<script type="ts">
  import router from "page";
  import type { Asset } from "./inventory";
  import AssetDisplay from "./AssetDisplay.svelte";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";
  import type { SignoutHistoryEntry } from "./signoutHistory";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import { assetStore, searchForAsset } from "./inventory";
  import { lookupSignoutHistory } from "./signoutHistory";
  import { assetTag, validateAsset } from "./validators";
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
          valid: s && s.length > 3,
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

  $: if (asset) {
    getHistory();
    router("/asset/" + asset["Asset Tag"]);
  }
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
      errors={$assetTag && $lookupForm?.fields?.assetTag?.errors}
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
    {#if history.length}
      <SignoutHistoryTable signoutHistoryItems={history} />
    {:else}
      <div class="center">
        <div class="w3-card-4 w3-center empty">No signout history</div>
      </div>
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
