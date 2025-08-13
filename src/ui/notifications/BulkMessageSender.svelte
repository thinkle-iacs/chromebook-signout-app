<script lang="ts">
  import MessageSelector from "./MessageSelector.svelte";

  import NotificationNotice from "./components/NotificationNotice.svelte";

  import Contacts from "@ui/Contacts.svelte";

  import { getContracts } from "@data/contracts";
  import { getMessages, messagesStore } from "@data/messages";
  import { getContacts, contactStore, getEmails } from "@data/contacts";

  import {
    fetchFullHistory,
    fullHistory,
    SignoutHistoryEntry,
  } from "@data/signoutHistory";
  import { onMount } from "svelte";
  import AssetDisplay from "@ui/AssetDisplay.svelte";
  import { parseMarkdown } from "@ui/util";
  import NotificationSender from "./NotificationSender.svelte";
  import { getNotifications } from "@data/notifications";
  import { buildMessageForExtras, createEmail } from "./messageUtils";
  import SignoutHistoryTable from "@ui/SignoutHistoryTable.svelte";
  import NotificationSummary from "./components/NotificationSummary.svelte";
  import { Asset } from "@data/inventory";
  let fetchedFull;
  let update;

  export let assetTags: string[] | null = null;

  let historyWeCareAbout = [];
  $: {
    if (assetTags && assetTags.length) {
      historyWeCareAbout = $fullHistory.filter((h) =>
        assetTags.includes(h["Asset Tag (from Asset)"][0])
      );
    } else {
      historyWeCareAbout = [...$fullHistory];
    }
  }

  onMount(() => {
    getContacts().then(() => (update += 1));
    getMessages().then(() => (update += 1));
    fetchFullHistory(true);
    fetchNotifications();
  });
  $: console.log("contactStore", $contactStore);
  $: console.log("messageStore", $messagesStore);
  let messages = [];
  $: messages = Object.values($messagesStore);
  let showBody = {};
  let sortedEntries: SignoutHistoryEntry[];
  let perStudent = {};

  $: updateEntries(historyWeCareAbout);
  function updateEntries(makeMeUpdate: any) {
    sortedEntries = historyWeCareAbout;
    perStudent = {};
    sortedEntries.forEach((he) => {
      if (he["Asset Tag (from Asset)"][0].length > 3) {
        if (he.Student && he.Student[0]) {
          let student = he.Student[0];
          if (!perStudent[student]) {
            perStudent[student] = [];
          }
          perStudent[student].push(he);
        }
      }
    });
  }

  const filterByDaily = (a) =>
    a.DailyLoan && a["Asset Tag (from Asset)"][0].length > 3;
  function toggleDaily() {
    if (filters.indexOf(filterByDaily) == -1) {
      filters = filters.filter((f) => f != filterByLong);
      filters = [...filters, filterByDaily];
    } else {
      filters = filters.filter((f) => f != filterByDaily);
    }
  }
  const filterByLong = (a) =>
    !a.DailyLoan && a["Asset Tag (from Asset)"][0].length > 3;

  function toggleLong() {
    if (filters.indexOf(filterByLong) == -1) {
      filters = filters.filter((f) => f != filterByDaily);
      filters = [...filters, filterByLong];
    } else {
      filters = filters.filter((f) => f != filterByLong);
    }
  }

  const filterByIsComputer = (a) => a["Asset Tag (from Asset)"][0].length > 3;

  function toggleAllComputers() {
    if (filters.indexOf(filterByIsComputer) == -1) {
      filters = [...filters, filterByIsComputer];
    } else {
      filters = filters.filter((f) => f != filterByIsComputer);
    }
  }
  const alphaSorter = (a, b) => {
    let anames = a["Email (from Students)"] || a["Email (from Staff)"];
    let bnames = b["Email (from Students)"] || b["Email (from Staff)"];
    let aname = (anames && anames[0].toUpperCase()) || "ZZZZZZZZ";
    let bname = (bnames && bnames[0].toUpperCase()) || "ZZZZZZZZ";
    if (aname && aname.indexOf("Yana") > -1) {
      console.log("Comparing", aname, "and", bname, aname > bname);
    }
    return (aname > bname && 1) || (aname < bname && -1) || 0;
  };
  function alphabetize() {
    sorters = [...sorters, alphaSorter];
  }

  const byYOGSorter = (a, b) => {
    let ay = a.YOG || 2000;
    let by = b.YOG || 2000;
    return (ay > by && -1) || (ay < by && 1) || 0;
  };
  function byYOG() {
    sorters = [...sorters, byYOGSorter];
  }

  const byAssetSorter = (a, b) => {
    let atags = a["Asset Tag (from Asset)"];
    let btags = b["Asset Tag (from Asset)"];
    let atag = atags && atags[0];
    let btag = btags && btags[0];
    return (atag > btag && 1) || (atag < btag && -1) || 0;
  };

  function byAsset() {
    sorters = [...sorters, byAssetSorter];
  }

  const byTimeSorter = (a, b) =>
    (a.Time < b.Time && 1) || (a.Time > b.Time && -1) || 0;
  function byTime() {
    sorters = [...sorters, byTimeSorter];
  }

  let sendEmails: { [key: number]: boolean } = {};
  let emailStudent = true;
  let emailContact = true;

  function updateAllCheckboxes(event) {
    sendEmails = {};
    for (let e of sortedEntries) {
      sendEmails[e.Num] = event.target.checked;
    }
  }

  let selectedMessage;
  let showMessage;

  let emails;

  function prepareSend() {
    emails = [];
    for (let entry of sortedEntries) {
      let student, others;
      if (sendEmails[entry.Num]) {
        student = entry.Student && entry.Student[0];
        if (student) {
          let others = perStudent[student];
        }
        emails.push(
          createEmail(
            selectedMessage,
            entry,
            emailStudent,
            emailContact,
            others
          )
        );
      }
    }
    console.log(emails);
  }

  let notificationsByEntry = {};
  async function fetchNotifications() {
    let existingNotifications = await getNotifications();
    for (let n of existingNotifications) {
      if (!notificationsByEntry[n.fields.SignoutEntry]) {
        notificationsByEntry[n.fields.SignoutEntry] = [n];
      } else {
        notificationsByEntry[n.fields.SignoutEntry].push(n);
      }
    }
  }

  const hideModeFilter = (e) => {
    //debugger;
    return !notificationsByEntry[e.Num];
  };
  function hideAlreadySent() {
    if (filters.indexOf(hideModeFilter) == -1) {
      filters = [hideModeFilter, ...filters];
    }
  }
  function showAlreadySent() {
    filters = filters.filter((f) => f != hideModeFilter);
  }

  const filterByStatus = (e) => {
    if (!statusFilter || e.Status == statusFilter) {
      return true;
    } else {
      return false;
    }
  };

  function selectUpTo(entry) {
    // We make two round trips...
    let lastUncheckedBefore = -1;
    for (let i = 0; i < sortedEntries.length; i++) {
      let e = sortedEntries[i];
      if (sendEmails[e.Num]) {
        // This one is checked...
        lastUncheckedBefore = i;
      }
      if (e == entry) {
        // If we are the entry, then we are ready to roll!
        for (
          let indexToCheck = lastUncheckedBefore;
          indexToCheck <= i;
          indexToCheck++
        ) {
          let entryToCheck = sortedEntries[indexToCheck];
          sendEmails[entryToCheck.Num] = true;
          console.log("checking off", indexToCheck, entryToCheck);
        }
        return;
      }
    }
  }
  let statusFilter: "Out" | "Returned" | "Lost" = null;

  let filters = [filterByStatus];
  let sorters = [];

  function applyFilters(force1, force2, force3, statusFilter) {
    console.log("Re-apply filters!");
    sortedEntries = [...historyWeCareAbout];
    console.log("Begin with", sortedEntries.length);
    for (let f of filters) {
      console.log("Apply filter", f);
      sortedEntries = sortedEntries.filter(f);
      console.log("Now we have", sortedEntries.length);
    }
    for (let sorter of sorters) {
      sortedEntries.sort(sorter);
    }
    sortedEntries = sortedEntries;
  }

  $: applyFilters(historyWeCareAbout, filters, sorters, statusFilter);
</script>

<div class="w3-container">
  <div>
    {#key update}
      <h2>Messages</h2>
      <div class="w3-cell-row">
        <div class="w3-cell">
          <MessageSelector bind:selectedMessage />
        </div>
      </div>
    {/key}
  </div>

  <div class="w3-cell-row w3-align-middle">
    {#if emails && emails.length}
      <div class="modal-wrap">
        <div class="w3-container w3-card modal-content">
          <h3>Ready to Send {emails.length} Emails</h3>
          <button class="w3-button w3-grey" on:click={() => (emails = [])}
            >Close</button
          >
          <NotificationSender notifications={emails} />
        </div>
      </div>
    {:else}
      <div class="w3-cell w3-cell-middle">
        {#if fetchedFull}
          <label for="status-input">Status:</label>
          <select
            id="status-input"
            class="w3-input w3-cell w3-border"
            bind:value={statusFilter}
          >
            <option value={"Out"}>Out</option>
            <option value={"Returned"}>Returned</option>
            <option value={"Lost"}>Lost</option>
            <option value={null}>All</option>
          </select>
        {/if}
      </div>
      <button
        class="w3-btn w3-cell w3-cell-middle w3-border w3-margin"
        on:click={() => {
          fetchFullHistory(false);
          fetchedFull = true;
        }}>Get Full Signout History</button
      >
      <button
        class="w3-btn w3-cell w3-cell-middle w3-border w3-margin"
        on:click={() => fetchNotifications()}
        >Refetch Notification History</button
      >
    {/if}
  </div>
  {#if historyWeCareAbout.length}
    <div class="w3-cell-row">
      <button
        class:w3-black={sorters.at(-1) == byYOGSorter}
        class="w3-button w3-border"
        on:click={byYOG}>↕YOG</button
      >
      <button
        class:w3-black={sorters.at(-1) == alphaSorter}
        class="w3-button w3-border"
        on:click={alphabetize}>↕A-Z</button
      >
      <button
        class="w3-button w3-border"
        class:w3-black={sorters.at(-1) == byAssetSorter}
        on:click={byAsset}>↕#</button
      >
      <button
        class:w3-black={sorters.at(-1) == byTimeSorter}
        class="w3-button w3-border"
        on:click={byTime}>↕🕑</button
      >
      <button
        class:w3-black={filters.indexOf(filterByIsComputer) > -1}
        class="w3-button w3-border"
        on:click={toggleAllComputers}>Only CB</button
      >
      <button
        class="w3-button w3-border"
        on:click={toggleLong}
        class:w3-black={filters.indexOf(filterByLong) > -1}
        >Only Long Term CB</button
      >
      <button
        class="w3-button w3-border"
        on:click={toggleDaily}
        class:w3-black={filters.indexOf(filterByDaily) > -1}
        >Only Daily CB</button
      >
      <button
        class="w3-button w3-border"
        on:click={() => {
          filters = [filterByStatus];
          statusFilter = null;
        }}>All</button
      >
      {#if filters.indexOf(hideModeFilter) > -1}
        <button class="w3-button w3-border" on:click={showAlreadySent}
          >Show Items Already Sent</button
        >
      {:else}
        <button class="w3-button w3-border" on:click={hideAlreadySent}
          >Hide Items Already Sent</button
        >
      {/if}
      {#if selectedMessage}
        <button
          class="w3-button w3-blue"
          style="display:inline-block;margin-left:auto"
          on:click={prepareSend}
        >
          Prepare to Send!
        </button>
      {/if}
    </div>

    <table class="w3-table">
      <tr>
        <th>
          <input type="checkbox" on:change={updateAllCheckboxes} />
        </th>
        <th>Time</th>
        <th>Status</th>
        <th>Asset</th>
        <th>
          <input type="checkbox" bind:checked={emailStudent} />
          Email</th
        >
        <th>LASID</th>
        <th>
          <input type="checkbox" bind:checked={emailContact} />
          Contact</th
        >
        <th>Daily</th>
      </tr>
      {#each sortedEntries as historyEntry (historyEntry.Num)}
        {@const LASID = historyEntry.LASID && historyEntry.LASID[0]}
        {@const student = historyEntry.Student && historyEntry.Student[0]}
        <tr>
          <td>
            <input
              type="checkbox"
              bind:checked={sendEmails[historyEntry.Num]}
              on:dblclick={() => selectUpTo(historyEntry)}
            />
            {#if notificationsByEntry[historyEntry.Num]}
              <NotificationNotice
                notifications={notificationsByEntry[historyEntry.Num]}
              />
            {/if}
          </td>
          <td>{new Date(historyEntry.Time).toLocaleDateString()}</td>
          <td>{historyEntry.Status}</td>
          <td>
            {#if historyEntry["Asset Tag (from Asset)"]}
              <AssetDisplay
                asset={{
                  "Asset Tag": historyEntry["Asset Tag (from Asset)"][0],
                }}
              />
            {/if}
          </td>
          <td
            >{historyEntry["Email (from Students)"] ||
              historyEntry["Email (from Staff)"]}
            {#if historyEntry.YOG}
              ({historyEntry.YOG})
            {/if}
          </td>
          <td>{LASID}</td>
          <td><Contacts contact={$contactStore[LASID]} /></td>
          <td
            >{#if historyEntry.DailyLoan}
              Daily
            {:else}
              Long Term{/if}
          </td>
          <td
            >{(student && perStudent[student] && perStudent[student].length) ||
              "-"}</td
          >
        </tr>
        <!--<tr>
        <td colspan="5">
          {JSON.stringify(historyEntry)}
        </td>
      </tr>-->
      {/each}
    </table>
  {/if}
</div>

<style>
  th,
  td {
    max-width: 10em;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  td:nth-child(3),
  th:nth-child(3) {
    max-width: 5.5em;
  }
  td a,
  th a {
    text-overflow: ellipsis;
  }
  .modal-wrap {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    padding: 16px;
    box-sizing: border-box;
    display: grid;
    place-content: center;
    z-index: 99;
  }

  .modal-wrap > * {
    background-color: white;
    overflow-y: scroll;
    max-height: 80vh;
  }
</style>
