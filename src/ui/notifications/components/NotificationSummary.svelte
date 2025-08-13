<script lang="ts">
  import type { NotificationFields } from "@data/notifications";
  import { parseMarkdown } from "@ui/util";
  export let fields: NotificationFields;

  let mode: "COMPACT" | "NORM" | "EXPANDED" = "COMPACT";
</script>

{#if fields}
  <div class="w3-card">
    <header>
      #{fields.Num}. {fields["Subject (from Messages)"]}
      <button disabled={mode == "COMPACT"} on:click={() => (mode = "COMPACT")}
        >-</button
      >
      <button disabled={mode == "NORM"} on:click={() => (mode = "NORM")}
        >+</button
      >
      <button disabled={mode == "EXPANDED"} on:click={() => (mode = "EXPANDED")}
        >++</button
      >
    </header>
    <div class="w3-container to">
      Recipients: {fields.Recipient}
      {fields.Recipient2 || ""}
      {fields.Recipient3 || ""}
      {fields.Recipient4 || ""}
    </div>
    <div class="w3-container message-status">
      {#if fields.Send && fields.Sent}<br />Sent!
      {:else if fields.Send}Queued to send!
      {:else}
        Not yet queued up
      {/if}
    </div>
    {#if mode != "COMPACT"}
      {#if mode == "EXPANDED"}
        <div>{@html parseMarkdown(fields["Body (from Messages)"])}</div>
      {/if}
      <div>{@html parseMarkdown(fields.StatusInfo)}</div>
      <div>{@html parseMarkdown(fields.MachineInfo)}</div>
    {/if}
    <div contenteditable bind:textContent={fields["ExtraText"]} />
  </div>
{/if}
