<script lang="ts">
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import TicketInvoice from "../TicketInvoice.svelte";
  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;
  const __unused = updateTicket;

  export let createNotifications;
  export let signoutAsset;

  import { mergeUpdates } from "./draftManager";
  let draft: Partial<Ticket> = {};
  let mergedTicket: Ticket;
  $: {
    const { merged } = mergeUpdates(ticket, draft);
    mergedTicket = merged;
  }
</script>

<div class="w3-panel w3-light-gray w3-border">
  <TicketInfo ticket={mergedTicket} onChange={() => {}} />
  <TicketDescription ticket={mergedTicket} onChange={() => {}} />
  <p class="w3-small">
    Ticket is closed. You can still send invoices or notifications if needed.
  </p>

  <TicketInvoice {ticket} />
</div>
