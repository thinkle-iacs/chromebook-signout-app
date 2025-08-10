<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import TicketAssetAssignment from "../editorComponents/TicketAssetAssignment.svelte";
  import TicketNotification from "../TicketNotification.svelte";
  import { signoutAsset } from "../../data/signout";
  import { assetStore } from "../../data/inventory";
  import { get } from "svelte/store";

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

  // Drop-off specifics
  let checkInDevice = true;
  let provideTemp = true;

  // Track processing state
  let processing = false;

  // helper to set/unset the Temporary Device from the assignment component
  function setTemporaryDevice(assetId?: string) {
    const d: any = draft as any;
    if (assetId) {
      d["Temporary Device"] = [assetId];
      d["Temp Status"] = "Loaned";
    } else {
      d["Temporary Device"] = [];
      delete d["Temp Status"];
    }
    // trigger reactivity
    draft = { ...draft };
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
          alert("This ticket has no linked student.");
          return;
        }
        const tempId = selectedTempId;
        if (!tempId) {
          alert("Select a temporary device first.");
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
          ? `Drop-off processed; checked in device and loaned temp`
          : "Drop-off processed; checked in device; no temp needed",
        changes: historyChanges,
      } as any);

      // reset local draft
      draft = {};
    } catch (e) {
      console.error("Dropoff processing failed:", e);
      alert("Failed to process drop-off. No changes were saved.");
    } finally {
      processing = false;
    }
  }
</script>

<div class="w3-panel w3-pale-yellow w3-border">
  <h4>Awaiting Drop-Off</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  {#if processing}
    <div class="w3-panel w3-yellow w3-small">
      <i class="fa fa-spinner fa-spin"></i> Processing…
    </div>
  {/if}

  <TicketInfo {ticket} onChange={handleChange} disabled={processing} />
  <TicketDescription {ticket} onChange={handleChange} />

  <TicketNotification
    {ticket}
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

  <div class="w3-section w3-padding w3-border w3-round">
    <h5>Temporary Device</h5>
    <label class="w3-small" style="display:block;margin-bottom:8px;">
      <input type="checkbox" bind:checked={provideTemp} disabled={processing} />
      Provide a temporary device
    </label>

    {#if provideTemp}
      <div class="w3-section">
        <TicketAssetAssignment
          {ticket}
          field="Temporary Device"
          onSave={setTemporaryDevice}
          disabled={processing}
        />
      </div>
    {/if}

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

  <div class="w3-section">
    <button
      class="w3-button w3-amber"
      on:click={processDropoff}
      disabled={processing}
    >
      {buttonLabel}
    </button>
  </div>
</div>
