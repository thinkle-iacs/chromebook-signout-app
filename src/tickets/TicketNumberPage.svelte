<script lang="ts">
  import TicketEditor from "./TicketEditor.svelte";
  import { onMount } from "svelte";
  import { getTicketByNumber } from "../data/tickets";
  import type { Ticket } from "../data/tickets";

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

  $: console.log("Got ticket:", ticket);
</script>

{#if loading}
  <div>Loading ticket...</div>
{:else if error}
  <div class="w3-panel w3-red">{error}</div>
{:else if ticket}
  <TicketEditor {ticket} readOnly={false} />
{/if}
