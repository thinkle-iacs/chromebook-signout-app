<script type="ts">
  import router from "page";
  import type { Asset } from "@data/inventory";
  import AssetDisplay from "./AssetDisplay.svelte";
  import SignoutHistoryTable from "@history/SignoutHistoryTable.svelte";
  import type { SignoutHistoryEntry } from "@data/signoutHistory";
  import FormField from "@components/FormField.svelte";
  import SimpleForm from "@components/SimpleForm.svelte";
  import { assetStore, searchForAsset } from "@data/inventory";
  import { lookupSignoutHistory } from "@data/signoutHistory";
  import { assetTag, validateAsset } from "@utils/validators";
  import { ChromebookInfo, getDeviceInfo } from "@data/google";
  import ChromebookInfoDisplay from "./ChromebookInfoDisplay.svelte";
  import { getTickets, type Ticket } from "@data/tickets";
  import TicketTable from "@tickets/TicketTable.svelte";
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
      lookupForm.validate();
    }
  }

  $: doValidation($assetTag);
  let history: SignoutHistoryEntry[] = [];
  async function getHistory() {
    if (!asset) {
      history = [];
      return;
    }
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
    if (!asset) {
      googleChromebookInfo = null;
      return;
    }
    googleChromebookInfo = (await getDeviceInfo(asset)) || null;
  }

  // Tickets lazy state (student-style pattern with initiation + dedupe)
  let tickets: Ticket[] = [];
  let ticketsLoaded = false; // indicates first successful load
  let ticketsLoading = false;
  let ticketsInitiated = false; // prevents duplicate initial fetch when toggling tabs
  let lastAssetTag: string | null = null;
  let ticketError = "";

  function dedupe(list: Ticket[]) {
    const seen = new Set();
    return list.filter((t) => {
      if (!t || !(t as any)._id) return false;
      if (seen.has((t as any)._id)) return false;
      seen.add((t as any)._id);
      return true;
    });
  }

  async function loadTickets() {
    if (!asset || ticketsLoading) return; // guard ongoing
    // If we've already loaded for this asset tag, skip (lazy)
    if (ticketsInitiated && lastAssetTag === asset["Asset Tag"]) return;
    ticketsLoading = true;
    ticketError = "";
    try {
      const fetched = await getTickets({ asset: asset["Asset Tag"] });
      tickets = dedupe(fetched as any);
      ticketsLoaded = true;
      ticketsInitiated = true;
      lastAssetTag = asset["Asset Tag"];
    } catch (e: any) {
      ticketError = e.message || "Failed loading tickets";
      tickets = [];
    } finally {
      ticketsLoading = false;
    }
  }

  // Reset per-asset state when asset changes
  $: if (asset) {
    googleChromebookInfo = null;
    getGoogleInfo();
    getHistory();
    router("/asset/" + asset["Asset Tag"]);
    tickets = [];
    ticketsLoaded = false;
    ticketsInitiated = false;
    lastAssetTag = null;
    ticketError = "";
  }
  let mode: "history" | "google" | "tickets" = "history";
  // Lazy load only on first activation of tickets tab for the current asset
  $: if (mode === "tickets") {
    loadTickets();
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
      <button
        class="w3-button w3-bar-item"
        class:w3-blue={mode == "tickets"}
        on:click={() => (mode = "tickets")}
      >
        Tickets
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
    {:else if mode == "tickets"}
      {#if ticketsLoading}
        <p class="w3-small w3-text-blue">Loading tickets...</p>
      {:else if ticketError}
        <p class="w3-small w3-text-red">{ticketError}</p>
      {:else if !ticketsLoaded}
        <p class="w3-small w3-opacity">No tickets loaded.</p>
      {:else if tickets.length === 0}
        <p class="w3-small w3-opacity">No tickets for this asset.</p>
      {:else}
        <TicketTable
          ticketIDs={tickets.map((t) => t._id)}
          showStudentColumn={true}
          showAssetColumn={true}
          showTempColumn={true}
          compact={true}
        />
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
