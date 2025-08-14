<script lang="ts">
  import EditButton from "./EditButton.svelte";
  import StudentTag from "@people/students/StudentTag.svelte";
  import NameDropdown from "@people/components/NameDropdown.svelte";
  import { getStudent, type Student, studentsStore } from "@data/students";
  import { studentName, validateStudent } from "@utils/validators";
  import type { Ticket } from "@data/tickets";
  import { showToast } from "@ui/components/toastStore";

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
      showToast("Please select a student", "error");
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
  <div class="w3-card w3-white w3-padding w3-leftbar w3-border">
    <div class="w3-right w3-margin-bottom">
      <button
        class="w3-btn w3-transparent w3-small icon-btn"
        on:click={cancelEditing}
        {disabled}
        title="Cancel editing"
        aria-label="Cancel editing"
      >
        ✕
      </button>
    </div>
    <div class="w3-clear"></div>

    <div class="input-wrapper w3-margin-bottom">
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
      <div class="w3-light-gray w3-padding-small w3-round-small">
        <StudentTag student={currentStudent} />
      </div>
    {/if}

    <div
      class="w3-margin-top w3-border-top w3-padding-small w3-right-align action-bar"
    >
      {#if existingStudent}
        <button
          class="w3-btn w3-red w3-small w3-round icon-btn remove-btn"
          title="Remove student"
          on:click={removeStudent}
          {disabled}
        >
          –
        </button>
      {/if}
      <button
        class="w3-btn w3-green w3-small w3-round icon-btn"
        on:click={saveStudentLink}
        disabled={!hasChanges || disabled}
        title="Save"
        aria-label="Save"
      >
        ✓
      </button>
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
    padding: 4px 10px;
    font-weight: 600;
    line-height: 1.3;
  }
  .action-bar .w3-btn + .w3-btn {
    margin-left: 6px;
  }
</style>
