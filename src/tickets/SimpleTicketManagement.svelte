<script lang="ts">
  import type { Ticket } from "../data/tickets";
  import { updateTicket } from "../data/tickets";
  import StudentTag from "../StudentTag.svelte";
  import AssetDisplay from "../AssetDisplay.svelte";
  import NameDropdown from "../NameDropdown.svelte";
  import {
    studentName,
    assetTag,
    staffName,
    validateStudent,
    validateStaff,
  } from "../validators";
  import {
    getStudent,
    studentsStore,
    searchForStudent,
  } from "../data/students";
  import { staffStore, searchForStaff } from "../data/staff";
  import { assetStore, searchForAsset } from "../data/inventory";
  import { onMount } from "svelte";

  export let ticket: Ticket;

  let saving = false;
  let pendingChanges = false;
  let newNote = "";

  // Editing modes for student and device
  let editingStudent = false;
  let editingDevice = false;
  let editingStaff = false;
  let tempStudentName = "";
  let tempAssetTag = "";
  let tempStaffName = "";

  // Input element references for dropdowns
  let studentInput: HTMLInputElement;
  let staffInput: HTMLInputElement;

  // Reactive validation to trigger dropdowns only when input length >= 2
  $: if ($studentName && editingStudent && $studentName.length >= 2) {
    validateStudent($studentName);
  }

  $: if ($staffName && editingStaff && $staffName.length >= 2) {
    validateStaff($staffName);
  }

  $: console.log("Updating student name:", $studentName); // why doesn't this fire???

  // Form fields that track pending changes
  let formData = {
    ticketStatus: ticket["Ticket Status"],
    tempStatus: ticket["Temp Status"] || "",
    publicNote: "",
    privateNote: "",
  };

  // Watch for changes to mark form as dirty
  $: pendingChanges =
    formData.ticketStatus !== ticket["Ticket Status"] ||
    formData.tempStatus !== (ticket["Temp Status"] || "") ||
    formData.publicNote.trim() !== "" ||
    formData.privateNote.trim() !== "";

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

  const tempStatusOptions = [
    { value: "", label: "None" },
    { value: "Not Needed", label: "Not Needed" },
    { value: "Needed", label: "Needed" },
    { value: "Assigned", label: "Assigned" },
    { value: "Loaned", label: "Loaned" },
    { value: "Returned", label: "Returned" },
  ];

  async function saveChanges() {
    if (!pendingChanges) return;

    saving = true;
    try {
      const updates: Partial<Ticket> = {};

      // Track changes for history
      let changes = [];

      if (formData.ticketStatus !== ticket["Ticket Status"]) {
        updates["Ticket Status"] = formData.ticketStatus;
        changes.push(
          `Ticket Status: ${ticket["Ticket Status"]} → ${formData.ticketStatus}`
        );
      }

      if (formData.tempStatus !== (ticket["Temp Status"] || "")) {
        updates["Temp Status"] =
          formData.tempStatus === "" ? undefined : (formData.tempStatus as any);
        changes.push(
          `Temp Status: ${ticket["Temp Status"] || "None"} → ${formData.tempStatus || "None"}`
        );
      }

      // Handle notes
      let notesToAdd = [];
      if (formData.publicNote.trim()) {
        const timestamp = new Date().toLocaleDateString();
        const existingNotes = ticket.Notes || "";
        updates.Notes =
          existingNotes +
          (existingNotes ? "\n\n" : "") +
          `[${timestamp}] ${formData.publicNote}`;
        notesToAdd.push(`Added public note: ${formData.publicNote}`);
      }

      if (formData.privateNote.trim()) {
        const timestamp = new Date().toLocaleDateString();
        const existingPrivateNotes = ticket.PrivateNotes || "";
        updates.PrivateNotes =
          existingPrivateNotes +
          (existingPrivateNotes ? "\n\n" : "") +
          `[${timestamp}] ${formData.privateNote}`;
        notesToAdd.push(`Added private note: ${formData.privateNote}`);
      }

      // Simple history tracking (for now, just append to existing)
      if (changes.length > 0 || notesToAdd.length > 0) {
        const timestamp = new Date().toLocaleString();
        const historyEntry = `[${timestamp}] ${[...changes, ...notesToAdd].join("; ")}`;
        const existingHistory = ticket.History || "";
        updates.History =
          existingHistory + (existingHistory ? "\n" : "") + historyEntry;
      }

      await updateTicket(ticket._id, updates);

      // Update local ticket object
      Object.assign(ticket, updates);

      // Reset form
      formData.ticketStatus = ticket["Ticket Status"];
      formData.tempStatus = ticket["Temp Status"] || "";
      formData.publicNote = "";
      formData.privateNote = "";

      alert("Ticket updated successfully!");
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket: " + error.message);
    } finally {
      saving = false;
    }
  }

  function resetForm() {
    formData.ticketStatus = ticket["Ticket Status"];
    formData.tempStatus = ticket["Temp Status"] || "";
    formData.publicNote = "";
    formData.privateNote = "";
  }

  function assignTempDevice() {
    // Navigate to checkout with student pre-filled and indicate this is for a temp device
    const studentName = ticket._linked?.Student?.Name;
    if (studentName) {
      // We could add a query parameter to indicate this is a temp assignment
      window.location.href = `/checkout/?student=${encodeURIComponent(studentName)}&tempFor=${ticket._id}`;
    } else {
      alert("No student linked to this ticket");
    }
  }

  function viewStudent() {
    const studentName = ticket._linked?.Student?.Name;
    if (studentName) {
      window.location.href = `/student/${encodeURIComponent(studentName)}`;
    }
  }

  function viewDevice() {
    const assetTag = ticket._linked?.Device?.AssetTag;
    if (assetTag) {
      window.location.href = `/asset/${encodeURIComponent(assetTag)}`;
    }
  }

  function startEditingStudent() {
    editingStudent = true;
    tempStudentName = ticket._linked?.Student?.Name || "";
    $studentName = tempStudentName;
  }

  function cancelEditingStudent() {
    editingStudent = false;
    tempStudentName = "";
    $studentName = "";
  }

  async function saveStudentLink() {
    if (!$studentName) {
      alert("Please select a student");
      return;
    }

    saving = true;
    try {
      // Find the student to get their ID
      const student = getStudent($studentName);
      if (!student) {
        alert("Student not found");
        return;
      }

      // Update ticket with student ID (this should be the Airtable record ID)
      const updates: any = {
        Student: [student._id], // Airtable expects an array for linked records
      };

      await updateTicket(ticket._id, updates);

      // Update local ticket object
      ticket.Student = student._id as any;
      // Note: The _linked data will be updated on next fetch

      editingStudent = false;
      tempStudentName = "";
      $studentName = "";

      alert("Student linked successfully!");
    } catch (error) {
      console.error("Error linking student:", error);
      alert("Failed to link student: " + error.message);
    } finally {
      saving = false;
    }
  }

  function startEditingDevice() {
    editingDevice = true;
    tempAssetTag = ticket._linked?.Device?.AssetTag || "";
    $assetTag = tempAssetTag;
  }

  function cancelEditingDevice() {
    editingDevice = false;
    tempAssetTag = "";
    $assetTag = "";
  }

  async function saveDeviceLink() {
    if (!$assetTag) {
      alert("Please enter an asset tag");
      return;
    }

    saving = true;
    try {
      // Search for the asset to get its ID
      await searchForAsset($assetTag);
      const asset = $assetStore[$assetTag];

      if (!asset) {
        alert("Asset not found");
        return;
      }

      // Update ticket with device ID
      const updates: any = {
        Device: [asset._id], // Airtable expects an array for linked records
      };

      await updateTicket(ticket._id, updates);

      // Update local ticket object
      ticket.Device = asset._id as any;

      editingDevice = false;
      tempAssetTag = "";
      $assetTag = "";

      alert("Device linked successfully!");
    } catch (error) {
      console.error("Error linking device:", error);
      alert("Failed to link device: " + error.message);
    } finally {
      saving = false;
    }
  }

  function startEditingStaff() {
    editingStaff = true;
    tempStaffName = ticket._linked?.Staff?.["Full Name"] || "";
    $staffName = tempStaffName;
  }

  function cancelEditingStaff() {
    editingStaff = false;
    tempStaffName = "";
    $staffName = "";
  }

  async function saveStaffLink() {
    if (!$staffName) {
      alert("Please select a staff member");
      return;
    }

    saving = true;
    try {
      // Find the staff member to get their ID
      const staff = $staffStore[$staffName];
      if (!staff) {
        alert("Staff member not found");
        return;
      }

      // Update ticket with staff ID
      const updates: any = {
        Staff: [staff._id], // Airtable expects an array for linked records
      };

      await updateTicket(ticket._id, updates);

      // Update local ticket object
      ticket.Staff = staff._id as any;

      editingStaff = false;
      tempStaffName = "";
      $staffName = "";

      alert("Staff member linked successfully!");
    } catch (error) {
      console.error("Error linking staff:", error);
      alert("Failed to link staff: " + error.message);
    } finally {
      saving = false;
    }
  }

  function viewStaff() {
    const staffName = ticket._linked?.Staff?.["Full Name"];
    if (staffName) {
      window.location.href = `/staff/${encodeURIComponent(staffName)}`;
    }
  }

  async function removeStudent() {
    saving = true;
    try {
      const updates: any = { Student: [] };
      await updateTicket(ticket._id, updates);
      ticket.Student = null;
      ticket._linked.Student = null;
      ticketsStore.update(($ticketsStore) => {
        $ticketsStore[ticket._id] = { ...ticket };
        return $ticketsStore;
      });
      $studentName = "";
      tempStudentName = "";
      alert("Student removed.");
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Failed to remove student: " + error.message);
    } finally {
      saving = false;
    }
  }

  async function removeStaff() {
    saving = true;
    try {
      const updates: any = { Staff: [] };
      await updateTicket(ticket._id, updates);
      ticket.Staff = null;
      ticket._linked.Staff = null;
      ticketsStore.update(($ticketsStore) => {
        $ticketsStore[ticket._id] = { ...ticket };
        return $ticketsStore;
      });
      $staffName = "";
      tempStaffName = "";
      alert("Staff removed.");
    } catch (error) {
      console.error("Error removing staff:", error);
      alert("Failed to remove staff: " + error.message);
    } finally {
      saving = false;
    }
  }
</script>

<div class="ticket-management w3-card w3-white w3-padding">
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
        <div class="w3-col s4">
          <div class="w3-row">
            <div class="w3-col s8">
              <h5>Student</h5>
            </div>
            <div class="w3-col s4 w3-right-align">
              {#if !editingStudent}
                <button
                  class="w3-btn w3-small w3-blue w3-round"
                  on:click={startEditingStudent}
                  title="Link/change student"
                >
                  {ticket._linked?.Student ? "Edit" : "Link"}
                </button>
              {/if}
            </div>
          </div>

          {#if editingStudent}
            <div class="w3-panel w3-border w3-light-blue">
              <input
                bind:this={studentInput}
                type="text"
                class="w3-input w3-border"
                placeholder="Start typing student name..."
                bind:value={$studentName}
                autocomplete="off"
              />
              <NameDropdown mode="student" inputElement={studentInput} />
              <div class="w3-margin-top">
                <button
                  class="w3-btn w3-green w3-small"
                  on:click={saveStudentLink}
                  disabled={!$studentName || saving}
                >
                  Save
                </button>
                <button
                  class="w3-btn w3-gray w3-small w3-margin-left"
                  on:click={cancelEditingStudent}
                  disabled={saving}
                >
                  Cancel
                </button>
                {#if ticket.Student}
                  <button
                    class="w3-btn w3-red w3-small w3-margin-left"
                    title="Remove student"
                    on:click={removeStudent}
                    disabled={saving}
                  >
                    &times;
                  </button>
                {/if}
              </div>
            </div>
          {:else if ticket._linked?.Student}
            <StudentTag student={ticket._linked.Student} />
          {:else}
            <span class="w3-text-gray">No student linked</span>
          {/if}
        </div>

        <div class="w3-col s4">
          <div class="w3-row">
            <div class="w3-col s8">
              <h5>Staff</h5>
            </div>
            <div class="w3-col s4 w3-right-align">
              {#if !editingStaff}
                <button
                  class="w3-btn w3-small w3-green w3-round"
                  on:click={startEditingStaff}
                  title="Link/change staff"
                >
                  {ticket._linked?.Staff ? "Edit" : "Link"}
                </button>
              {/if}
            </div>
          </div>

          {#if editingStaff}
            <div class="w3-panel w3-border w3-light-green">
              <input
                bind:this={staffInput}
                type="text"
                class="w3-input w3-border"
                placeholder="Start typing staff name..."
                bind:value={$staffName}
                autocomplete="off"
              />
              <NameDropdown mode="staff" inputElement={staffInput} />
              <div class="w3-margin-top">
                <button
                  class="w3-btn w3-green w3-small"
                  on:click={saveStaffLink}
                  disabled={!$staffName || saving}
                >
                  Save
                </button>
                <button
                  class="w3-btn w3-gray w3-small w3-margin-left"
                  on:click={cancelEditingStaff}
                  disabled={saving}
                >
                  Cancel
                </button>
                {#if ticket.Staff}
                  <button
                    class="w3-btn w3-red w3-small w3-margin-left"
                    title="Remove staff"
                    on:click={removeStaff}
                    disabled={saving}
                  >
                    &times;
                  </button>
                {/if}
              </div>
            </div>
          {:else if ticket._linked?.Staff}
            <div class="w3-panel w3-light-green w3-border">
              <div class="w3-small">
                <strong>{ticket._linked.Staff["Full Name"]}</strong><br />
                <span class="w3-text-gray">{ticket._linked.Staff.Role}</span><br
                />
                <span class="w3-text-gray"
                  >{ticket._linked.Staff.Department}</span
                ><br />
                <a
                  href="mailto:{ticket._linked.Staff.Email}"
                  class="w3-text-blue"
                >
                  {ticket._linked.Staff.Email}
                </a>
              </div>
            </div>
          {:else}
            <span class="w3-text-gray">No staff linked</span>
          {/if}
        </div>

        <div class="w3-col s4">
          <div class="w3-row">
            <div class="w3-col s8">
              <h5>Device</h5>
            </div>
            <div class="w3-col s4 w3-right-align">
              {#if !editingDevice}
                <button
                  class="w3-btn w3-small w3-orange w3-round"
                  on:click={startEditingDevice}
                  title="Link/change device"
                >
                  {ticket._linked?.Device ? "Edit" : "Link"}
                </button>
              {/if}
            </div>
          </div>

          {#if editingDevice}
            <div class="w3-panel w3-border w3-light-orange">
              <input
                type="text"
                class="w3-input w3-border"
                placeholder="Enter asset tag..."
                bind:value={$assetTag}
              />
              <div class="w3-margin-top">
                <button
                  class="w3-btn w3-green w3-small"
                  on:click={saveDeviceLink}
                  disabled={!$assetTag || saving}
                >
                  Save
                </button>
                <button
                  class="w3-btn w3-gray w3-small w3-margin-left"
                  on:click={cancelEditingDevice}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else if ticket._linked?.Device}
            <AssetDisplay asset={ticket._linked.Device} />
          {:else}
            <span class="w3-text-gray">No device linked</span>
          {/if}
        </div>
      </div>

      <!-- Current Notes Display -->
      <div class="w3-section">
        <div class="w3-row-padding">
          <div class="w3-col s6">
            <h5>Current Public Notes</h5>
            <div
              class="w3-panel w3-border w3-light-gray w3-small"
              style="max-height: 200px; overflow-y: auto;"
            >
              {ticket.Notes || "No notes yet"}
            </div>
          </div>
          <div class="w3-col s6">
            <h5>Current Private Notes</h5>
            <div
              class="w3-panel w3-border w3-light-red w3-small"
              style="max-height: 200px; overflow-y: auto;"
            >
              {ticket.PrivateNotes || "No private notes yet"}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w3-col l4 m12">
      <!-- Status Management Form -->
      <div class="w3-panel w3-border w3-light-blue">
        <h4>Update Ticket</h4>

        <div class="w3-margin-bottom">
          <label for="ticket-status" class="w3-text-blue"
            ><b>Ticket Status</b></label
          >
          <select
            id="ticket-status"
            class="w3-select w3-border"
            bind:value={formData.ticketStatus}
          >
            {#each ticketStatusOptions as status}
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
            bind:value={formData.tempStatus}
          >
            {#each tempStatusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <div class="w3-margin-bottom">
          <label for="public-note" class="w3-text-blue"
            ><b>Add Public Note</b></label
          >
          <textarea
            id="public-note"
            bind:value={formData.publicNote}
            class="w3-input w3-border"
            placeholder="Add public note (visible to student)..."
            rows="3"
          ></textarea>
        </div>

        <div class="w3-margin-bottom">
          <label for="private-note" class="w3-text-red"
            ><b>Add Private Note</b></label
          >
          <textarea
            id="private-note"
            bind:value={formData.privateNote}
            class="w3-input w3-border"
            placeholder="Add private note (internal only)..."
            rows="3"
          ></textarea>
        </div>

        <div class="w3-margin-top">
          <button
            class="w3-btn w3-green w3-block"
            on:click={saveChanges}
            disabled={!pendingChanges || saving}
          >
            {#if saving}
              <i class="fa fa-spinner fa-spin"></i> Saving...
            {:else if pendingChanges}
              Save Changes
            {:else}
              No Changes
            {/if}
          </button>

          {#if pendingChanges}
            <button
              class="w3-btn w3-gray w3-block w3-margin-top"
              on:click={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          {/if}
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="w3-panel w3-border w3-margin-top">
        <h4>Quick Actions</h4>

        <button
          class="w3-btn w3-orange w3-block w3-margin-bottom"
          on:click={assignTempDevice}
          disabled={!ticket._linked?.Student}
          title={!ticket._linked?.Student
            ? "Link a student first"
            : "Assign temporary device to student"}
        >
          <i class="fa fa-laptop"></i> Assign Temp Device
        </button>

        {#if ticket._linked?.Student}
          <button
            class="w3-btn w3-blue w3-block w3-margin-bottom"
            on:click={viewStudent}
          >
            <i class="fa fa-user"></i> View Student Details
          </button>
        {/if}

        {#if ticket._linked?.Staff}
          <button
            class="w3-btn w3-green w3-block w3-margin-bottom"
            on:click={viewStaff}
          >
            <i class="fa fa-user-tie"></i> View Staff Details
          </button>
        {/if}

        {#if ticket._linked?.Device}
          <button
            class="w3-btn w3-orange w3-block w3-margin-bottom"
            on:click={viewDevice}
          >
            <i class="fa fa-laptop"></i> View Device Details
          </button>
        {/if}
      </div>

      <!-- History Display -->
      <div class="w3-panel w3-border w3-margin-top">
        <h4>History</h4>
        <div
          class="history-display w3-small"
          style="max-height: 300px; overflow-y: auto;"
        >
          {#if ticket.History}
            {#each ticket.History.split("\n").filter( (line) => line.trim() ) as entry}
              <div
                class="w3-margin-bottom w3-padding w3-border-left w3-border-blue"
              >
                {entry}
              </div>
            {/each}
          {:else}
            <div class="w3-text-gray">No history yet</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .history-display div {
    border-left: 3px solid #2196f3 !important;
  }

  textarea {
    resize: vertical;
    min-height: 60px;
  }

  .w3-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
