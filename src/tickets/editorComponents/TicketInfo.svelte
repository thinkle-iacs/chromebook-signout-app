<script lang="ts">
  import { assetStore } from "./../../data/inventory.ts";
  import type { Ticket } from "../../data/tickets";
  import TicketStudentAssignment from "./TicketStudentAssignment.svelte";
  import TicketAssetAssignment from "./TicketAssetAssignment.svelte";

  export let ticket: Ticket;
  export let onChange: (updates: Partial<Ticket>) => void = () => {};
  export let disabled: boolean = false;

  function getTicketDevice(ticket, assetStoreForForceUpdate) {
    console.log("Checking ticket for device", ticket);
    if (!ticket.Device) {
      console.log("No device on this ticket");
      return null;
    } else {
      let assetTag = ticket._linked?.Device?.["Asset Tag"];
      if (assetTag && assetStore) {
        let storeDevice = $assetStore[assetTag];
        if (storeDevice) {
          console.log("Returning asset from store: ", storeDevice);
          return storeDevice;
        }
      }
      console.log("Returning device from ticket: ", ticket._linked?.Device);
      return ticket._linked?.Device;
    }
  }

  let device = getTicketDevice(ticket);

  $: device = getTicketDevice(ticket, $assetStore);
  $: console.log("TicketInfo has device: ", device);
</script>

<div class="w3-section">
  <div class="w3-row-padding w3-section">
    <div class="w3-col l2 m4 s6">
      <h4>Ticket Info</h4>
      <div class="w3-small">
        <div><b>Number:</b> #{ticket.Number}</div>
        <div><b>Status:</b> {ticket["Ticket Status"] || "-"}</div>
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
