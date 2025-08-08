<script lang="ts">
  import { onMount } from "svelte";
  import { getTickets, ticketsStore, type Ticket } from "../data/tickets";
  import AssetDisplay from "../AssetDisplay.svelte";
  import StudentTag from "../StudentTag.svelte";
  import TicketEditor from "./TicketEditor.svelte";

  let loading = true;
  let error: string | null = null;
  let tickets: Ticket[] = [];
  let selectedTicket: Ticket | null = null;
  let showDetailModal = false;

  // Reactive statement to update tickets array when store changes
  $: tickets = Object.values($ticketsStore);

  onMount(async () => {
    try {
      loading = true;
      await getTickets();
      loading = false;
    } catch (err) {
      error = err.message || "Failed to load tickets";
      loading = false;
    }
  });

  function showTicketDetail(ticket: Ticket) {
    selectedTicket = ticket;
    showDetailModal = true;
  }

  function closeDetailModal() {
    showDetailModal = false;
    selectedTicket = null;
  }

  onMount(async () => {
    try {
      loading = true;
      await getTickets();
      loading = false;
    } catch (err) {
      error = err.message || "Failed to load tickets";
      loading = false;
    }
  });

  function getStatusColor(status: string): string {
    switch (status) {
      case "New":
        return "w3-red";
      case "Awaiting Drop-Off":
        return "w3-orange";
      case "Have Device":
        return "w3-yellow";
      case "In Repair":
        return "w3-blue";
      case "Ready for Pickup":
        return "w3-green";
      case "In Progress":
        return "w3-indigo";
      case "Closed":
        return "w3-gray";
      default:
        return "";
    }
  }

  function formatDate(dateString: string): string {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  }
</script>

<div class="w3-container">
  <h2>Ticket Browser</h2>

  {#if loading}
    <div class="w3-panel w3-blue">
      <p>Loading tickets...</p>
    </div>
  {:else if error}
    <div class="w3-panel w3-red">
      <p>Error: {error}</p>
    </div>
  {:else}
    <div class="w3-responsive">
      <table class="w3-table w3-striped w3-bordered w3-small">
        <thead>
          <tr class="w3-blue">
            <th>Number</th>
            <th>Status</th>
            <th>Device Status</th>
            <th>Temp Status</th>
            <th>Student</th>
            <th>Device</th>
            <th>Description</th>
            <th>Staff</th>
            <th>Submitted By</th>
          </tr>
        </thead>
        <tbody>
          {#each tickets as ticket (ticket._id)}
            <tr class="w3-hover-light-gray">
              <td class="w3-text-blue">
                <button
                  class="ticket-number-btn w3-btn w3-small w3-blue w3-hover-dark-blue"
                  on:click={() => showTicketDetail(ticket)}
                  title="Click to view ticket details"
                >
                  #{ticket.Number}
                </button>
              </td>
              <td>
                <span
                  class="w3-tag w3-small {getStatusColor(
                    ticket['Ticket Status']
                  )}"
                >
                  {ticket["Ticket Status"] || "Unknown"}
                </span>
              </td>
              <td>
                {#if ticket._linked?.Device?.Status}
                  <span class="w3-tag w3-small w3-gray">
                    {ticket._linked.Device.Status}
                  </span>
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td>
                {#if ticket["Temp Status"]}
                  <span class="w3-tag w3-small w3-light-blue">
                    {ticket["Temp Status"]}
                  </span>
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td class="w3-text-blue">
                {#if ticket._linked?.Student}
                  <StudentTag student={ticket._linked.Student} />
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td>
                {#if ticket.Device && ticket._linked?.Device}
                  <AssetDisplay
                    asset={ticket._linked.Device}
                    showStatus={false}
                  />
                {:else if ticket.FormAsset}
                  {ticket.FormAsset}
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td style="max-width: 200px;">
                <div class="w3-small" style="word-wrap: break-word;">
                  {ticket["User Description"] || "-"}
                </div>
              </td>
              <td>
                {#if ticket._linked?.Staff}
                  <div class="w3-small">
                    <strong>{ticket._linked?.Staff["Full Name"]}</strong><br />
                    <span class="w3-text-gray">{ticket._linked.Staff.Role}</span
                    ><br />
                    <a
                      href="mailto:{ticket._linked.Staff.Email}"
                      class="w3-text-blue w3-small"
                    >
                      {ticket._linked.Staff.Email}
                    </a>
                  </div>
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td class="w3-small">
                {ticket.SubmittedBy || "-"}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>

      {#if tickets.length === 0}
        <div class="w3-panel w3-pale-yellow w3-border">
          <p>No tickets found.</p>
        </div>
      {:else}
        <div class="w3-panel w3-light-gray">
          <p class="w3-small">Total tickets: {tickets.length}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Ticket Detail Modal -->
{#if showDetailModal && selectedTicket}
  <div class="w3-modal" style="display: block;">
    <div class="w3-modal-content w3-animate-top" style="max-width: 1200px;">
      <div class="w3-container">
        <span
          class="w3-button w3-display-topright w3-large w3-hover-red"
          on:click={closeDetailModal}
          on:keydown={(e) => e.key === "Enter" && closeDetailModal()}
          role="button"
          tabindex="0"
        >
          &times;
        </span>
        <TicketEditor ticket={selectedTicket} readOnly={false} />
      </div>
    </div>
  </div>
{/if}

<style>
  td {
    vertical-align: top;
  }

  .ticket-number-btn {
    padding: 4px 8px;
    font-weight: bold;
    border: none;
    text-decoration: none;
  }

  .w3-modal {
    z-index: 1000;
  }

  .w3-modal-content {
    max-height: 90vh;
    overflow-y: auto;
  }

  .w3-tag {
    border-radius: 3px;
  }
</style>
