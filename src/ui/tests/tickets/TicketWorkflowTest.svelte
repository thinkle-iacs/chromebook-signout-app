<script lang="ts">
  import { mockTickets, createMockUpdateTicket, getMockTicketByStatus } from "./mockTicketData";
  import TicketWorkflow from "@ui/tickets/TicketWorkflow.svelte";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "@ui/tickets/history";
  import { loggedIn } from "@data/user";

  let selectedStatus: Ticket["Ticket Status"] = "New";
  let selectedTicket = mockTickets.new;
  let ticketHistory: HistoryEntry[] = [];

  // Available ticket statuses for testing
  const ticketStatuses: Ticket["Ticket Status"][] = [
    "New",
    "Awaiting Drop-Off", 
    "Have Device",
    "In Repair",
    "Ready for Pickup",
    "In Progress",
    "Closed"
  ];

  // Mock update function that logs updates
  let mockUpdateTicket = createMockUpdateTicket("new", (updatedTicket, historyEntry) => {
    selectedTicket = updatedTicket;
    ticketHistory = [...ticketHistory, historyEntry];
  });

  function changeTicketStatus(status: Ticket["Ticket Status"]) {
    selectedStatus = status;
    selectedTicket = { ...getMockTicketByStatus(status) };
    ticketHistory = [];
    
    // Create new mock update function for the new ticket
    const statusKey = status.toLowerCase().replace(/[\s-]/g, "");
    mockUpdateTicket = createMockUpdateTicket(statusKey, (updatedTicket, historyEntry) => {
      selectedTicket = updatedTicket;
      ticketHistory = [...ticketHistory, historyEntry];
    });
  }

  function resetTicket() {
    changeTicketStatus(selectedStatus);
  }

  // Mock onUpdateTicket function for TicketWorkflow component
  function onUpdateTicket(ticket: Ticket, historyEntry: any) {
    console.log("[MOCK] onUpdateTicket called:", { ticket, historyEntry });
    selectedTicket = ticket;
    ticketHistory = [...ticketHistory, historyEntry];
  }
</script>

<div class="w3-container">
  <div class="w3-card w3-margin">
    <header class="w3-container w3-blue">
      <h3>Complete Ticket Workflow Test</h3>
    </header>
    
    <div class="w3-container w3-padding">
      {#if !$loggedIn}
        <div class="w3-panel w3-pale-yellow w3-border w3-margin">
          <h4>⚠️ Authentication Not Required for Testing</h4>
          <p>This is a testing harness that uses mock data only. No database calls will be made.</p>
          <p><strong>Note:</strong> In production, you would need to be logged in to access ticket workflows.</p>
        </div>
      {/if}
      
      <p class="w3-text-gray">
        Test the complete TicketWorkflow component with different ticket statuses. No database calls will be made.
      </p>
      
      <!-- Status Selector -->
      <div class="w3-panel w3-pale-blue w3-border">
        <h4>Select Ticket Status to Test:</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
          {#each ticketStatuses as status}
            <button 
              class="w3-button {selectedStatus === status ? 'w3-blue' : 'w3-white w3-border'}"
              on:click={() => changeTicketStatus(status)}
            >
              {status}
            </button>
          {/each}
        </div>
        <button class="w3-button w3-red w3-small" on:click={resetTicket}>
          Reset Current Ticket
        </button>
      </div>
      
      <div class="w3-row">
        <div class="w3-col l8">
          <div class="w3-card w3-margin-bottom">
            <header class="w3-container w3-light-gray">
              <h4>Workflow Component - {selectedStatus}</h4>
            </header>
            <div class="w3-container w3-padding">
              <TicketWorkflow 
                ticket={selectedTicket} 
                readOnly={false}
                {onUpdateTicket}
              />
            </div>
          </div>
        </div>
        
        <div class="w3-col l4">
          <div class="w3-card w3-margin-bottom">
            <header class="w3-container w3-light-gray">
              <h4>Debug Info</h4>
            </header>
            <div class="w3-container w3-padding">
              <div class="w3-small">
                <p><strong>Ticket ID:</strong> {selectedTicket._id}</p>
                <p><strong>Status:</strong> {selectedTicket["Ticket Status"]}</p>
                <p><strong>Number:</strong> {selectedTicket.Number}</p>
                <p><strong>Device Status:</strong> {selectedTicket["Device Status"] || "N/A"}</p>
                <p><strong>Temp Status:</strong> {selectedTicket["Temp Status"] || "N/A"}</p>
                <p><strong>Priority:</strong> {selectedTicket.Priority || "N/A"}</p>
                <p><strong>Assignee:</strong> {selectedTicket.Assignee || "N/A"}</p>
                <p><strong>Resolution:</strong> {selectedTicket.Resolution || "N/A"}</p>
                <p><strong>Repair Cost:</strong> ${selectedTicket["Repair Cost"] || 0}</p>
                
                <h5>Student Info:</h5>
                {#if selectedTicket._linked?.Student}
                  <p><strong>Name:</strong> {selectedTicket._linked.Student.Name}</p>
                  <p><strong>Email:</strong> {selectedTicket._linked.Student.Email}</p>
                  <p><strong>YOG:</strong> {selectedTicket._linked.Student.YOG}</p>
                {:else}
                  <p class="w3-text-gray">No student linked</p>
                {/if}
                
                <h5>Device Info:</h5>
                {#if selectedTicket._linked?.Device}
                  <p><strong>Asset Tag:</strong> {selectedTicket._linked.Device["Asset Tag"]}</p>
                  <p><strong>Model:</strong> {selectedTicket._linked.Device.Model}</p>
                {:else}
                  <p class="w3-text-gray">No device linked</p>
                {/if}
                
                {#if selectedTicket._linked?.["Temporary Device"]}
                  <h5>Temp Device Info:</h5>
                  <p><strong>Asset Tag:</strong> {selectedTicket._linked["Temporary Device"]["Asset Tag"]}</p>
                  <p><strong>Model:</strong> {selectedTicket._linked["Temporary Device"].Model}</p>
                {/if}
              </div>
              
              <h5>Update History:</h5>
              <div class="w3-small" style="max-height: 300px; overflow-y: auto;">
                {#each ticketHistory as entry, i}
                  <div class="w3-panel w3-pale-green w3-border w3-margin-bottom">
                    <strong>#{i + 1}: {entry.action}</strong><br>
                    <span class="w3-text-gray">Status: {entry.status}</span><br>
                    {#if entry.note}
                      <span class="w3-text-blue">Note: {entry.note}</span><br>
                    {/if}
                    {#if entry.changes}
                      <details>
                        <summary class="w3-text-indigo">View Changes</summary>
                        <pre class="w3-small">{JSON.stringify(entry.changes, null, 2)}</pre>
                      </details>
                    {/if}
                  </div>
                {:else}
                  <p class="w3-text-gray">No updates yet</p>
                {/each}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  pre {
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 11px;
  }
  
  details summary {
    cursor: pointer;
    margin-bottom: 8px;
  }
  
  details[open] summary {
    margin-bottom: 4px;
  }
</style>