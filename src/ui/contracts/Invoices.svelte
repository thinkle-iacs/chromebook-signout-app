<script lang="ts">
  import { onMount } from "svelte";
  import type { InvoiceResult } from "@data/invoices";
  import { getInvoices } from "@data/invoices";
  import Loader from "@components/Loader.svelte";

  let loading = true;
  let rows: InvoiceResult[] = [];
  let ticketFilter = "";

  async function refresh() {
    loading = true;
    rows = await getInvoices(
      ticketFilter ? { ticketNumber: ticketFilter } : {}
    );
    loading = false;
  }

  onMount(refresh);

  function fmtMultiline(val: unknown): string {
    if (Array.isArray(val)) return val.filter(Boolean).join("\n");
    if (typeof val === "string") return val;
    return "";
  }

  function formatCurrency(val: number | undefined) {
    if (val == null || isNaN(val as any)) return "-";
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
    }).format(val);
  }

  const dateFmt = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  function formatDate(val: string | undefined) {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val; // fallback
    return dateFmt.format(d);
  }
</script>

<div class="w3-container">
  <h3>Invoices</h3>

  <div class="w3-margin-bottom">
    <label for="ticketFilter">Filter by Ticket:</label>
    &nbsp;
    <input
      id="ticketFilter"
      class="w3-input w3-border w3-small"
      style="max-width: 260px; display:inline-block"
      bind:value={ticketFilter}
      placeholder="Ticket ID"
    />
    <button class="w3-button w3-blue w3-small" on:click={refresh}>Apply</button>
  </div>

  {#if loading}
    <Loader text="Loading invoices" working={true} />
  {:else}
    <table class="w3-table w3-striped w3-bordered w3-small">
      <thead>
        <tr>
          <th>Student Email</th>
          <th>Asset Tag</th>
          <th>Date Created</th>
          <th>Ticket Info</th>
          <th>Repair Cost</th>
          <th>Contacts</th>
          <th>Delivered</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr>
            <td
              >{(r.fields["Student Email (from Student)"] || []).join(", ")}</td
            >
            <td
              >{(r.fields["Device Asset Tag (from Ticket)"] || []).join(
                ", "
              )}</td
            >
            <td class="date-created" title={r.fields["Date Created"]}
              >{formatDate(r.fields["Date Created"])}</td
            >
            <td style="white-space: pre-wrap;"
              >{fmtMultiline(r.fields["Ticket Block"])}</td
            >
            <td>{formatCurrency(r.fields["Repair Cost (from Ticket)"])}</td>
            <td style="white-space: pre-wrap;"
              >{fmtMultiline(r.fields["Contact Info"])}</td
            >
            <td>{r.fields["Email Sent"] ? "✅" : "—"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .date-created {
    white-space: nowrap;
  }
</style>
