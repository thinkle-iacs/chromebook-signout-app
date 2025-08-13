<script lang="ts">
  import EditButton from "./EditButton.svelte";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import InstantTextArea from "./InstantTextArea.svelte";

  export let ticket: Ticket;
  export let onChange: (
    updates: Partial<Ticket>,
    historyEntry?: HistoryEntry
  ) => void = () => {};

  let currentId: string | undefined;
  let userDescription = "";
  let publicNotes = "";
  let privateNotes = "";

  let editUserDescription = false;
  // Sync local state with ticket; allow external updates (e.g. draft merge) to flow in
  $: if (ticket) {
    if (ticket._id !== currentId) {
      editUserDescription = false; // reset edit mode on ID change
    }
    currentId = ticket._id;
    // Auto-enable edit if no description
    if (
      !ticket["User Description"] ||
      ticket["User Description"].trim() === ""
    ) {
      editUserDescription = true;
    }
  }
</script>

<div class="w3-section w3-row">
  <div class="w3-col s12 m6 l4 w3-padding">
    <div style="display:flex; flex-direction: row; align-items: start;">
      <h4>Issue Description</h4>
      <EditButton
        on:click={() => {
          editUserDescription = !editUserDescription;
        }}
      />
    </div>
    {#if editUserDescription}
      <InstantTextArea
        rows={5}
        placeholder="Describe the issue..."
        value={ticket["User Description"] || ""}
        onChange={(val) => {
          userDescription = val;
          onChange({ "User Description": val });
        }}
      />
    {:else}
      <div class="multiline-user-text">
        {ticket["User Description"] || "(no description)"}
      </div>
    {/if}
  </div>

  <div class="w3-col s12 m6 l4 w3-padding">
    <h5>Public Notes</h5>
    <InstantTextArea
      rows={6}
      placeholder="Enter public notes..."
      value={ticket["Notes"] || ""}
      onChange={(val) => {
        publicNotes = val;
        onChange({ Notes: val });
      }}
    />
  </div>
  <div class="w3-col s12 m6 l4 w3-padding">
    <h5>Private Notes</h5>
    <InstantTextArea
      rows={6}
      placeholder="Enter private notes..."
      value={ticket["PrivateNotes"] || ""}
      onChange={(val) => {
        privateNotes = val;
        onChange({ PrivateNotes: val });
      }}
    />
  </div>
</div>

<style>
  .multiline-user-text {
    white-space: pre-wrap; /* preserve newlines, collapse other whitespace, allow wrapping */
    word-wrap: break-word;
  }
</style>
