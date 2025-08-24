<script lang="ts">
  import MessageRow from "./components/MessageRow.svelte";

  import NotificationSummary from "./components/NotificationSummary.svelte";
  import {
    createNotifications,
    getNotifications,
    updateNotifications,
  } from "@data/notifications";
  import type {
    Notification,
    NotificationResult,
    NotificationUpdates,
  } from "@data/notifications";
  import { messagesStore } from "@data/messages";
  import Message from "./BulkMessageSender.svelte";
  import { logger } from "@utils/log";
  export let notifications;

  let toSend: Notification[] = [];

  $: {
    toSend = notifications.map((n) => {
      let nr: Notification = {
        "Signout History": [n.entry._id],
        Messages: [n.message._id],
        ExtraText: n.ExtraText || "",
        Recipient: n.Recipient,
        Recipient2: n.Recipient2,
        Recipient3: n.Recipient3,
        Recipient4: n.Recipient4,
        Send: true,
      };
      return nr;
    });
  }
  let result: NotificationResult[];
  async function send() {
    result = await createNotifications(toSend);
    logger.logVerbose("Got result", result);
  }

  async function sendReal() {
    let updates: NotificationUpdates[] = [];
    for (let row of result) {
      updates.push({
        id: row.id,
        fields: {
          Send: true,
        },
      });
    }
    let oldResult = result;
    logger.logVerbose("Old result was", oldResult);
    logger.logVerbose("Pushing updates...", updates);
    result = await updateNotifications(updates);
    logger.logVerbose("done with update!", result);
  }

  async function getAllNotifications() {
    history = await getNotifications();
  }

  let history: NotificationResult[] = [];

  $: updateResults(history);

  function updateResults(history) {
    let changed = false;
    for (let item of history) {
      logger.logVerbose("Got history item", item);
      let correspondingNotification = result.filter(
        (n) => n.Num == item.fields.Num
      );

      logger.logVerbose("Got corresponding item!", correspondingNotification);
      if (correspondingNotification) {
        for (let property in item.fields) {
          // Update???
          if (correspondingNotification[property] != item.fields[property]) {
            logger.logVerbose("Updating", property);
            correspondingNotification[property] = item.fields[property];
            changed = true;
          }
        }
      }
    }
    if (changed) {
      result = result;
    }
  }
</script>

<!-- <button class="w3-button" on:click={getAllNotifications}>Check History</button> -->
{#if !result}
  <div>
    To Send:
    <table class="w3-table w3-striped w3-hoverable">
      <tbody>
        {#each notifications as notification}
          <MessageRow {notification} />
        {/each}
      </tbody>
    </table>
  </div>
  <button class="w3-btn w3-red" on:click={send}
    >Send {notifications.length} messages</button
  >
{/if}

{#if result}
  <div>
    Sent Messages:
    {#each result as row}
      <NotificationSummary fields={row.fields} />
    {/each}
  </div>
{/if}
