<script lang="ts">
  import EditButton from "./EditButton.svelte";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import { validateAsset } from "@utils/validators";
  import { type Asset, assetStore, searchForAsset } from "@data/inventory";
  import type { Ticket } from "@data/tickets";
  import { get, writable } from "svelte/store";
  import { showToast } from "@ui/components/toastStore";
  import { withLoadingIndicator } from "@utils/util";
  import Loader from "@components/Loader.svelte";

  let myAssetTag = writable("");
  let verifyingAsset = writable(false);

  let doValidateAsset = withLoadingIndicator(validateAsset, verifyingAsset);

  export let ticket: Ticket;
  export let field: "Device" | "Temporary Device" = "Device";
  export let forceEditOn: boolean = false; // New prop to force edit mode

  export let onSave: (
    assetId: string | null,
    asset: Asset
  ) => Promise<void> = async () => {};

  let editing = forceEditOn;
  $: if (forceEditOn) editing = forceEditOn; // Reactive to forceEditOn changes
  let inputElement: HTMLInputElement | null = null;

  // Track existing vs current asset
  let existingAsset = null;
  $: existingAsset =
    field === "Device" ? ticket._linked?.Device || null : getTempLinkedAsset();

  function getTempLinkedAsset() {
    if (!ticket) return;
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
      console.log("Validating", $myAssetTag);
      doValidateAsset($myAssetTag, myAssetTag);
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
        showToast("Asset not found", "error");
        return;
      }
    }
    await onSave(currentAsset._id, currentAsset);
    // Optimistically show the selection until parent persists
    localAsset = currentAsset;
    editing = false;
    $myAssetTag = "";
    currentAsset = null;
  }

  async function removeAsset() {
    await onSave(null, null);
    // Clear local override immediately
    localAsset = null;
    editing = false;
    $myAssetTag = "";
    currentAsset = null;
  }
</script>

{#if ticket}
  {#if editing}
    <div class="w3-card w3-white w3-padding w3-leftbar w3-border">
      <div class="w3-right w3-margin-bottom">
        <button
          class="w3-btn w3-transparent w3-small icon-btn"
          on:click={cancelEditing}
          title="Cancel editing"
          aria-label="Cancel editing"
        >
          ✕
        </button>
      </div>
      <div class="w3-clear"></div>

      <div class="input-wrapper w3-margin-bottom">
        <label for="assetTagInput"><b>Asset Tag:</b></label>
        <input
          id="assetTagInput"
          bind:this={inputElement}
          type="text"
          class="w3-input w3-border"
          placeholder="Enter asset tag..."
          bind:value={$myAssetTag}
          autocomplete="off"
        />
        {#if $verifyingAsset}
          <Loader text="Looking up asset..." working={true} />
        {:else if $myAssetTag.length >= 2 && !currentAsset && displayAsset?.["Asset Tag"] !== $myAssetTag}
          <!-- If we've typed something AND we didn't find an asset AND it's not the same
         as the asset we've already got saved -->
          <p class="w3-small w3-text-red">No asset found</p>
        {/if}
      </div>

      {#if currentAsset}
        <div class="w3-light-gray w3-padding-small w3-round-small">
          <AssetDisplay asset={currentAsset} />
        </div>
      {:else if displayAsset && $myAssetTag === displayAsset?.["Asset Tag"]}
        <div class="w3-light-gray w3-padding-small w3-round-small">
          <AssetDisplay asset={displayAsset} />
        </div>
      {/if}

      <div
        class="w3-margin-top w3-border-top w3-padding-small w3-right-align action-bar"
      >
        {#if displayAsset}
          <button
            class="w3-btn w3-red w3-small w3-round icon-btn remove-btn"
            title="Remove asset"
            on:click={removeAsset}
            disabled={!currentAsset}
          >
            –
          </button>
        {/if}
        <button
          class="w3-btn w3-green w3-small w3-round icon-btn"
          on:click={saveAssetLink}
          disabled={!hasChanges}
          title="Save"
          aria-label="Save"
        >
          ✓
        </button>
      </div>
    </div>
  {:else if displayAsset}
    <div style="display: flex; align-items: start;">
      <AssetDisplay asset={displayAsset} />
      <EditButton on:click={startEditing} />
    </div>
  {:else}
    <button
      class="w3-btn w3-blue w3-small w3-margin-top"
      on:click={startEditing}
    >
      {field === "Device" ? "Link Device" : "Link Temp Device"}
    </button>
  {/if}
{/if}

<style>
  .input-wrapper {
    position: relative;
  }
  .icon-btn {
    padding: 4px 10px;
    font-weight: 600;
    line-height: 1.3;
  }
  .action-bar .w3-btn + .w3-btn {
    margin-left: 6px;
  }
</style>
