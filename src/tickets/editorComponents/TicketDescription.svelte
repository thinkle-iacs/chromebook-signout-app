<script lang="ts">
  import EditButton from "./EditButton.svelte";
  import type { Ticket } from "../../data/tickets";
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

  $: if (ticket && ticket._id !== currentId) {
    currentId = ticket._id;
    userDescription = ticket["User Description"] || "";
    publicNotes = ticket.Notes || "";
    privateNotes = ticket.PrivateNotes || "";
  }
  let editUserDescription = false;
</script>

<div class="w3-section">
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
      value={userDescription}
      onChange={(val) => {
        userDescription = val;
        onChange({ "User Description": val });
      }}
    />
  {:else}
    <div>{userDescription}</div>
  {/if}

  <div class="w3-row-padding w3-section">
    <div class="w3-col s6">
      <h5>Public Notes</h5>
      <InstantTextArea
        rows={6}
        placeholder="Enter public notes..."
        value={publicNotes}
        onChange={(val) => {
          publicNotes = val;
          onChange({ Notes: val });
        }}
      />
    </div>
    <div class="w3-col s6">
      <h5>Private Notes</h5>
      <InstantTextArea
        rows={6}
        placeholder="Enter private notes..."
        value={privateNotes}
        onChange={(val) => {
          privateNotes = val;
          onChange({ PrivateNotes: val });
        }}
      />
    </div>
  </div>
</div>
