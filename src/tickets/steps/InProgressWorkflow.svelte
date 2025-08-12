<script lang="ts">
  import TicketNotification from "./../TicketNotification.svelte";
  import type { Ticket } from "../../data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketInfo from "../editorComponents/TicketInfo.svelte";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";

  import { mergeUpdates } from "./draftManager";
  import StickyBottomActionBar from "../components/StickyBottomActionBar.svelte";
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

<div class="w3-panel w3-pale-yellow w3-border inprogress-content">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <h4 style="margin:0;">In Progress</h4>
    <ShowPendingChanges {draft} onSave={saveDraft} saving={false} />
  </div>
  <div class="w3-small w3-text-gray">
    Ticket #{ticket.Number} · {ticket["Ticket Status"]}
  </div>

  <TicketInfo ticket={mergedTicket} onChange={handleChange} />
  <TicketDescription ticket={mergedTicket} onChange={handleChange} />

  <div class="w3-section w3-padding w3-border w3-round">
    <h5 style="margin-top:0;">Resolution</h5>
    <select
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
    <div class="w3-small w3-text-gray" style="margin-top:4px;">
      Select a resolution before closing.
    </div>
  </div>
</div>
<TicketNotification
  ticket={mergedTicket}
  defaultMessage="TicketUpdate"
  onChange={handleChange}
/>
<StickyBottomActionBar colorClass="w3-amber" className="inprogress-action-bar">
  <div
    class="w3-small"
    style="flex:1 1 auto; display:flex; flex-direction:column; gap:4px;"
  >
    <strong>Finish work</strong>
    <span
      >{mergedTicket.Resolution
        ? `Ready to close with: ${mergedTicket.Resolution}`
        : "Choose resolution to enable Close"}</span
    >
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
