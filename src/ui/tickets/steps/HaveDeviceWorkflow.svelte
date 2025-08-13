<script lang="ts">
  import StickyBottomActionBar from "./../components/StickyBottomActionBar.svelte";
  import TicketInfo from "./../editorComponents/TicketInfo.svelte";
  import type { Ticket } from "@data/tickets";
  import type { HistoryEntry } from "../history";
  import TicketDescription from "../editorComponents/TicketDescription.svelte";
  import ShowPendingChanges from "../components/ShowPendingChanges.svelte";
  import { mergeUpdates } from "./draftManager";

  export let ticket: Ticket;
  export let updateTicket: (
    updates: Partial<Ticket>,
    historyEntry: HistoryEntry<Record<string, { from?: unknown; to?: unknown }>>
  ) => Promise<void> | void;

  // Local draft state for this step
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

  async function saveAndMoveToRepair() {
    updateTicket(
      { ...draft, "Ticket Status": "In Repair" } as any,
      { action: "Moved to repair queue with edits", status: "In Repair" } as any
    );
    // reset local draft after save
    draft = {};
  }
</script>

<div
  class="w3-panel w3-pale-green w3-border have-device-content"
  style="padding-bottom:90px;"
>
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <h4 style="margin:0;">Have Device</h4>
    <ShowPendingChanges {draft} onSave={saveAndMoveToRepair} saving={false} />
  </div>

  <TicketInfo ticket={mergedTicket} onChange={handleChange} />

  <TicketDescription ticket={mergedTicket} onChange={handleChange} />
</div>

<StickyBottomActionBar>
  <div class="w3-small" style="flex:1 1 auto;">
    Device is in possession. Ready to enter repair workflow.
  </div>
  <button class="w3-button w3-brown" on:click={saveAndMoveToRepair}>
    Move to In Repair
  </button>
</StickyBottomActionBar>
