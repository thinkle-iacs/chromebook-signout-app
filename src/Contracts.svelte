<script lang="ts">
  import { onMount } from "svelte";
  import { getContracts, contractStore } from "./contracts";
  import type { Contract } from "./contracts";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";

  let contract: Contract;
  let lastMode;

  onMount(() => {
    changeMode();
  });
  let mode = "Unmapped";

  function changeMode() {
    if (mode != lastMode) {
      if (mode == "Unmapped") {
        getContracts(true);
      } else if (mode == "Mapped") {
        getContracts(false, false, true);
      } else {
        getContracts(false, true);
      }
      lastMode = mode;
    }
  }

  $: changeMode(mode);
  let contractFields = [
    "ID",
    "Signature",
    "Student First",
    "Student Last",
    "Parent First",
    "Parent Last",
    "WiFi",
    "Grade Level",
    "Date",
  ];
</script>

<h2>Map Contracts</h2>

<div>
  <nav class="w3-bar w3-border-bottom">
    <button
      class="w3-bar-item w3-button"
      class:w3-blue={mode == "Unmapped"}
      on:click={() => (mode = "Unmapped")}
    >
      New Contracts
    </button>
    <button
      class="w3-bar-item w3-button"
      class:w3-blue={mode == "Mapped"}
      on:click={() => (mode = "Mapped")}
    >
      Existing Contracts
    </button>
    <!-- <button
      class="w3-bar-item w3-button"
      class:w3-blue={mode == "All"}
      on:click={() => (mode = "All")}
    >
      All Contracts
    </button> -->
  </nav>
  <table>
    {#each Object.keys($contractStore) as contractId}
      {@const contract = $contractStore[contractId]}
      <tr>
        {#each contractFields as field}
          <td>
            <span>{contract[field]}</span>
          </td>
        {/each}
        <td>
          {#if contract.Student && contract.Student.length}
            Mapped: {contract.Student[0]}
            {contract["LASID (from Student)"][0]}
            {contract["Name (from Student)"][0]}
            {contract["Email (from Student)"][0]}
          {:else}
            <input
              value="{contract['Student First']} {contract['Student Last']}"
            />
          {/if}
        </td>
      </tr>
    {/each}
  </table>
</div>

<SimpleForm>
  <FormField />
  <input type="submit" value="Submit" />
</SimpleForm>

<style>
</style>
