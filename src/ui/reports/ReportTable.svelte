<script>
  import { onDestroy, onMount, tick } from "svelte";
  import { logger } from "@utils/log";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import DataExporter from "./DataExporter.svelte";
  import BulkMessageSender from "@notifications/BulkMessageSender.svelte";
  import { signoutAsset } from "@data/signout";
  import { updateAsset } from "@data/inventory";
  import {
    billForLostDevice,
    getBillableStudentId,
    DEFAULT_REPLACEMENT_COST,
  } from "@data/lostDeviceBilling";
  import { setDeviceDisabled } from "@data/google";
  import { showToast } from "@components/toastStore";

  const ADMIN_CONSOLE_URL = "https://admin.google.com/ac/chrome/devices";

  export let data;
  export let columns = [];
  export let filename = "data.csv";
  export let openAssetLinksInNewTab = false;
  // Map of asset tag -> latest checkout status ("Out", "Repairing", ...).
  // The last checkout is the source of truth for who actually holds a device.
  export let statusByTag = new Map();
  // "all" | "out" (actually out with a student) | "repair" (in our hands)
  let checkoutFilter = "all";
  // sortColumn is now a property name (string)
  let sortColumn = columns[0] || "";
  let sortDirection = "asc";
  export let headers = [];

  let sortedData = [];
  let tableScrollEl;
  let topScrollEl;
  let reportTableEl;
  let topScrollWidth = 0;
  let showTopScroll = false;
  let resizeObserver;

  function syncScrollMetrics() {
    if (!tableScrollEl || !reportTableEl) return;
    topScrollWidth = reportTableEl.scrollWidth;
    showTopScroll = reportTableEl.scrollWidth > tableScrollEl.clientWidth + 1;
    if (topScrollEl && topScrollEl.scrollLeft !== tableScrollEl.scrollLeft) {
      topScrollEl.scrollLeft = tableScrollEl.scrollLeft;
    }
  }

  function handleTopScroll() {
    if (!tableScrollEl || !topScrollEl) return;
    if (tableScrollEl.scrollLeft !== topScrollEl.scrollLeft) {
      tableScrollEl.scrollLeft = topScrollEl.scrollLeft;
    }
  }

  function handleTableScroll() {
    if (!tableScrollEl || !topScrollEl) return;
    if (topScrollEl.scrollLeft !== tableScrollEl.scrollLeft) {
      topScrollEl.scrollLeft = tableScrollEl.scrollLeft;
    }
  }

  let syncPending = false;
  async function scheduleSyncMetrics() {
    if (syncPending) return;
    syncPending = true;
    await tick();
    syncPending = false;
    syncScrollMetrics();
  }

  $: filteredData.length,
    columns.length,
    headers.length,
    haveGoogleData,
    scheduleSyncMetrics();

  onMount(() => {
    const onResize = () => syncScrollMetrics();
    window.addEventListener("resize", onResize);
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => syncScrollMetrics());
      if (reportTableEl) {
        resizeObserver.observe(reportTableEl);
      }
    }
    scheduleSyncMetrics();

    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  });

  onDestroy(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  function isStale(lastUsed) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(lastUsed) < thirtyDaysAgo;
  }
  function resortData(data, direction, prop) {
    const sorted = [...data]; // Create a copy...
    sorted.sort((a, b) => {
      let sortProp = prop;
      if (prop === "_ASSET") {
        sortProp = "Asset Tag";
      }
      if (a[sortProp] === undefined || b[sortProp] === undefined) {
        return 0; // Handle undefined values gracefully
      }
      // Special case: sort lastUsed as a date
      if (sortProp === "lastUsed") {
        const aDate = new Date(a[sortProp]);
        const bDate = new Date(b[sortProp]);
        if (direction === "asc") {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      }
      if (direction === "asc") {
        if (a[sortProp] < b[sortProp]) return -1;
        if (a[sortProp] > b[sortProp]) return 1;
      } else {
        if (a[sortProp] < b[sortProp]) return 1;
        if (a[sortProp] > b[sortProp]) return -1;
      }
      return 0;
    });
    return sorted;
  }

  // Derived (not a side-effect assignment) so Svelte orders the chain
  // data -> sortedData -> filteredData and recomputes filteredData when the
  // report data first arrives — otherwise the table stays empty until some
  // other state change forces a re-flush.
  $: sortedData = resortData(data, sortDirection, sortColumn);

  let haveGoogleData = false;
  $: {
    logger.logVerbose("RT: Check for google data...");
    if (data && data.length > 0 && data[0].hasOwnProperty("googleData")) {
      logger.logVerbose("RT: We have Google data!");
      haveGoogleData = true;
    } else {
      logger.logVerbose("RT: No Google data found.");
      haveGoogleData = false;
    }
  }
  let expandedUsers = {};
  let expandedSessions = {};

  const FILTER_ANY = "any";
  const FILTER_TRUE = "true";
  const FILTER_FALSE = "false";

  // Filter state
  let filterMismatched = FILTER_ANY; // "all" | true | false
  let filterStale = FILTER_ANY; // "all" | true | false

  // Derive unique model and purpose values from data
  $: uniqueModels = [
    ...new Set(data.map((r) => r.Model).filter(Boolean)),
  ].sort();
  $: uniquePurposes = [
    ...new Set(data.map((r) => r.Purpose).filter(Boolean)),
  ].sort();

  // Multi-select filter state
  let selectedModels = new Set();
  let selectedPurposes = new Set();
  let prevModelKey = "";
  let prevPurposeKey = "";

  // Reset selections when the set of available values changes
  $: {
    const modelKey = uniqueModels.join("|");
    if (modelKey !== prevModelKey) {
      selectedModels = new Set(uniqueModels);
      prevModelKey = modelKey;
    }
  }
  $: {
    const purposeKey = uniquePurposes.join("|");
    if (purposeKey !== prevPurposeKey) {
      selectedPurposes = new Set(uniquePurposes);
      prevPurposeKey = purposeKey;
    }
  }

  let showModelDropdown = false;
  let showPurposeDropdown = false;

  function toggleModel(model) {
    if (selectedModels.has(model)) {
      selectedModels.delete(model);
    } else {
      selectedModels.add(model);
    }
    selectedModels = new Set(selectedModels);
  }
  function togglePurpose(purpose) {
    if (selectedPurposes.has(purpose)) {
      selectedPurposes.delete(purpose);
    } else {
      selectedPurposes.add(purpose);
    }
    selectedPurposes = new Set(selectedPurposes);
  }

  // Expose filtered data for parent to read imperatively
  export function getFilteredData() {
    return filteredData;
  }

  // Derived filtered data
  $: filteredData = sortedData.filter((row) => {
    if (filterMismatched !== FILTER_ANY) {
      if (filterMismatched === FILTER_TRUE && row.lastUserMatch !== false)
        return false;
      if (filterMismatched === FILTER_FALSE && row.lastUserMatch === false)
        return false;
    }
    if (filterStale !== FILTER_ANY) {
      if (filterStale === FILTER_TRUE && !isStale(row.lastUsed)) return false;
      if (filterStale === FILTER_FALSE && isStale(row.lastUsed)) return false;
    }
    // Only filter when SOME (not all, not zero) are selected. size === 0 is
    // the transient pre-init state (and a deliberate "None" click) — treating
    // it as "no filter" stops the table rendering empty until a filter is
    // touched.
    if (
      selectedModels.size > 0 &&
      selectedModels.size < uniqueModels.length &&
      !selectedModels.has(row.Model)
    )
      return false;
    if (
      selectedPurposes.size > 0 &&
      selectedPurposes.size < uniquePurposes.length &&
      !selectedPurposes.has(row.Purpose)
    )
      return false;
    if (checkoutFilter !== "all") {
      const st = statusByTag.get(row["Asset Tag"]);
      if (checkoutFilter === "out" && st !== "Out") return false;
      if (checkoutFilter === "repair" && st !== "Repairing") return false;
    }
    return true;
  });

  function setFilterMismatched(val) {
    filterMismatched = val;
  }
  function setFilterStale(val) {
    filterStale = val;
  }

  function selectGoodAssets() {
    // Select assets that are NOT mismatched and NOT stale
    const goodRows = filteredData.filter(
      (row) => row.lastUserMatch !== false && !isStale(row.lastUsed),
    );
    selectedAssetTags = new Set(goodRows.map((row) => row["Asset Tag"]));
  }

  let includeGoogleDataInExport = haveGoogleData;
  let exportColumns = [];
  let ASSET_COLUMNS = [
    "Asset Tag",
    "Serial",
    "Make",
    "Model",
    "Year of Purchase",
  ];
  $: {
    // Expand _ASSET into ASSET_COLUMNS for exportColumns
    let baseColumns = columns.flatMap((col) =>
      col === "_ASSET" ? ASSET_COLUMNS : [col],
    );
    if (includeGoogleDataInExport) {
      exportColumns = [
        ...baseColumns,
        "lastUserMatch",
        "lastUsed",
        "recentUsers",
        "sessions",
      ];
    } else {
      exportColumns = [...baseColumns];
    }
  }

  let selectedAssetTags = new Set();
  let mountBulkMessageSender = false;
  let showBulkMessageSender = false;

  function openBulkMessageSender() {
    if (!mountBulkMessageSender) {
      mountBulkMessageSender = true;
    }
    showBulkMessageSender = true;
  }

  function toggleSelectAll() {
    if (selectedAssetTags.size === filteredData.length) {
      selectedAssetTags = new Set();
    } else {
      selectedAssetTags = new Set(filteredData.map((row) => row["Asset Tag"]));
    }
  }
  function toggleSelectRow(row) {
    const tag = row["Asset Tag"];
    if (selectedAssetTags.has(tag)) {
      selectedAssetTags.delete(tag);
    } else {
      selectedAssetTags.add(tag);
    }
    selectedAssetTags = new Set(selectedAssetTags); // trigger reactivity
  }

  let isUpdatingStatus = false;
  let updateStatusError = "";

  async function markSelectedAsLost() {
    isUpdatingStatus = true;
    updateStatusError = "";
    try {
      const tags = [...selectedAssetTags];
      await Promise.all(
        tags.map(async (tag) => {
          const asset = data.find((row) => row["Asset Tag"] === tag);
          if (!asset) throw new Error(`Asset not found: ${tag}`);
          await signoutAsset(null, null, asset, "", "Lost", false);
        }),
      );
      selectedAssetTags = new Set();
    } catch (e) {
      updateStatusError = e.message || "Failed to update status.";
    } finally {
      isUpdatingStatus = false;
    }
  }

  let showLostConfirm = false;
  let lostNote = "";
  let billForReplacement = false;
  let replacementCost = DEFAULT_REPLACEMENT_COST;

  $: billableSelectedCount = [...selectedAssetTags].filter((tag) => {
    const asset = data.find((row) => row["Asset Tag"] === tag);
    return asset && getBillableStudentId(asset);
  }).length;

  function openLostConfirm() {
    lostNote = "";
    billForReplacement = false;
    replacementCost = DEFAULT_REPLACEMENT_COST;
    showLostConfirm = true;
  }
  function closeLostConfirm() {
    showLostConfirm = false;
  }

  async function confirmMarkSelectedAsLost() {
    isUpdatingStatus = true;
    updateStatusError = "";
    try {
      const tags = [...selectedAssetTags];
      const billingErrors = [];
      let billedCount = 0;
      await Promise.all(
        tags.map(async (tag) => {
          const asset = data.find((row) => row["Asset Tag"] === tag);
          if (!asset) throw new Error(`Asset not found: ${tag}`);
          // Bill first so the signout note can record the ticket number.
          let note = lostNote;
          if (billForReplacement) {
            if (!getBillableStudentId(asset)) {
              billingErrors.push(`${tag}: no current student to bill`);
            } else {
              try {
                const { ticket } = await billForLostDevice(asset, {
                  cost: replacementCost,
                  note: lostNote,
                });
                note =
                  (lostNote ? lostNote + " " : "") +
                  `Billed family $${replacementCost} for replacement` +
                  (ticket.Number ? ` (Ticket #${ticket.Number}).` : ".");
                billedCount++;
              } catch (e) {
                billingErrors.push(`${tag}: ${e.message}`);
              }
            }
          }
          await signoutAsset(null, null, asset, note, "Lost", false);
          await updateAsset(asset._id, { Status: "Lost" });
        }),
      );
      if (billingErrors.length) {
        updateStatusError = `Marked as lost, but some invoices could not be sent — ${billingErrors.join("; ")}`;
        if (billedCount) {
          showToast(`Queued ${billedCount} invoice(s)`, "info");
        }
      } else {
        showToast(
          billForReplacement
            ? `Marked ${tags.length} device(s) lost and queued ${billedCount} invoice(s) for the business office`
            : `Marked ${tags.length} device(s) lost`,
          "success",
        );
        selectedAssetTags = new Set();
        closeLostConfirm();
      }
    } catch (e) {
      updateStatusError = e.message || "Failed to update status.";
    } finally {
      isUpdatingStatus = false;
    }
  }

  // Batch disable / enable
  let deviceActionInProgress = false;
  let deviceActionResults = null; // { succeeded, failed: [{tag, serial, error}], action }
  let showDeviceActionConfirm = false;
  let pendingDeviceAction = ""; // "disable" | "reenable"

  function openDeviceActionConfirm(action) {
    pendingDeviceAction = action;
    showDeviceActionConfirm = true;
  }

  async function confirmDeviceAction() {
    deviceActionInProgress = true;
    showDeviceActionConfirm = false;
    deviceActionResults = null;
    const tags = [...selectedAssetTags];
    const succeeded = [];
    const failed = [];
    const disabling = pendingDeviceAction === "disable";
    await Promise.all(
      tags.map(async (tag) => {
        const asset = data.find((row) => row["Asset Tag"] === tag);
        if (!asset || !asset.Serial) {
          failed.push({ tag, serial: asset?.Serial || "?", error: "No serial number on record" });
          return;
        }
        const result = await setDeviceDisabled(asset, disabling);
        if (result.success) {
          succeeded.push(tag);
        } else {
          failed.push({ tag, serial: asset.Serial, error: result.errorMessage || "Unknown error" });
        }
      })
    );
    deviceActionInProgress = false;
    deviceActionResults = { succeeded, failed, action: pendingDeviceAction };
    if (failed.length === 0) {
      showToast(
        `${disabling ? "Disabled" : "Re-enabled"} ${succeeded.length} device(s)`,
        "success"
      );
      selectedAssetTags = new Set();
    }
  }

  export let loginDataReady = false;
</script>

<!-- Filter controls -->
{#if data.length}
  <div class="w3-padding filter-bar">
    <div
      style="
        display:grid; 
        grid-template-areas: 'input1 input2' 'note note'; 
        grid-gap: 0.5em;
        "
    >
      <label
        class="w3-bar-item"
        tooltip="Whether the last user matches the current primary user of the asset"
        >Mismatched:
        <select
          disabled={!loginDataReady}
          bind:value={filterMismatched}
          on:change={(e) => setFilterMismatched(e.target.value)}
          class="w3-select w3-border"
          style="width:auto;display:inline-block;margin-left:4px;"
        >
          <option value={FILTER_ANY}>All</option>
          <option value={FILTER_TRUE}>Yes</option>
          <option value={FILTER_FALSE}>No</option>
        </select>
      </label>
      <label class="w3-bar-item"
        >Stale:
        <select
          disabled={!loginDataReady}
          bind:value={filterStale}
          on:change={(e) => setFilterStale(e.target.value)}
          class="w3-select w3-border"
          style="width:auto;display:inline-block;margin-left:4px;"
        >
          <option value={FILTER_ANY}>All</option>
          <option value={FILTER_TRUE}>Yes</option>
          <option value={FILTER_FALSE}>No</option>
        </select>
      </label>

      <div
        class="w3-text-gray w3-small"
        style="grid-area: note; padding: 0px 16px; font-style: italic;"
      >
        {#if !loginDataReady}
          Run "Get Login Data" to filter by login status.
        {:else}
          Mismatched: machine not signed out to its last user.
          <br />Stale: not used in last 30 days.
        {/if}
      </div>
    </div>
    {#if statusByTag.size}
      <label
        class="w3-bar-item"
        title="Based on each device's last checkout action — the source of truth for who actually holds it. 'In for repair' means it's in our hands though still assigned to the student."
        >Show:
        <select
          bind:value={checkoutFilter}
          class="w3-select w3-border"
          style="width:auto;display:inline-block;margin-left:4px;"
        >
          <option value="all">All assigned</option>
          <option value="out">Actually out (with student)</option>
          <option value="repair">In for repair (in our hands)</option>
        </select>
      </label>
    {/if}
    <div class="dropdown-filter" style="position:relative;">
      <button
        class="w3-button w3-border w3-bar-item"
        on:click={() => (showModelDropdown = !showModelDropdown)}
      >
        Model: {selectedModels.size === uniqueModels.length
          ? "All"
          : `${selectedModels.size}/${uniqueModels.length}`}
        &#9662;
      </button>
      {#if showModelDropdown}
        <div class="filter-dropdown w3-card-4 w3-white">
          <div
            class="w3-bar w3-border-bottom"
            style="display:flex;gap:4px;padding:4px;"
          >
            <button
              class="w3-button w3-tiny w3-light-grey"
              on:click={() => {
                selectedModels = new Set(uniqueModels);
              }}>All</button
            >
            <button
              class="w3-button w3-tiny w3-light-grey"
              on:click={() => {
                selectedModels = new Set();
              }}>None</button
            >
          </div>
          <div style="max-height:250px;overflow-y:auto;padding:4px 8px;">
            {#each uniqueModels as model}
              <label
                class="w3-block"
                style="cursor:pointer;white-space:nowrap;padding:2px 0;"
              >
                <input
                  type="checkbox"
                  class="w3-check"
                  checked={selectedModels.has(model)}
                  on:change={() => toggleModel(model)}
                />
                {model}
              </label>
            {/each}
          </div>
          <button
            class="w3-button w3-block w3-border-top w3-small"
            on:click={() => (showModelDropdown = false)}>Done</button
          >
        </div>
      {/if}
    </div>
    <div class="dropdown-filter" style="position:relative;">
      <button
        class="w3-button w3-border w3-bar-item"
        on:click={() => (showPurposeDropdown = !showPurposeDropdown)}
      >
        Purpose: {selectedPurposes.size === uniquePurposes.length
          ? "All"
          : `${selectedPurposes.size}/${uniquePurposes.length}`}
        &#9662;
      </button>
      {#if showPurposeDropdown}
        <div class="filter-dropdown w3-card-4 w3-white">
          <div
            class="w3-bar w3-border-bottom"
            style="display:flex;gap:4px;padding:4px;"
          >
            <button
              class="w3-button w3-tiny w3-light-grey"
              on:click={() => {
                selectedPurposes = new Set(uniquePurposes);
              }}>All</button
            >
            <button
              class="w3-button w3-tiny w3-light-grey"
              on:click={() => {
                selectedPurposes = new Set();
              }}>None</button
            >
          </div>
          <div style="max-height:250px;overflow-y:auto;padding:4px 8px;">
            {#each uniquePurposes as purpose}
              <label
                class="w3-block"
                style="cursor:pointer;white-space:nowrap;padding:2px 0;"
              >
                <input
                  type="checkbox"
                  class="w3-check"
                  checked={selectedPurposes.has(purpose)}
                  on:change={() => togglePurpose(purpose)}
                />
                {purpose}
              </label>
            {/each}
          </div>
          <button
            class="w3-button w3-block w3-border-top w3-small"
            on:click={() => (showPurposeDropdown = false)}>Done</button
          >
        </div>
      {/if}
    </div>
    {#if haveGoogleData}
      <label class="w3-bar-item">
        <input
          type="checkbox"
          class="w3-check"
          bind:checked={includeGoogleDataInExport}
        />
        Include Google Data in Export
      </label>
    {/if}
    <button
      class="w3-button w3-bar-item"
      style="margin-left:1em;"
      on:click={selectGoodAssets}>Select Good Assets</button
    >
  </div>
{/if}
<div class="w3-responsive">
  <p>
    Showing <b>{filteredData.length}</b> records
    {#if statusByTag.size}
      {@const shownOut = filteredData.filter(
        (r) => statusByTag.get(r["Asset Tag"]) === "Out",
      ).length}
      {@const shownRepair = filteredData.filter(
        (r) => statusByTag.get(r["Asset Tag"]) === "Repairing",
      ).length}
      <span class="w3-small w3-text-grey"
        >· <b>{shownOut}</b> actually out
        {#if shownRepair}· <span class="w3-text-amber"
            ><b>{shownRepair}</b> in for repair (in our hands)</span
          >{/if}</span
      >
    {/if}
  </p>

  <div
    class="w3-bar w3-center w3-margin-bottom"
    style="justify-content: center; display: flex; gap: 0.5em;"
  >
    <button
      class="w3-button w3-blue w3-bar-item"
      disabled={selectedAssetTags.size === 0}
      on:click={openBulkMessageSender}
    >
      Send Email to Selected
    </button>
    <button
      class="w3-button w3-orange w3-bar-item"
      disabled={selectedAssetTags.size === 0 || isUpdatingStatus}
      on:click={openLostConfirm}
    >
      Mark as Lost
    </button>
    <button
      class="w3-button w3-red w3-bar-item"
      disabled={selectedAssetTags.size === 0 || deviceActionInProgress}
      on:click={() => openDeviceActionConfirm("disable")}
    >
      Disable Selected
    </button>
    <button
      class="w3-button w3-green w3-bar-item"
      disabled={selectedAssetTags.size === 0 || deviceActionInProgress}
      on:click={() => openDeviceActionConfirm("reenable")}
    >
      Re-enable Selected
    </button>
    <span class="w3-bar-item data-exporter-wrap" style="padding:0;">
      <DataExporter items={filteredData} {filename} headers={exportColumns} />
    </span>
  </div>

  <!-- Disable/enable confirmation dialog -->
  {#if showDeviceActionConfirm}
    <div class="modal-wrap">
      <div class="modal-content w3-card w3-padding">
        <h4>
          {pendingDeviceAction === "disable" ? "Disable" : "Re-enable"}
          {selectedAssetTags.size} device(s)?
        </h4>
        {#if pendingDeviceAction === "disable"}
          <p class="w3-small">
            Disabled devices will show a lock screen and cannot be used until
            re-enabled. This calls the Google Admin API.
          </p>
        {:else}
          <p class="w3-small">
            This will re-enable the selected devices via the Google Admin API.
          </p>
        {/if}
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button
            class="w3-button {pendingDeviceAction === 'disable' ? 'w3-red' : 'w3-green'}"
            on:click={confirmDeviceAction}
          >
            Confirm {pendingDeviceAction === "disable" ? "Disable" : "Re-enable"}
          </button>
          <button
            class="w3-button w3-light-grey"
            on:click={() => (showDeviceActionConfirm = false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Device action results -->
  {#if deviceActionResults}
    <div class="w3-panel {deviceActionResults.failed.length ? 'w3-pale-red' : 'w3-pale-green'} w3-border">
      <p>
        <strong>
          {deviceActionResults.action === "disable" ? "Disabled" : "Re-enabled"}
          {deviceActionResults.succeeded.length} device(s).
        </strong>
        {#if deviceActionResults.failed.length}
          {deviceActionResults.failed.length} failed:
        {/if}
      </p>
      {#if deviceActionResults.failed.length}
        <ul class="w3-ul w3-small">
          {#each deviceActionResults.failed as f}
            <li><b>{f.tag}</b> (s/n: {f.serial}) — {f.error}</li>
          {/each}
        </ul>
        <p class="w3-small">
          <a href={ADMIN_CONSOLE_URL} target="_blank" rel="noopener">
            Manage these devices manually in the Google Admin console →
          </a>
        </p>
      {/if}
      <button
        class="w3-button w3-tiny w3-light-grey"
        on:click={() => (deviceActionResults = null)}>Dismiss</button
      >
    </div>
  {/if}

  {#if mountBulkMessageSender}
    <div
      class="modal-wrap modal-bulk-message"
      style:display={showBulkMessageSender ? "flex" : "none"}
    >
      <div
        class="modal-content modal-bulk-message-content"
        style="position:relative;"
      >
        <button
          class="close-modal-btn"
          on:click={() => (showBulkMessageSender = false)}
          aria-label="Close"
          type="button">&times;</button
        >
        <BulkMessageSender assetTags={[...selectedAssetTags]} />
      </div>
    </div>
  {/if}

  {#if showTopScroll}
    <div
      class="top-scrollbar"
      bind:this={topScrollEl}
      on:scroll={handleTopScroll}
    >
      <div
        class="top-scrollbar-content"
        style={`width: ${topScrollWidth}px;`}
      ></div>
    </div>
  {/if}
  <div
    class="report-table-scroll"
    bind:this={tableScrollEl}
    on:scroll={handleTableScroll}
  >
    <table
      bind:this={reportTableEl}
      class="w3-table w3-bordered w3-striped report-table-grid"
    >
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectedAssetTags.size === filteredData.length &&
                filteredData.length > 0}
              indeterminate={selectedAssetTags.size > 0 &&
                selectedAssetTags.size < filteredData.length}
              on:change={toggleSelectAll}
            />
          </th>
          {#each headers as header, i}
            <th
              on:click={() => {
                const colProp = columns[i];
                if (sortColumn === colProp) {
                  sortDirection = sortDirection === "asc" ? "desc" : "asc";
                } else {
                  sortColumn = colProp;
                  sortDirection = "asc";
                }
              }}
            >
              {header}
            </th>
          {/each}
          {#if haveGoogleData}
            <th
              on:click={() => {
                if (sortColumn === "lastUserMatch") {
                  sortDirection = sortDirection === "asc" ? "desc" : "asc";
                } else {
                  sortColumn = "lastUserMatch";
                  sortDirection = "asc";
                }
              }}
              style="cursor:pointer"
            >
              Last User?
            </th>
            <th
              on:click={() => {
                if (sortColumn === "lastUsed") {
                  sortDirection = sortDirection === "asc" ? "desc" : "asc";
                } else {
                  sortColumn = "lastUsed";
                  sortDirection = "asc";
                }
              }}
              style="cursor:pointer"
            >
              Last Used
            </th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each filteredData as row (row.Serial)}
          <tr
            class:highlight-stale={haveGoogleData && isStale(row.lastUsed)}
            class:highlight-wrong-user={haveGoogleData && !row.lastUserMatch}
          >
            <td>
              <input
                type="checkbox"
                checked={selectedAssetTags.has(row["Asset Tag"])}
                on:change={() => toggleSelectRow(row)}
              />
            </td>
            {#each columns as column, i (i)}
              <td>
                {#if column == "_ASSET"}
                  <AssetDisplay
                    asset={row}
                    openInNewTab={openAssetLinksInNewTab}
                    signoutStatus={statusByTag.get(row["Asset Tag"]) || ""}
                  />
                {:else}
                  {row[column]}
                {/if}
              </td>
            {/each}
            {#if haveGoogleData}
              <td class="user">
                {row.recentUsers[0]}
                <button
                  class="w3-button w3-small"
                  on:click={() => {
                    expandedUsers[row.Serial] = !expandedUsers[row.Serial];
                  }}>+</button
                >
                {#if expandedUsers[row.Serial]}
                  <ul>
                    {#each row.recentUsers.slice(1) as user}
                      <li>{user}</li>
                    {/each}
                  </ul>
                {/if}
              </td>
              <td class="session">
                {row.lastUsed}<button
                  class="w3-button w3-small"
                  on:click={() => {
                    expandedSessions[row.Serial] =
                      !expandedSessions[row.Serial];
                  }}>+</button
                >

                {#if expandedSessions[row.Serial]}
                  <ul>
                    {#each row.sessions as session}
                      <li>{session}</li>
                    {/each}
                  </ul>
                {/if}
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if showLostConfirm}
    <div
      class="modal-wrap"
      style="display:flex;align-items:center;justify-content:center;z-index:2000;"
    >
      <div
        class="modal-content lost-confirm-modal"
        style="max-width:400px;width:90vw;padding:2em;position:relative;"
      >
        <button
          class="close-modal-btn"
          on:click={closeLostConfirm}
          disabled={isUpdatingStatus}
          aria-label="Close"
          type="button">&times;</button
        >
        <h3>Mark {selectedAssetTags.size} asset(s) as Lost?</h3>
        <label for="lost-note">Optional Note:</label>
        <textarea
          id="lost-note"
          class="w3-input w3-border"
          rows="3"
          bind:value={lostNote}
          placeholder="Add a note (optional)"
        ></textarea>
        <div class="w3-margin-top">
          <label>
            <input
              type="checkbox"
              class="w3-check"
              bind:checked={billForReplacement}
              disabled={isUpdatingStatus}
            />
            Bill family for replacement
          </label>
          {#if billForReplacement}
            <div class="w3-margin-top">
              <label for="replacement-cost">Replacement cost ($):</label>
              <input
                id="replacement-cost"
                type="number"
                min="0"
                class="w3-input w3-border"
                bind:value={replacementCost}
                disabled={isUpdatingStatus}
              />
            </div>
            <p class="w3-small w3-text-gray">
              {billableSelectedCount} of {selectedAssetTags.size} selected device(s)
              have a current student and can be billed. For each, we'll create a
              closed "Lost" ticket with the replacement cost and ask the business
              office to send an invoice to the family.
            </p>
          {/if}
        </div>
        <div class="w3-bar w3-margin-top">
          <button
            class="w3-button w3-orange w3-bar-item"
            on:click={confirmMarkSelectedAsLost}
            disabled={isUpdatingStatus ||
              (billForReplacement &&
                (!replacementCost || replacementCost <= 0))}
          >
            {isUpdatingStatus
              ? billForReplacement
                ? "Marking lost & sending invoices..."
                : "Marking as Lost..."
              : billForReplacement
                ? "Confirm & Send Invoice(s)"
                : "Confirm"}
          </button>
        </div>
        {#if updateStatusError}
          <div class="w3-text-red">{updateStatusError}</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .highlight-stale {
    background-color: #ffcccc; /* Light red for stale items */
  }
  .highlight-wrong-user {
    background-color: #ffcc99; /* Light orange for wrong user */
  }
  .highlight-wrong-user .user {
    font-weight: bold;
    color: #c6093b;
  }
  .highlight-stale .session {
    font-weight: bold;
    color: #c6093b;
  }

  /* Minimalist expander styling for <ul> in table cells */
  td ul {
    margin: 4px 0 0 0;
    padding: 6px 12px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    list-style: none;
    font-size: 0.95em;
    position: relative;
    z-index: 1;
  }
  td ul li {
    margin: 0;
    padding: 0;
    border: none;
    line-height: 1.5;
  }

  /* Modal styles */
  .modal-wrap {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    z-index: 1000;
    padding: 0;
  }
  .modal-content {
    background: #fff;
    border-radius: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    box-shadow: none;
    padding: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  .modal-content.lost-confirm-modal {
    width: auto;
    height: auto;
    max-height: 90vh;
    border-radius: 8px;
  }
  .modal-bulk-message .modal-content {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
  }
  .data-exporter-wrap :global(button.w3-button) {
    margin-top: 0;
  }
  .report-table-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .top-scrollbar {
    position: sticky;
    top: 0;
    overflow-x: auto;
    overflow-y: hidden;
    margin-bottom: 6px;
    padding: 6px 0 4px;
    background: #fff;
    z-index: 20;
    border-bottom: 1px solid #e0e0e0;
    -webkit-overflow-scrolling: touch;
  }
  .top-scrollbar-content {
    height: 1px;
  }
  .report-table-grid {
    min-width: 920px;
    table-layout: auto;
  }
  .lost-confirm-modal {
    position: relative;
  }
  .close-modal-btn {
    position: absolute;
    top: 8px;
    right: 12px;
    background: none;
    border: none;
    font-size: 2em;
    color: #888;
    cursor: pointer;
    z-index: 10;
    padding: 0;
    line-height: 1;
    transition: color 0.2s;
  }
  .close-modal-btn:hover {
    color: #c6093b;
  }
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 0.5em;
  }
  .dropdown-filter {
    display: inline-block;
    position: relative;
  }
  .filter-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    min-width: 220px;
    background: #fff;
  }
</style>
