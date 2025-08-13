<script lang="ts">
  import { onMount } from "svelte";
  import type { Student } from "@data/students";
  import { getTickets, type Ticket } from "@data/tickets";
  import TicketTable from "@tickets/TicketTable.svelte";

  export let student: Student;
  export let active: boolean = false; // parent controls visibility

  let loading = false;
  let error: string = "";
  let tickets: Ticket[] = [];
  let initiated = false; // ensure we only fetch once per student unless email changes
  let lastEmail: string | null = null;

  function dedupe(list: Ticket[]) {
    const seen = new Set();
    return list.filter((t) => {
      if (!t || !(t as any)._id) return false;
      if (seen.has((t as any)._id)) return false;
      seen.add((t as any)._id);
      return true;
    });
  }

  async function loadTickets() {
    if (!student?.Email) {
      tickets = [];
      return;
    }
    try {
      loading = true;
      error = "";
      const fetched = await getTickets({ user: student.Email });
      tickets = dedupe(fetched as any);
      lastEmail = student.Email;
    } catch (e: any) {
      error = e.message || "Failed loading tickets";
      tickets = [];
    } finally {
      loading = false;
    }
  }

  // Initial mount: do not load until active for first time
  onMount(() => {
    if (active && !initiated) {
      initiated = true;
      loadTickets();
    }
  });

  // Reactively load when tab becomes active first time or when student email changes
  $: if (active) {
    if (!initiated) {
      initiated = true;
      loadTickets();
    } else if (lastEmail && student?.Email && student.Email !== lastEmail) {
      // Different student selected; refetch
      initiated = true;
      loadTickets();
    }
  }
</script>

<div class="w3-container" class:hidden={!active}>
  {#if loading}
    <p class="w3-small w3-text-blue">Loading tickets...</p>
  {:else if error}
    <p class="w3-small w3-text-red">{error}</p>
  {:else if !tickets.length}
    <p class="w3-small w3-opacity">No tickets for this student.</p>
  {:else}
    <TicketTable
      {tickets}
      showStudentColumn={false}
      showAssetColumn={true}
      showFilters={false}
      compact={true}
    />
  {/if}
</div>

<style>
  .hidden {
    display: none;
  }
</style>
