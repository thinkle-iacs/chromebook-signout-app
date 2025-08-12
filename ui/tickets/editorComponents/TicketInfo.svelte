<script lang="ts">
  import { assetStore } from "@data/inventory";
  import type { Ticket } from "@data/tickets";
  import TicketStudentAssignment from "./TicketStudentAssignment.svelte";
  import TicketAssetAssignment from "./TicketAssetAssignment.svelte";
  import TicketNotificationsSummary from "../components/TicketNotificationsSummary.svelte";
  import TicketInvoicesSummary from "../components/TicketInvoicesSummary.svelte";

  export let ticket: Ticket;
  export let onChange: (updates: Partial<Ticket>) => void = () => {};
  export let disabled: boolean = false;

  let device = getTicketDevice(ticket);

  function getTicketDevice(ticket, assetStoreForForceUpdate) {
    if (!ticket.Device) {
      return null;
    } else {
      let assetTag = ticket._linked?.Device?.["Asset Tag"];
      if (assetTag && assetStore) {
        let storeDevice = $assetStore[assetTag];
        if (storeDevice) {
          return storeDevice;
        }
      }
      return ticket._linked?.Device;
    }
  }

  $: device = getTicketDevice(ticket, $assetStore);

  // Remove hardcoded color map; use W3.CSS color classes instead
  const priorityClass: Record<number, string> = {
    1: "w3-green",
    2: "w3-light-green",
    3: "w3-amber",
    4: "w3-orange",
    5: "w3-red",
  };
  function getPriorityClass(p: number) {
    return priorityClass[p] || "w3-gray";
  }

  // Local (pending) priority state for immediate UI feedback
  let localPriority: number | undefined = ticket.Priority;
  $: if (ticket.Priority !== undefined && localPriority === undefined) {
    localPriority = ticket.Priority; // sync if ticket loads later
  }

  function setPriority(p: number) {
    if (disabled) return;
    localPriority = p; // immediate visual feedback
    onChange({ Priority: p }); // parent will persist later
  }
  $: isPriorityDirty = localPriority !== ticket.Priority;
</script>

<div class="w3-section">
  <div class="w3-row-padding w3-section">
    <div class="w3-col l2 m4 s6">
      <h4>Ticket Info</h4>
      <div class="w3-small">
        <div><b>Number:</b> #{ticket.Number}</div>
        <div><b>Status:</b> {ticket["Ticket Status"] || "-"}</div>
        <div class="priority-row">
          <b>Priority:</b>
          <span class="priority-pills">
            {#each [1, 2, 3, 4, 5] as p}
              <button
                class="priority-pill w3-button w3-round-small w3-border {getPriorityClass(
                  p
                )} {localPriority === p ? 'active' : ''} {isPriorityDirty &&
                localPriority === p
                  ? 'dirty'
                  : ''}"
                on:click={() => setPriority(p)}
                {disabled}
                title={`Priority ${p}`}
                aria-pressed={localPriority === p}>{p}</button
              >
            {/each}
          </span>
          {#if isPriorityDirty}
            <span
              class="dirty-indicator"
              title="Pending change (save in workflow step)">unsaved</span
            >
          {/if}
        </div>
      </div>
    </div>
    <div class="w3-col l3 m4 s6">
      <h5>Student</h5>
      <TicketStudentAssignment
        {ticket}
        {disabled}
        onSave={async (studentId) => {
          onChange({ Student: studentId ? [studentId] : [] });
        }}
      />
    </div>
    <div class="w3-col l3 m4 s6">
      <h5>Device</h5>
      <TicketAssetAssignment
        {ticket}
        {disabled}
        onSave={async (deviceId) => {
          onChange({ Device: deviceId ? [deviceId] : [] });
        }}
      />
      {#if device && device.Status}
        <div class="w3-small w3-text-gray">Status: {device.Status}</div>
      {/if}
    </div>
    <div class="w3-col l3 m4 s6">
      <h5>Temp</h5>
      <TicketAssetAssignment
        {ticket}
        field="Temporary Device"
        {disabled}
        onSave={async (tempId) => {
          onChange({ ["Temporary Device"]: tempId ? [tempId] : [] });
        }}
      />
    </div>
  </div>
</div>

<style>
  .priority-row {
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
  .priority-pills {
    display: inline-flex;
    gap: 4px;
    margin-left: 4px;
  }
  .priority-pill {
    padding: 2px 8px !important;
    min-width: 32px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    transition:
      transform 0.15s ease,
      box-shadow 0.15s ease,
      filter 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    filter: brightness(0.95);
  }
  .priority-pill:not(.active) {
    opacity: 0.55;
  }
  .priority-pill:hover {
    filter: brightness(1.05);
    opacity: 1;
  }
  .priority-pill.active {
    transform: scale(1.12);
    box-shadow:
      0 0 0 2px #fff inset,
      0 0 0 2px rgba(0, 0, 0, 0.15);
    opacity: 1;
    filter: brightness(1.02);
  }
  .priority-pill.dirty.active {
    box-shadow:
      0 0 0 2px #fff inset,
      0 0 0 2px rgba(255, 193, 7, 0.8);
  }
  .priority-pill:focus-visible {
    outline: 2px solid #000;
    outline-offset: 2px;
  }
  .priority-pill:disabled {
    cursor: not-allowed;
    opacity: 0.35;
    filter: grayscale(0.2);
  }
  .dirty-indicator {
    font-size: 10px;
    background: #ffeb3b;
    padding: 1px 4px;
    border-radius: 3px;
    color: #444;
    margin-left: 2px;
  }
  /* Remove pulse animation to reduce visual noise */
  .priority-pill.dirty {
    animation: none;
  }
</style>
