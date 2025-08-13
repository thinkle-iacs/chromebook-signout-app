<script lang="ts">
  import { user } from "@data/user";
  import type { Ticket } from "@data/tickets";
  import { updateTicket } from "@data/tickets";
  import StudentTag from "@ui/people/students/StudentTag.svelte";
  import AssetDisplay from "@ui/assets/AssetDisplay.svelte";
  import EditableTextField from "./editorComponents/EditableTextField.svelte";
  import TicketStudentAssignment from "./editorComponents/TicketStudentAssignment.svelte";
  import TicketAssetAssignment from "./editorComponents/TicketAssetAssignment.svelte";
  import { studentsStore } from "@data/students";
  import { assetStore } from "@data/inventory";
  import EditableNumberField from "./editorComponents/EditableNumberField.svelte";

  export let ticket: Ticket;
  export let readOnly: boolean = false;
  export let onTicketChange: (ticket: Ticket) => void = () => {};

  let saving = false;

  // Status options for dropdowns
  const ticketStatusOptions = [
    "New",
    "Awaiting Drop-Off",
    "Have Device",
    "In Repair",
    "Ready for Pickup",
    "In Progress",
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
  function parseHistoryData(history: string | undefined) {
    try {
      return history ? JSON.parse(history) : { entries: [] };
    } catch (e) {
      // If History is plain text, convert it to structured format
      return {
        entries: history
          ? [
              {
                timestamp: new Date().toISOString(),
                action: "legacy_note",
                content: history,
                user: "system",
              },
            ]
          : [],
      };
    }
  }
  historyData = parseHistoryData(ticket.History);

  function getCurrentHistoryEntries() {
    // Always parse the latest ticket.History to avoid overwriting
    return parseHistoryData(ticket.History).entries;
  }

  // --- Centralized update function with history ---
  async function doTicketUpdate(updates: Partial<Ticket>, historyEntry?: any) {
    if (readOnly) return;
    saving = true;
    try {
      let entries = getCurrentHistoryEntries();
      if (historyEntry) {
        entries.push(historyEntry);
        updates = { ...updates, History: JSON.stringify({ entries }) };
      }
      const updated = await updateTicket(ticket._id, updates);
      Object.assign(ticket, updated);
      historyData = parseHistoryData(ticket.History);
      onTicketChange(ticket);
      return updated;
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket");
    } finally {
      saving = false;
    }
  }

  // --- Status update ---
  async function updateStatus(field: keyof Ticket, newValue: any) {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      action: "status_change",
      field: field,
      from: ticket[field],
      to: newValue,
      user: $user.email,
      note: `${field} changed from ${ticket[field]} to ${newValue}`,
    };
    await doTicketUpdate({ [field]: newValue }, historyEntry);
  }

  // --- Notes and User Description update ---
  async function saveNotes(type: "public" | "private", newValue: string) {
    let updates: Partial<Ticket> = {};
    let noteContent: string = newValue;
    if (type === "public") {
      updates.Notes = noteContent;
    } else {
      updates.PrivateNotes = noteContent;
    }

    const historyEntry = {
      timestamp: new Date().toISOString(),
      action: "note_edited",
      type: type,
      content: noteContent,
      user: $user.email,
    };

    await doTicketUpdate(updates, historyEntry);
  }

  async function saveUserDescription(newValue: string) {
    let updates: Partial<Ticket> = {
      "User Description": newValue,
    };

    const historyEntry = {
      timestamp: new Date().toISOString(),
      action: "user_description_edited",
      content: newValue,
      user: $user.email,
    };

    await doTicketUpdate(updates, historyEntry);
  }

  // --- Device/Student association update ---
  async function updateLinkedField(
    field: "Device" | "Student",
    newValue: string | null
  ) {
    let updates: Partial<Ticket> = {};
    updates[field] = newValue ? [newValue] : [];

    // Get human-readable names for history
    let fromName = "none";
    let toName = "none";

    if (field === "Student") {
      // Use existing _linked data for current student
      if (ticket._linked?.Student) {
        const existingStudent = ticket._linked.Student;
        fromName = `${existingStudent.Name} (${existingStudent.Email})`;
      }
      // Look up new student in store
      if (newValue) {
        const newStudent = Object.values($studentsStore).find(
          (s) => s._id === newValue
        );
        toName = newStudent
          ? `${newStudent.Name} (${newStudent.Email})`
          : newValue;
      }
    } else if (field === "Device") {
      // Use existing _linked data for current device
      if (ticket._linked?.Device) {
        const existingAsset = ticket._linked.Device;
        fromName = `${existingAsset.AssetTag} (${existingAsset.Model})`;
      }
      // Look up new asset in store
      if (newValue) {
        const newAsset = Object.values($assetStore).find(
          (a) => a._id === newValue
        );
        toName = newAsset
          ? `${newAsset["Asset Tag"]} (${newAsset.Model})`
          : newValue;
      }
    }

    const historyEntry = {
      timestamp: new Date().toISOString(),
      action: "linked_field_updated",
      field,
      from: ticket[field],
      to: newValue,
      user: $user.email,
      note: `${field} changed from ${fromName} to ${toName}`,
    };

    await doTicketUpdate(updates, historyEntry);
  }

  // --- Repair Cost update ---
  async function updateRepairCost(newValue: number | undefined) {
    if (readOnly) return;
    const historyEntry = {
      timestamp: new Date().toISOString(),
      action: "repair_cost_updated",
      from: ticket["Repair Cost"],
      to: newValue,
      user: $user.email,
      note: `Repair Cost changed from ${ticket["Repair Cost"] ?? "none"} to ${newValue ?? "none"}`,
    };
    await doTicketUpdate({ "Repair Cost": newValue }, historyEntry);
  }

  function formatDollar(val: number | undefined) {
    if (val === undefined || val === null || isNaN(val)) return "";
    return `$${val.toFixed(2)}`;
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
        {#if !readOnly}
          <EditableTextField
            textValue={ticket["User Description"] || ""}
            onSave={saveUserDescription}
            disabled={saving}
            rows={5}
            placeholder="Describe the issue..."
          />
        {:else}
          <p class="w3-panel w3-light-gray">{ticket["User Description"]}</p>
        {/if}
      </div>

      <!-- People & Devices -->
      <div class="w3-row-padding w3-section">
        <div class="w3-col s6">
          <h5>Student</h5>
          <TicketStudentAssignment
            {ticket}
            disabled={saving || readOnly}
            onSave={async (studentId) => {
              await updateLinkedField("Student", studentId);
            }}
          />
        </div>
        <div class="w3-col s6">
          <h5>Device</h5>
          <TicketAssetAssignment
            {ticket}
            disabled={saving || readOnly}
            onSave={async (deviceId) => {
              await updateLinkedField("Device", deviceId);
            }}
          />
        </div>
      </div>

      <!-- Notes Section -->
      <div class="w3-section">
        <div class="w3-row-padding">
          <div class="w3-col s6">
            <h5>Public Notes</h5>
            {#if !readOnly}
              <EditableTextField
                textValue={ticket.Notes || ""}
                onSave={(val) => saveNotes("public", val)}
                disabled={saving}
                rows={8}
                placeholder="Enter public notes..."
              />
            {:else}
              <div class="w3-panel w3-border w3-light-gray w3-small">
                {ticket.Notes || "No notes yet"}
              </div>
            {/if}
          </div>
          <div class="w3-col s6">
            <h5>Private Notes</h5>
            {#if !readOnly}
              <EditableTextField
                textValue={ticket.PrivateNotes || ""}
                onSave={(val) => saveNotes("private", val)}
                disabled={saving}
                rows={8}
                placeholder="Enter private notes..."
              />
            {:else}
              <div class="w3-panel w3-border w3-light-red w3-small">
                {ticket.PrivateNotes || "No private notes yet"}
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

        <!-- Repair Cost Field -->
        <div class="w3-margin-bottom">
          <label for="repair-cost" class="w3-text-blue"
            ><b>Repair Cost</b></label
          >
          {#if !readOnly}
            <EditableNumberField
              value={ticket["Repair Cost"]}
              onSave={updateRepairCost}
              disabled={saving}
              min={0}
              placeholder="0.00"
            />
          {:else}
            <div class="w3-panel w3-border w3-light-gray w3-small">
              {formatDollar(ticket["Repair Cost"])}
            </div>
          {/if}
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
