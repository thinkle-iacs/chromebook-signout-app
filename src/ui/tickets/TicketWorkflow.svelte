<script lang="ts">
  // ---- imports identical style to your TicketEditor ----
  import { logger } from "@utils/log";
  import { user } from "@data/user";
  import type { Ticket } from "@data/tickets";
  import {
    updateTicket as saveTicket,
    createTicket as apiCreateTicket,
  } from "@data/tickets";
  import type { HistoryEntry } from "./history";
  // New step components
  import NewTicketWorkflow from "./steps/NewTicketWorkflow.svelte";
  import DropoffWorkflow from "./steps/DropoffWorkflow.svelte";
  import HaveDeviceWorkflow from "./steps/HaveDeviceWorkflow.svelte";
  import RepairWorkflow from "./steps/RepairWorkflow.svelte";
  import PickupWorkflow from "./steps/PickupWorkflow.svelte";
  import InProgressWorkflow from "./steps/InProgressWorkflow.svelte";
  import ClosedWorkflow from "./steps/ClosedWorkflow.svelte";
  import { showToast } from "@ui/components/toastStore";

  // ---- props ----
  export let ticket: Ticket;
  export let readOnly: boolean = false;
  export let onUpdateTicket: (t: Ticket, historyEntry: any) => void = () => {};

  // ---- timeline steps (labels shown in header) ----
  const FLOW_STEPS = [
    "New",
    "Awaiting Drop-Off",
    "Have Device",
    "In Repair",
    "Ready for Pickup",
    "In Progress",
    "Closed",
  ] as const;
  type FlowStep = (typeof FLOW_STEPS)[number];

  // Map your Ticket Status strings to the step & component
  function currentStep(ts: string | undefined): FlowStep {
    switch (ts) {
      // New set
      case "New":
        return "New";
      case "Awaiting Drop-Off":
        return "Awaiting Drop-Off";
      case "Have Device":
        return "Have Device";
      case "In Repair":
        return "In Repair";
      case "Ready for Pickup":
        return "Ready for Pickup";
      case "In Progress":
        return "In Progress";
      case "Closed":
        return "Closed";
      default:
        return "New"; // fallback for undefined / unknown statuses
    }
  }

  /* 
    Our main workflows would look like...

    New -> Awaiting Drop-Off -> Have Device -> In Repair -> Ready for Pickup ->  Closed
    
    Or... sometimes, the new ticket might be created with the device already in hand, so we'd go...
    
    New -> Have Device -> In Repair -> Ready for Pickup -> Closed
    
    Or... sometimes we might not need the device at all, but we might assign some user education or 
    configuration task to someone in which case it might look like...

    New -> In Progress -> Closed
  */

  function stepComponent(step: FlowStep) {
    switch (step) {
      case "New":
        return NewTicketWorkflow;
      case "Awaiting Drop-Off":
        return DropoffWorkflow;
      case "Have Device":
        return HaveDeviceWorkflow;
      case "In Repair":
        return RepairWorkflow;
      case "Ready for Pickup":
        return PickupWorkflow;
      case "In Progress":
        return InProgressWorkflow;
      case "Closed":
        return ClosedWorkflow;
      default:
        return null;
    }
  }

  // ---- history parsing helpers (compatible with your JSON structure) ----
  function parseHistoryEntries(history: string | undefined) {
    try {
      return history ? (JSON.parse(history).entries ?? []) : [];
    } catch {
      return [];
    }
  }
  function stringifyHistory(entries: any[]) {
    return JSON.stringify({ entries });
  }

  // Pull dates for timeline from history entries that include a status
  function stepDatesFromHistory(
    historyStr: string | undefined
  ): Record<FlowStep, string> {
    const dates: Record<FlowStep, string> = Object.create(null);
    const entries = parseHistoryEntries(historyStr);
    for (const e of entries) {
      const dest = typeof e?.status === "string" ? e.status : e?.status?.to;
      if (dest) {
        const toStep = currentStep(dest as any);
        if (toStep && !dates[toStep]) dates[toStep] = e.timestamp;
      }
    }
    return dates;
  }

  // New: include Created timestamp for the "New" step when not present in history
  function stepDates(t: Ticket): Record<FlowStep, string> {
    const dates = stepDatesFromHistory(t.History);
    if (!dates["New"]) {
      const created = (t as any).Created;
      if (created) {
        const ts =
          created instanceof Date
            ? created.toISOString()
            : new Date(created).toISOString();
        dates["New"] = ts;
      }
    }
    return dates;
  }

  // Compute dates (includes Created for New if missing)
  $: timelineDates = stepDates(ticket);

  // Friendly date formatter (handles ISO strings or Date objects)
  const stepDateFormatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  function formatStepDate(val: string | Date | undefined): string {
    if (!val) return "";
    try {
      const d = val instanceof Date ? val : new Date(val);
      if (isNaN(d.getTime())) return "";
      return stepDateFormatter.format(d);
    } catch (e) {
      return "";
    }
  }

  // ---- updateTicket callback exposed to steps ----
  let saving = false;

  async function updateTicket(
    updates: Partial<Ticket>,
    historyEntry?: HistoryEntry<
      Record<string, { from?: unknown; to?: unknown }>
    >
  ) {
    logger.logRegular(
      "TicketWorkflow updateTicket called with:",
      updates,
      historyEntry
    );
    if (readOnly) return;

    const now = new Date().toISOString();
    const beforeStatus = ticket["Ticket Status"];
    const afterStatus = (updates["Ticket Status"] ?? beforeStatus) as
      | string
      | undefined;

    // Build changes map from updates (excluding History)
    const changes: Record<string, { from?: unknown; to?: unknown }> = {};
    Object.keys(updates).forEach((k) => {
      if (k === "History") return;
      // @ts-ignore index access on Ticket
      changes[k] = { from: (ticket as any)[k], to: (updates as any)[k] };
    });

    const composed: HistoryEntry<typeof changes> = {
      timestamp: now,
      action:
        historyEntry?.action ||
        (ticket._id.startsWith("TEMP-") ? "create_ticket" : "workflow_update"),
      status: (afterStatus as Ticket["Ticket Status"]) || beforeStatus,
      changes: { ...changes, ...(historyEntry?.changes as any) },
      note: historyEntry?.note,
      user: (user && (user as any).email) || "system",
      payload: historyEntry?.payload,
    };

    const entries = parseHistoryEntries(ticket.History);
    const mergedHistory = stringifyHistory([...entries, composed]);

    saving = true;
    try {
      let updated: Ticket;
      if (ticket._id.startsWith("TEMP-")) {
        const creationPayload: any = {
          ...ticket,
          ...updates,
          History: mergedHistory,
        };
        delete creationPayload._id;
        delete creationPayload._linked;
        // Remove computed / readonly fields Airtable rejects
        delete creationPayload.Created;
        if (creationPayload.Number === 0) delete creationPayload.Number;
        Object.keys(creationPayload).forEach((k) => {
          if (creationPayload[k] === undefined) delete creationPayload[k];
        });
        try {
          const updated: Ticket = await apiCreateTicket(creationPayload); // API returns ticket object you fool...
          Object.assign(ticket, updated);
          logger.logRegular("Created new ticket, calling onUpdateTicket");
          onUpdateTicket(updated, composed);
          showToast("Ticket created", "success");
        } catch (err) {
          logger.logError("Failed to create ticket:", err);
          showToast("Failed to create ticket", "error");
        }
      } else {
        const merged = { ...updates, History: mergedHistory } as any;
        // Remove non-field props that Airtable rejects
        delete (merged as any)._id;
        delete (merged as any)._linked;
        delete (merged as any).Created; // readonly formula/computed
        const updatedRaw = await saveTicket(ticket._id, merged);
        const updated = updatedRaw as Ticket;
        Object.assign(ticket, updated);
        onUpdateTicket(updated, composed);
        showToast("Ticket updated", "success");
      }
    } catch (err) {
      logger.logError("TicketWorkflow updateTicket failed:", err);
      showToast("Failed to save ticket", "error");
    } finally {
      saving = false;
    }
  }

  function canJumpTo(step: FlowStep) {
    return (
      !readOnly &&
      !saving &&
      step !== currentStep(ticket["Ticket Status"]) &&
      Boolean(step)
    );
  }

  async function jumpTo(step: FlowStep) {
    if (!canJumpTo(step)) return;
    await updateTicket({ "Ticket Status": step as any }, {
      action: "timeline_jump",
      status: step,
      note: `Changed via timeline to ${step}`,
      changes: { "Ticket Status": { from: ticket["Ticket Status"], to: step } },
    } as any);
    showToast(`Status changed to ${step}`, "info");
  }

  // Add keyboard support for accessibility
  function onStepKeyDown(event: KeyboardEvent, step: FlowStep) {
    if (!canJumpTo(step)) return;
    const key = event.key;
    if (key === "Enter" || key === " ") {
      event.preventDefault();
      jumpTo(step);
    }
  }
</script>

<!-- Timeline header -->
<div class="w3-card w3-white w3-padding w3-margin-bottom">
  <div class="w3-row">
    {#each FLOW_STEPS as step}
      {#key step}
        <div
          class="w3-col s12 m3 l1 w3-center w3-small"
          class:clickable={canJumpTo(step)}
          style="margin-right:8px;"
          role="button"
          tabindex={canJumpTo(step) ? 0 : -1}
          on:click={() => jumpTo(step)}
          on:keydown={(e) => onStepKeyDown(e, step)}
        >
          <div
            class="dot"
            class:current={currentStep(ticket["Ticket Status"]) === step}
            class:done={Boolean(timelineDates[step])}
            title={step}
            style="width:10px;height:10px;border-radius:50%;display:inline-block;margin-bottom:4px;border:2px solid #2196F3;"
          />
          <div>{step}</div>
          {#if timelineDates[step]}
            <div class="w3-text-grey" title={timelineDates[step]}>
              {formatStepDate(timelineDates[step])}
            </div>
          {/if}
        </div>
      {/key}
    {/each}
  </div>
</div>

<!-- Step body -->
{#if saving}
  <div class="w3-panel w3-yellow w3-small">
    <i class="fa fa-spinner fa-spin"></i> Saving…
  </div>
{/if}

<svelte:component
  this={stepComponent(currentStep(ticket["Ticket Status"]))}
  {ticket}
  {updateTicket}
/>

<style>
  .dot.done {
    background: #e3f2fd;
  }
  .dot.current {
    background: #2196f3;
  }
  .dot.current ~ div {
    font-weight: bold;
  }
  .clickable {
    cursor: pointer;
  }
</style>
