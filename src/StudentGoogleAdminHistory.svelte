<script lang="ts">
  import ChromebookInfoDisplay from "./ChromebookInfoDisplay.svelte";
  import type { Student } from "./data/students";
  import type { ChromebookInfo } from "./data/google";
  import { getDevicesForUser } from "./data/google";
  export let student: Student;
  let lastLookedUp = null;
  let chromebooks: ChromebookInfo[] | void;

  async function updateChromebooks() {
    console.log("Update chromebooks for", student);
    chromebooks = await getDevicesForUser(student);
  }

  $: if (student?.LASID != lastLookedUp) {
    updateChromebooks().then(() => (lastLookedUp = student.LASID));
  }
</script>

{#if chromebooks}
  <div class="w3-card w3-container">
    <h2>Student was last to use {chromebooks.length} Chromebooks</h2>
    {#each chromebooks as chromebook}
      <ChromebookInfoDisplay info={chromebook} />
    {/each}
  </div>
{:else if student}
  <div class="w3-card w3-container">
    No chromebook sign-in history found (yet) for
    {student.Email}...
  </div>
{:else}
  <div>No student to look up checkout history for :-(</div>
{/if}
