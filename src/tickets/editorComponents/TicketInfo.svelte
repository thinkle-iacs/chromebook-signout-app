<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import TicketStudentAssignment from "./TicketStudentAssignment.svelte";
  import TicketAssetAssignment from "./TicketAssetAssignment.svelte";

  export let ticket: Ticket;
  export let onChange: (updates: Partial<Ticket>) => void = () => {};
  export let disabled: boolean = false;
</script>

<div class="w3-section">
  <h4>Ticket Info</h4>
  <div class="w3-small">
    <div><b>Number:</b> #{ticket.Number}</div>
    <div><b>Status:</b> {ticket["Ticket Status"] || "-"}</div>
  </div>

  <div class="w3-row-padding w3-section">
    <div class="w3-col s6">
      <h5>Student</h5>
      <TicketStudentAssignment
        {ticket}
        {disabled}
        onSave={async (studentId) => {
          onChange({ Student: studentId ? [studentId] : [] });
        }}
      />
    </div>
    <div class="w3-col s6">
      <h5>Device</h5>
      <TicketAssetAssignment
        {ticket}
        {disabled}
        onSave={async (deviceId) => {
          onChange({ Device: deviceId ? [deviceId] : [] });
        }}
      />
    </div>
  </div>
</div>
