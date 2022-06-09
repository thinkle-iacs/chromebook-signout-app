<script lang="ts">
  import NotificationNotice from "./NotificationNotice.svelte";

  import Contacts from "./Contacts.svelte";

  import { getContracts } from "./data/contracts";
  import { getMessages, messagesStore } from "./data/messages";
  import { getContacts, contactStore, getEmails } from "./data/contacts";

  import {
    fetchFullHistory,
    fullHistory,
    SignoutHistoryEntry,
  } from "./data/signoutHistory";
  import { onMount } from "svelte";
  import AssetDisplay from "./AssetDisplay.svelte";
  import { parseMarkdown } from "./util";
  import NotificationSender from "./NotificationSender.svelte";
  import { getNotifications } from "./data/notifications";
  let update;
  onMount(() => {
    getContacts().then(() => (update += 1));
    getMessages().then(() => (update += 1));
  });
  $: console.log("contactStore", $contactStore);
  $: console.log("messageStore", $messagesStore);
  let messages = [];
  $: messages = Object.values($messagesStore);
  let showBody = {};
  let sortedEntries: SignoutHistoryEntry[];
  let perStudent = {};

  $: updateEntries($fullHistory);
  function updateEntries() {
    sortedEntries = $fullHistory;
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

  function onlyDaily() {
    sortedEntries = $fullHistory.filter(
      (a) => a.DailyLoan && a["Asset Tag (from Asset)"][0].length > 3
    );
    console.log("Filtering to ", sortedEntries.length, "daily");
    alphabetize();
  }

  function onlyLong() {
    sortedEntries = $fullHistory.filter(
      (a) => !a.DailyLoan && a["Asset Tag (from Asset)"][0].length > 3
    );
    console.log("Filtering to ", sortedEntries.length, "long term");
    alphabetize();
  }

  function showAllComputers() {
    sortedEntries = $fullHistory.filter(
      (a) => a["Asset Tag (from Asset)"][0].length > 3
    );
    console.log("Showing all", sortedEntries.length);
    alphabetize();
  }

  function alphabetize() {
    sortedEntries.sort((a, b) => {
      let anames = a["Email (from Students)"] || a["Email (from Staff)"];
      let bnames = b["Email (from Students)"] || b["Email (from Staff)"];
      let aname = (anames && anames[0].toUpperCase()) || "ZZZZZZZZ";
      let bname = (bnames && bnames[0].toUpperCase()) || "ZZZZZZZZ";
      if (aname && aname.indexOf("Yana") > -1) {
        console.log("Comparing", aname, "and", bname, aname > bname);
      }
      return (aname > bname && 1) || (aname < bname && -1) || 0;
    });
    sortedEntries = sortedEntries;
  }

  function byYOG() {
    sortedEntries.sort((a, b) => {
      let ay = a.YOG || 2000;
      let by = b.YOG || 2000;
      return (ay > by && -1) || (ay < by && 1) || 0;
    });
    sortedEntries = sortedEntries;
  }

  function byAsset() {
    sortedEntries.sort((a, b) => {
      let atags = a["Asset Tag (from Asset)"];
      let btags = b["Asset Tag (from Asset)"];
      let atag = atags && atags[0];
      let btag = btags && btags[0];
      return (atag > btag && 1) || (atag < btag && -1) || 0;
    });
    sortedEntries = sortedEntries;
  }
  function byTime() {
    sortedEntries.sort(
      (a, b) => (a.Time < b.Time && 1) || (a.Time > b.Time && -1) || 0
    );
    sortedEntries = sortedEntries;
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

  function buildMessageForExtras(extras: SignoutHistoryEntry[]) {
    debugger;
    let message = `\nStudent also has ${extras.length} additional computer out: `;
    for (let e of extras) {
      message += `\n\tAsset Tag ${e["Asset Tag (from Asset)"]} (signed ${e.Status} @ ${e.Time})`;
    }
    return message;
  }

  function prepareSend() {
    emails = [];
    for (let entry of sortedEntries) {
      if (sendEmails[entry.Num]) {
        let LASID = entry.LASID && entry.LASID[0];
        let notification = {};
        notification.message = selectedMessage;
        emails.push(notification);
        notification.entry = entry;
        let student =
          notification.entry.Student && notification.entry.Student[0];
        if (student) {
          let others = perStudent[student];
          if (others.length > 1) {
            debugger;
            let extras = others.filter((e) => e != entry);
            if (extras) {
              notification.ExtraText = buildMessageForExtras(extras);
            }
          }
        }
        if (emailStudent) {
          let email =
            entry["Email (from Students)"] || entry["Email (from Staff)"];
          if (email) {
            notification.Recipient = email.join(",");
          }
        }
        if (emailContact && LASID && $contactStore[LASID]) {
          notification.Recipient2 = getEmails($contactStore[LASID]).join(",");
        }
        notification.studentIdentifier = entry.Student && entry.Student[0];
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
</script>

<div>
  {#key update}
    <h2>Messages</h2>
    <select bind:value={selectedMessage}>
      {#each messages as message}
        <option value={message}>
          {message.Subject} ({message.ID})
        </option>
      {/each}
    </select>
    <button on:click={() => (showMessage = !showMessage)}>
      {#if showMessage}(hide){:else}?{/if}
    </button>
    {#if selectedMessage && showMessage}
      <p>{@html parseMarkdown(selectedMessage.Body)}</p>
    {/if}
  {/key}
</div>
{#if emails && emails.length}
  Ready To Send Emails! {emails.length}
  <button on:click={() => (emails = [])}>Cancel</button>
  <NotificationSender notifications={emails} />
{:else}
  <button on:click={() => fetchFullHistory(true)}>Fetch Signout History</button>
  <button on:click={() => fetchNotifications(true)}
    >Fetch Notification History</button
  >
  {#if $fullHistory.length}
    <button on:click={byYOG}>byYOG</button>
    <button on:click={alphabetize}>A-Z</button>
    <button on:click={byAsset}>#</button>
    <button on:click={byTime}>🕑</button>
    <button on:click={showAllComputers}>Only CB</button>
    <button on:click={onlyLong}>Only Long Term CB</button>
    <button on:click={onlyDaily}>Only Daily CB</button>
    <button on:click={() => (sortedEntries = $fullHistory)}>All</button>
    <button
      style="display:inline-block;margin-left:auto"
      on:click={prepareSend}
    >
      Prepare to Send!
    </button>
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
{/if}

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
</style>
