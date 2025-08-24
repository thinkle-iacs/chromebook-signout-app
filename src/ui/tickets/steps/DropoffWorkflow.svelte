<script lang="ts">
  import { logger } from "@utils/log";
  import type { Asset } from "@data/inventory";
  import { Notification } from "@data/notifications";
  import TicketNotificationsSummary from "./../components/TicketNotificationsSummary.svelte";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import TicketAssetAssignment from "../editorComponents/TicketAssetAssignment.svelte";
  import TicketNotification from "../TicketNotification.svelte";
  import { signoutAsset } from "@data/signout";
  import { assetStore } from "@data/inventory";
  import { get } from "svelte/store";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";
  import { mergeUpdates } from "./draftManager";
  import Toast from "@components/Toast.svelte";
  import StickyBottomActionBar from "../components/StickyBottomActionBar.svelte";
  import AssetDisplay from "@ui/assets/AssetDisplay.svelte";

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
  let mergedTicket: Ticket = { ...ticket, ...draft } as Ticket;
  $: {
    const { merged, updates } = mergeUpdates(ticket, draft);
    mergedTicket = merged;
    draft = updates;

    logger.logVerbose("Merged ticket", mergedTicket, "Draft", draft);
  }

  // Drop-off specifics
  let checkInDevice = true;
  let provideTemp = true;

  $: if (provideTemp && !["Needed", "Loaned"].includes(draft["Temp Status"])) {
    handleChange({ "Temp Status": "Needed" });
  } else if (!provideTemp) {
    handleChange({
      "Temp Status": "Not Needed",
      "Temporary Device": [] as any,
    });
  }

  // Track processing state
  let processing = false;

  // helper to set/unset the Temporary Device from the assignment component
  function setTemporaryDevice(assetId?: string, asset?: Asset) {
    if (assetId) {
      handleChange({
        "Temporary Device": [assetId] as any,
        // Do not mark Loaned yet; only mark Needed until processing
        "Temp Status": "Needed" as any,
        // Ensure linked asset is set for display
        _linked: { "Temporary Device": asset },
      });
    } else {
      handleChange({
        "Temporary Device": [] as any,
        // Clear out _linked...
        _linked: { "Temporary Device": null },
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
  $: mainTag = mergedTicket._linked?.Device?.["Asset Tag"] || "";

  $: hasTemp = provideTemp && mergedTicket["Temporary Device"]?.length > 0;
  $: checkInLabel = checkInDevice
    ? `<b>Check in</b> device for repair`
    : "Leave device as is";
  $: checkOutLabel = provideTemp
    ? `<b>Sign out</b> temp, `
    : "Mark <b>temp-not-needed</b>";
  $: buttonLabel = `<span>${checkInLabel}, ${checkOutLabel} and update Status to Have Device</span>`;

  $: logger.logVerbose(
    "Updated mainTag",
    mainTag,
    "draftTemp",
    draft,
    " ticket",
    ticket
  );

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
      logger.logError("Failed to save draft", e);
      showToast("error", "Failed to save changes");
    }
  }

  async function processDropoff() {
    if (processing) return;
    processing = true;

    const updates: Partial<Ticket> = { ...draft };
    const historyChanges: Record<string, { from?: unknown; to?: unknown }> = {};

    // Determine IDs we need from ticket
    const studentIds = (mergedTicket as any).Student as string[] | undefined;
    const deviceIds = (mergedTicket as any).Device as string[] | undefined;
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
        const tempId = mergedTicket["Temporary Device"]?.[0];
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
          ? `Temp device while repairing ${mainTag} (Ticket #${mergedTicket.Number})`
          : `Temporary device for Ticket #${mergedTicket.Number}`;
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
      logger.logError("Dropoff processing failed:", e);
      showToast("error", "Failed to process drop-off");
    } finally {
      processing = false;
    }
  }
</script>

<div class="w3-panel w3-border dropoff-content">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <ShowPendingChanges {draft} onSave={saveDraft} saving={processing} />
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

  <div class="w3-section"></div>

  {#if toast}
    <Toast kind={toast.kind} message={toast.message} show={true} />
  {/if}
</div>

<StickyBottomActionBar className="dropoff-action-bar-container">
  <div class="action-bar-left">
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <div>
        <label>
          <input
            type="checkbox"
            bind:checked={provideTemp}
            disabled={processing}
          />
          Sign <b>out</b>
        </label>
        {#if provideTemp}
          <TicketAssetAssignment
            ticket={mergedTicket}
            field="Temporary Device"
            onSave={setTemporaryDevice}
            forceEditOn={provideTemp &&
              !mergedTicket["Temporary Device"]?.length}
          />
        {/if}
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            bind:checked={checkInDevice}
            disabled={processing}
          />
          Check <b>in</b>
          {#if mergedTicket?._linked?.Device}
            <AssetDisplay asset={mergedTicket._linked?.Device} />
          {/if}
        </label>
      </div>
    </div>
    <!-- <div class="w3-small w3-text-gray">
          <div>This will:</div>
          <ul class="w3-ul" style="margin-top:4px;">
            <li>Check in device {mainTag || "(linked device)"} for repair</li>
            {#if hasTemp}
              <li>Check out temporary device to the student</li>
            {/if}
            <li>Update ticket status to "Have Device"</li>
          </ul>
        </div> -->
  </div>

  <button
    class="w3-button w3-green long-button"
    on:click={processDropoff}
    disabled={processing ||
      (provideTemp && !mergedTicket["Temporary Device"]?.length)}
    aria-label={buttonLabel}
  >
    {#if processing}
      <i class="fa fa-spinner fa-spin"></i> Processing…
    {:else}
      {@html buttonLabel}
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
  .long-button {
    text-overflow: ellipsis;
  }
</style>
