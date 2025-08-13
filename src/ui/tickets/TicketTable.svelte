<script lang="ts">
  import type { Ticket } from "@data/tickets";
  import TicketWorkflow from "./TicketWorkflow.svelte";
  import StudentTag from "@people/students/StudentTag.svelte";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import { ticketsStore } from "@data/tickets";

  // Accept tickets array from parent; keep minimal local state
  export let ticketIDs: string[] = [];
  export let showFilters: boolean = false;
  export let showStudentColumn: boolean = true;
  export let showAssetColumn: boolean = true;
  export let showTempColumn: boolean = false;
  export let compact: boolean = true;
  // NEW: control initial visibility of closed tickets from parent
  export let hideClosedInitially: boolean = false;

  let tickets = ticketIDs
    .map((id) => $ticketsStore[id] || null)
    .filter(Boolean);

  let selectedTicket: Ticket = null;
  let showDetailModal = false;
  let hideClosed = hideClosedInitially; // initialize from prop
  let statusFilter = "";
  let sortBy: string = "Number";
  let sortOrder: "asc" | "desc" = "desc";

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
  function formatDate(d: any) {
    return d ? new Date(d).toLocaleDateString() : "";
  }
  function toggleSort(field: string) {
    if (sortBy === field) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortBy = field;
      sortOrder = "desc";
    }
  }
  $: filtered = tickets ? [...tickets] : [];
  $: if (filtered) {
    if (hideClosed)
      filtered = filtered.filter((t) => t["Ticket Status"] !== "Closed");
    if (statusFilter)
      filtered = filtered.filter((t) => t["Ticket Status"] === statusFilter);
    filtered.sort((a, b) => {
      let av;
      let bv;
      switch (sortBy) {
        case "Number":
          av = a.Number || 0;
          bv = b.Number || 0;
          break;
        case "Created":
          av = new Date(a.Created || 0).getTime();
          bv = new Date(b.Created || 0).getTime();
          break;
        case "Priority":
          av = a.Priority || 0;
          bv = b.Priority || 0;
          break;
        default:
          av = a.Number || 0;
          bv = b.Number || 0;
      }
      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }
  $: statusOptions = [
    ...new Set(tickets.map((t) => t["Ticket Status"]).filter(Boolean)),
  ].sort();
  function openTicket(t: Ticket) {
    selectedTicket = structuredClone(t); // avoid direct reference
    showDetailModal = true;
  }
  function closeDetail() {
    showDetailModal = false;
    selectedTicket = null;
  }
  function handleUpdateTicket(updatedTicket: Ticket) {
    const idx = tickets.findIndex((t) => t._id === updatedTicket._id);
    if (idx >= 0) tickets[idx] = updatedTicket as any;
    selectedTicket = structuredClone(updatedTicket); // avoid direct reference
  }
</script>

<!-- Filters -->
{#if showFilters}
  <div class="w3-panel w3-light-gray w3-padding w3-small">
    <div class="w3-row-padding">
      <div class="w3-col s6 m3">
        <input
          id="hideClosed"
          class="w3-check"
          type="checkbox"
          bind:checked={hideClosed}
        />
        <label for="hideClosed"> Hide Closed</label>
      </div>
      <div class="w3-col s6 m3">
        <select class="w3-select w3-border w3-small" bind:value={statusFilter}>
          <option value="">All Statuses</option>
          {#each statusOptions as s}
            <option value={s}>{s}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>
{/if}

<div class="w3-responsive">
  <table class="w3-table w3-striped w3-bordered {compact ? 'w3-small' : ''}">
    <thead>
      <tr class="w3-blue">
        <th
          ><button class="sort" on:click={() => toggleSort("Number")}
            ># {sortBy === "Number"
              ? sortOrder === "asc"
                ? "↑"
                : "↓"
              : ""}</button
          ></th
        >
        <th>Status</th>
        <th
          ><button class="sort" on:click={() => toggleSort("Priority")}
            >Pr {sortBy === "Priority"
              ? sortOrder === "asc"
                ? "↑"
                : "↓"
              : ""}</button
          ></th
        >
        <th
          ><button class="sort" on:click={() => toggleSort("Created")}
            >Created {sortBy === "Created"
              ? sortOrder === "asc"
                ? "↑"
                : "↓"
              : ""}</button
          ></th
        >
        {#if showStudentColumn}<th>Student</th>{/if}
        {#if showAssetColumn}<th>Device</th>{/if}
        {#if showTempColumn}<th>Temp</th>{/if}
        <th>Description</th>
        <th>Resolution</th>
      </tr>
    </thead>
    <tbody>
      {#each filtered as t (t._id)}
        <tr
          class="w3-hover-light-gray {t['Ticket Status'] === 'Closed'
            ? 'closed-row'
            : ''}"
        >
          <td>
            <button
              class="ticket-number-btn w3-btn w3-small w3-blue"
              on:click={() => openTicket(t)}
            >
              #{t.Number || (t._id && t._id.startsWith("TEMP-") ? "Draft" : "")}
            </button>
          </td>
          <td
            ><span class="w3-tag w3-small {getStatusColor(t['Ticket Status'])}"
              >{t["Ticket Status"] || "Unknown"}</span
            ></td
          >
          <td
            ><span class="w3-tag w3-small {getPriorityColor(t.Priority)}"
              >{getPriorityText(t.Priority)}</span
            ></td
          >
          <td class="w3-small">{formatDate(t.Created)}</td>
          {#if showStudentColumn}
            <td
              >{#if t._linked?.Student}<StudentTag
                  student={t._linked.Student}
                />{:else}<span class="w3-text-gray">-</span>{/if}</td
            >
          {/if}
          {#if showAssetColumn}
            <td
              >{#if t.Device && t._linked?.Device}<AssetDisplay
                  asset={t._linked.Device}
                  showStatus={false}
                />{:else if t.FormAsset}{t.FormAsset}{:else}<span
                  class="w3-text-gray">-</span
                >{/if}</td
            >
          {/if}
          {#if showTempColumn}
            <td>
              {#if t?._linked["Temporary Device"]}
                <AssetDisplay
                  asset={t?._linked["Temporary Device"]}
                  showStatus={false}
                />
              {:else}
                <span class="w3-text-gray">-</span>
              {/if}
            </td>
          {/if}
          <td class="desc">{t["User Description"] || "-"}</td>
          <td class="w3-small">{t.Resolution || "-"}</td>
        </tr>
      {/each}
      {#if filtered.length === 0}
        <tr><td colspan="8" class="w3-center w3-text-gray">No tickets</td></tr>
      {/if}
    </tbody>
  </table>
</div>

{#if showDetailModal && selectedTicket}
  <div class="modal" style="display:block;">
    <button class="close-button" on:click={closeDetail} tabindex="0"
      >&times;</button
    >
    <div class="opaque">
      <TicketWorkflow
        ticket={selectedTicket}
        onUpdateTicket={handleUpdateTicket}
      />
    </div>
  </div>
{/if}

<style>
  .ticket-number-btn {
    padding: 4px 8px;
    font-weight: bold;
  }
  .sort {
    background: none;
    border: none;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }
  .sort:hover {
    text-decoration: underline;
  }
  .desc {
    max-width: 260px;
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
  }
  .close-button:hover {
    background: #f44336;
    color: white;
    border-color: #f44336;
  }
  .opaque {
    background: white;
  }
  .closed-row {
    opacity: 0.55;
  }
</style>
