<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import { updateAsset } from "../../data/inventory";

  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  // Local draft for general edits to ticket
  let draft: Partial<Ticket> = {};
  function handleChange(updates: Partial<Ticket>) {
    draft = { ...draft, ...updates };
  }

  // Device status (on Inventory asset, not on ticket)
  const deviceStatusOptions = [
    "New",
    "Waiting on Part",
    "Waiting on Repair",
    "Repaired",
    "Discarded",
  ];
  let currentAssetStatus: string | "" = "";
  let deviceStatus: string | "" = currentAssetStatus;

  $: {
    currentAssetStatus = (ticket as any)._linked?.Device?.Status || "";
  }

  function updateDevicePreset(currentAssetStatus) {
    deviceStatus = currentAssetStatus;
  }

  $: updateDevicePreset(currentAssetStatus);

  // Repair cost (on ticket)
  let repairCost: number | undefined = ticket["Repair Cost"];

  let saving = false;

  async function saveChanges() {
    if (saving) return;
    saving = true;
    try {
      const historyChanges: Record<string, { from?: unknown; to?: unknown }> =
        {};

      // Update asset status if changed
      const deviceIds = (ticket as any).Device as string[] | undefined;
      const deviceId = deviceIds && deviceIds[0];
      if (deviceId && deviceStatus !== currentAssetStatus) {
        await updateAsset(deviceId, { Status: deviceStatus || null });
        historyChanges["Device Status"] = {
          from: currentAssetStatus || undefined,
          to: deviceStatus || undefined,
        };
      }

      // Build ticket updates from draft
      const updates: Partial<Ticket> = { ...draft };

      // Include repair cost if changed
      if (repairCost !== ticket["Repair Cost"]) {
        updates["Repair Cost"] = repairCost as any;
        historyChanges["Repair Cost"] = {
          from: ticket["Repair Cost"],
          to: repairCost,
        };
      }

      // Persist if we have anything to save
      const hasTicketUpdates = Object.keys(updates).length > 0;
      const hasHistory = Object.keys(historyChanges).length > 0;
      if (hasTicketUpdates || hasHistory) {
        await updateTicket(updates, {
          action: "repair_saved",
          status: ticket["Ticket Status"],
          note: "Repair details saved",
          changes: historyChanges,
        } as any);
        // Clear local draft after successful save
        draft = {};
      }
    } catch (e) {
      console.error("Failed to save repair changes:", e);
      alert("Failed to save repair changes.");
    } finally {
      saving = false;
    }
  }

  // Placeholder messaging/invoicing hooks
  async function sendInvoicePlaceholder() {
    // TODO: implement real invoicing
    console.log("[invoice] Would invoice for:", ticket["Repair Cost"], ticket);
  }

  async function markReadyForPickup() {
    if (saving) return;
    saving = true;
    try {
      // First save any pending changes (asset status / repair cost)
      await saveChanges();

      // Then perform messaging placeholder (invoice only)
      await sendInvoicePlaceholder();

      // Finally update ticket status
      await updateTicket(
        { ...draft, "Ticket Status": "Ready for Pickup" as any },
        {
          action: "repair_complete",
          status: "Ready for Pickup",
          note: "Marked ready for pickup",
          changes: {
            "Ticket Status": {
              from: ticket["Ticket Status"],
              to: "Ready for Pickup",
            },
          },
        } as any
      );

      // reset draft
      draft = {};
    } catch (e) {
      console.error("Failed to mark ready for pickup:", e);
      alert("Failed to mark ready for pickup.");
    } finally {
      saving = false;
    }
  }
</script>

<div class="w3-panel w3-pale-blue w3-border">
  <h4>In Repair</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  <TicketInfo {ticket} onChange={handleChange} disabled={saving} />
  <TicketDescription {ticket} onChange={handleChange} />

  <div class="w3-row-padding w3-section">
    <div class="w3-col s12 m6">
      <label for="device-status-select" class="w3-text-blue"
        ><b>Device Status (Inventory)</b></label
      >
      <select
        id="device-status-select"
        class="w3-select w3-border"
        bind:value={deviceStatus}
        disabled={saving}
      >
        <option value="">None</option>
        {#each deviceStatusOptions as status}
          <option value={status}>{status}</option>
        {/each}
      </select>
      <div class="w3-small w3-text-grey">
        Current: {currentAssetStatus || "None"}
      </div>
    </div>

    <div class="w3-col s12 m6">
      <label for="repair-cost-input" class="w3-text-blue"
        ><b>Repair Cost</b></label
      >
      <input
        id="repair-cost-input"
        type="number"
        class="w3-input w3-border"
        min="0"
        step="0.01"
        bind:value={repairCost}
        placeholder="0.00"
        disabled={saving}
      />
    </div>
  </div>

  <div class="w3-section">
    <button class="w3-button w3-blue" on:click={saveChanges} disabled={saving}>
      {saving ? "Saving..." : "Save"}
    </button>
    <button
      class="w3-button w3-green w3-margin-left"
      on:click={markReadyForPickup}
      disabled={saving}
    >
      Mark Ready for Pickup
    </button>
  </div>
</div>
