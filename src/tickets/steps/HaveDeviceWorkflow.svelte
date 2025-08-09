<script lang="ts">
  import TicketInfo from "./../editorComponents/TicketInfo.svelte";
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";

  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  // Local draft state for this step
  let draft: Partial<Ticket> = {};
  let draftHistory: HistoryEntry | undefined;

  function handleChange(updates: Partial<Ticket>, hist?: HistoryEntry) {
    draft = { ...draft, ...updates };
    // last edit wins
    draftHistory = hist || draftHistory;
  }

  async function saveAndMoveToRepair() {
    const updates: Partial<Ticket> = { ...draft, "Ticket Status": "In Repair" };
    updateTicket(updates, {
      action: "Moved to repair queue with edits",
      status: "In Repair",
      changes: Object.fromEntries(
        Object.entries(draft).map(([k, v]) => [
          k,
          { from: (ticket as any)[k], to: v },
        ])
      ),
    });
    // reset local draft after save
    draft = {};
    draftHistory = undefined;
  }
</script>

<div class="w3-panel w3-pale-green w3-border">
  <h4>Have Device</h4>
  <TicketInfo {ticket} onChange={handleChange} />

  <TicketDescription {ticket} onChange={handleChange} />

  <button class="w3-button w3-green" on:click={saveAndMoveToRepair}>
    Save changes & Move to In Repair
  </button>
</div>
