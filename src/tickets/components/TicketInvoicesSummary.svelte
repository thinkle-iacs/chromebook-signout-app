<script lang="ts">
  import type { Ticket } from "../../data/tickets";
  import { getInvoices } from "../../data/invoices";

  export let ticket: Ticket;

  let open = false;
  let loading = false;
  let rows: any[] = [];
  $: count = ((ticket as any)?.Invoices || []).length;
  $: hasAny = count > 0;

  function formatDollar(val: number | undefined) {
    if (val === undefined || val === null || isNaN(val as any)) return "";
    return `$${Number(val).toFixed(2)}`;
  }

  function statusText(inv: any) {
    const send = !!inv.fields?.["Send Email"]; // queued to send
    const sent = !!inv.fields?.["Email Sent"]; // already sent
    if (sent) return "Sent";
    if (send) return "Sending";
    return "—";
  }

  async function toggle() {
    open = !open;
    if (open && rows.length === 0) {
      loading = true;
      try {
        rows = await getInvoices({ ticketNumber: String(ticket.Number) });
      } finally {
        loading = false;
      }
    }
  }
</script>

{#if hasAny}
  <button class="w3-button w3-tiny w3-light-grey" on:click={toggle}>
    {count} invoice{count === 1 ? "" : "s"}
  </button>
  {#if open}
    <div class="w3-panel w3-white w3-border w3-small w3-margin-top">
      {#if loading}
        <div class="w3-small w3-text-gray">Loading…</div>
      {:else if rows.length === 0}
        <div class="w3-small w3-text-gray">No invoices found.</div>
      {:else}
        <ul class="w3-ul w3-small">
          {#each rows as inv}
            <li>
              {inv.fields?.["Date Created"]}
              · {formatDollar(inv.fields?.["Repair Cost (from Ticket)"])}
              · {statusText(inv)}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
{/if}
