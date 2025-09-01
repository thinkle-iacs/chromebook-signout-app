<script lang="ts">
  import EmailBlob from "@components/EmailBlob.svelte";
  /* 
  *
  * In our Airtable Automation, we build a ticket blurb as follows:
  * 
  IF(
  {Ticket},
    "Ticket Number: " & {Ticket} &
    "\nTicket Status: " & {Ticket Status (from Ticket)} &
    IF(
      {Status (from Device) (from Ticket)},
        "\nDevice Status: " & {Status (from Device) (from Ticket)},
        ""
    ) &
    "\nUser Description: " & {User Description (from Ticket)} &
    "\nNotes: " & {Notes (from Ticket)} &
    IF(
      {Repair Cost (from Ticket)},
        "\nRepair Cost: $" & {Repair Cost (from Ticket)},
        ""
    ),
  BLANK()
)

  Our goal is to reproduce that here
  */

  import type { Ticket } from "@data/tickets";
  export let ticket: Ticket;
</script>

<!-- prettier-ignore-start -->
<EmailBlob>Ticket Number: {ticket.Number}
Ticket Status: {ticket["Ticket Status"]}
User Description: {ticket["User Description"] || "(none)"}
Notes: {ticket.Notes || "(none)"}
{#if ticket["Repair Cost"]}Repair Cost: ${ticket["Repair Cost"]}{/if}</EmailBlob>
<!-- prettier-ignore-end -->
