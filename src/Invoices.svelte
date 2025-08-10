<script lang="ts">
  import { onMount } from "svelte";
  import type { InvoiceResult } from "./data/invoices";
  import { getInvoices, createInvoices, updateInvoices } from "./data/invoices";

  let loading = true;
  let rows: InvoiceResult[] = [];
  let ticketFilter = "";

  async function refresh() {
    loading = true;
    rows = await getInvoices(ticketFilter ? { ticket: ticketFilter } : {});
    loading = false;
  }

  onMount(refresh);

  async function toggleSendEmail(row: InvoiceResult) {
    const current = !!row.fields["Send Email"];
    await updateInvoices([{ id: row.id, fields: { "Send Email": !current } }]);
    await refresh();
  }

  function fmtMultiline(val: unknown): string {
    if (Array.isArray(val)) return val.filter(Boolean).join("\n");
    if (typeof val === "string") return val;
    return "";
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
    <p>Loading…</p>
  {:else}
    <table class="w3-table-all w3-small">
      <thead>
        <tr>
          <th>Student Email</th>
          <th>Asset Tag</th>
          <th>Date Created</th>
          <th>Ticket Info</th>
          <th>Contacts</th>
          <th>Delivered</th>
          <th>Actions</th>
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
            <td>{r.fields["Date Created"]}</td>
            <td style="white-space: pre-wrap;"
              >{fmtMultiline(r.fields["Ticket Block"])}</td
            >
            <td style="white-space: pre-wrap;"
              >{fmtMultiline(r.fields["Contact Info"])}</td
            >
            <td>{r.fields["Email Sent"] ? "✅" : "—"}</td>
            <td>
              <button
                class="w3-button w3-border w3-small"
                on:click={() => toggleSendEmail(r)}
              >
                {r.fields["Send Email"] ? "Mark Don’t Send" : "Mark Send"}
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
