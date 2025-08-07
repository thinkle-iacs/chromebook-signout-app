<script lang="ts">
  import AssetDisplay from "../AssetDisplay.svelte";
  import { assetStore, searchForAsset } from "../data/inventory";
  import type { Ticket } from "../data/tickets";
  import { get } from "svelte/store";

  export let ticket: Ticket;
  export let disabled: boolean = false;
  export let onSave: (
    deviceId: string | null
  ) => Promise<void> = async () => {};

  let editing = false;
  let tempAssetTag = "";

  function startEditing() {
    editing = true;
    tempAssetTag = ticket._linked?.Device?.AssetTag || "";
  }

  function cancelEditing() {
    editing = false;
    tempAssetTag = "";
  }

  async function saveDeviceLink() {
    if (!tempAssetTag) {
      alert("Please enter an asset tag");
      return;
    }
    await searchForAsset(tempAssetTag);
    const asset = get(assetStore)[tempAssetTag];
    if (!asset) {
      alert("Asset not found");
      return;
    }
    await onSave(asset._id);
    editing = false;
    tempAssetTag = "";
  }

  async function removeDevice() {
    await onSave(null);
    editing = false;
    tempAssetTag = "";
  }
</script>

{#if editing}
  <div class="w3-panel w3-border w3-light-orange">
    <input
      type="text"
      class="w3-input w3-border"
      placeholder="Enter asset tag..."
      bind:value={tempAssetTag}
      {disabled}
    />
    <div class="w3-margin-top">
      <button
        class="w3-btn w3-green w3-small"
        on:click={saveDeviceLink}
        disabled={!tempAssetTag || disabled}
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
      {#if ticket.Device}
        <button
          class="w3-btn w3-red w3-small w3-margin-left"
          title="Remove device"
          on:click={removeDevice}
          {disabled}
        >
          &times;
        </button>
      {/if}
    </div>
  </div>
{:else if ticket._linked?.Device}
  <AssetDisplay asset={ticket._linked.Device} />
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
