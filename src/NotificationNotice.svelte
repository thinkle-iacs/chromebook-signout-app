<script lang="ts">
  import type { NotificationResult } from "./data/notifications";
  export let notifications: NotificationResult[];

  let detailed = false;
</script>

<div>
  <button on:click={() => (detailed = !detailed)}
    >{notifications.length} ✉</button
  >
  {#if detailed}
    {notifications.filter((n) => n.fields.Sent).length} sent
    {notifications.filter((n) => n.fields.Send && !n.fields.Sent).length} queued
    to send
    {notifications.filter((n) => !n.fields.Send).length} not yet finalized
  {/if}
</div>

<style>
</style>
