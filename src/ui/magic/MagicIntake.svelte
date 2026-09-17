<script lang="ts">
  /*
    /magic/ — new-Chromebook intake. Design §8 in thinkle-iacs/cb-intake-extension.

    A bench tool used a hundred times in a row: legible across a workbench, driven from the
    keyboard, and the success panel is a state rather than a toast, so a mistake is visible
    before it is a hundred mistakes.

    Served without the app's login gate on purpose. On an enrolled device the extension
    hands over the serial and a policy token; anywhere else the page asks for the normal
    login before it will do anything.
  */
  import { onMount, tick } from "svelte";
  import LogIn from "@auth/LogIn.svelte";
  import { loggedIn } from "@data/user";
  import { ALL_PURPOSES } from "@data/inventory";
  import { commitDevice, lookupDevice, saveDefaults } from "@data/intake";
  import type { CommitResult, IntakeDefaults, LookupResult } from "@data/intake";
  import { waitForIntakeDevice } from "./cb-intake-page";
  import type { IntakeDevice } from "./cb-intake-page";
  import { MESSAGE_SOURCE, PRESENT_TYPE } from "./protocol";

  export let isIt = false; // passed to every page by App; unused here
  isIt;

  type Phase =
    | "waiting" // 1: looking for the extension
    | "manual" // 1b: no extension, type the serial
    | "loading" // looking the device up
    | "device" // 3/4: identified, awaiting the asset tag
    | "writing"
    | "success" // 5
    | "conflict" // §6: retag, or tag already in use
    | "error"; // 6

  let phase: Phase = "waiting";
  let extStatus = "looking for the extension";
  let announced: IntakeDevice | null = null;
  // A function, not a `$:` declaration: reactive values only update at the next flush, so
  // a request made right after `announced` is set would go out without the token.
  const credentials = () => announced?.credentials ?? null;
  $: authStatus = announced?.credentials?.token
    ? "using this device's intake token"
    : $loggedIn
    ? "using your login"
    : "not signed in";

  let manualSerial = "";
  let manualReason = "";
  /** Heard from the extension (its beacon) even if it couldn't read a serial. */
  let extensionVersion: string | null = null;
  let source = "";

  let device: LookupResult | null = null;
  let assetTag = "";
  let dop = "";
  /** What DOP was prefilled with, so an untouched prefill isn't written back. */
  let dopPrefill = "";
  let make = "";
  let model = "";
  let tagHint = "";

  let result: CommitResult | null = null;
  let conflict: any = null;
  let error: { heading: string; text: string; next: string; detail?: any } | null = null;

  /** Set when a request needs a login; retried once the login lands. */
  let loginPrompt: { text: string; retry: () => void } | null = null;

  let batch: IntakeDefaults | null = null;
  let batchError: string | null = null;
  let editingBatch = false;
  let batchDraft: IntakeDefaults = {};

  let tagInput: HTMLInputElement;
  let manualInput: HTMLInputElement;
  let cancelConflictButton: HTMLButtonElement;
  let purposeSelect: HTMLSelectElement;

  const WRITE_ORDER = [
    "Asset Tag",
    "Serial",
    "Device Type",
    "Make",
    "Model",
    "MAC-Wireless",
    "DOP",
    "Manufacture Date",
    "Purpose",
    "Status",
    "Location",
    "Category",
  ];

  // --- flow ----------------------------------------------------------------------------

  async function start() {
    phase = "waiting";
    device = null;
    result = null;
    conflict = null;
    error = null;
    extStatus = "looking for the extension";
    extensionVersion = null;

    // The beacon arrives in milliseconds; the device can take a couple of seconds on a
    // cold service worker, which is worth saying out loud rather than looking hung.
    const sawBeacon = (event: MessageEvent) => {
      if (event.data?.source === MESSAGE_SOURCE && event.data.type === PRESENT_TYPE) {
        extStatus = "reading this device";
        extensionVersion = event.data.extensionVersion ?? "?";
      }
    };
    window.addEventListener("message", sawBeacon);
    const found = await waitForIntakeDevice();
    window.removeEventListener("message", sawBeacon);

    if (found.available === false) {
      announced = null;
      // Every failure but no_extension means an extension answered — just without a serial,
      // which is what happens anywhere but a managed Chromebook. (Its beacon usually fires
      // before this page is listening, so don't rely on having seen it.)
      if (found.code !== "no_extension") extensionVersion = extensionVersion ?? "";
      extStatus = extensionVersion !== null
        ? `extension${extensionVersion ? ` v${extensionVersion}` : ""} — can't read this device`
        : "no extension — manual entry";
      manualReason = extensionVersion !== null
        ? `The intake extension is installed but couldn't read a serial number. That only works on a school-managed Chromebook. (${found.reason})`
        : found.reason;
      phase = "manual";
      await tick();
      manualInput?.focus();
      return;
    }
    announced = found.value;
    extStatus = `extension v${announced.extensionVersion}`;
    await lookup(announced.device.serial, "this device");
  }

  function submitManual() {
    const serial = manualSerial.trim();
    if (serial) lookup(serial, "entered by hand");
  }

  function askForLogin(text: string, retry: () => void) {
    if ($loggedIn) {
      // Signed in and still refused: a login won't help, so don't loop on it.
      showError("Not allowed", "Your account can't use intake. Sign in with an IT account.", "Nothing was written.");
      return;
    }
    loginPrompt = { text, retry };
  }

  // Retry whatever was waiting on a login once it lands.
  $: if ($loggedIn && loginPrompt) {
    const { retry } = loginPrompt;
    loginPrompt = null;
    retry();
  }

  async function lookup(serial: string, from: string) {
    phase = "loading";
    source = from;
    const response = await lookupDevice(credentials(), serial);
    if (response.ok === false) {
      if (response.needsLogin) {
        phase = announced ? "waiting" : "manual";
        askForLogin(
          credentials()?.token
            ? "This device's intake token was refused. Sign in to keep going."
            : "Sign in to look up devices.",
          () => lookup(serial, from)
        );
        return;
      }
      showError("Lookup failed", describe(response), "Nothing was written.", response.error);
      return;
    }

    device = { ...response.data, serial: response.data.serial ?? serial };
    if (device.defaults) batch = device.defaults;
    batchError = device.defaultsError;
    assetTag = device.existingRecord?.["Asset Tag"] ?? announced?.device.assetId ?? "";
    dop = dopPrefill = device.suggested?.DOP ?? "";
    make = device.existingRecord?.Make ?? device.suggested?.Make ?? "";
    model = device.existingRecord?.Model ?? device.suggested?.Model ?? "";
    tagHint = "";
    phase = "device";
    await focusTag();
  }

  async function commit(allowRetag = false) {
    const tag = assetTag.trim();
    if (!tag) {
      tagHint = "Type the asset tag from the sticker.";
      return;
    }
    if (!device) return;
    phase = "writing";
    conflict = null;
    const fields: Record<string, string> = {};
    // Only a date the tech changed. The server fills DOP from first enrollment on a new
    // record (or a blank one) and keeps a recorded DOP otherwise.
    if (dop && dop !== dopPrefill) fields.DOP = dop;
    if (make.trim()) fields.Make = make.trim();
    if (model.trim()) fields.Model = model.trim();

    const response = await commitDevice(credentials(), {
      serial: device.serial,
      assetTag: tag,
      fields,
      ...(allowRetag ? { allowRetag: true } : {}),
    });

    if (response.ok === true) {
      result = response.data;
      phase = "success";
      await tick();
      (document.activeElement as HTMLElement)?.blur?.();
      return;
    }
    if (response.needsLogin) {
      phase = "device";
      askForLogin("Sign in to write this record.", () => commit(allowRetag));
      return;
    }
    if (response.status === 409 && ["retag_conflict", "tag_in_use"].includes(response.error?.error)) {
      conflict = response.error;
      phase = "conflict";
      await tick();
      cancelConflictButton?.focus();
      return;
    }
    showError(
      "The write failed",
      describe(response),
      response.error?.written === false || (response.status >= 400 && response.status < 500)
        ? "Nothing was written. Fix the problem above and try again."
        : "It's not certain whether anything was written. Look the device up before retrying.",
      response.error
    );
  }

  function showError(heading: string, text: string, next: string, detail?: any) {
    error = { heading, text, next, detail };
    phase = "error";
  }

  function describe(response: { status: number; error: any }) {
    return response.error?.detail ?? response.error?.error ?? `HTTP ${response.status}`;
  }

  async function focusTag() {
    await tick();
    tagInput?.focus();
    tagInput?.select();
  }

  async function retryAfterError() {
    error = null;
    if (device) {
      phase = "device";
      await focusTag();
    } else {
      start();
    }
  }

  async function cancelConflict() {
    conflict = null;
    phase = "device";
    await focusTag();
  }

  // --- batch defaults (design §7) --------------------------------------------------------

  async function editBatch() {
    batchDraft = { Purpose: "", Status: "", Location: "", ...(batch ?? {}) };
    editingBatch = true;
    await tick();
    purposeSelect?.focus();
  }

  async function submitBatch() {
    // Changing the batch default is a deliberate, separate action — never a side effect
    // of a per-device edit.
    const response = await saveDefaults(credentials(), batchDraft);
    if (response.ok === false) {
      if (response.needsLogin) {
        askForLogin("Sign in to change the batch defaults.", submitBatch);
        return;
      }
      batchError = describe(response);
      return;
    }
    batch = response.data.defaults;
    batchError = null;
    editingBatch = false;
    if (phase === "device") await focusTag();
  }

  // --- keyboard ------------------------------------------------------------------------

  function onWindowKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && phase === "success") {
      // Enter moves on; hands never leave the keyboard.
      event.preventDefault();
      start();
    } else if (event.key === "Escape" && phase === "conflict") {
      cancelConflict();
    }
  }

  /** "5 yrs" from a manufactureDate like "2020-11" or "2020-11-01". */
  function ageFrom(value: string | undefined) {
    const match = value?.match(/^(\d{4})-(\d{2})/);
    if (!match) return "";
    const months =
      (new Date().getFullYear() - Number(match[1])) * 12 + (new Date().getMonth() + 1 - Number(match[2]));
    if (months < 0) return "";
    return months < 12 ? `${months} mo old` : `${(months / 12).toFixed(1).replace(/\.0$/, "")} yrs old`;
  }

  function formatAue(value: string | undefined) {
    if (!value) return "";
    const date = /^\d+$/.test(value) ? new Date(Number(value)) : new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  }

  $: batchSummary = batch
    ? Object.entries(batch)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ") || "none set"
    : "not loaded";

  $: writtenRows = result
    ? [
        ...WRITE_ORDER.filter((k) => k in result.fieldsWritten),
        ...Object.keys(result.fieldsWritten).filter((k) => !WRITE_ORDER.includes(k) && !k.startsWith("_")),
      ].map((k) => [k, result.fieldsWritten[k]])
    : [];

  onMount(start);
</script>

<svelte:window on:keydown={onWindowKeydown} />

<div class="intake">
  <header>
    <h1>Chromebook intake</h1>
    <span class="muted">
      <span class:spinner={phase === "waiting"}>{extStatus}</span>
      &nbsp;·&nbsp; {authStatus}
    </span>
  </header>

  <section class="batch">
    {#if editingBatch}
      <form on:submit|preventDefault={submitBatch}>
        <label>
          Purpose
          <select bind:this={purposeSelect} bind:value={batchDraft.Purpose}>
            <option value="">—</option>
            {#each ALL_PURPOSES as purpose}
              <option value={purpose}>{purpose}</option>
            {/each}
          </select>
        </label>
        <label>Status <input bind:value={batchDraft.Status} list="intake-statuses" /></label>
        <label>Location <input bind:value={batchDraft.Location} list="intake-locations" /></label>
        <datalist id="intake-statuses">
          <option value="New" />
          <option value="Active" />
        </datalist>
        <datalist id="intake-locations">
          <option value="Tech Room" />
          <option value="Student Loan" />
          <option value="Library" />
          <option value="Staff Loan" />
        </datalist>
        <span class="batch-buttons">
          <button class="w3-button w3-blue" type="submit">Save for this batch</button>
          <button class="w3-button w3-border" type="button" on:click={() => (editingBatch = false)}>Cancel</button>
        </span>
      </form>
    {:else}
      <span>Batch defaults: <b>{batchSummary}</b></span>
      <button class="link" type="button" on:click={editBatch}>change</button>
    {/if}
    {#if batchError}
      <span class="bad-text">{batchError}</span>
    {/if}
  </section>

  {#if loginPrompt}
    <div class="panel warn">
      <h2>Sign in to continue</h2>
      <p>{loginPrompt.text}</p>
      <LogIn />
    </div>
  {/if}

  {#if phase === "waiting" || phase === "loading"}
    <p class="muted big-status spinner">
      {phase === "waiting" ? extStatus : "looking up this device"}
    </p>
  {/if}

  {#if phase === "manual"}
    {#if $loggedIn}
      <section class="device">
        <h2>{extensionVersion !== null ? "Can't read this device" : "No extension on this machine"}</h2>
        <p class="muted">{manualReason}</p>
        <form on:submit|preventDefault={submitManual}>
          <label for="manual-serial">Serial number</label>
          <input
            id="manual-serial"
            bind:this={manualInput}
            bind:value={manualSerial}
            placeholder="5CD1234ABC"
            spellcheck="false"
            autocomplete="off"
            on:keydown={(e) => {
              // Explicit, not implicit form submission: scanners and synthetic keys don't always trigger it.
              if (e.key === "Enter") {
                e.preventDefault();
                submitManual();
              }
            }}
          />
          <button class="w3-button w3-blue" type="submit">Look up</button>
        </form>
      </section>
    {:else if !loginPrompt}
      <div class="panel warn">
        <h2>{extensionVersion !== null ? "Can't read this device" : "No extension on this machine"}</h2>
        <p>{manualReason} Sign in to enter a serial by hand.</p>
        <LogIn />
      </div>
    {/if}
  {/if}

  {#if device && (phase === "device" || phase === "writing" || phase === "conflict")}
    <section class="device">
      <p class="muted">{source}</p>
      <p class="serial">{device.serial}</p>
      {#if device.google}
        <dl class="fields">
          <dt>Google calls it</dt><dd>{device.google.model ?? ""}</dd>
          <dt><label for="intake-make">Make</label></dt>
          <dd><input id="intake-make" class="small" bind:value={make} /></dd>
          <dt><label for="intake-model">Model</label></dt>
          <dd><input id="intake-model" class="small wide" bind:value={model} /></dd>
          {#if device.suggested?.["MAC-Wireless"]}<dt>MAC</dt><dd>{device.suggested["MAC-Wireless"]}</dd>{/if}
          {#if device.google.autoUpdateExpiration}
            <dt>Auto-update expires</dt><dd>{formatAue(device.google.autoUpdateExpiration)}</dd>
          {/if}
          {#if device.google.manufactureDate}
            <dt>Manufactured</dt>
            <dd>{device.google.manufactureDate} <span class="muted">({ageFrom(device.google.manufactureDate)})</span></dd>
          {/if}
          <dt><label for="intake-dop">In service since (DOP)</label></dt>
          <dd>
            <input id="intake-dop" class="date" type="date" bind:value={dop} />
            <span class="muted">{device.existingRecord?.DOP ? "as recorded" : "first enrolled"}</span>
          </dd>
        </dl>
      {/if}
    </section>

    {#if !device.google}
      <div class="panel bad">
        <h2>Google Admin doesn't know this serial</h2>
        <p>
          Nothing can be written until the device is enrolled. If you typed the serial, check
          it; if it was just enrolled, give Google a minute and try again.
        </p>
        <button class="w3-button w3-border" type="button" on:click={start}>Start over</button>
      </div>
    {:else}
      {#if device.duplicateSerial}
        <div class="panel bad">
          <h2>Inventory has more than one record for this serial</h2>
          <p>Merge them in Airtable before intaking this device.</p>
        </div>
      {:else if device.existingRecord}
        <div class="panel warn">
          <h2>Already in inventory</h2>
          <p>
            This serial is inventoried as <b>{device.existingRecord["Asset Tag"] || "(no tag)"}</b>.
            The same tag refreshes it; a different tag will ask before retagging.
          </p>
        </div>
      {/if}

      <section class="tag-entry">
        <label for="asset-tag">Asset tag <span class="muted">— type it and press <kbd>Enter</kbd></span></label>
        <input
          id="asset-tag"
          bind:this={tagInput}
          bind:value={assetTag}
          disabled={phase !== "device"}
          autocomplete="off"
          spellcheck="false"
          on:keydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
        />
        <p class="muted" class:spinner={phase === "writing"}>{phase === "writing" ? "writing" : tagHint}</p>
      </section>
    {/if}
  {/if}

  {#if phase === "conflict" && conflict}
    <div class="panel warn">
      {#if conflict.error === "retag_conflict"}
        <h2>Serial already carries a different tag</h2>
        <p>
          Serial {device?.serial} is inventoried as <b>{conflict.existingTag}</b>, but you typed
          <b>{conflict.incomingTag}</b>. Most of the time that is a typo. Retag only if you mean it.
        </p>
        <button class="w3-button w3-orange" type="button" on:click={() => commit(true)}>
          Retag this device as {conflict.incomingTag}
        </button>
      {:else}
        <h2>Tag already in use</h2>
        <p>
          <b>{conflict.incomingTag}</b> is already on serial <b>{conflict.otherSerial}</b>.
          Check the sticker, or fix <a href={conflict.recordUrl} target="_blank" rel="noopener">that record</a> first.
        </p>
      {/if}
      <button class="w3-button w3-border" type="button" bind:this={cancelConflictButton} on:click={cancelConflict}>
        Back to the tag <kbd>Esc</kbd>
      </button>
    </div>
  {/if}

  {#if phase === "success" && result}
    <div class="panel ok">
      <h2>{result.created ? "Created" : result.idempotent ? "Refreshed" : result.retagged ? "Retagged" : "Updated"}</h2>
      <p class="big-tag">{result.fieldsWritten["Asset Tag"]}</p>
      {#if result.googleAssetIdWriteBack.ok}
        <p>Asset tag written back to Google Admin.</p>
      {:else}
        <p class="bad-text">
          Google write-back did NOT succeed{result.googleAssetIdWriteBack.error
            ? `: ${result.googleAssetIdWriteBack.error}`
            : ""}. The inventory record is still correct.
        </p>
      {/if}
      <table class="written">
        {#each writtenRows as [key, value]}
          <tr><td>{key}</td><td>{value}</td></tr>
        {/each}
      </table>
      <p>
        <a href={result.recordUrl} target="_blank" rel="noopener">Open this record</a>
        &nbsp;·&nbsp; <kbd>Enter</kbd> for the next device
      </p>
    </div>
  {/if}

  {#if phase === "error" && error}
    <div class="panel bad">
      <h2>{error.heading}</h2>
      <p>{error.text}</p>
      <p class="muted">{error.next}</p>
      {#if error.detail}
        <pre class="detail">{JSON.stringify(error.detail, null, 2)}</pre>
      {/if}
      <button class="w3-button w3-border" type="button" on:click={retryAfterError}>Try again</button>
    </div>
  {/if}
</div>

<style>
  .intake {
    font-size: 17px;
    margin: 0 auto;
    max-width: 56rem;
    padding: 1rem 1rem 6rem;
  }
  header {
    align-items: baseline;
    display: flex;
    flex-wrap: wrap;
    gap: 0 1rem;
    justify-content: space-between;
  }
  h1 {
    font-size: 1.1rem;
    letter-spacing: 0.02em;
    margin: 0.75rem 0;
    text-transform: uppercase;
  }
  h2 {
    font-size: 1rem;
    margin: 0 0 0.5rem;
    text-transform: uppercase;
  }
  .muted {
    color: #667085;
  }
  .bad-text {
    color: #b42318;
  }

  .batch {
    align-items: center;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin-bottom: 1.5rem;
    padding: 0.6rem 0.9rem;
  }
  .batch form {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    width: 100%;
  }
  .batch label {
    font-size: 0.85rem;
  }
  .batch input,
  .batch select {
    display: block;
    padding: 0.3rem 0.5rem;
    width: 11rem;
  }
  .batch-buttons {
    align-self: end;
  }
  button.link {
    background: none;
    border: 0;
    color: #175cd3;
    cursor: pointer;
    text-decoration: underline;
  }

  .device {
    border: 1px solid #d0d5dd;
    border-radius: 10px;
    padding: 1rem 1.25rem;
  }
  .device input {
    font-size: 1.4rem;
    padding: 0.3rem 0.6rem;
  }
  .serial {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    margin: 0;
  }
  dl.fields {
    display: grid;
    gap: 0.35rem 1.5rem;
    grid-template-columns: max-content 1fr;
    margin: 1rem 0 0;
  }
  dl.fields dt {
    color: #667085;
    font-size: 0.85rem;
  }
  dl.fields dd {
    margin: 0;
  }
  dl.fields input.small {
    font-size: 1rem;
    padding: 0.1rem 0.4rem;
    width: 7rem;
  }
  dl.fields input.date {
    font-size: 1rem;
    padding: 0.1rem 0.4rem;
  }
  dl.fields input.small.wide {
    width: 16rem;
  }

  .tag-entry {
    margin: 1.5rem 0;
  }
  #asset-tag {
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 0.5rem 0.75rem;
    width: 100%;
  }

  .panel {
    border-radius: 10px;
    margin: 1.5rem 0;
    padding: 1rem 1.25rem;
  }
  .panel.ok {
    background: #ecfdf3;
    border: 2px solid #087443;
  }
  .panel.warn {
    background: #fffaeb;
    border: 2px solid #b54708;
  }
  .panel.bad {
    background: #fef3f2;
    border: 2px solid #b42318;
  }
  /* LogIn is a card built for a full page; tone it down inside a panel. */
  .panel :global(.w3-card) {
    box-shadow: none;
    padding: 0.5rem 0 !important;
    background: transparent;
  }
  .big-tag {
    font-size: 2.6rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    line-height: 1.1;
    margin: 0.25rem 0 0.75rem;
  }
  .big-status {
    font-size: 1.4rem;
    margin: 2rem 0;
  }
  table.written {
    border-collapse: collapse;
    margin-top: 0.75rem;
    width: 100%;
  }
  table.written td {
    border-top: 1px solid #d0d5dd;
    padding: 0.25rem 0.5rem 0.25rem 0;
    vertical-align: top;
  }
  table.written td:first-child {
    color: #667085;
    white-space: nowrap;
    width: 12rem;
  }
  kbd {
    border: 1px solid #d0d5dd;
    border-bottom-width: 2px;
    border-radius: 4px;
    font: 0.85em ui-monospace, monospace;
    padding: 0.05em 0.4em;
  }
  pre.detail {
    font-size: 0.8rem;
    overflow-x: auto;
    white-space: pre-wrap;
  }
  .spinner::after {
    animation: dots 1.2s steps(4, end) infinite;
    content: "";
  }
  @keyframes dots {
    to {
      content: "....";
    }
  }
</style>
