<script lang="ts">
  import EditButton from "./EditButton.svelte";
  import StudentTag from "@people/students/StudentTag.svelte";
  import NameDropdown from "@people/components/NameDropdown.svelte";
  import { getStudent, type Student, studentsStore } from "@data/students";
  import { studentName, validateStudent } from "@utils/validators";
  import type { Ticket } from "@data/tickets";

  export let ticket: Ticket;
  export let disabled: boolean = false;
  export let onSave: (
    studentId: string | null,
    student: Student | null
  ) => Promise<void> = async () => {};

  let editing = false;
  let inputElement: HTMLInputElement | null = null;

  // Track existing vs current student
  let existingStudent = ticket._linked?.Student || null;
  let currentStudent = null;

  // When studentName changes, update currentStudent and trigger validation
  $: if ($studentName) {
    currentStudent = getStudent($studentName, $studentsStore);
    // Trigger validation to show dropdown when typing
    if (editing && $studentName.length >= 2) {
      validateStudent($studentName);
    }
  } else {
    currentStudent = null;
  }

  // Check if we have changes to save
  $: hasChanges = currentStudent?._id !== existingStudent?._id;

  function startEditing() {
    editing = true;
    // Set the global store to the existing student's name
    $studentName = existingStudent?.Name || "";
  }

  function cancelEditing() {
    editing = false;
    $studentName = "";
    currentStudent = null;
  }

  async function saveStudentLink() {
    if (!currentStudent) {
      alert("Please select a student");
      return;
    }
    await onSave(currentStudent._id);
    existingStudent = currentStudent;
    editing = false;
    $studentName = "";
    currentStudent = null;
  }

  async function removeStudent() {
    await onSave(null);
    existingStudent = null;
    editing = false;
    $studentName = "";
    currentStudent = null;
  }
</script>

{#if editing}
  <div class="w3-panel w3-border w3-light-blue">
    <div class="input-wrapper">
      <input
        bind:this={inputElement}
        type="text"
        class="w3-input w3-border"
        placeholder="Start typing student name..."
        bind:value={$studentName}
        autocomplete="off"
        {disabled}
      />
      <NameDropdown mode="student" {inputElement} />
    </div>

    {#if currentStudent}
      <div class="w3-margin-top w3-light-gray w3-padding-small">
        <StudentTag student={currentStudent} />
      </div>
    {/if}

    <div class="w3-margin-top action-buttons">
      <button
        class="w3-btn w3-gray w3-small icon-btn"
        on:click={cancelEditing}
        {disabled}
        title="Cancel"
        aria-label="Cancel"
      >
        ✕
      </button>
      <button
        class="w3-btn w3-green w3-small icon-btn save-btn"
        on:click={saveStudentLink}
        disabled={!hasChanges || disabled}
        title="Save"
        aria-label="Save"
      >
        ✓
      </button>
      {#if existingStudent}
        <button
          class="w3-btn w3-red w3-small icon-btn remove-btn"
          title="Remove student"
          on:click={removeStudent}
          {disabled}
        >
          –
        </button>
      {/if}
    </div>
  </div>
{:else if existingStudent}
  <StudentTag student={existingStudent} />
  <EditButton on:click={startEditing} {disabled} />
{:else}
  <span class="w3-text-gray">No student linked</span>
  <button
    class="w3-btn w3-blue w3-small w3-margin-top"
    on:click={startEditing}
    {disabled}
  >
    Link Student
  </button>
{/if}

<style>
  /* anchor for dropdown */
  .input-wrapper {
    position: relative;
  }
  .icon-btn {
    padding: 2px 8px;
    font-weight: 600;
    line-height: 1.2;
  }
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .save-btn {
    margin-left: auto;
  }
</style>
