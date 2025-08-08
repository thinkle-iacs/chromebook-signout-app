<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;
  // Mark prop as used to satisfy Svelte compiler (no-op)
  const __unused = updateTicket;
</script>

<div class="w3-panel w3-light-gray w3-border">
  <h4>Closed</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>
  <p class="w3-small">
    Ticket is closed. Add summary or billing follow-up here later.
  </p>
</div>
