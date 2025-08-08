<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;
</script>

<div class="w3-panel w3-pale-blue w3-border">
  <h4>New Ticket</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"] || "New"}
  </div>
  <p class="w3-small">
    This is a placeholder for the New step. Add triage actions here.
  </p>
  <button
    class="w3-button w3-blue"
    on:click={() =>
      updateTicket(
        { "Ticket Status": "Awaiting Drop-Off" },
        { action: "Moved to Awaiting Drop-Off", status: "Awaiting Drop-Off" }
      )}
  >
    Move to Awaiting Drop-Off
  </button>
</div>
