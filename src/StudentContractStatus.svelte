<script lang="ts">
  import type { Student } from "./data/students";
  import {
    contractStore,
    getContracts,
    getContractForStudent,
    updateContractsIfNeeded,
    updateContracts,
  } from "./data/contracts";
  import type { Contract } from "./data/contracts";
  import { onMount } from "svelte";
  export let student: Student;
  onMount(() => updateContractsIfNeeded());
  let contract: Contract;

  $: {
    if ($contractStore) {
      contract = getContractForStudent(student);
    }
  }
  let pop = false;
  function showPopup() {
    pop = true;
  }
  function hidePopup() {
    pop = false;
  }
</script>

<div class="container">
  {#if contract}
    <div
      class="icon w3-green w3-padding-16"
      on:mouseenter={showPopup}
      on:mouseleave={hidePopup}
    >
      ✓ Contract
    </div>
    <div
      class="popup w3-white w3-border w3-padding-16"
      class:pop
      on:mouseenter={showPopup}
      on:mouseleave={hidePopup}
    >
      Contract signed on {contract.Date} by {contract.Signature}
    </div>
  {:else}
    <div class="icon w3-red w3-padding-16">
      ✗ No Contract On File!
      <button on:click={updateContracts} class="w3-btn">Re-check DB?</button>
    </div>
  {/if}
</div>

<style>
  .popup {
    position: absolute;
    top: 48px;
    left: 0;
    z-index: 2;
    transition: opacity 300ms;
    pointer-events: none;
    opacity: 0;
  }
  .popup.pop {
    opacity: 1;
    pointer-events: all;
  }
  .container {
    position: relative;
    display: inline-flex;
  }
  div {
    padding-right: 16px;
    padding-left: 16px;
  }
</style>
