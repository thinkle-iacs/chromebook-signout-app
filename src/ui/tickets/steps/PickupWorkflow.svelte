<script lang="ts">
  import { logger } from "@utils/log";

  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import TicketNotification from "../TicketNotification.svelte";
  import { signoutAsset as apiSignoutAsset } from "@data/signout";
  import { assetStore } from "@data/inventory";
  import { get } from "svelte/store";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";
  import { mergeUpdates } from "./draftManager";
  import StickyBottomActionBar from "../components/StickyBottomActionBar.svelte";
  export let createNotifications;
  export let signoutAsset = apiSignoutAsset;
  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  let draft: Partial<Ticket> = {};
  function handleChange(updates: Partial<Ticket>) {
    draft = { ...draft, ...updates };
  }
  let mergedTicket: Ticket;
  $: {
    const { merged, updates } = mergeUpdates(ticket, draft);
    mergedTicket = merged;
    draft = updates;
  }

  // Close actions
  let checkInTemp = true;
  let checkOutRepaired = true;
  let processing = false;

  const resolutions: Ticket["Resolution"][] = [
    "Fixed",
    "Replaced Device",
    "Unable to Reproduce",
    "Won't Fix",
    "Duplicate",
    "Canceled",
    "No Issue Found",
    "User Education",
  ];

  // Derive asset tags for labels
  $: mainTag =
    ticket._linked?.Device?.["Asset Tag"] ||
    (ticket as any)["Asset Tag (from Device)"]?.[0] ||
    "";
  $: tempTag =
    (ticket as any)._linked?.["Temporary Device"]?.["Asset Tag"] ||
    (ticket as any)["Asset Tag (from Temporary Device)"]?.[0] ||
    "";

  // Linked record ids + what closing will actually do, so the confirmation
  // button can narrate it accurately.
  $: linkedStudentId = ((ticket as any).Student as string[] | undefined)?.[0];
  $: linkedDeviceId = ((ticket as any).Device as string[] | undefined)?.[0];
  $: linkedTempId = ((ticket as any)["Temporary Device"] as
    | string[]
    | undefined)?.[0];
  $: willCheckOut = checkOutRepaired && !!linkedDeviceId && !!linkedStudentId;
  $: willCheckInTemp = checkInTemp && !!linkedTempId && !!linkedStudentId;
  $: closeActionLabel = (() => {
    const parts: string[] = [];
    if (willCheckOut) parts.push(`sign out ${mainTag || "device"}`);
    if (willCheckInTemp) parts.push(`check in ${tempTag || "temp"}`);
    return parts.length ? `Close ticket, ${parts.join(", ")}` : "Close ticket";
  })();

  $: studentName =
    (ticket as any)._linked?.Student?.Name ||
    (Array.isArray((ticket as any)["Name (from Student)"])
      ? (ticket as any)["Name (from Student)"][0]
      : (ticket as any)["Name (from Student)"]) ||
    "the student";
  $: studentStatusRaw =
    (ticket as any)._linked?.Student?.Status ??
    (ticket as any)["Status (from Student)"];
  $: studentInactive =
    (Array.isArray(studentStatusRaw) ? studentStatusRaw[0] : studentStatusRaw)
      ?.toString()
      .toLowerCase() === "inactive";

  let showConfirm = false;
  async function confirmClose() {
    try {
      await closeTicket();
    } finally {
      showConfirm = false;
    }
  }

  async function closeTicket() {
    if (processing) return;
    processing = true;
    try {
      const updates: Partial<Ticket> = { ...draft };
      const historyChanges: Record<string, { from?: unknown; to?: unknown }> =
        {};
      const studentIds = (ticket as any).Student as string[] | undefined;
      const studentId = studentIds && studentIds[0];
      const deviceIds = (ticket as any).Device as string[] | undefined;
      const deviceId = deviceIds && deviceIds[0];
      const tempArr = (ticket as any)["Temporary Device"] as
        | string[]
        | undefined;
      const tempId = tempArr && tempArr[0];
      const store: any = get(assetStore);

      // 1) Check IN temporary device
      if (checkInTemp && tempId && studentId) {
        const tempAsset: any = store[tempId] || {
          _id: tempId,
          "Asset Tag": tempTag,
        };
        const studentObj: any = { _id: studentId };
        await signoutAsset(
          studentObj,
          null as any,
          tempAsset,
          `Temp device returned for Ticket #${ticket.Number}`,
          "Returned",
          false
        );
        (updates as any)["Temp Status"] = "Returned";
        historyChanges["Temp Status"] = {
          from: ticket["Temp Status"],
          to: "Returned",
        };
      }

      // 2) Check OUT repaired main device
      if (checkOutRepaired && deviceId && studentId) {
        const deviceAsset: any = store[deviceId] || {
          _id: deviceId,
          "Asset Tag": mainTag,
        };
        const studentObj: any = { _id: studentId };
        await signoutAsset(
          studentObj,
          null as any,
          deviceAsset,
          `Repaired device returned (Ticket #${ticket.Number})`,
          "Out",
          false
        );
      }

      // 3) Close ticket
      updates["Ticket Status"] = "Closed" as any;
      historyChanges["Ticket Status"] = {
        from: ticket["Ticket Status"],
        to: "Closed",
      };

      await updateTicket(updates, {
        action: "pickup_complete",
        status: "Closed",
        note: `Closed after pickup${checkInTemp && tempId ? "; temp returned" : ""}${checkOutRepaired ? "; device checked out" : ""}`,
        changes: historyChanges,
      } as any);

      draft = {};
    } catch (e) {
      logger.logError("Failed to close ticket:", e);
      alert("Failed to close ticket.");
    } finally {
      processing = false;
    }
  }
</script>

<div class="w3-panel w3-border pickup-content" style="padding-bottom:90px;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <h4 style="margin:0;">In Repair → Ready for Pickup</h4>
    <ShowPendingChanges {draft} onSave={closeTicket} saving={processing} />
  </div>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  <TicketInfo ticket={mergedTicket} onChange={handleChange} />
  <TicketDescription ticket={mergedTicket} onChange={handleChange} />
  <TicketNotification {createNotifications} ticket={mergedTicket} />

  <div class="w3-section w3-padding w3-border w3-round">
    <h5 style="margin-top:0;">Pickup Actions</h5>
    <label class="w3-small" style="display:block;margin-bottom:8px;">
      <input type="checkbox" bind:checked={checkInTemp} disabled={processing} />
      Check in temporary device{tempTag ? ` (${tempTag})` : ""}
    </label>
    <label class="w3-small" style="display:block;margin-bottom:8px;">
      <input
        type="checkbox"
        bind:checked={checkOutRepaired}
        disabled={processing}
      />
      Check out repaired device to student{mainTag ? ` (${mainTag})` : ""}
    </label>
  </div>

  <div class="w3-section w3-padding w3-border w3-round">
    <h5 style="margin-top:0;">Resolution</h5>
    <select
      class="w3-select w3-border w3-small"
      on:change={(e) => handleChange({ Resolution: e.target.value })}
    >
      <option value="" disabled selected={!mergedTicket.Resolution}
        >Select resolution...</option
      >
      {#each resolutions as r}
        <option value={r} selected={mergedTicket.Resolution === r}>{r}</option>
      {/each}
    </select>
    <div class="w3-small w3-text-gray" style="margin-top:4px;">
      Required if closing now.
    </div>
  </div>
</div>

<StickyBottomActionBar>
  <div
    class="w3-small"
    style="flex:1 1 auto; display:flex; flex-direction:column; gap:4px;"
  >
    <strong>Finalize Pickup</strong>
    <span
      >{checkInTemp ? "Will mark temp returned" : "Temp unchanged"}; {checkOutRepaired
        ? "repaired device out"
        : "main device unchanged"}; {mergedTicket.Resolution
        ? `resolution: ${mergedTicket.Resolution}`
        : "choose resolution"}.</span
    >
  </div>
  <button
    class="w3-button w3-green"
    on:click={() => (showConfirm = true)}
    disabled={processing || !mergedTicket.Resolution}
  >
    {processing ? "Processing…" : "Close Ticket…"}
  </button>
</StickyBottomActionBar>

{#if showConfirm}
  <div class="w3-modal" style="display:block; z-index:3000;">
    <div
      class="w3-modal-content w3-card-4 w3-round"
      style="max-width:480px; margin-top:8%;"
    >
      <header class="w3-container w3-blue">
        <h5>Close ticket #{ticket.Number}?</h5>
      </header>
      <div class="w3-container w3-padding-16">
        <p class="w3-small w3-text-gray" style="margin-top:0;">
          Confirm what should happen to the devices when this ticket closes:
        </p>
        {#if mainTag}
          <label class="w3-small" style="display:block;margin-bottom:8px;">
            <input type="checkbox" bind:checked={checkOutRepaired} />
            Check out repaired device <b>{mainTag}</b> to <b>{studentName}</b>
          </label>
        {/if}
        {#if tempTag}
          <label class="w3-small" style="display:block;margin-bottom:8px;">
            <input type="checkbox" bind:checked={checkInTemp} />
            Check in temporary device <b>{tempTag}</b>
          </label>
        {/if}
        {#if willCheckOut && studentInactive}
          <div
            class="w3-panel w3-pale-yellow w3-leftbar w3-border-amber w3-small"
            style="margin:8px 0;"
          >
            ⚠ <b>{studentName}</b> is marked <b>inactive</b> (likely graduated).
            Signing <b>{mainTag}</b> out to them will show it as theirs — uncheck
            above to return it to the pool instead.
          </div>
        {/if}
        {#if !willCheckOut && !willCheckInTemp}
          <p class="w3-small w3-text-gray">
            No device changes — just closing the ticket.
          </p>
        {/if}
      </div>
      <footer
        class="w3-container w3-padding-16"
        style="display:flex; gap:8px; justify-content:flex-end;"
      >
        <button
          class="w3-button w3-light-grey"
          on:click={() => (showConfirm = false)}
          disabled={processing}>Cancel</button
        >
        <button
          class="w3-button w3-green"
          on:click={confirmClose}
          disabled={processing}
        >
          {processing ? "Processing…" : closeActionLabel}
        </button>
      </footer>
    </div>
  </div>
{/if}
