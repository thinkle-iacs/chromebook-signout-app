<script lang="ts">
  import NotificationSummary from "./NotificationSummary.svelte";
  import {
    createNotifications,
    getNotifications,
    updateNotifications,
  } from "./data/notifications";
  import type {
    Notification,
    NotificationResult,
    NotificationUpdates,
  } from "./data/notifications";
  import { messagesStore } from "./data/messages";
  import Message from "./Message.svelte";
  export let notification: Notification;

  function getMessage(mid): Message {
    return Object.values($messagesStore).find((m) => m._id == mid);
  }
  let expanded = false;
</script>

<tr>
  <td>
    <span on:click={() => (expanded = !expanded)}>{notification.Recipient}</span
    >
  </td>
  <td>
    {#if expanded}
      <div class="message w3-card">
        {#each notification.Messages as m}
          {@const message = getMessage(m)}
          <h3>
            {message.Subject}
            <button class="w3-button" on:click={() => (expanded = false)}
              >&times;</button
            >
          </h3>
          <h4>To: {notification.Recipient}</h4>
          <h4>CC: {notification.Recipient2}</h4>
          <div>{@html message.Body}</div>
          <div>{@html notification.ExtraText}</div>
        {/each}
      </div>
    {:else}
      <div>
        {#each notification.Messages as m}
          {@const message = getMessage(m)}
          <button class="w3-button" on:click={() => (expanded = true)}
            >{message.Subject}</button
          >
        {/each}
      </div>
    {/if}
  </td>
</tr>
