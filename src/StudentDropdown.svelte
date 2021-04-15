<script lang="ts">
  import { studentDropdown, studentName } from "./validators";
</script>

{#if $studentDropdown.length}
  <ul class="w3-white dropdown w3-ul w3-border">
    {#each $studentDropdown as student}
      <li>
        <button class="w3-button" on:click={() => ($studentName = student)}>
          {student}
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    flex-direction: column;
    display: flex;
  }

  .dropdown {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 2;
  }
</style>
