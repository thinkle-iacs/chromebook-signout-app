<script lang="ts">
  export let mode: "staff" | "student" = "student";
  import {
    studentDropdown,
    studentName,
    staffDropdown,
    staffName,
  } from "./validators";

  function select(name) {
    if (mode == "staff") {
      console.log("Set staff=>", name);
      $staffName = name;
    } else {
      console.log("Set student=>", name);
      $studentName = name;
    }
  }

  let dropdown = [];
  $: if (mode == "student") {
    dropdown = $studentDropdown;
  } else {
    dropdown = $staffDropdown;
  }
</script>

{#if dropdown.length}
  <ul class="w3-white dropdown w3-ul w3-border">
    {#each dropdown as name}
      <li>
        <button class="w3-button" on:click={() => select(name)}>
          {name}
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
