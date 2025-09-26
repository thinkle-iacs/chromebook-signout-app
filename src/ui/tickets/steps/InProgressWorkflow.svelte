<script lang="ts">
  import TicketNotification from "./../TicketNotification.svelte";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";

  import { mergeUpdates } from "./draftManager";
  import StickyBottomActionBar from "../components/StickyBottomActionBar.svelte";
  export let createNotifications;
  export let ticket: Ticket;
  export let signoutAsset;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  let draft: Partial<Ticket> = {};
  function handleChange(updates: Partial<Ticket>) {
    draft = { ...draft, ...updates };
  }
  let mergedTicket: Ticket;
  $: {
    const { merged, updates } = mergeUpdates(ticket, draft);
    mergedTicket = merged;
    draft = updates;
  }

  const resolutions: Ticket["Resolution"][] = [
    "Fixed",
    "Replaced Device",
    "Unable to Reproduce",
    "Won't Fix",
    "Duplicate",
    "Canceled",
    "No Issue Found",
    "User Education",
  ];

  function saveDraft() {
    if (!Object.keys(draft).length) return;
    updateTicket(draft, {
      action: "save_draft",
      status: ticket["Ticket Status"],
    } as any);
    draft = {};
  }
  function closeTicket() {
    const resolution = (draft as any).Resolution || (ticket as any).Resolution;
    if (!resolution) {
      // simple guard; could add toast later
      return;
    }
    const updates = {
      ...draft,
      Resolution: resolution,
      "Ticket Status": "Closed",
    } as any;
    updateTicket(updates, {
      action: "Task completed",
      status: "Closed",
    } as any);
    draft = {};
  }
</script>

<div class="w3-panelx w3-border inprogress-content w3-padding">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <ShowPendingChanges {draft} onSave={saveDraft} saving={false} />
  </div>

  <TicketInfo ticket={mergedTicket} onChange={handleChange} />
  <TicketDescription ticket={mergedTicket} onChange={handleChange} />
</div>
<TicketNotification
  ticket={mergedTicket}
  defaultMessage="TicketUpdate"
  onChange={handleChange}
  {createNotifications}
/>
<StickyBottomActionBar colorClass="w3-amber" className="inprogress-action-bar">
  <div class="">
    <label for="resolution" class="w3-text-blue" style="margin-top:0;"
      >Resolution</label
    >
    <select
      id="resolution"
      class="w3-select w3-border w3-small"
      on:change={(e) => handleChange({ Resolution: e.target.value })}
    >
      <option value="" disabled selected={!mergedTicket.Resolution}
        >Select resolution...</option
      >
      {#each resolutions as r}
        <option value={r} selected={mergedTicket.Resolution === r}>{r}</option>
      {/each}
    </select>
  </div>
  <button
    class="w3-button w3-brown"
    disabled={!mergedTicket.Resolution}
    on:click={closeTicket}>Close Ticket</button
  >
</StickyBottomActionBar>

<style>
  .inprogress-content {
    padding-bottom: 90px;
  }
</style>
