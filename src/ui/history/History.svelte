<script type="ts">
  import { logger } from "@utils/log";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import { onMount } from "svelte";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";
  import type { SignoutHistoryEntry } from "@data/signoutHistory";
  import {
    fetchFullHistory,
    fullHistory,
    fetching,
  } from "@data/signoutHistory";
  import Loader from "@components/Loader.svelte";

  let history: SignoutHistoryEntry[] = [];

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

  function getNotesForSort(historyItem: SignoutHistoryEntry) {
    if (historyItem.Notes) {
      return historyItem.Notes.replace(/^\s*/, "").toUpperCase();
    } else {
      return "ZZZZZZZZZZZZZZZZZZZZZZZZZ";
    }
  }

  function sortByNotes() {
    history.sort(
      (a, b) => (getNotesForSort(a) > getNotesForSort(b) && 1) || -1
    );
    history = history;
  }

  function reverse() {
    history.reverse();
    history = history; // react
  }

  let userData = {};
  let users = [];

  function isCharger(asset: { "Asset Tag (from Asset)": string[] }) {
    if (asset["Asset Tag (from Asset)"] && asset["Asset Tag (from Asset)"][0]) {
      if (asset["Asset Tag (from Asset)"][0].length < 4) {
        // 3-digit assets are chargers
        return true;
      } else {
        return false;
      }
    } else {
      logger.logVerbose("unexpected asset?", asset);
    }
  }
  function getUserData(h) {
    logger.logVerbose("Get user data!", h);
    for (let entry of h) {
      let name = getName(entry);
      if (name) {
        if (!userData[name]) {
          users.push(name);
          userData[name] = {
            currentLoans: [],
            allLoans: [],
            lost: [],
            nonChargerLoans: [],
            currentNonChargerLoans: [],
          };
        }
        let isACharger = isCharger(entry);
        let currentUserData = userData[name];
        currentUserData.allLoans.push(entry);
        if (!isACharger) {
          currentUserData.nonChargerLoans.push(entry);
        }
        if (entry["Is Latest Change"] && entry["Status"] == "Out") {
          currentUserData.currentLoans.push(entry);
          if (!isACharger) {
            currentUserData.currentNonChargerLoans.push(entry);
          }
        }
        if (entry["Status"] == "Lost") {
          currentUserData.lost.push(entry);
        }
      }
    }
    // react
    sortUsers();
    logger.logVerbose("userData", userData);
    history = $fullHistory;
  }

  function sortUsers() {
    users.sort((a, b) => {
      if (excludeChargerMode) {
        return (
          userData[b].currentNonChargerLoans.length -
          userData[a].currentNonChargerLoans.length
        );
      } else {
        return (
          userData[b].currentLoans.length - userData[a].currentLoans.length
        );
      }
    });
    users = users;
    userData = userData;
  }

  $: getUserData($fullHistory);
  let excludeChargerMode = true;
  let excludeStaffMode = true;
  $: sortUsers(excludeChargerMode);

  function getUsers(users, excludeStaffMode) {
    logger.logVerbose("Filtering users...", users);
    let result = users.filter(
      (u: "") => !excludeStaffMode || u.split("@")[0].includes(".")
    );
    logger.logVerbose("Got ", result);
    return result;
  }
  let loanHistoryMode = false;
</script>

{#if history.length}
  <nav class="w3-bar sticky w3-white">
    <a
      class="w3-button w3-border"
      class:w3-blue={loanHistoryMode == false}
      href="#loans"
      on:click={() => (loanHistoryMode = false)}
    >
      User List
    </a>
    <a
      class="w3-button w3-border"
      href="#users"
      class:w3-blue={loanHistoryMode == true}
      on:click={() => (loanHistoryMode = true)}
    >
      Loan History
    </a>
  </nav>
  <div class:invisible={loanHistoryMode} class="container">
    <div class="w3-bar sticky w3-white">
      <h4 id="users">User History, by Number of Loans</h4>
      <input bind:checked={excludeChargerMode} type="checkbox" /> Excude
      chargers
      <input bind:checked={excludeStaffMode} type="checkbox" /> Excude staff
    </div>
    <table class="w3-table w3-striped w3-bordered">
      <tr>
        <th>#</th>
        <th>User</th>
        <th># Current Loans</th>
        <th>Current Loan Info</th>
      </tr>
      {#each getUsers(users, excludeStaffMode) as user, n}
        <tr>
          <td>{n + 1}</td>
          <td>{user}</td>
          <td>
            {#if excludeChargerMode}
              {userData[user].currentNonChargerLoans.length}
            {:else}
              {userData[user].currentLoans.length}
            {/if}
          </td>
          <td>
            {#if excludeChargerMode}
              {#each userData[user].currentNonChargerLoans as loan}
                <div class="row">
                  <AssetDisplay asset={getAsset(loan)} />
                  <span class="w3-text-grey"
                    >{new Date(loan.Time).toLocaleDateString()}</span
                  >
                </div>
              {/each}
            {:else}
              {#each userData[user].currentLoans as loan}
                <div class="row">
                  <AssetDisplay asset={getAsset(loan)} />
                  <span class="w3-text-grey"
                    >{new Date(loan.Time).toLocaleDateString()}</span
                  >
                </div>
              {/each}
            {/if}
          </td>
        </tr>
      {/each}
    </table>
  </div>
  <div class:invisible={!loanHistoryMode} class="container">
    <nav class="w3-bar w3-container sticky" style="padding-top:5px">
      <h3 id="loans">Loan History</h3>
      <button class="w3-button w3-border" on:click={sortByDate}>
        By Date
      </button>
      <button class="w3-button w3-border" on:click={sortByStatus}
        >By Status</button
      >
      <button class="w3-button w3-border" on:click={sortByNotes}
        >By Notes</button
      >
      <button class="w3-button w3-border" on:click={sortAlpha}>
        By Student
      </button>
      <button class="w3-button w3-border" on:click={reverse}> Reverse </button>
    </nav>
    <SignoutHistoryTable signoutHistoryItems={history} />
  </div>
{:else}
  <div class="w3-card w3-center">
    <Loader text="Hold on... this might take a sec" working={true} />
  </div>
{/if}

<style>
  .sticky {
    position: sticky;
    top: 2px;
    background-color: white;
    z-index: 3;
  }
  .invisible {
    display: none;
  }
  .container .sticky {
    z-index: 2;
    padding-top: 40px;
  }
  .w3-bar h4 {
    display: inline-block;
  }
  .row {
    display: flex;
    flex-direction: row;
    justify-content: left;
    align-items: center;
  }
</style>
