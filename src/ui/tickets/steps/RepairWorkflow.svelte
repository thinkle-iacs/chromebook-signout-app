<script lang="ts">
  import { logger } from "@utils/log";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import { updateAsset } from "@data/inventory";
  import { createEventDispatcher } from "svelte";
  import RepairPickList from "../components/RepairPickList.svelte";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";
  import TicketInvoice from "../TicketInvoice.svelte";
  import TicketNotification from "../TicketNotification.svelte";
  import StickyBottomActionBar from "../components/StickyBottomActionBar.svelte";
  import { mergeUpdates } from "./draftManager";

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

  // Merge view (read-only to children) preferring draft values
  let mergedTicket: Ticket;
  $: {
    const { merged, updates } = mergeUpdates(ticket, draft);
    mergedTicket = merged;
    draft = updates;
  }

  // Device status (on Inventory asset, not on ticket)
  const deviceStatusOptions = [
    "New",
    "Active",
    "Needs Diagnosis",
    "Waiting on Part",
    "Waiting on Repair",
    "Repaired",
    "Retired",
    "Lost",
  ];

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

  let currentAssetStatus: string | "" = "";
  let deviceStatus: string | "" = currentAssetStatus;

  $: {
    currentAssetStatus = (ticket as any)._linked?.Device?.Status || "";
  }

  function updateDevicePreset(currentAssetStatus) {
    deviceStatus = currentAssetStatus;
  }

  $: updateDevicePreset(currentAssetStatus);

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

      // Add history entry for Repair Cost if present and changed
      if (
        Object.prototype.hasOwnProperty.call(updates, "Repair Cost") &&
        updates["Repair Cost"] !== ticket["Repair Cost"]
      ) {
        historyChanges["Repair Cost"] = {
          from: ticket["Repair Cost"],
          to: updates["Repair Cost"],
        };
      }

      // Add history entry for Resolution if present and changed
      if (
        Object.prototype.hasOwnProperty.call(updates, "Resolution") &&
        updates["Resolution"] !== ticket["Resolution"]
      ) {
        historyChanges["Resolution"] = {
          from: ticket["Resolution"],
          to: updates["Resolution"],
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
      logger.logError("Failed to save repair changes:", e);
      alert("Failed to save repair changes.");
    } finally {
      saving = false;
    }
  }

  async function markReadyForPickup() {
    if (saving) return;
    saving = true;
    try {
      // First save any pending changes (asset status / repair cost)
      await saveChanges();

      // Update ticket status
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
      logger.logError("Failed to mark ready for pickup:", e);
      alert("Failed to mark ready for pickup.");
    } finally {
      saving = false;
    }
  }

  // Local input binding for Repair Cost (draft-managed)
  let repairCostInput: string =
    ticket["Repair Cost"] != null ? String(ticket["Repair Cost"]) : "";
  $: if (mergedTicket) {
    const current = (mergedTicket as any)["Repair Cost"];
  }

  function handleRepairPick(item: { label: string; amount: number }) {
    handleChange({ "Repair Cost": item.amount as any });
    const existingNotes = (mergedTicket.Notes || "").trim();
    const line = `Repair Item: ${item.label}`;
    let newNotes: string;
    if (!existingNotes) newNotes = line;
    else if (!existingNotes.split(/\r?\n/).includes(line))
      newNotes = existingNotes + "\n" + line;
    else newNotes = existingNotes; // avoid duplicate
    handleChange({ Notes: newNotes });
  }
</script>

<div class="w3-panel w3-border">
  <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
    <ShowPendingChanges {draft} onSave={saveChanges} {saving} />
  </div>

  <TicketInfo ticket={mergedTicket} onChange={handleChange} disabled={saving} />
  <TicketDescription ticket={mergedTicket} onChange={handleChange} />

  <div class="w3-row-padding w3-section">
    <div class="w3-col s12 m12">
      <RepairPickList onSelect={handleRepairPick} disabled={saving} />
    </div>
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
        value={mergedTicket["Repair Cost"] != null
          ? String(mergedTicket["Repair Cost"])
          : ""}
        on:input={(e) => {
          const num = e.target.valueAsNumber;
          handleChange({
            "Repair Cost": num === undefined || isNaN(num) ? undefined : num,
          });
        }}
        placeholder="0.00"
        disabled={saving}
      />
    </div>
  </div>

  <!-- Invoices Section -->
  <TicketInvoice {ticket} />

  <!-- Notifications Section -->
  <TicketNotification
    {ticket}
    defaultMessage="TicketUpdate"
    messages={[
      "TicketUpdate",
      "BringMachineForRepairNoLoan",
      "BringMachineForRepairLoanReady",
      "RepairComplete",
    ]}
  />

  <!-- Resolution Section -->
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
      Select a resolution for the repair work.
    </div>
  </div>

  <!-- Sticky Action Bar -->
  <StickyBottomActionBar className="w3-border-top">
    <button class="w3-button w3-blue" on:click={saveChanges} disabled={saving}>
      {saving ? "Saving..." : "Save"}
    </button>
    <button
      class="w3-button w3-green"
      on:click={markReadyForPickup}
      disabled={saving}
    >
      Mark Ready for Pickup
    </button>
  </StickyBottomActionBar>
</div>
