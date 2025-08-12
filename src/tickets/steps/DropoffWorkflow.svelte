<script lang="ts">
  import { Notification } from "./../../data/notifications.ts";
  import TicketNotificationsSummary from "./../components/TicketNotificationsSummary.svelte";
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import TicketAssetAssignment from "../editorComponents/TicketAssetAssignment.svelte";
  import TicketNotification from "../TicketNotification.svelte";
  import { signoutAsset } from "../../data/signout";
  import { assetStore } from "../../data/inventory";
  import { get } from "svelte/store";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";
  import { mergeUpdates } from "./draftManager";
  import Toast from "@components/Toast.svelte";
  import StickyBottomActionBar from "../components/StickyBottomActionBar.svelte";

  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  // Local draft for general edits
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

  // Drop-off specifics
  let checkInDevice = true;
  let provideTemp = true;

  // Track processing state
  let processing = false;

  // helper to set/unset the Temporary Device from the assignment component
  function setTemporaryDevice(assetId?: string) {
    if (assetId) {
      handleChange({
        "Temporary Device": [assetId] as any,
        // Do not mark Loaned yet; only mark Needed until processing
        "Temp Status": "Needed" as any,
      });
    } else {
      handleChange({
        "Temporary Device": [] as any,
        // Clearing device resets status unless already processed
        "Temp Status": provideTemp
          ? ticket["Temp Status"] === "Loaned"
            ? "Loaned"
            : undefined
          : undefined,
      });
    }
  }

  // Derived values for UI and notes
  $: mainTag = ticket._linked?.Device?.["Asset Tag"] || "";
  $: draftTemp = (draft as any)["Temporary Device"] as string[] | undefined;
  $: selectedTempId =
    (draftTemp && draftTemp[0]) ||
    ((ticket as any)["Temporary Device"] || [])[0];
  $: hasTemp = provideTemp && Boolean(selectedTempId);
  $: buttonLabel = hasTemp
    ? "Check in device for repair and check out temp"
    : "Check in device for repair";
  // Summary text for action bar
  $: actionSummary = hasTemp
    ? `Will check in ${mainTag || "device"} and loan temp, then set status to Have Device.`
    : `Will check in ${mainTag || "device"} and set status to Have Device.`;

  let toast: { kind: "success" | "error" | "info"; message: string } | null =
    null;
  function showToast(kind: "success" | "error" | "info", message: string) {
    toast = { kind, message };
    setTimeout(() => (toast = null), 3500);
  }

  async function saveDraft() {
    if (!Object.keys(draft).length && ticket["Temp Status"]) {
      // still allow temp status change when toggling provideTemp even if no other draft keys
    }
    try {
      const updates: Partial<Ticket> = { ...draft };

      // Enforce Temp Status semantics on save (pre-processing)
      if (provideTemp) {
        const tempAssigned = selectedTempId;
        // If temp requested but not yet processed, status should be Needed (unless already Loaned)
        if (ticket["Temp Status"] !== "Loaned") {
          (updates as any)["Temp Status"] = tempAssigned ? "Needed" : "Needed";
        }
      } else {
        // No temp needed
        (updates as any)["Temp Status"] = "Not Needed";
        // Clear any temp device reference if present
        if ((ticket as any)["Temporary Device"]?.length) {
          (updates as any)["Temporary Device"] = [] as any;
        }
      }

      // Build history changes AFTER applying enforced fields
      const changes = Object.fromEntries(
        Object.keys(updates).map((k) => [
          k,
          { from: (ticket as any)[k], to: (updates as any)[k] },
        ])
      );
      await updateTicket(updates, {
        action: "dropoff_saved",
        status: ticket["Ticket Status"],
        note: "Drop-off details saved",
        changes,
      } as any);
      draft = {};
      showToast("success", "Changes saved.");
    } catch (e) {
      console.error("Failed to save draft", e);
      showToast("error", "Failed to save changes");
    }
  }

  async function processDropoff() {
    if (processing) return;
    processing = true;

    const updates: Partial<Ticket> = { ...draft };
    const historyChanges: Record<string, { from?: unknown; to?: unknown }> = {};

    // Determine IDs we need from ticket
    const studentIds = (ticket as any).Student as string[] | undefined;
    const deviceIds = (ticket as any).Device as string[] | undefined;
    const studentId = studentIds && studentIds[0];
    const deviceId = deviceIds && deviceIds[0];

    try {
      // 1) Check in the current device
      if (checkInDevice && deviceId && studentId) {
        const deviceObj: any = {
          _id: deviceId,
          "Asset Tag": mainTag,
        };
        const studentObj: any = { _id: studentId };
        await signoutAsset(
          studentObj,
          null as any,
          deviceObj,
          `In for repair (Ticket #${ticket.Number})`,
          "Repairing",
          false
        );
      }

      // 2) Temp device checkout
      if (provideTemp) {
        if (!studentId) {
          showToast("error", "Ticket has no linked student");
          processing = false;
          return;
        }
        const tempId = selectedTempId;
        if (!tempId) {
          showToast("error", "Select a temporary device first");
          processing = false;
          return;
        }
        const store: any = get(assetStore);
        const tempAsset: any = store[tempId] || {
          _id: tempId,
          "Asset Tag": "",
        };

        const studentObj: any = { _id: studentId };
        const tempNote = mainTag
          ? `Temp device while repairing ${mainTag} (Ticket #${ticket.Number})`
          : `Temporary device for Ticket #${ticket.Number}`;
        await signoutAsset(
          studentObj,
          null as any,
          tempAsset,
          tempNote,
          "Out",
          false
        );
        (updates as any)["Temporary Device"] = [tempId];
        (updates as any)["Temp Status"] = "Loaned";
        historyChanges["Temporary Device"] = {
          from: (ticket as any)["Temporary Device"],
          to: [tempId],
        };
        historyChanges["Temp Status"] = {
          from: ticket["Temp Status"],
          to: "Loaned",
        };
      } else {
        // Mark not needed
        (updates as any)["Temp Status"] = "Not Needed";
        historyChanges["Temp Status"] = {
          from: ticket["Temp Status"],
          to: "Not Needed",
        };
        // Clear temp device link if any
        (updates as any)["Temporary Device"] = [] as any;
      }

      // 3) Move status to Have Device
      updates["Ticket Status"] = "Have Device" as any;
      historyChanges["Ticket Status"] = {
        from: ticket["Ticket Status"],
        to: "Have Device",
      };

      await updateTicket(updates, {
        action: "dropoff_processed",
        status: "Have Device",
        note: hasTemp
          ? "Drop-off processed; checked in device and loaned temp"
          : "Drop-off processed; checked in device; no temp needed",
        changes: historyChanges,
      } as any);

      // reset local draft
      draft = {};
      showToast("success", "Drop-off processed");
    } catch (e) {
      console.error("Dropoff processing failed:", e);
      showToast("error", "Failed to process drop-off");
    } finally {
      processing = false;
    }
  }
</script>

<div class="w3-panel w3-pale-yellow w3-border dropoff-content">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <h4 style="margin:0;">Awaiting Drop-Off</h4>
    <ShowPendingChanges {draft} onSave={saveDraft} saving={processing} />
  </div>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  {#if processing}
    <div class="w3-panel w3-yellow w3-small">
      <i class="fa fa-spinner fa-spin"></i> Processing…
    </div>
  {/if}

  <TicketInfo
    ticket={mergedTicket}
    onChange={handleChange}
    disabled={processing}
  />

  <TicketDescription ticket={mergedTicket} onChange={handleChange} />
  <TicketNotification
    ticket={mergedTicket}
    defaultMessage="BringMachineForRepairLoanReady"
  />

  <div class="w3-section">
    <label class="w3-small">
      <input
        type="checkbox"
        bind:checked={checkInDevice}
        disabled={processing}
      />
      Check in {ticket._linked?.Device?.["Asset Tag"] || "dropped device"} now
    </label>
  </div>

  {#if provideTemp}
    <div class="w3-section w3-padding w3-border w3-round">
      <h5>Temporary Device</h5>
      <div class="w3-section">
        <TicketAssetAssignment
          {ticket}
          field="Temporary Device"
          onSave={setTemporaryDevice}
          disabled={processing}
        />
      </div>
      <div class="w3-small w3-text-gray">
        <div>This will:</div>
        <ul class="w3-ul" style="margin-top:4px;">
          <li>Check in device {mainTag || "(linked device)"} for repair</li>
          {#if hasTemp}
            <li>Check out temporary device to the student</li>
          {/if}
          <li>Update ticket status to "Have Device"</li>
        </ul>
      </div>
    </div>
  {/if}

  {#if toast}
    <Toast kind={toast.kind} message={toast.message} show={true} />
  {/if}
</div>

<StickyBottomActionBar className="dropoff-action-bar-container">
  <div class="w3-small action-bar-left">
    <label
      class="w3-small"
      style="margin-right:12px; display:inline-flex; align-items:center; gap:4px;"
    >
      <input type="checkbox" bind:checked={provideTemp} disabled={processing} />
      Temp device needed
    </label>
    <span>{actionSummary}</span>
  </div>
  <button
    class="w3-button w3-brown"
    on:click={processDropoff}
    disabled={processing || (provideTemp && !selectedTempId)}
    aria-label={buttonLabel}
  >
    {#if processing}
      <i class="fa fa-spinner fa-spin"></i> Processing…
    {:else}
      {buttonLabel}
    {/if}
  </button>
</StickyBottomActionBar>

<style>
  .dropoff-content {
    padding-bottom: 80px; /* space so content not hidden behind sticky bar */
  }
  .action-bar-left {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  @media (max-width: 640px) {
    .action-bar-left {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
