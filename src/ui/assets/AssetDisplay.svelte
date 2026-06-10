<script lang="ts">
  import type { Asset } from "@data/inventory";
  import { l } from "@utils/util";
  import EmailDisplay from "@people/components/EmailDisplay.svelte";
  export let asset: Asset | null = null;
  export let showOwner: boolean = false;
  export let openInNewTab: boolean = false;
  $: assetTag = (asset && asset["Asset Tag"]) || "";
  $: purpose = asset?.Purpose || null;
  $: isRetired = purpose === "Disposed" || purpose === "Retired";
</script>

{#if !asset || !assetTag}
  <div class="w3-small w3-text-gray">(Unknown Asset)</div>
{:else}
  <div class="w3-container row" class:retired={isRetired}>
    <div
      class="tag w3-round-xlarge"
      class:w3-indigo={/^[0-9][0-9][0-9][0-9]$/.test(assetTag)}
      class:w3-red={/^A[0-9][0-9][0-9][0-9]/.test(assetTag)}
      class:w3-black={/^[0-9][0-9][0-9]$/.test(assetTag)}
      class:tag-retired={isRetired}
    >
      {#if openInNewTab}
        <a href={`/asset/${assetTag}`} target="_blank" rel="noreferrer"
          >{assetTag}</a
        >
      {:else}
        <a href={`/asset/${assetTag}`} on:click={l(`/asset/${assetTag}`)}
          >{assetTag}</a
        >
      {/if}
    </div>
    <div class="column">
      <div class="model limit w3-small">
        <b>{asset.Make || ""} {asset.Model || ""}</b>
        {#if asset["Year of Purchase"]}
          ({asset["Year of Purchase"]})
        {/if}
        {#if purpose === "MCAS"}
          <span class="purpose-badge purpose-mcas">MCAS</span>
        {:else if purpose === "Daily Loaner"}
          <span class="purpose-badge purpose-daily">DL</span>
        {:else if purpose === "Staff Spare"}
          <span class="purpose-badge purpose-spare">Spare</span>
        {:else if purpose === "Temp"}
          <span class="purpose-badge purpose-temp">Temp</span>
        {:else if purpose === "Disposed"}
          <span class="purpose-badge purpose-retired">Disposed</span>
        {:else if purpose === "Retired"}
          <span class="purpose-badge purpose-retired">Retired</span>
        {/if}
      </div>
      <div class="limit w3-tiny">
        {#if asset["Charger Type"]}
          <span class="charger">{asset["Charger Type"]}</span>
        {/if}
        {#if asset.Serial}
          <div class="w3-monospace">s/n: {asset.Serial}</div>
        {/if}
        {#if asset["MAC-Wireless"]}
          <span class="w3-monospace">mac: {asset["MAC-Wireless"]}</span>
        {/if}
      </div>
      {#if showOwner}
        <div class="w3-small">
          {#if asset["Email (from Student (Current))"]}
            Currently signed out to
            <b class:inactive={asset["Student Status"]?.[0] === "Inactive"}>
              <EmailDisplay email={asset["Email (from Student (Current))"]} />
            </b>
            {#if asset["YOG (from Student (Current))"]}
              ({asset["YOG (from Student (Current))"]})
            {/if}
          {/if}
          {#if asset["Full Name (from User)"]}
            Currently signed out to staff
            <b>{asset["Full Name (from User)"]}</b>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  .charger {
    font-size: x-small;
  }
  .limit {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .limit:hover {
    text-overflow: initial;
    overflow: initial;
  }
  .tag {
    display: inline-block;
    padding: 8px;
    align-self: center;
    align-items: center;
    margin-right: 4px;
  }
  .row {
    padding-bottom: 8px;
    display: flex;
    flex-direction: row;
  }
  .column {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .inactive {
    text-decoration: line-through;
    color: #9e9e9e;
  }
  .purpose-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: bold;
    padding: 1px 4px;
    border-radius: 3px;
    vertical-align: middle;
    margin-left: 4px;
    letter-spacing: 0.03em;
  }
  .purpose-mcas {
    background: #111;
    color: #ff4444;
    border: 1px solid #ff4444;
  }
  .purpose-daily {
    background: #e3f2fd;
    color: #0d47a1;
    border: 1px solid #90caf9;
  }
  .purpose-spare {
    background: #fff3e0;
    color: #bf360c;
    border: 1px solid #ffcc80;
  }
  .purpose-temp {
    background: #f5f5f5;
    color: #616161;
    border: 1px solid #bdbdbd;
  }
  .purpose-retired {
    background: #eeeeee;
    color: #9e9e9e;
    border: 1px solid #bdbdbd;
    text-decoration: line-through;
  }
  .retired {
    opacity: 0.5;
  }
  .tag-retired {
    border: 2px dashed currentColor !important;
    background: transparent !important;
  }
</style>
