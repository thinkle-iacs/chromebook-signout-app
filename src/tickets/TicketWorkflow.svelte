<script lang="ts">
  // ---- imports identical style to your TicketEditor ----
  import { user } from "./../data/user.ts";
  import type { Ticket } from "../data/tickets";
  import { updateTicket } from "../data/tickets";

  // Step components you’ll implement (tiny, focused UIs)
  // Fix me...

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
      // Legacy mappings
      case "Untriaged":
        return "New";
      case "Triaged":
        return "Awaiting Drop-Off";
      case "Assigned":
        return "Awaiting Drop-Off";
      case "Waiting on Student":
        return "Awaiting Drop-Off";
      case "In Progress":
        return "In Progress";
      case "Waiting on Tech":
        return "In Repair";
      case "Waiting on Part":
        return "In Repair";
      case "Resolved":
        return "Ready for Pickup";
      default:
        return "New";
    }
  }

  function stepComponent(step: FlowStep) {
    switch (step) {
      case "New":
        return NewTicketWorkflow;
      case "Awaiting Drop-Off":
        return WaitingOnStudentWorkflow; // closest existing placeholder
      case "Have Device":
        return HaveDeviceWorkflow;
      case "In Repair":
        return WaitingOnTechWorkflow; // reuse existing
      case "Ready for Pickup":
        return RepairedWorkflow; // reuse existing
      case "In Progress":
        return HaveDeviceWorkflow; // reuse existing
      case "Closed":
        return ClosedWorkflow;
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

  // Pull dates for timeline from history entries that include a {status:{from,to}}
  function stepDatesFromHistory(
    historyStr: string | undefined
  ): Record<FlowStep, string> {
    const dates: Record<FlowStep, string> = Object.create(null);
    const entries = parseHistoryEntries(historyStr);
    for (const e of entries) {
      if (e?.status?.to) {
        const toStep = statusToStep(e.status.to);
        if (toStep && !dates[toStep]) dates[toStep] = e.timestamp;
      }
    }
    return dates;
  }
  function statusToStep(status: string | undefined): FlowStep | null {
    if (!status) return null;
    switch (status) {
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
      // Legacy mappings
      case "Untriaged":
        return "New";
      case "Triaged":
        return "Awaiting Drop-Off";
      case "Assigned":
        return "Awaiting Drop-Off";
      case "Waiting on Student":
        return "Awaiting Drop-Off";
      case "Waiting on Tech":
        return "In Repair";
      case "Waiting on Part":
        return "In Repair";
      case "Resolved":
        return "Ready for Pickup";
      default:
        return null;
    }
  }

  // ---- atomic commit exposed to steps ----
  type CommitOptions = {
    /** Optional human-readable note for history */
    note?: string;
    /** If you changed status in updates, you can also pass a friendlier status label for the history bubble */
    statusLabel?: string;
    /** Side-effect to run AFTER save (e.g., send email, check-in/out). */
    after?: () => Promise<void> | void;
  };

  let saving = false;

  async function commit(updates: Partial<Ticket>, opts: CommitOptions = {}) {
    if (readOnly) return;

    const now = new Date().toISOString();
    const beforeStatus = ticket["Ticket Status"];
    const afterStatus = (updates["Ticket Status"] ?? beforeStatus) as
      | string
      | undefined;

    const entries = parseHistoryEntries(ticket.History);
    const historyEntry = {
      timestamp: now,
      action: "workflow_commit",
      user: $user?.email ?? "system",
      note: opts.note ?? "",
      // include status change if it happened so the timeline can light up
      ...(beforeStatus !== afterStatus
        ? {
            status: {
              from: beforeStatus ?? null,
              to: afterStatus ?? null,
              label: opts.statusLabel ?? afterStatus,
            },
          }
        : {}),
      // light trace of fields changed (useful for future-you)
      fields: Object.keys(updates),
    };

    const merged = {
      ...updates,
      History: stringifyHistory([...entries, historyEntry]),
    };

    saving = true;
    try {
      const updated = await updateTicket(ticket._id, merged);
      Object.assign(ticket, updated);
      onUpdateTicket(updated, historyEntry);
      if (opts.after) await opts.after();
    } catch (err) {
      console.error("TicketWorkflow commit failed:", err);
      alert("Failed to save ticket changes.");
    } finally {
      saving = false;
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
          style="margin-right:8px;"
        >
          <div
            class="dot"
            class:current={currentStep(ticket["Ticket Status"]) === step}
            class:done={Boolean(stepDatesFromHistory(ticket.History)[step])}
            title={step}
            style="width:10px;height:10px;border-radius:50%;display:inline-block;margin-bottom:4px;border:2px solid #2196F3;"
          />
          <div>{step}</div>
          {#if stepDatesFromHistory(ticket.History)[step]}
            <div class="w3-text-grey">
              {new Date(
                stepDatesFromHistory(ticket.History)[step]
              ).toLocaleDateString()}
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
  {commit}
  {readOnly}
/>

<style>
  .dot.current {
    background: #2196f3;
  }
  .dot.done {
    background: #e3f2fd;
  }
</style>
