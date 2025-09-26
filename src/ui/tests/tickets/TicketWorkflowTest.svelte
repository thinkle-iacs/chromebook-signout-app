<script lang="ts">
  import { writable } from "svelte/store";
  import { tickets } from "./mockTickets";
  import TicketWorkflow from "@ui/tickets/TicketWorkflow.svelte";

  // Store for selected ticket index
  let selectedIdx = 0;
  const ticketStore = writable(structuredClone(tickets[selectedIdx]));

  // Log of API calls
  let apiLog: Array<{ method: string; args: any[]; timestamp: string }> = [];

  // Pop-out state
  let isFullScreen = false;

  // When ticket selection changes, update store
  function selectTicket(idx: number) {
    selectedIdx = idx;
    ticketStore.set(structuredClone(tickets[idx].ticket));
    apiLog = [];
  }

  function toggleFullScreen() {
    isFullScreen = !isFullScreen;
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

  // Helper to log API calls without updating ticket store
  function logOnly(method: string, handler: (...args: any[]) => any) {
    return (...args: any[]) => {
      const result = handler(...args);
      apiLog = [
        ...apiLog,
        { method, args, timestamp: new Date().toLocaleTimeString() },
      ];
      return result;
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

  const signoutAsset = logOnly("signoutAsset", (...args) => {
    // Simulate asset signout - this doesn't return anything meaningful
    return Promise.resolve();
  });

  const createNotifications = logOnly("createNotifications", (...args) => {
    // Simulate notification creation - return proper NotificationResult[]
    console.log("createNotifications called with args:", args);

    // The first argument should be the notifications array
    let notifications = args[0] || [];

    // Handle case where notifications might be double-nested
    if (
      Array.isArray(notifications) &&
      notifications.length === 1 &&
      Array.isArray(notifications[0])
    ) {
      notifications = notifications[0];
    }

    console.log("Processing notifications:", notifications);

    // Create results that match the real Airtable API structure
    const results = notifications.map((notification, index) => ({
      id: `rec${Math.random().toString(36).substr(2, 9)}`,
      _rawJson: {
        id: `rec${Math.random().toString(36).substr(2, 9)}`,
        createdTime: new Date().toISOString(),
        fields: {
          Num: Math.floor(Math.random() * 10000),
          ...notification,
          Created: new Date().toISOString(),
          Send: true,
        },
      },
      fields: {
        Num: Math.floor(Math.random() * 10000),
        ...notification,
        Created: new Date().toISOString(),
        Send: true,
      },
      // Add Airtable metadata
      _table: {
        name: "Notifications",
      },
    }));

    console.log("Returning results:", results);

    // Return the array as the real API does
    return results;
  });
</script>

<h1 class:hidden={isFullScreen}>Ticket Test</h1>

<!-- Ticket selector -->
<div class="w3-section" class:hidden={isFullScreen}>
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

  <!-- Pop-out toggle button -->
  <button
    class="w3-button w3-small w3-border w3-right {isFullScreen
      ? 'w3-red'
      : 'w3-green'}"
    on:click={toggleFullScreen}
    style="margin-left:8px;"
  >
    {isFullScreen ? "⮧ Pop In" : "⮤ Pop Out"}
  </button>
</div>

<!-- TicketWorkflow container with conditional styling -->
<div class="ticket-workflow-container" class:fullscreen={isFullScreen}>
  {#if isFullScreen}
    <!-- Full screen overlay -->
    <div class="fullscreen-overlay">
      <div class="fullscreen-header w3-bar w3-dark-gray">
        <div class="w3-bar-item">
          <strong>Ticket Workflow Test - {tickets[selectedIdx].name}</strong>
        </div>
        <button
          class="w3-bar-item w3-button w3-right w3-red"
          on:click={toggleFullScreen}
        >
          ✕ Close
        </button>
      </div>
      <div class="fullscreen-content">
        <TicketWorkflow
          ticket={$ticketStore}
          {onUpdateTicket}
          {saveTicket}
          {apiCreateTicket}
          {signoutAsset}
          {createNotifications}
        />
      </div>
    </div>
  {:else}
    <!-- Normal inline display -->
    <TicketWorkflow
      ticket={$ticketStore}
      {onUpdateTicket}
      {saveTicket}
      {apiCreateTicket}
      {signoutAsset}
      {createNotifications}
    />
  {/if}
</div>

<!-- API log -->
<div class="w3-section w3-card w3-padding" class:hidden={isFullScreen}>
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

<style>
  .ticket-workflow-container.fullscreen {
    position: relative;
  }

  .fullscreen-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: white;
    z-index: 9999;
    display: flex;
    flex-direction: column;
  }

  .fullscreen-header {
    flex-shrink: 0;
    height: 48px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .fullscreen-content {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }

  .hidden {
    display: none;
  }
</style>
