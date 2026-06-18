<script lang="ts">
  import { logger } from "@utils/log";
  import AssetDisplay from "./AssetDisplay.svelte";
  import type { ChromebookInfo } from "@data/google";
  import { setDeviceDisabled } from "@data/google";
  import { assetStore, searchForAsset } from "@data/inventory";
  import type { Asset } from "@data/inventory";

  export let info: ChromebookInfo;

  const ADMIN_CONSOLE_URL = "https://admin.google.com/ac/chrome/devices";

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
    logger.logRegular("Already had ", asset, "for", info);
  } else {
    searchForAsset(null, null, info.serialNumber).then((val) => {
      asset = $assetStore[info.serialNumber.toLowerCase()];
    });
  }
  let showChart = false;

  // Disable/enable action state
  let actionInProgress = false;
  let actionError = "";
  let currentStatus = info.status;

  async function toggleDisabled() {
    if (!asset) return;
    actionInProgress = true;
    actionError = "";
    const disabling = currentStatus === "ACTIVE";
    try {
      const result = await setDeviceDisabled(asset, disabling);
      if (result.success) {
        currentStatus = disabling ? "DISABLED" : "ACTIVE";
      } else {
        actionError = result.errorMessage || "Action failed";
      }
    } finally {
      actionInProgress = false;
    }
  }
</script>

<div class="w3-small w3-card w3-container">
  <!-- Device status banner -->
  {#if currentStatus === "DISABLED"}
    <div class="w3-panel w3-red status-banner">
      <strong>⚠ Device is DISABLED</strong> — shows a lock screen; cannot be used
      by students.
    </div>
  {:else if currentStatus === "DEPROVISIONED"}
    <div class="w3-panel w3-deep-purple w3-text-white status-banner">
      <strong>Device is DEPROVISIONED</strong> — removed from management. Cannot
      be re-enrolled without a license.
    </div>
  {/if}

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

  <!-- Disable / re-enable control -->
  {#if asset && currentStatus !== "DEPROVISIONED"}
    <div class="action-row">
      {#if currentStatus === "DISABLED"}
        <button
          class="w3-button w3-green"
          disabled={actionInProgress}
          on:click={toggleDisabled}
        >
          {actionInProgress ? "Re-enabling…" : "Re-enable Device"}
        </button>
      {:else}
        <button
          class="w3-button w3-orange"
          disabled={actionInProgress}
          on:click={toggleDisabled}
        >
          {actionInProgress ? "Disabling…" : "Disable Device"}
        </button>
      {/if}
      {#if actionError}
        <span class="w3-text-red w3-small">
          {actionError} —
          <a href={ADMIN_CONSOLE_URL} target="_blank" rel="noopener"
            >manage in Admin console</a
          >
        </span>
      {/if}
    </div>
  {/if}

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
  .status-banner {
    margin: 8px 0;
    padding: 8px 16px;
    border-radius: 4px;
  }
  .action-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 0;
    flex-wrap: wrap;
  }
</style>
