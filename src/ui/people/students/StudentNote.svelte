<script lang="ts">
  import type { Student } from "@data/students";

  export let student: Student;
</script>

{#if student && student.Notes}
  <div class="student-note w3-yellow w3-card-4 w3-padding w3-margin">
    <div class="note-label">Notes for {student.Name}</div>
    <p>{student.Notes}</p>
  </div>
{/if}

<style>
  .note-label {
    font-weight: normal;
    font-size: small;
  }
  .student-note {
    font-weight: bold;
    font-style: italic;
  }
</style>
