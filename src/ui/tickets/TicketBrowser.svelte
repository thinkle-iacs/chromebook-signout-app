<script lang="ts">
  import { onMount } from "svelte";
  import { getTickets, ticketsStore, type Ticket } from "@data/tickets";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import StudentTag from "@people/students/StudentTag.svelte";
  import TicketWorkflow from "./TicketWorkflow.svelte";
  import type { HistoryEntry } from "./history";
  import { showToast } from "@ui/components/toastStore";

  let loading = true;
  let error: string | null = null;
  let tickets: Ticket[] = [];
  let filteredTickets: Ticket[] = [];
  let selectedTicket: Ticket | null = null;
  let showDetailModal = false;

  // Filtering and sorting state
  let hideClosed = true;
  let sortBy: string = "Number";
  let sortOrder: "asc" | "desc" = "desc";
  let statusFilter: string = "";
  let priorityFilter: string = "";

  // Reactive statement to update tickets array when store changes
  $: tickets = Object.values($ticketsStore);

  // Apply filters and sorting
  $: {
    let filtered = [...tickets].filter(Boolean); // remove any undefined entries defensively

    // Normalize any tickets with missing status to "New" so downstream logic is safe
    for (const t of filtered) {
      if (t && !t["Ticket Status"]) (t as any)["Ticket Status"] = "New";
    }

    // Filter by closed tickets
    if (hideClosed) {
      filtered = filtered.filter(
        (ticket) => ticket["Ticket Status"] !== "Closed"
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(
        (ticket) => ticket["Ticket Status"] === statusFilter
      );
    }

    // Filter by priority
    if (priorityFilter) {
      filtered = filtered.filter(
        (ticket) => String(ticket.Priority || "") === priorityFilter
      );
    }

    // Sort tickets
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case "Number":
          aVal = a.Number || 0;
          bVal = b.Number || 0;
          break;
        case "Created":
          aVal = new Date(a.Created || 0);
          bVal = new Date(b.Created || 0);
          break;
        case "Priority":
          aVal = a.Priority || 0;
          bVal = b.Priority || 0;
          break;
        case "Status":
          aVal = a["Ticket Status"] || "";
          bVal = b["Ticket Status"] || "";
          break;
        default:
          aVal = a.Number || 0;
          bVal = b.Number || 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    filteredTickets = filtered;
  }

  // Get unique values for filters
  $: statusOptions = [
    ...new Set(tickets.map((t) => t["Ticket Status"]).filter(Boolean)),
  ].sort();
  $: priorityOptions = [
    ...new Set(tickets.map((t) => t.Priority).filter((p) => p != null)),
  ].sort();

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

  // Replace old handleUpdateTicket that re-called API with updated full ticket object
  function handleUpdateTicket(
    updatedTicket: Ticket,
    _historyEntry: HistoryEntry<
      Record<string, { from?: unknown; to?: unknown }>
    >
  ) {
    // The workflow already persisted changes; just sync selection & let reactive store update table
    selectedTicket = updatedTicket;
    // Optionally refresh filters by triggering reactive assignments
    tickets = Object.values($ticketsStore);
  }

  function createTempTicket() {
    const tempId = `TEMP-${Date.now()}`;
    const created = new Date().toISOString();
    const temp: any = {
      _id: tempId,
      Number: 0,
      Created: created,
      "Ticket Status": "New",
      Priority: 3,
      History: JSON.stringify({ entries: [] }),
    };

    // push into local store for immediate visibility
    ticketsStore.update(($s: any) => {
      $s[tempId] = temp;
      return $s;
    });
    showToast("Draft ticket created", "info");
    showTicketDetail(temp);
  }

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

  function getPriorityText(priority: number | null | undefined): string {
    if (!priority) return "Normal";
    switch (priority) {
      case 1:
        return "Very Low";
      case 2:
        return "Low";
      case 3:
        return "Normal";
      case 4:
        return "High";
      case 5:
        return "Critical";
      default:
        return "Normal";
    }
  }

  function getPriorityColor(priority: number | null | undefined): string {
    if (!priority) return "w3-light-gray";
    switch (priority) {
      case 1:
        return "w3-blue";
      case 2:
        return "w3-light-blue";
      case 3:
        return "w3-light-gray";
      case 4:
        return "w3-orange";
      case 5:
        return "w3-red";
      default:
        return "w3-light-gray";
    }
  }

  function setSortBy(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortBy = field;
      sortOrder = "desc";
    }
  }
</script>

<div class="w3-container">
  <div
    style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;"
  >
    <h2>Tickets</h2>
    <div style="display:flex; gap:8px;">
      <button class="w3-button w3-green" on:click={createTempTicket}>
        New
      </button>
    </div>
  </div>

  {#if loading}
    <div class="w3-panel w3-blue">
      <p>Loading tickets...</p>
    </div>
  {:else if error}
    <div class="w3-panel w3-red">
      <p>Error: {error}</p>
    </div>
  {:else}
    <!-- Filters and Controls -->
    <div class="w3-panel w3-light-gray w3-padding">
      <div class="w3-row-padding">
        <div class="w3-col s12 m3">
          <div class="w3-text-blue"><b>Filters</b></div>
          <div class="w3-margin-top">
            <input
              type="checkbox"
              id="hide-closed"
              class="w3-check"
              bind:checked={hideClosed}
            />
            <label class="w3-small" for="hide-closed">
              Hide Closed Tickets</label
            >
          </div>
        </div>

        <div class="w3-col s12 m3">
          <label class="w3-text-blue" for="status-filter"
            ><b>Status Filter</b></label
          >
          <select
            id="status-filter"
            class="w3-select w3-border w3-small"
            bind:value={statusFilter}
          >
            <option value="">All Statuses</option>
            {#each statusOptions as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>

        <div class="w3-col s12 m3">
          <label class="w3-text-blue" for="priority-filter"
            ><b>Priority Filter</b></label
          >
          <select
            id="priority-filter"
            class="w3-select w3-border w3-small"
            bind:value={priorityFilter}
          >
            <option value="">All Priorities</option>
            {#each priorityOptions as priority}
              <option value={String(priority)}
                >{getPriorityText(priority)}</option
              >
            {/each}
          </select>
        </div>

        <div class="w3-col s12 m3">
          <label class="w3-text-blue" for="sort-by"><b>Sort By</b></label>
          <select
            id="sort-by"
            class="w3-select w3-border w3-small"
            bind:value={sortBy}
          >
            <option value="Number">Ticket Number</option>
            <option value="Created">Date Created</option>
            <option value="Priority">Priority</option>
            <option value="Status">Status</option>
          </select>
          <div class="w3-margin-top">
            <button
              class="w3-button w3-small w3-border {sortOrder === 'asc'
                ? 'w3-blue'
                : 'w3-light-gray'}"
              on:click={() => (sortOrder = "asc")}
            >
              ↑ Asc
            </button>
            <button
              class="w3-button w3-small w3-border {sortOrder === 'desc'
                ? 'w3-blue'
                : 'w3-light-gray'}"
              on:click={() => (sortOrder = "desc")}
            >
              ↓ Desc
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="w3-responsive">
      <table class="w3-table w3-striped w3-bordered w3-small">
        <thead>
          <tr class="w3-blue">
            <th>
              <button class="sort-header" on:click={() => setSortBy("Number")}>
                Number {sortBy === "Number"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </button>
            </th>
            <th>
              <button class="sort-header" on:click={() => setSortBy("Status")}>
                Status {sortBy === "Status"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </button>
            </th>
            <th>
              <button
                class="sort-header"
                on:click={() => setSortBy("Priority")}
              >
                Priority {sortBy === "Priority"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </button>
            </th>
            <th>
              <button class="sort-header" on:click={() => setSortBy("Created")}>
                Created {sortBy === "Created"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </button>
            </th>
            <th>Resolution</th>
            <th>Device Status</th>
            <th>Temp</th>
            <th>Student</th>
            <th>Device</th>
            <th>Description</th>
            <th>Staff</th>
            <th>Submitted By</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredTickets as ticket (ticket._id)}
            <tr class="w3-hover-light-gray">
              <td class="w3-text-blue">
                <button
                  class="ticket-number-btn w3-btn w3-small w3-blue w3-hover-dark-blue"
                  on:click={() => showTicketDetail(ticket)}
                  title="Click to view ticket details"
                >
                  #{ticket.Number ||
                    (ticket._id.startsWith("TEMP-") ? "Draft" : "")}
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
                <span
                  class="w3-tag w3-small {getPriorityColor(ticket.Priority)}"
                >
                  {getPriorityText(ticket.Priority)}
                </span>
              </td>
              <td class="w3-small">
                {formatDate(ticket.Created)}
              </td>
              <td>
                {#if ticket.Resolution}
                  <span class="w3-tag w3-small w3-teal"
                    >{ticket.Resolution}</span
                  >
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td>
                {#if ticket.Device?.length && ticket._linked?.Device?.Status}
                  <span class="w3-tag w3-small w3-gray">
                    {ticket._linked.Device.Status}
                  </span>
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td>
                <div
                  class="w3-center"
                  style="display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center;"
                >
                  {#if ticket["Temp Status"]}
                    <span class="w3-tag w3-small w3-light-blue">
                      {ticket["Temp Status"]}
                    </span>
                  {:else}
                    <span class="w3-text-gray">-</span>
                  {/if}
                  {#if ticket["Temporary Device"]}
                    {@const tempDeviceObject = ticket?._linked?.[
                      "Temporary Device"
                    ] || { "Asset Tag": ticket["Temporary Device"] }}
                    <AssetDisplay asset={tempDeviceObject} showStatus={false} />
                  {/if}
                </div>
              </td>
              <td class="w3-text-blue">
                {#if ticket?.Student?.length && ticket._linked?.Student}
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
              <td class="description-cell">
                {#if ticket["User Description"]}
                  <div
                    class="w3-small description-text"
                    title={ticket["User Description"]}
                  >
                    {ticket["User Description"]}
                  </div>
                {:else}
                  <span class="w3-text-gray">-</span>
                {/if}
              </td>
              <td>
                {#if ticket.Staff?.length && ticket._linked?.Staff}
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

      {#if filteredTickets.length === 0}
        <div class="w3-panel w3-pale-yellow w3-border">
          <p>No tickets found matching the current filters.</p>
        </div>
      {:else}
        <div class="w3-panel w3-light-gray">
          <p class="w3-small">
            Showing {filteredTickets.length} of {tickets.length} tickets
            {#if hideClosed}(closed tickets hidden){/if}
          </p>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Ticket Detail Modal -->
{#if showDetailModal && selectedTicket}
  <div class="modal" style="display: block;">
    <button
      class="close-button"
      on:click={closeDetailModal}
      on:keydown={(e) => e.key === "Enter" && closeDetailModal()}
      tabindex="0"
      title="Close"
    >
      &times;
    </button>
    <div class="opaque">
      <TicketWorkflow
        ticket={selectedTicket}
        onUpdateTicket={handleUpdateTicket}
      />
    </div>
  </div>
{/if}

<style>
  .opaque {
    background: white;
  }
  td {
    vertical-align: top;
  }

  .ticket-number-btn {
    padding: 4px 8px;
    font-weight: bold;
    border: none;
    text-decoration: none;
  }

  .close-button {
    position: absolute;
    top: 15px;
    right: 20px;
    width: 40px;
    height: 40px;
    background: white;
    border: 2px solid #ddd;
    border-radius: 50%;
    font-size: 24px;
    font-weight: bold;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1001;
    transition: all 0.2s ease;
  }

  .close-button:hover {
    background: #f44336;
    color: white;
    border-color: #f44336;
  }

  .w3-tag {
    border-radius: 3px;
  }

  .sort-header {
    background: none;
    border: none;
    color: white;
    font-weight: bold;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 3px;
  }

  .sort-header:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100dvw;
    height: 100dvh;
    padding: 16px;
    background: rgba(0, 0, 0, 0.8);
    overflow-y: auto;
    z-index: 4;
  }

  .description-cell {
    max-width: 280px;
  }
  .description-text {
    display: -webkit-box;
    -webkit-line-clamp: 3; /* show up to 3 lines */
    line-clamp: 3; /* standard property */
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    word-wrap: break-word;
    white-space: normal;
    line-height: 1.2em;
    max-height: calc(1.2em * 3); /* fallback for non-webkit browsers */
  }
  .w3-table thead th {
    text-align: center;
    vertical-align: middle;
  }
</style>
