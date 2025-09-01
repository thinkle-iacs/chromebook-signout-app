<script lang="ts">
  import { writable } from "svelte/store";
  import { tickets } from "./mockTickets";
  import TicketWorkflow from "@ui/tickets/TicketWorkflow.svelte";

  // Store for selected ticket index
  let selectedIdx = 0;
  const ticketStore = writable(structuredClone(tickets[selectedIdx]));

  // Log of API calls
  let apiLog: Array<{ method: string; args: any[]; timestamp: string }> = [];

  // When ticket selection changes, update store
  function selectTicket(idx: number) {
    selectedIdx = idx;
    ticketStore.set(structuredClone(tickets[idx].ticket));
    apiLog = [];
  }

  // Helper to update ticket store and log
  function logAndUpdate(
    method: string,
    updater: (ticket: any, ...args: any[]) => any
  ) {
    return (...args: any[]) => {
      debugger;
      let updated;
      ticketStore.update((ticket) => {
        updated = updater(ticket, ...args);
        return updated;
      });
      apiLog = [
        ...apiLog,
        { method, args, timestamp: new Date().toLocaleTimeString() },
      ];
      return updated;
    };
  }

  // Fake API methods
  const onUpdateTicket = (ticket, updatedTicket, historyEntry) => {
    // Merge updatedTicket into ticket
    return { ...ticket, ...updatedTicket };
  };

  const saveTicket = logAndUpdate("saveTicket", (ticket, id, updates) => {
    // Merge updates into ticket
    return { ...ticket, ...updates };
  });

  const apiCreateTicket = logAndUpdate("apiCreateTicket", (ticket, payload) => {
    // Simulate creating a ticket (assign new _id)
    return {
      ...ticket,
      ...payload,
      _id: "FAKE-" + Math.floor(Math.random() * 10000),
    };
  });

  const signoutAsset = logAndUpdate("signoutAsset", (ticket, ...args) => {
    // Simulate asset signout
    return { ...ticket };
  });

  const createNotifications = logAndUpdate(
    "createNotifications",
    (ticket, ...args) => {
      // Simulate notification creation
      return { ...ticket };
    }
  );
</script>

<h1>Ticket Test</h1>

<!-- Ticket selector -->
<div class="w3-section">
  <label class="w3-text-grey">Select test ticket:</label>
  {#each tickets as t, idx}
    <button
      class="w3-button w3-small w3-border {selectedIdx === idx
        ? 'w3-blue'
        : ''}"
      on:click={() => selectTicket(idx)}
      style="margin-right:4px;"
    >
      {t.name}
    </button>
  {/each}
</div>

<!-- TicketWorkflow with reactive ticket -->
<TicketWorkflow
  ticket={$ticketStore}
  {onUpdateTicket}
  {saveTicket}
  {apiCreateTicket}
  {signoutAsset}
  {createNotifications}
/>

<!-- API log -->
<div class="w3-section w3-card w3-padding">
  <h4 class="w3-text-grey">API Call Log</h4>
  {#if apiLog.length === 0}
    <div class="w3-text-grey">No API calls yet.</div>
  {:else}
    <ul class="w3-ul w3-small">
      {#each [...apiLog].reverse() as entry, i}
        <li>
          <b>{entry.method}</b> @ {entry.timestamp}
          <pre style="margin:0;white-space:pre-wrap;">{JSON.stringify(
              entry.args,
              null,
              2
            )}</pre>
        </li>
      {/each}
    </ul>
  {/if}
</div>
