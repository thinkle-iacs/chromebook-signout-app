<script type="ts">
  import router from "page";
  import type { Asset } from "@data/inventory";
  import AssetDisplay from "./AssetDisplay.svelte";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";
  import type { SignoutHistoryEntry } from "@data/signoutHistory";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import { assetStore, searchForAsset } from "@data/inventory";
  import { lookupSignoutHistory } from "@data/signoutHistory";
  import { assetTag, validateAsset } from "./validators";
  import { ChromebookInfo, getDeviceInfo } from "@data/google";
  import ChromebookInfoDisplay from "./ChromebookInfoDisplay.svelte";
  export let tag;
  $: if (tag) {
    $assetTag = tag;
  }
  let asset: Asset | null;
  $: asset = $assetStore[$assetTag];
  let validators = () => ({
    asset: {
      value: $assetTag,
      validators: [
        (s) => ({
          name: "",
          valid: s && s.length >= 3,
        }),
        validateAsset,
      ],
    },
  });
  let lookupForm;

  function doValidation(...args) {
    if (lookupForm) {
      console.log("validate!");
      lookupForm.validate();
    }
  }

  $: doValidation($assetTag);
  let history = [];
  async function getHistory() {
    console.log("Get history for", asset);
    let results = await lookupSignoutHistory({
      asset,
    });
    if (results.length) {
      results.sort((a, b) => b.Num - a.Num);
      history = results;
    } else {
      history = [];
    }
  }

  let googleChromebookInfo: ChromebookInfo | null;

  async function getGoogleInfo() {
    console.log("Looking up info?", asset.Serial);
    googleChromebookInfo = (await getDeviceInfo(asset)) || null;
    console.log("Got info", googleChromebookInfo);
  }

  $: if (asset) {
    googleChromebookInfo = null;
    getGoogleInfo();
    getHistory();
    router("/asset/" + asset["Asset Tag"]);
  } else {
    googleChromebookInfo = null;
  }
  let mode: "history" | "google" = "history";
</script>

<article class="w3-container w3-padding-24 w3-xlarge">
  <SimpleForm
    {validators}
    onFormCreated={(f) => {
      lookupForm = f;
    }}
  >
    <FormField
      name="Asset Tag"
      errors={$assetTag && $lookupForm?.fields?.asset?.errors}
    >
      <input
        id="assettag"
        bind:value={$assetTag}
        class:valid={$lookupForm?.valid}
      />
    </FormField>
  </SimpleForm>
  {#if asset}
    <AssetDisplay {asset} showOwner={true} />
    <div class="w3-bar w3-row w3-border-bottom w3-medium">
      <button
        class="w3-button w3-bar-item"
        class:w3-blue={mode == "history"}
        on:click={() => (mode = "history")}
      >
        Signout History
      </button>
      <button
        class="w3-button w3-bar-item"
        class:w3-blue={mode == "google"}
        on:click={() => (mode = "google")}
      >
        Google Admin Info
      </button>
    </div>
    {#if mode == "history"}
      {#if history.length}
        <SignoutHistoryTable signoutHistoryItems={history} />
      {:else}
        <div class="center">
          <div class="w3-card-4 w3-center empty">No signout history</div>
        </div>
      {/if}
    {:else if mode == "google"}
      {#if googleChromebookInfo}
        <ChromebookInfoDisplay info={googleChromebookInfo} />
      {:else}
        No google info found (yet)
      {/if}
    {/if}
  {/if}
</article>

<style>
  .empty {
    min-height: 200px;
    min-width: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
  }
  .center {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  article {
    max-width: 1100px;
    margin: auto;
  }
  .valid {
    font-weight: bold;
  }
</style>
