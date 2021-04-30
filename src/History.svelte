<script type="ts">
  import AssetDisplay from "./AssetDisplay.svelte";
  import { onMount } from "svelte";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";
  import type { SignoutHistoryEntry } from "./signoutHistory";
  import { fetchFullHistory, fullHistory, fetching } from "./signoutHistory";

  let history: SignoutHistoryEntry = [];

  onMount(async () => {
    if (!$fullHistory.length) {
      fetchFullHistory();
    }
  });
  function sortByDate() {
    history.sort((a, b) => (a.Time > b.Time && -1) || 1);
    history = history; // react
  }
  function getAsset(item: SignoutHistoryEntry) {
    let asset = item["Asset Tag (from Asset)"][0];
    return { "Asset Tag": asset };
  }
  function getName(item: SignoutHistoryEntry) {
    if (item["Email (from Students)"]) {
      return item["Email (from Students)"][0];
    } else if (item["Email (from Staff)"]) {
      return item["Email (from Staff)"][0];
    } else {
      return "";
    }
  }

  function sortAlpha() {
    history.sort((a, b) => (getName(a) > getName(b) && 1) || -1);
    history = history; // react
  }

  function sortByStatus() {
    history.sort((a, b) => (a.Status > b.Status && 1) || -1);
    history = history;
  }
  function reverse() {
    history.reverse();
    history = history; // react
  }

  let userData = {};
  let users = [];

  function getUserData(h) {
    console.log("Get user data!", h);
    for (let entry of h) {
      let name = getName(entry);
      if (name) {
        if (!userData[name]) {
          users.push(name);
          userData[name] = {
            currentLoans: [],
            allLoans: [],
            lost: [],
          };
        }
        let currentUserData = userData[name];
        currentUserData.allLoans.push(entry);
        if (entry["Is Latest Change"] && entry["Status"] == "Out") {
          currentUserData.currentLoans.push(entry);
        }
        if (entry["Status"] == "Lost") {
          currentUserData.lost.push(entry);
        }
      }
    }
    // react
    users.sort(
      (a, b) =>
        userData[b].currentLoans.length - userData[a].currentLoans.length
    );
    userData = userData;
    users = users;
    console.log("userData", userData);
    history = $fullHistory;
  }
  $: getUserData($fullHistory);
</script>

{#if history.length}
  <nav class="w3-bar">
    <a class="w3-button" href="#loans"> Jump to Loan History </a>
    <a class="w3-button" href="#users"> Jump to User List </a>
  </nav>

  <h4 id="users">User History, by Number of Loans</h4>
  <table class="w3-table">
    <tr>
      <th>User</th>
      <th># Current Loans</th>
      <th>Current Loan Info</th>
    </tr>
    {#each users as user}
      <tr>
        <td>{user}</td>
        <td>
          {userData[user].currentLoans.length}
        </td>
        <td>
          {#each userData[user].currentLoans as loan}
            <AssetDisplay asset={getAsset(loan)} />
          {/each}
        </td>
      </tr>
    {/each}
  </table>
  <h3 id="loans">Loan History</h3>
  <nav class="w3-bar w3-container" style="padding-top:5px">
    <button class="w3-button w3-border" on:click={sortByDate}> By Date </button>
    <button class="w3-button w3-border" on:click={sortByStatus}
      >By Status</button
    >
    <button class="w3-button w3-border" on:click={sortAlpha}>
      By Student
    </button>
    <button class="w3-button w3-border" on:click={reverse}> Reverse </button>
  </nav>
  <SignoutHistoryTable signoutHistoryItems={history} />
{:else}
  <div class="big-card w3-card w3-center w3-yellow">
    {#if fetching}
      Hold on... this might take a sec
    {:else if fullHistory.length && !history.length}
      Almost there...
    {:else}
      Huh, maybe there was no data? Or AirTable didn't feel like ponying up all
      that data?
    {/if}
  </div>
{/if}

<style>
  .big-card {
    height: 300px;
    width: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: auto;
    margin-top: 2em;
    font-size: x-large;
  }
</style>
