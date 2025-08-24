<script lang="ts">
  import type { Asset } from "@data/inventory";
  import type { Student } from "@data/students";
  export let asset: Asset | null = null;
  export let student: Student | null = null;

  let studentTicketNumbers = [];
  let deviceTicketNumbers = [];
  let tempTicketNumbers = [];
  $: if (asset) {
    deviceTicketNumbers = asset["Ticket Numbers"] || [];
    tempTicketNumbers = asset["Temp Ticket Numbers"] || [];
  } else {
    deviceTicketNumbers = [];
    tempTicketNumbers = [];
  }

  $: if (student) {
    studentTicketNumbers = student["Ticket Numbers"] || [];
  } else {
    studentTicketNumbers = [];
  }

  type TicketLink = {
    number: number;
    comment: string;
  };

  let ticketLinks: TicketLink[] = [];

  // Build ticketLinks array based on the rules
  $: updateLinks(asset, student);

  function updateLinks(asset: Asset | null, student: Student | null) {
    ticketLinks = [];
    // Collect all unique ticket numbers
    const allNumbers = new Set<number>([
      ...deviceTicketNumbers,
      ...tempTicketNumbers,
      ...studentTicketNumbers,
    ]);

    for (const number of allNumbers) {
      let comment = "";

      const isDevice = deviceTicketNumbers.includes(number);
      const isTemp = tempTicketNumbers.includes(number);
      const isStudent = studentTicketNumbers.includes(number);

      if (isStudent && (isDevice || isTemp)) {
        if (isTemp) {
          comment = "Manage Ticket for This Temp Device for this Student";
        } else {
          comment = "Manage Ticket for This Device for this Student";
        }
      } else if (isTemp && !isStudent) {
        comment = "Manage Ticket for this Temp Device";
      } else if (isDevice && !isStudent) {
        comment = "Manage Ticket for this Device";
      } else if (isStudent && !isDevice && !isTemp) {
        comment = "Manage Ticket for this Student";
      }

      ticketLinks = [...ticketLinks, { number, comment }];
    }
  }
  import { logger } from "@utils/log";
  $: logger.logVerbose(
    "Ticket links for asset:",
    asset,
    "student",
    student,
    ticketLinks
  );
</script>

{#each ticketLinks as link}
  <a
    class="ticket-link w3-red w3-button w3-round"
    href={`/ticket/number/${link.number}`}
    aria-label={`Go to ticket ${link.number}`}
    style="text-decoration: none; cursor: pointer; width: auto; display: inline-block;"
    role="button"
  >
    <span class="ticket-comment">{link.comment}</span> #{link.number}
  </a>
{/each}
