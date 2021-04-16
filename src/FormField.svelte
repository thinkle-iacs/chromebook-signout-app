<script lang="ts">
  export let errors: string[] | null = null;
  export let name: string | null;
  import { fade } from "svelte/transition";
</script>

<div class="field">
  <slot name="label">
    <label for={name && name.toLowerCase().replace(/\s+/g, "")}>
      {name}
    </label>
  </slot>
  <slot>
    <!-- Input goes here -->
  </slot>
  {#if errors}
    <div transition:fade|local class="error w3-text-dark-gray">
      {#each errors as error}
        <span transition:fade|local>{error}</span>
      {/each}
    </div>
  {/if}
  <div class="details">
    <slot name="details" />
  </div>
  <div class="dropdown-container">
    <slot name="dropdown" />
  </div>
</div>

<style>
  .field {
    position: relative;
    margin-top: 1em;
    margin-bottom: 1em;
  }
  .field:nth-child(1) {
    margin-top: 0;
  }

  .field .error {
    position: absolute;
    top: 0;
    right: 5px;
  }
  .dropdown-container {
    position: relative;
  }
</style>
