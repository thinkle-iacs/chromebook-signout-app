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
  } from "@utils/validators";

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
  import { logger } from "@utils/log";

  onMount(async () => {
    logger.logVerbose("Fetch contacts!");
    await getContacts();
    logger.logVerbose("contactStore", $contactStore);
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
      logger.logVerbose(
        "Try autoselecting!",
        $messagesStore,
        "item=>",
        signoutItem
      );
      if (signoutItem.DailyLoan) {
        selectedMessage = $messagesStore["ReturnYourDaily"];
      } else {
        selectedMessage = $messagesStore["NewLoan"];
      }
    } else {
      logger.logVerbose(
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

<div class="modal-backdrop">
  <div class="modal-content w3-container w3-white w3-card-4 w3-round-large">
    <div class="modal-header">
      <h2>Send Message</h2>
      <button
        class="close-btn"
        on:click={() => (notification = null)}
        aria-label="Close">×</button
      >
    </div>
    <div class="modal-body">
      {#if notification}
        <NotificationSender notifications={[notification]} />
        <div class="w3-margin-top">
          <button class="w3-btn w3-gray" on:click={() => (notification = null)}
            >Cancel</button
          >
        </div>
      {:else}
        <h3>Send Message about:</h3>
        {#if asset}<AssetDisplay {asset} />{/if}
        <MessageSelector bind:selectedMessage />

        <table class="w3-table w3-striped w3-margin-bottom">
          <tbody>
            {#if contacts}
              <tr>
                <td
                  ><input bind:checked={sendToContacts} type="checkbox" />
                </td>
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
          <button class="w3-btn w3-green w3-block" on:click={prepareMessage}>
            Queue Up Message
          </button>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
    box-sizing: border-box;
  }

  .modal-content {
    max-width: min(1200px, 90vw);
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid #eee;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.2em;
    font-weight: bold;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    transition: color 0.2s;
    padding: 0;
    line-height: 1;
  }

  .close-btn:hover {
    color: #c6093b;
  }

  .modal-body {
    padding: 24px;
  }

  h3 {
    font-size: 1.1em;
    margin-top: 0;
  }
</style>
