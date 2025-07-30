<script lang="ts">
  import { onMount } from "svelte";
  import { getTickets, ticketsStore, type Ticket } from "../data/tickets";
  import AssetDisplay from "../AssetDisplay.svelte";
  import StudentTag from "../StudentTag.svelte";

  let loading = true;
  let error: string | null = null;
  let tickets: Ticket[] = [];

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

  function getStatusColor(status: string): string {
    switch (status) {
      case "Untriaged":
        return "w3-red";
      case "Triaged":
        return "w3-orange";
      case "Assigned":
        return "w3-yellow";
      case "In Progress":
        return "w3-blue";
      case "Waiting on Student":
        return "w3-purple";
      case "Waiting on Tech":
        return "w3-indigo";
      case "Resolved":
        return "w3-green";
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
            <tr>
              <td class="w3-text-blue">
                <strong>#{ticket.Number}</strong>
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
                {#if ticket._linked.Device.Status}
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
                {#if ticket._linked.Student}
                  <StudentTag student={ticket._linked.Student} />
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td>
                {#if ticket.Device}
                  <AssetDisplay
                    asset={ticket._linked.Device}
                    showStatus={false}
                  />
                {:else if ticket.FormAsset}
                  {ticket.FormAsset}
                {/if}
              </td>
              <td style="max-width: 200px;">
                <div class="w3-small" style="word-wrap: break-word;">
                  {ticket["User Description"] || "-"}
                </div>
              </td>
              <td>
                {#if ticket._linked.Staff}
                  <span class="w3-text-blue">
                    {ticket._linked.Staff["Full Name"]}
                    <a href="mailto:{ticket._linked.Staff.Email}"
                      >{ticket._linked.Staff.Email}</a
                    >
                  </span>
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

<style>
  td {
    vertical-align: top;
  }

  .w3-tag {
    border-radius: 3px;
  }
</style>
