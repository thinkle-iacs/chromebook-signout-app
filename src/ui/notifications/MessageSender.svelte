<script lang="ts">
  import { fly, fade } from "svelte/transition";
  export let signoutItem: SignoutHistoryEntry;

  import { getStudent, Student } from "@data/students";
  import type { Staff } from "@data/staff";
  import { Asset, assetStore } from "@data/inventory";

  import type { CheckoutStatus } from "@data/signout";

  import {
    studentName,
    staffName,
    assetTags,
    chargerTag,
    validateStudent,
    validateStaff,
    validateAssets,
    validateAsset,
  } from "@ui/utils/validators";

  import { contactStore, getContacts, getEmails } from "@data/contacts";
  import { onMount } from "svelte";
  import { createEmail } from "./messageUtils";
  import MessageSelector from "./MessageSelector.svelte";
  import {
    lookupSignoutHistory,
    SignoutHistoryEntry,
  } from "@data/signoutHistory";
  import SignoutHistoryTable from "@history/SignoutHistoryTable.svelte";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import NotificationSender from "./NotificationSender.svelte";
  import NotificationNotice from "./components/NotificationNotice.svelte";
  import { messagesStore } from "@data/messages";

  onMount(async () => {
    console.log("Fetch contacts!");
    await getContacts();
    console.log($contactStore);
  });
  let selectedMessage;
  let contacts = null;
  $: contacts = $contactStore[signoutItem?.LASID];
  let sendToContacts = false;
  let asset;

  $: asset = $assetStore[signoutItem["Asset Tag (from Asset)"][0]];
  let forceTrue = true;
  $: if (!forceTrue) {
    forceTrue = true;
  }

  async function prepareMessage() {
    let others = await lookupSignoutHistory({
      student: signoutItem.Student,
      onlyOut: true,
      isLatest: true,
    });
    notification = createEmail(
      selectedMessage,
      signoutItem,
      true,
      contacts && sendToContacts,
      others
    );
  }

  async function autoselectMessage(force, force2) {
    let messages = Object.values($messagesStore);
    if (signoutItem && messages.length) {
      console.log("Try autoselecting!", $messagesStore, "item=>", signoutItem);
      if (signoutItem.DailyLoan) {
        selectedMessage = $messagesStore["ReturnYourDaily"];
      } else {
        selectedMessage = $messagesStore["NewLoan"];
      }
    } else {
      console.log(
        "Not autoselecting message",
        selectedMessage,
        signoutItem,
        messages
      );
    }
  }
  $: autoselectMessage(signoutItem, $messagesStore);
  let notification;
</script>

<div class="w3-container w3-border w3-padding-32">
  {#if notification}
    <NotificationSender notifications={[notification]} />
    <button class="w3-btn" on:click={() => (notification = null)}>Cancel</button
    >
  {:else}
    <h2>Send Message about:</h2>
    {#if asset}<AssetDisplay {asset} />{/if}
    <MessageSelector bind:selectedMessage />

    <table class="w3-table w3-margin-bottom">
      <tbody>
        {#if contacts}
          <tr>
            <td><input bind:checked={sendToContacts} type="checkbox" /> </td>
            <td>
              Contacts: {JSON.stringify(getEmails(contacts).join(","))}
            </td>
          </tr>
        {/if}
        {#if signoutItem["Email (from Students)"]}
          <tr>
            <td>
              <input bind:checked={forceTrue} type="checkbox" />
            </td>
            <td>
              {signoutItem["Email (from Students)"]}
            </td>
          </tr>
        {/if}
        {#if signoutItem["Email (from Staff)"]}
          <tr>
            <td>
              <input bind:checked={forceTrue} type="checkbox" />
            </td>
            <td>
              {signoutItem["Email (from Staff)"]}
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
    {#if selectedMessage}
      <button class="w3-btn w3-green" on:click={prepareMessage}>
        Queue Up Message
      </button>
    {/if}
  {/if}
</div>

<style>
  h2 {
    font-size: normal;
  }
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  label {
    display: inline-flex;
    align-items: center;
    color: #333;
    transition: all 300ms;
  }
  label input[type="radio"] {
    margin-right: 5px;
  }
  .bold {
    color: black;
    text-shadow: 0px 0px 1px #222;
  }
  input[type="radio"] {
    margin-left: 16px;
  }
  article {
    max-width: 1100px;
    margin: auto;
    margin-top: 1em;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .slot {
    display: contents;
  }
  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .row > :global(*) {
    margin-left: 16px;
  }
  .row > :global(*):first-child {
    margin-left: 0;
  }
  .rowDetail {
    min-height: 72px;
  }

  .noteChoice > label:first-child {
    position: absolute;
    left: 0;
    max-width: 10em;
  }
  .noteChoice {
    margin-left: 10em;
    margin-top: 5px;
  }
  textarea {
    height: 4em;
  }
</style>
