<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;
</script>

<div class="w3-panel w3-pale-yellow w3-border">
  <h4>In Progress</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>
  <p class="w3-small">
    Placeholder for tasks not requiring device intake (user education,
    configuration, etc.).
  </p>
  <button
    class="w3-button w3-amber"
    on:click={() =>
      updateTicket(
        { "Ticket Status": "Closed" },
        { action: "Task completed", status: "Closed" }
      )}
  >
    Close Ticket
  </button>
</div>
