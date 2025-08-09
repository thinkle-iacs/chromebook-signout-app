<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  let draft: Partial<Ticket> = {};
  function handleChange(updates: Partial<Ticket>) {
    draft = { ...draft, ...updates };
  }
</script>

<div class="w3-panel w3-pale-blue w3-border">
  <h4>In Repair</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  <TicketInfo {ticket} onChange={handleChange} />
  <TicketDescription {ticket} onChange={handleChange} />

  <p class="w3-small">Placeholder for repair actions and notes.</p>
  <button
    class="w3-button w3-blue"
    on:click={() =>
      updateTicket(
        { ...draft, "Ticket Status": "Ready for Pickup" },
        { action: "Repair complete", status: "Ready for Pickup" }
      )}
  >
    Mark Ready for Pickup
  </button>
</div>
