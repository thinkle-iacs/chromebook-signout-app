<script lang="ts">
  import { mockTickets, createMockUpdateTicket } from "./mockTicketData";
  import PickupWorkflow from "@ui/tickets/steps/PickupWorkflow.svelte";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "@ui/tickets/history";

  let selectedTicket = mockTickets.readyForPickup;
  let ticketHistory: HistoryEntry[] = [];

  // Mock update function that logs updates
  const mockUpdateTicket = createMockUpdateTicket("readyForPickup", (updatedTicket, historyEntry) => {
    selectedTicket = updatedTicket;
    ticketHistory = [...ticketHistory, historyEntry];
  });

  function resetTicket() {
    selectedTicket = { ...mockTickets.readyForPickup };
    ticketHistory = [];
  }
</script>

<div class="w3-container">
  <div class="w3-card w3-margin">
    <header class="w3-container w3-blue">
      <h3>Pickup Workflow Test</h3>
    </header>
    
    <div class="w3-container w3-padding">
      <p class="w3-text-gray">
        Test the PickupWorkflow component with a "Ready for Pickup" ticket. No database calls will be made.
      </p>
      
      <div class="w3-row">
        <div class="w3-col l8">
          <div class="w3-card w3-margin-bottom">
            <header class="w3-container w3-light-gray">
              <h4>Workflow Component</h4>
            </header>
            <div class="w3-container w3-padding">
              <PickupWorkflow ticket={selectedTicket} updateTicket={mockUpdateTicket} />
            </div>
          </div>
        </div>
        
        <div class="w3-col l4">
          <div class="w3-card w3-margin-bottom">
            <header class="w3-container w3-light-gray">
              <h4>Debug Info</h4>
            </header>
            <div class="w3-container w3-padding">
              <button class="w3-button w3-red w3-small w3-margin-bottom" on:click={resetTicket}>
                Reset Ticket
              </button>
              
              <p><strong>Ticket ID:</strong> {selectedTicket._id}</p>
              <p><strong>Status:</strong> {selectedTicket["Ticket Status"]}</p>
              <p><strong>Number:</strong> {selectedTicket.Number}</p>
              <p><strong>Temp Status:</strong> {selectedTicket["Temp Status"]}</p>
              <p><strong>Device Status:</strong> {selectedTicket["Device Status"]}</p>
              <p><strong>Repair Cost:</strong> ${selectedTicket["Repair Cost"]}</p>
              
              <h5>Update History:</h5>
              <div class="w3-small" style="max-height: 200px; overflow-y: auto;">
                {#each ticketHistory as entry, i}
                  <div class="w3-panel w3-pale-blue w3-border w3-margin-bottom">
                    <strong>#{i + 1}: {entry.action}</strong><br>
                    <span class="w3-text-gray">Status: {entry.status}</span><br>
                    {#if entry.changes}
                      <pre class="w3-small">{JSON.stringify(entry.changes, null, 2)}</pre>
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
  }
</style>