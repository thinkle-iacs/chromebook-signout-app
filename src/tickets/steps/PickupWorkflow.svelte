<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;
</script>

<div class="w3-panel w3-pale-green w3-border">
  <h4>Ready for Pickup</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>
  <p class="w3-small">Placeholder for librarian pickup workflow.</p>
  <button
    class="w3-button w3-green"
    on:click={() =>
      updateTicket(
        { "Ticket Status": "Closed" },
        { action: "Ticket closed after pickup", status: "Closed" }
      )}
  >
    Close Ticket
  </button>
</div>
