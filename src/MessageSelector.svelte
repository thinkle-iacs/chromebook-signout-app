<script lang="ts">
  import { getMessages, messagesStore } from "@data/messages";
  import { onMount } from "svelte";
  import { parseMarkdown } from "./util";

  import { getNotifications } from "@data/notifications";

  let update;
  onMount(() => {
    getMessages().then(() => (update += 1));
  });

  let messages = [];
  $: messages = Object.values($messagesStore);

  export let selectedMessage;
  let showMessage;
</script>

<label>Message</label>
<div style="display:flex;gap:8px;">
  <select class="w3-input w3-cell w3-border" bind:value={selectedMessage}>
    {#each messages as message}
      <option value={message}>
        {message.Subject} ({message.ID})
      </option>
    {/each}
  </select>
  <button
    class="w3-button w3-cell w3-border"
    on:click={() => (showMessage = !showMessage)}
  >
    {#if showMessage}(hide){:else}Read{/if}
  </button>
</div>
{#if selectedMessage && showMessage}
  <div class="w3-card w3-pad w3-container" style="margin:auto">
    <p class="w3-cell w3-cell-middle">
      {@html parseMarkdown(selectedMessage.Body)}
    </p>
  </div>
{/if}

<style>
</style>
