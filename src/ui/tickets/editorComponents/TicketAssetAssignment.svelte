<script lang="ts">
  import EditButton from "./EditButton.svelte";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import { validateAsset } from "@utils/validators";
  import { assetStore, searchForAsset } from "@data/inventory";
  import type { Ticket } from "@data/tickets";
  import { get, writable } from "svelte/store";

  let myAssetTag = writable("");

  export let ticket: Ticket;
  export let field: "Device" | "Temporary Device" = "Device";
  export let disabled: boolean = false;
  export let onSave: (assetId: string | null) => Promise<void> = async () => {};

  let editing = false;
  let inputElement: HTMLInputElement | null = null;

  // Track existing vs current asset
  let existingAsset = null;
  $: existingAsset =
    field === "Device" ? ticket._linked?.Device || null : getTempLinkedAsset();

  function getTempLinkedAsset() {
    // Prefer the record id from the link field
    const tmpArr: any = (ticket as any)["Temporary Device"];
    const id: string | undefined = tmpArr && tmpArr[0];

    // 1) If API provided a linked object, use it and attach id
    const linked = (ticket as any)._linked?.["Temporary Device"];
    if (linked) {
      return { _id: id, ...linked };
    }

    // 2) Try assetStore by id (populated via inventory lookups)
    if (id) {
      const storeById = get(assetStore) as any;
      if (storeById && storeById[id]) return storeById[id];
    }

    // 3) Fallback: use the denormalized tag field if present
    const tagFromField = (ticket as any)[
      "Asset Tag (from Temporary Device)"
    ]?.[0];
    if (tagFromField) {
      const storeByTag = get(assetStore) as any;
      const fromStore = storeByTag?.[tagFromField.toUpperCase()];
      if (fromStore) return fromStore;
      // Minimal object so AssetDisplay can render something
      return { _id: id, "Asset Tag": tagFromField } as any;
    }

    return null;
  }

  let currentAsset = null;

  // New: optimistic local selection until parent persists ticket updates
  let localAsset: any = null;
  // Compute what to display: local override > existing
  $: displayAsset = localAsset || existingAsset;
  // Clear override once ticket reflects the same asset
  $: if (localAsset && existingAsset && localAsset._id === existingAsset._id) {
    localAsset = null;
  }

  // When assetTag changes, update currentAsset and trigger validation
  $: if ($myAssetTag) {
    currentAsset = get(assetStore)[$myAssetTag.toUpperCase()];
    // Trigger validation to show any validation messages
    if (editing && $myAssetTag.length >= 2) {
      validateAsset($myAssetTag, myAssetTag);
    }
  } else {
    currentAsset = null;
  }

  // Check if we have changes to save (compare with what we currently display)
  $: hasChanges = currentAsset?._id !== displayAsset?._id;

  function startEditing() {
    editing = true;
    // Set the global store to the currently displayed asset's tag
    $myAssetTag = displayAsset?.["Asset Tag"] || "";
  }

  function cancelEditing() {
    editing = false;
    $myAssetTag = "";
    currentAsset = null;
  }

  async function saveAssetLink() {
    if (!currentAsset) {
      // Try to search for the asset if not found locally
      await searchForAsset($myAssetTag);
      currentAsset = get(assetStore)[$myAssetTag.toUpperCase()];

      if (!currentAsset) {
        alert("Asset not found");
        return;
      }
    }
    await onSave(currentAsset._id);
    // Optimistically show the selection until parent persists
    localAsset = currentAsset;
    editing = false;
    $myAssetTag = "";
    currentAsset = null;
  }

  async function removeAsset() {
    await onSave(null);
    // Clear local override immediately
    localAsset = null;
    editing = false;
    $myAssetTag = "";
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
      bind:value={$myAssetTag}
      autocomplete="off"
      {disabled}
    />

    {#if currentAsset}
      <div class="w3-margin-top w3-light-gray w3-padding-small">
        <AssetDisplay asset={currentAsset} />
      </div>
    {/if}

    <div class="w3-margin-top action-buttons">
      <button
        class="w3-btn w3-gray w3-small icon-btn"
        on:click={cancelEditing}
        {disabled}
        title="Cancel"
        aria-label="Cancel"
      >
        ✕
      </button>
      <button
        class="w3-btn w3-green w3-small icon-btn save-btn"
        on:click={saveAssetLink}
        disabled={!hasChanges || disabled}
        title="Save"
        aria-label="Save"
      >
        ✓
      </button>
      {#if displayAsset}
        <button
          class="w3-btn w3-red w3-small icon-btn remove-btn"
          title="Remove asset"
          on:click={removeAsset}
          {disabled}
        >
          –
        </button>
      {/if}
    </div>
  </div>
{:else if displayAsset}
  <div style="display: flex; align-items: start;">
    <AssetDisplay asset={displayAsset} />
    <EditButton on:click={startEditing} {disabled} />
  </div>
{:else}
  <span class="w3-text-gray"
    >No {field === "Device" ? "device" : "temporary device"} linked</span
  >
  <button
    class="w3-btn w3-blue w3-small w3-margin-top"
    on:click={startEditing}
    {disabled}
  >
    {field === "Device" ? "Link Device" : "Link Temp Device"}
  </button>
{/if}

<style>
  .icon-btn {
    padding: 2px 8px;
    font-weight: 600;
    line-height: 1.2;
  }
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .save-btn {
    margin-left: auto;
  }
</style>
