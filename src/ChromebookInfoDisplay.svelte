<script lang="ts">
  import type { ChromebookInfo } from "./data/google";
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
</script>

<div class="w3-small w3-card w3-container">
  <h2>Google Admin Console Info</h2>
  <div>
    Info from Console for machine with s/n {info.serialNumber}
    <br />Mac address: {info.macAddress}
    <br />Model: {info.model}
    <br />Manufactured: {info.manufatureDate}
  </div>

  <h3>Last Users:</h3>
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
  <h3>Last used:</h3>
  <ul class="w3-ul">
    {#each info.activeTimeRanges as timeRange}
      <li>{timeRange.date} for {formatDuration(timeRange.activeTime)}</li>
    {/each}
  </ul>
</div>
