<script lang="ts">
  import { createNotifications } from "@data/notifications";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";
  import { mergeUpdates } from "./draftManager";
  import StickyBottomActionBar from "../components/StickyBottomActionBar.svelte";
  export let createNotifications;
  export let signoutAsset;
  export let ticket: Ticket;
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

  function saveDraft() {
    if (!Object.keys(draft).length) return;
    updateTicket(draft, {
      action: "save_draft",
      status: ticket["Ticket Status"] || "New",
    } as any);
    draft = {};
  }
  function moveToAwaiting() {
    const updates = { ...draft, "Ticket Status": "Awaiting Drop-Off" } as any;
    updateTicket(updates, {
      action: "Moved to Awaiting Drop-Off",
      status: "Awaiting Drop-Off",
    } as any);
    draft = {};
  }
  function moveToInProgress() {
    const updates = { ...draft, "Ticket Status": "In Progress" } as any;
    updateTicket(updates, {
      action: "Moved to In Progress",
      status: "In Progress",
    } as any);
    draft = {};
  }
</script>

<div class="w3-panel w3-border new-ticket-content">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <ShowPendingChanges {draft} onSave={saveDraft} saving={false} />
  </div>
  <TicketInfo ticket={mergedTicket} onChange={handleChange} />
  <TicketDescription ticket={mergedTicket} onChange={handleChange} />
</div>

<StickyBottomActionBar className="new-ticket-action-bar">
  <div
    class="w3-small"
    style="flex:1 1 auto; display:flex; flex-direction:column; gap:4px;"
  >
    <strong>Choose next step:</strong>
    <span>Is this a hardware/device issue or just software / setup?</span>
  </div>
  <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
    <button
      class="w3-button w3-white w3-border"
      on:click={moveToInProgress}
      aria-label="Move to In Progress (Machine Not Needed)"
    >
      Software / Setup Problem (Machine Not Needed)
    </button>
    <button
      class="w3-button w3-blue"
      on:click={moveToAwaiting}
      aria-label="Move to Awaiting Drop-Off"
    >
      Need Machine (Awaiting Drop-Off)
    </button>
  </div>
</StickyBottomActionBar>

<style>
  .new-ticket-content {
    padding-bottom: 90px;
  }
  @media (max-width: 640px) {
    .new-ticket-action-bar {
      flex-direction: column;
    }
  }
</style>
