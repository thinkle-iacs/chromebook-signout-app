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
      };
      return nr;
    });
  }
  let result: NotificationResult[];
  async function send() {
    result = await createNotifications(toSend);
    console.log("Got result", result);
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
    console.log("Old result was", oldResult);
    console.log("Pushing updates...", updates);
    result = await updateNotifications(updates);
    console.log("done with update!", result);
  }

  async function getAllNotifications() {
    history = await getNotifications();
  }

  let history: NotificationResult[] = [];
</script>

<button on:click={getAllNotifications}> Check History </button>
{#if !result}
  <button on:click={send}>Queue 'Em Up in AirTable!</button>
  <table class="w3-table">
    {#each notifications as n}
      <tr>
        <td>{n.Recipient}</td>
        <td>{n.Recipient2}</td>
        <td>{n.message.ID}</td>
        <td>{n.entry["Asset Tag (from Asset)"]}</td>
        <td>{n.entry.Name}</td>
        <td>{n.entry.YOG}</td>
      </tr>
    {/each}
  </table>

  <div>
    To Send:
    {JSON.stringify(toSend)}
  </div>
{/if}

{#if result}
  <button on:click={sendReal}>Send 'Em For Realzzzz!</button>
  <div>
    {#each result as row}
      <NotificationSummary fields={row.fields} />
    {/each}
  </div>
{/if}

{#if history.length}
  <h2>All Notifications</h2>
  {#each history as row}
    <NotificationSummary fields={row.fields} />
  {/each}
{/if}
