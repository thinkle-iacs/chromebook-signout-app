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
  const __unused = updateTicket;
</script>

<div class="w3-panel w3-light-gray w3-border">
  <h4>Closed</h4>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  <TicketInfo {ticket} onChange={() => {}} disabled={true} />
  <TicketDescription {ticket} onChange={() => {}} />

  <p class="w3-small">
    Ticket is closed. Add summary or billing follow-up here later.
  </p>
</div>
