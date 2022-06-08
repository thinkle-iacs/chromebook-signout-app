<script lang="ts">
  import { getContracts } from "./contracts";
  import { getMessages, messagesStore } from "./messages";
  import { getContacts, contactStore } from "./contacts";
  import {
    fetchFullHistory,
    fullHistory,
    SignoutHistoryEntry,
  } from "./signoutHistory";
  import { onMount } from "svelte";
  import AssetDisplay from "./AssetDisplay.svelte";
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
  $: {
    sortedEntries = $fullHistory;
    sortedEntries.sort((a, b) => {
      if (a.Name > b.Name) {
        1;
      } else if (a.Name == b.Name) {
        return 0;
      } else {
        return -1;
      }
    });
  }
</script>

<div>
  {#key update}
    <h2>Messages</h2>
    {#each messages as message}
      <li>
        <span on:click={() => (showBody[message.ID] = !showBody[message.ID])}
          >{message.ID} ({message.Subject})</span
        >
        {#if showBody[message.ID]}
          <p>{message.Body}</p>
        {/if}
      </li>
    {/each}
  {/key}
</div>
<button on:click={fetchFullHistory}>Fetch History</button>
{#if $fullHistory}
  <table class="w3-table">
    <tr>
      <th>Status</th>
      <th>Asset</th>
      <th>Email</th>
      <th>LASID</th>
      <th>Contact</th>
    </tr>
    {#each sortedEntries as historyEntry}
      {@const LASID = historyEntry.LASID && historyEntry.LASID[0]}
      <tr>
        <td>{historyEntry.Status}</td>
        <td>{historyEntry["Asset Tag (from Asset)"]}</td>
        <td
          >{historyEntry["Email (from Students)"] ||
            historyEntry["Email (from Staff)"]}</td
        >
        <td>{LASID}</td>
        <td>Contact? {JSON.stringify($contactStore[LASID])}</td>
      </tr>
      <!-- {JSON.stringify(historyEntry)} -->
    {/each}
  </table>
{/if}
