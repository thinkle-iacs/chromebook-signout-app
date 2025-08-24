<script lang="ts">
  import NotificationSummary from "./NotificationSummary.svelte";
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
  import { logger } from "@utils/log";

  export let notification: Notification;

  function getMessage(mid): Message {
    return Object.values($messagesStore).find((m) => m._id == mid);
  }
  let expanded = false;
  let recipients = notification.Recipient;
  $: {
    for (let n = 2; n < 6; n++) {
      let prop = "Recipient" + n;
      if (notification[prop]) {
        recipients += ", " + notification[prop];
      }
    }
  }
  $: logger.logVerbose(
    "Got notification row",
    notification,
    notification.message
  );
</script>

<tr class="" on:click={() => (expanded = !expanded)}>
  <td>
    <span>{recipients}</span>
  </td>
  <td>{notification.message.ID}</td>
  <td>{notification.entry["Asset Tag (from Asset)"]}</td>
  <td>{notification.entry.Name}</td>
  <td>{notification.entry.YOG}</td>
  <td
    >{#if notification.ExtraText}<span class="w3-badge w3-orange">+</span
      >{/if}</td
  >
</tr>
{#if expanded}
  <tr>
    <td colspan="4">
      <div class="message w3-card">
        <h3>
          {notification.message.Subject}
          <button class="w3-button" on:click={() => (expanded = false)}
            >&times;</button
          >
        </h3>
        <h4>To: {notification.Recipient}</h4>
        {#if notification.Recipient2}<h4>CC: {notification.Recipient2}</h4>{/if}
        {#if notification.Recipient3}<h4>CC: {notification.Recipient3}</h4>{/if}
        {#if notification.Recipient4}<h4>CC: {notification.Recipient4}</h4>{/if}
        {#if notification.Recipient5}<h4>CC: {notification.Recipient5}</h4>{/if}
        <div>{@html notification.message.Body}</div>
        <div>
          {#if notification.ExtraText}{@html notification.ExtraText}{/if}
        </div>
      </div>
    </td>
  </tr>
{/if}
