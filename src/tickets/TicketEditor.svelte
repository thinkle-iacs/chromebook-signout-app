<script lang="ts">
  import type { Ticket } from "../data/tickets";
  import { updateTicket } from "../data/tickets";
  import StudentTag from "../StudentTag.svelte";
  import AssetDisplay from "../AssetDisplay.svelte";

  export let ticket: Ticket;
  export let readOnly: boolean = false;

  let saving = false;
  let newNote = "";
  let newPrivateNote = "";

  // Status options for dropdowns
  const ticketStatusOptions = [
    "Untriaged",
    "Triaged",
    "Assigned",
    "In Progress",
    "Waiting on Student",
    "Waiting on Tech",
    "Resolved",
    "Closed",
  ];

  const deviceStatusOptions = [
    undefined,
    "New",
    "Waiting on Part",
    "Waiting on Repair",
    "Repaired",
    "Discarded",
  ];

  const tempStatusOptions = [
    undefined,
    "Not Needed",
    "Needed",
    "Assigned",
    "Loaned",
    "Returned",
  ];

  // Parse existing history or create empty structure
  let historyData;
  try {
    historyData = ticket.History ? JSON.parse(ticket.History) : { entries: [] };
  } catch (e) {
    // If History is plain text, convert it to structured format
    historyData = {
      entries: ticket.History
        ? [
            {
              timestamp: new Date().toISOString(),
              action: "legacy_note",
              content: ticket.History,
              user: "system",
            },
          ]
        : [],
    };
  }

  async function updateStatus(field: keyof Ticket, newValue: any) {
    if (readOnly) return;
    saving = true;
    try {
      // Add history entry for status change
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: "status_change",
        field: field,
        from: ticket[field],
        to: newValue,
        user: "current_user@school.edu", // TODO: Get from auth
        note: `${field} changed from ${ticket[field]} to ${newValue}`,
      };

      historyData.entries.push(historyEntry);

      await updateTicket(ticket._id, {
        [field]: newValue,
        History: JSON.stringify(historyData),
      });

      // Update ticket object - need to be careful with typing
      (ticket as any)[field] = newValue;
      ticket.History = JSON.stringify(historyData);
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket");
    } finally {
      saving = false;
    }
  }

  async function addNote(type: "public" | "private") {
    if (readOnly) return;
    const note = type === "public" ? newNote : newPrivateNote;
    if (!note.trim()) return;

    saving = true;
    try {
      // Add history entry for note
      const historyEntry = {
        timestamp: new Date().toISOString(),
        action: "note_added",
        type: type,
        content: note,
        user: "current_user@school.edu", // TODO: Get from auth
      };

      historyData.entries.push(historyEntry);

      const updates: Partial<Ticket> = {
        History: JSON.stringify(historyData),
      };

      if (type === "public") {
        updates.Notes =
          (ticket.Notes || "") +
          "\n\n" +
          `[${new Date().toLocaleDateString()}] ${note}`;
        newNote = "";
      } else {
        updates.PrivateNotes =
          (ticket.PrivateNotes || "") +
          "\n\n" +
          `[${new Date().toLocaleDateString()}] ${note}`;
        newPrivateNote = "";
      }

      await updateTicket(ticket._id, updates);

      // Update local ticket object
      Object.assign(ticket, updates);
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    } finally {
      saving = false;
    }
  }

  function handleStatusChange(field: keyof Ticket, event: Event) {
    const target = event.target as HTMLSelectElement;
    let value: any = target.value;
    if (field === "Device Status" || field === "Temp Status") {
      value = value || undefined;
    }
    updateStatus(field, value);
  }

  function formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
</script>

<div class="ticket-detail w3-card w3-white w3-padding">
  <div class="w3-row">
    <div class="w3-col l8 m12">
      <h3 class="w3-text-blue">Ticket #{ticket.Number}</h3>

      <!-- Basic Info -->
      <div class="w3-section">
        <h4>Issue Description</h4>
        <p class="w3-panel w3-light-gray">{ticket["User Description"]}</p>
      </div>

      <!-- People & Devices -->
      <div class="w3-row-padding w3-section">
        <div class="w3-col s6">
          <h5>Student</h5>
          {#if ticket._linked?.Student}
            <StudentTag student={ticket._linked.Student} />
          {:else}
            <span class="w3-text-gray">No student linked</span>
          {/if}
        </div>
        <div class="w3-col s6">
          <h5>Device</h5>
          {#if ticket._linked?.Device}
            <AssetDisplay asset={ticket._linked.Device} />
          {:else}
            <span class="w3-text-gray">No device linked</span>
          {/if}
        </div>
      </div>

      <!-- Notes Section -->
      <div class="w3-section">
        <div class="w3-row-padding">
          <div class="w3-col s6">
            <h5>Public Notes</h5>
            <div class="w3-panel w3-border w3-light-gray w3-small">
              {ticket.Notes || "No notes yet"}
            </div>
            {#if !readOnly}
              <div class="w3-margin-top">
                <textarea
                  bind:value={newNote}
                  class="w3-input w3-border"
                  placeholder="Add public note..."
                  rows="3"
                ></textarea>
                <button
                  class="w3-btn w3-blue w3-small w3-margin-top"
                  on:click={() => addNote("public")}
                  disabled={saving || !newNote.trim()}
                >
                  Add Note
                </button>
              </div>
            {/if}
          </div>
          <div class="w3-col s6">
            <h5>Private Notes</h5>
            <div class="w3-panel w3-border w3-light-red w3-small">
              {ticket.PrivateNotes || "No private notes yet"}
            </div>
            {#if !readOnly}
              <div class="w3-margin-top">
                <textarea
                  bind:value={newPrivateNote}
                  class="w3-input w3-border"
                  placeholder="Add private note..."
                  rows="3"
                ></textarea>
                <button
                  class="w3-btn w3-red w3-small w3-margin-top"
                  on:click={() => addNote("private")}
                  disabled={saving || !newPrivateNote.trim()}
                >
                  Add Private Note
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>

    <div class="w3-col l4 m12">
      <!-- Status Management -->
      <div class="w3-panel w3-border w3-light-blue">
        <h4>Status Management</h4>

        <div class="w3-margin-bottom">
          <label for="ticket-status" class="w3-text-blue"
            ><b>Ticket Status</b></label
          >
          <select
            id="ticket-status"
            class="w3-select w3-border"
            value={ticket["Ticket Status"]}
            on:change={(e) => handleStatusChange("Ticket Status", e)}
            disabled={saving || readOnly}
          >
            {#each ticketStatusOptions as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>

        <div class="w3-margin-bottom">
          <label for="device-status" class="w3-text-blue"
            ><b>Device Status</b></label
          >
          <select
            id="device-status"
            class="w3-select w3-border"
            value={ticket["Device Status"] || ""}
            on:change={(e) => handleStatusChange("Device Status", e)}
            disabled={saving || readOnly}
          >
            <option value="">None</option>
            {#each deviceStatusOptions.filter((s) => s !== undefined) as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>

        <div class="w3-margin-bottom">
          <label for="temp-status" class="w3-text-blue"
            ><b>Temp Device Status</b></label
          >
          <select
            id="temp-status"
            class="w3-select w3-border"
            value={ticket["Temp Status"] || ""}
            on:change={(e) => handleStatusChange("Temp Status", e)}
            disabled={saving || readOnly}
          >
            <option value="">None</option>
            {#each tempStatusOptions.filter((s) => s !== undefined) as status}
              <option value={status}>{status}</option>
            {/each}
          </select>
        </div>

        {#if saving}
          <div class="w3-panel w3-yellow w3-small">
            <i class="fa fa-spinner fa-spin"></i> Saving...
          </div>
        {/if}
      </div>

      <!-- History Timeline -->
      <div class="w3-panel w3-border">
        <h4>History</h4>
        <div class="history-timeline w3-small">
          {#each historyData.entries.slice().reverse() as entry}
            <div
              class="history-entry w3-margin-bottom w3-padding w3-border-left w3-border-blue"
            >
              <div class="w3-text-gray">{formatTimestamp(entry.timestamp)}</div>
              <div class="w3-text-blue">{entry.user}</div>
              <div>
                {#if entry.action === "status_change"}
                  <strong>{entry.field}:</strong> {entry.from} → {entry.to}
                {:else if entry.action === "note_added"}
                  <strong>Added {entry.type} note:</strong> {entry.content}
                {:else if entry.action === "legacy_note"}
                  <strong>Legacy:</strong> {entry.content}
                {:else}
                  {entry.note || entry.content}
                {/if}
              </div>
            </div>
          {/each}
          {#if historyData.entries.length === 0}
            <div class="w3-text-gray">No history yet</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .history-timeline {
    max-height: 400px;
    overflow-y: auto;
  }

  .history-entry {
    border-left: 3px solid #2196f3 !important;
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }
</style>
