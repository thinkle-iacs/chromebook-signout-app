<script lang="ts">
  import StudentScheduleModal from "./StudentScheduleModal.svelte";
  export let studentEmail: string = "";
  let open = false;
</script>

<button
  class="schedule-icon"
  title="View student schedule"
  aria-label="View student schedule"
  on:click={() => (open = true)}
>
  📅
</button>

<StudentScheduleModal
  {studentEmail}
  bind:open
  on:close={() => (open = false)}
/>

<style>
  .schedule-icon {
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 2px 4px;
  }
  .schedule-icon:hover {
    filter: brightness(0.9);
  }
</style>
