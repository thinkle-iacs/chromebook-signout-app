<script lang="ts">
  import AssetDisplay from "../AssetDisplay.svelte";
  import { assetStore, searchForAsset } from "../data/inventory";
  import { assetTag, validateAsset } from "../validators";
  import type { Ticket } from "../data/tickets";
  import { get } from "svelte/store";

  export let ticket: Ticket;
  export let disabled: boolean = false;
  export let onSave: (
    deviceId: string | null
  ) => Promise<void> = async () => {};

  let editing = false;
  let inputElement: HTMLInputElement | null = null;

  // Track existing vs current asset
  let existingAsset = ticket._linked?.Device || null;
  let currentAsset = null;

  // When assetTag changes, update currentAsset and trigger validation
  $: if ($assetTag) {
    currentAsset = get(assetStore)[$assetTag.toUpperCase()];
    // Trigger validation to show any validation messages
    if (editing && $assetTag.length >= 2) {
      validateAsset($assetTag);
    }
  } else {
    currentAsset = null;
  }

  // Check if we have changes to save
  $: hasChanges = currentAsset?._id !== existingAsset?._id;

  function startEditing() {
    editing = true;
    // Set the global store to the existing asset's tag
    $assetTag = existingAsset?.AssetTag || "";
  }

  function cancelEditing() {
    editing = false;
    $assetTag = "";
    currentAsset = null;
  }

  async function saveAssetLink() {
    if (!currentAsset) {
      // Try to search for the asset if not found locally
      await searchForAsset($assetTag);
      currentAsset = get(assetStore)[$assetTag.toUpperCase()];

      if (!currentAsset) {
        alert("Asset not found");
        return;
      }
    }
    await onSave(currentAsset._id);
    existingAsset = currentAsset;
    editing = false;
    $assetTag = "";
    currentAsset = null;
  }

  async function removeAsset() {
    await onSave(null);
    existingAsset = null;
    editing = false;
    $assetTag = "";
    currentAsset = null;
  }
</script>

{#if editing}
  <div class="w3-panel w3-border w3-light-orange">
    <input
      bind:this={inputElement}
      type="text"
      class="w3-input w3-border"
      placeholder="Enter asset tag..."
      bind:value={$assetTag}
      autocomplete="off"
      {disabled}
    />

    {#if currentAsset}
      <div class="w3-margin-top w3-light-gray w3-padding-small">
        <AssetDisplay asset={currentAsset} />
      </div>
    {/if}

    <div class="w3-margin-top">
      <button
        class="w3-btn w3-green w3-small"
        on:click={saveAssetLink}
        disabled={!hasChanges || disabled}
      >
        Save
      </button>
      <button
        class="w3-btn w3-gray w3-small w3-margin-left"
        on:click={cancelEditing}
        {disabled}
      >
        Cancel
      </button>
      {#if existingAsset}
        <button
          class="w3-btn w3-red w3-small w3-margin-left"
          title="Remove asset"
          on:click={removeAsset}
          {disabled}
        >
          Remove
        </button>
      {/if}
    </div>
  </div>
{:else if existingAsset}
  <AssetDisplay asset={existingAsset} />
  <button
    class="w3-btn w3-gray w3-small w3-margin-top"
    on:click={startEditing}
    {disabled}
  >
    Edit
  </button>
{:else}
  <span class="w3-text-gray">No device linked</span>
  <button
    class="w3-btn w3-blue w3-small w3-margin-top"
    on:click={startEditing}
    {disabled}
  >
    Link Device
  </button>
{/if}
