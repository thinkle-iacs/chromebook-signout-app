<script lang="ts">
  export let errors: string[] | null = null;
  export let name: string | null;
  export let fullWidth: boolean = true;
  import { fade } from "svelte/transition";
</script>

<div class="field" class:fullWidth>
  <slot name="label">
    <label for={name && name.toLowerCase().replace(/\s+/g, "")}>
      {name}
    </label>
  </slot>
  <slot>
    <!-- Input goes here -->
  </slot>
  {#if errors}
    <div transition:fade|local class="error w3-text-deep-orange">
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
  .fullWidth {
    width: 100%;
  }
  .field {
    position: relative;
    margin-bottom: 1em;
    padding-bottom: 1.5em;
  }
  .field .error {
    position: absolute;
    bottom: 2px;
    left: 5px;
    pointer-events: none;
    white-space: nowrap;
  }
  .error span {
    margin-left: 1em;
  }
  .dropdown-container {
    position: relative;
  }
</style>
