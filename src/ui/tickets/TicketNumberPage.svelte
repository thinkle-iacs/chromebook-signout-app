<script lang="ts">
  import TicketWorkflow from "./TicketWorkflow.svelte";
  import TicketEditor from "./TicketEditor.svelte";

  import { onMount } from "svelte";
  import { getTicketByNumber } from "@data/tickets";
  import type { Ticket } from "@data/tickets";

  export let number: string;
  let ticket: Ticket | null = null;
  let loading = true;
  let error = "";

  onMount(async () => {
    loading = true;
    error = "";
    ticket = null;
    const num = parseInt(number);
    if (!isNaN(num)) {
      try {
        ticket = await getTicketByNumber(num);
        if (!ticket) error = `Ticket #${num} not found.`;
      } catch (e) {
        error = "Error loading ticket.";
      }
    } else {
      error = "Invalid ticket number.";
    }
    loading = false;
  });

  import { logger } from "@utils/log";
  $: logger.logVerbose("Got ticket:", ticket);
</script>

{#if loading}
  <div>Loading ticket...</div>
{:else if error}
  <div class="w3-panel w3-red">{error}</div>
{:else if ticket}
  <TicketWorkflow
    {ticket}
    onUpdateTicket={(updatedTicket, history) => {
      logger.logVerbose("Ticket updated!", updatedTicket, history);
      ticket = updatedTicket;
    }}
  />
  <!-- <TicketEditor
    {ticket}
    readOnly={false}
    onTicketChange={(newTicket) => {
  logger.logVerbose("Got me a change to the ticket!", newTicket);
      ticket = newTicket;
    }}
  /> -->
{/if}
