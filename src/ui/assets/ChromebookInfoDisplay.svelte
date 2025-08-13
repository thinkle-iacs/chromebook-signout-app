<script lang="ts">
  import AssetDisplay from "./AssetDisplay.svelte";
  import type { ChromebookInfo } from "@data/google";
  import { assetStore, searchForAsset } from "@data/inventory";
  import type { Asset } from "@data/inventory";

  export let info: ChromebookInfo;
  info.activeTimeRanges;

  function formatDuration(ms) {
    const totSeconds = ms / 1000;
    const totMinutes = totSeconds / 60;
    const totHours = totMinutes / 60;
    const hours = Math.floor(totHours);
    const minutes = Math.floor(totMinutes % 60);
    const seconds = Math.floor(totSeconds % 60);
    return `${zeroPad(hours)}:${zeroPad(minutes)}:${zeroPad(seconds)}`;

    function zeroPad(n: number) {
      let s = n.toFixed(0);
      if (s.length == 1) {
        return "0" + s;
      } else {
        return s;
      }
    }
  }
  let showAllUsers = false;
  let asset: Asset;
  if ($assetStore[info.serialNumber.toLowerCase()]) {
    asset = $assetStore[info.serialNumber.toLowerCase()];
    console.log("Already had ", asset, "for", info);
  } else {
    searchForAsset(null, null, info.serialNumber).then((val) => {
      asset = $assetStore[info.serialNumber.toLowerCase()];
    });
  }
  let showChart = false;
</script>

<div class="w3-small w3-card w3-container">
  {#if info.recentUsers && info.activeTimeRanges}
    <h4 class="summary w3-medium">
      Last used by <b>{info.recentUsers[0].email}</b> on
      <b>{info.activeTimeRanges[info.activeTimeRanges.length - 1].date}</b>
    </h4>
    <div class="w3-tiny">According to Google Admin Data</div>
  {/if}
  <div class="w3-row">
    <div class="w3-col l8 m8 s12">
      s/n: {info.serialNumber}
      <br />mac: {info.macAddress}
      <br />Model: {info.model}
      {#if info.manufactureDate}<br />Manufactured: {info.manufactureDate}{/if}
      {#if info.lastKnownNetwork}
        {#each info.lastKnownNetwork as network}
          <br />Last network: {network.ipAddress}
          ({network.wanIpAddress})
        {/each}
      {/if}
    </div>
    <div class="w3-col l4 m4 s12">
      {#if asset}<AssetDisplay {asset} />{/if}
    </div>
  </div>
  <button
    class="w3-button"
    class:w3-blue={showChart}
    on:click={() => (showChart = !showChart)}
  >
    Show Full History
  </button>
  {#if showChart}
    <div class="w3-row">
      <div class="w3-col l6 m6 s12">
        <h5>Last Users:</h5>
        <ul class="w3-ul">
          {#each info.recentUsers as user, idx}
            {#if showAllUsers || idx < 5}
              <li>{user.email}</li>
            {/if}
          {/each}

          {#if info.recentUsers?.length > 5}
            <li>
              <button
                class="w3-button"
                on:click={() => (showAllUsers = !showAllUsers)}
              >
                {#if showAllUsers}
                  Show less
                {:else}
                  Show {info.recentUsers.length - 5} more...
                {/if}
              </button>
            </li>
          {/if}
        </ul>
      </div>
      <div class="w3-col m6 l6 s12">
        <h5>Last used:</h5>
        <ul class="w3-ul reverse">
          {#each info.activeTimeRanges as timeRange}
            <li>{timeRange.date} for {formatDuration(timeRange.activeTime)}</li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
</div>

<style>
  .reverse {
    display: flex;
    flex-direction: column-reverse;
  }
  .reverse li:last-child {
    border-bottom: 1px solid #ddd;
  }
</style>
