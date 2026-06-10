<script lang="ts">
  import { onMount } from "svelte";
  import type { InvoiceResult } from "@data/invoices";
  import { getInvoices } from "@data/invoices";
  import Loader from "@components/Loader.svelte";

  let loading = true;
  let allRows: InvoiceResult[] = [];

  async function refresh() {
    loading = true;
    allRows = await getInvoices({});
    loading = false;
  }

  onMount(refresh);

  // ---- Filters ----
  let search = "";
  let datePreset: "schoolYear" | "month" | "week" | "all" = "schoolYear";
  let typeFilter: "all" | "invoice" | "cancellation" = "all";
  let minCost = "";
  let maxCost = "";

  // School year runs July 1 - June 30
  function schoolYearStart(now: Date): Date {
    const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return new Date(y, 6, 1);
  }

  function presetStart(preset: typeof datePreset): Date | null {
    const now = new Date();
    switch (preset) {
      case "week": {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        d.setDate(d.getDate() - d.getDay()); // back to Sunday
        return d;
      }
      case "month":
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case "schoolYear":
        return schoolYearStart(now);
      default:
        return null;
    }
  }

  // ---- Field accessors (lookup fields come back as arrays) ----
  function joined(val: unknown): string {
    if (Array.isArray(val)) return val.filter(Boolean).join(", ");
    return (val as string) || "";
  }

  function costOf(r: InvoiceResult): number {
    const v = r.fields["Repair Cost (from Ticket)"];
    const n = Number(Array.isArray(v) ? v[0] : v);
    return isNaN(n) ? 0 : n;
  }

  function ticketNumberOf(r: InvoiceResult): string {
    return joined(r.fields["Number (from Ticket)"]);
  }

  function isCancellation(r: InvoiceResult): boolean {
    return Boolean(r.fields["Cancellation"]);
  }

  function matchesSearch(r: InvoiceResult, needle: string): boolean {
    if (!needle) return true;
    const haystack = [
      joined(r.fields["Student Email (from Student)"]),
      joined(r.fields["Device Asset Tag (from Ticket)"]),
      ticketNumberOf(r),
      r.fields["Note"] || "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle.toLowerCase());
  }

  function filterRows(
    rows: InvoiceResult[],
    search: string,
    datePreset,
    typeFilter,
    minCost: string,
    maxCost: string
  ): InvoiceResult[] {
    const start = presetStart(datePreset);
    const min = minCost === "" ? null : Number(minCost);
    const max = maxCost === "" ? null : Number(maxCost);
    return rows.filter((r) => {
      if (start) {
        const created = new Date(r.fields["Date Created"] || "");
        if (isNaN(created.getTime()) || created < start) return false;
      }
      if (typeFilter === "invoice" && isCancellation(r)) return false;
      if (typeFilter === "cancellation" && !isCancellation(r)) return false;
      const cost = costOf(r);
      if (min != null && !isNaN(min) && cost < min) return false;
      if (max != null && !isNaN(max) && cost > max) return false;
      return matchesSearch(r, search);
    });
  }

  // ---- Sorting ----
  let sortKey = "date";
  let sortDir: "asc" | "desc" = "desc"; // newest first by default

  const headers: { key: string; label: string }[] = [
    { key: "email", label: "Student Email" },
    { key: "asset", label: "Asset Tag" },
    { key: "date", label: "Date Created" },
    { key: "type", label: "Type" },
    { key: "ticket", label: "Ticket Info" },
    { key: "cost", label: "Repair Cost" },
    { key: "contacts", label: "Contacts" },
    { key: "delivered", label: "Delivered" },
  ];

  function sortValue(r: InvoiceResult, key: string): string | number {
    switch (key) {
      case "email":
        return joined(r.fields["Student Email (from Student)"]).toLowerCase();
      case "asset":
        return joined(r.fields["Device Asset Tag (from Ticket)"]).toLowerCase();
      case "date":
        return new Date(r.fields["Date Created"] || 0).getTime() || 0;
      case "type":
        return isCancellation(r) ? 1 : 0;
      case "ticket":
        return Number(ticketNumberOf(r)) || 0;
      case "cost":
        return costOf(r);
      case "contacts":
        return joined(r.fields["Contact Info"]).toLowerCase();
      case "delivered":
        return r.fields["Email Sent"] ? 1 : 0;
      default:
        return "";
    }
  }

  function setSort(key: string) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      // Dates & costs read most naturally biggest/newest first
      sortDir = key === "date" || key === "cost" ? "desc" : "asc";
    }
  }

  function sortRows(rows: InvoiceResult[], key: string, dir: "asc" | "desc") {
    const sorted = [...rows].sort((a, b) => {
      const av = sortValue(a, key);
      const bv = sortValue(b, key);
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  $: filteredRows = filterRows(
    allRows,
    search,
    datePreset,
    typeFilter,
    minCost,
    maxCost
  );
  $: displayRows = sortRows(filteredRows, sortKey, sortDir);

  // Net = invoices minus cancellations
  $: netTotal = filteredRows.reduce(
    (sum, r) => sum + (isCancellation(r) ? -costOf(r) : costOf(r)),
    0
  );
  $: cancellationCount = filteredRows.filter(isCancellation).length;

  // ---- Formatting ----
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

  <div class="filter-bar w3-margin-bottom">
    <label>
      Search:
      <input
        class="w3-input w3-border w3-small"
        style="max-width: 220px; display:inline-block"
        bind:value={search}
        placeholder="Email, asset tag, or ticket #"
      />
    </label>
    <label>
      Dates:
      <select
        class="w3-select w3-border w3-small"
        style="width:auto; display:inline-block"
        bind:value={datePreset}
      >
        <option value="schoolYear">This school year</option>
        <option value="month">This month</option>
        <option value="week">This week</option>
        <option value="all">All time</option>
      </select>
    </label>
    <label>
      Type:
      <select
        class="w3-select w3-border w3-small"
        style="width:auto; display:inline-block"
        bind:value={typeFilter}
      >
        <option value="all">All</option>
        <option value="invoice">Invoices</option>
        <option value="cancellation">Cancellations</option>
      </select>
    </label>
    <label>
      Cost:
      <input
        class="w3-input w3-border w3-small cost-input"
        type="number"
        min="0"
        bind:value={minCost}
        placeholder="min"
      />
      –
      <input
        class="w3-input w3-border w3-small cost-input"
        type="number"
        min="0"
        bind:value={maxCost}
        placeholder="max"
      />
    </label>
    <button class="w3-button w3-blue w3-small" on:click={refresh}
      >Refresh</button
    >
  </div>

  {#if loading}
    <Loader text="Loading invoices" working={true} />
  {:else}
    <p class="w3-small">
      Showing <b>{displayRows.length}</b> of {allRows.length} records
      {#if cancellationCount}
        ({cancellationCount} cancellation{cancellationCount === 1 ? "" : "s"})
      {/if}
      — net billed: <b>{formatCurrency(netTotal)}</b>
    </p>
    <table class="w3-table w3-striped w3-bordered w3-small">
      <thead>
        <tr>
          {#each headers as h (h.key)}
            <th
              class="sortable"
              on:click={() => setSort(h.key)}
              title="Sort by {h.label}"
            >
              {h.label}
              {#if sortKey === h.key}
                <span class="sort-arrow">{sortDir === "asc" ? "▲" : "▼"}</span>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each displayRows as r (r.id)}
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
            <td>
              {#if r.fields["Cancellation"]}
                <span class="w3-tag w3-red w3-small">Cancellation</span>
              {:else}
                Invoice
              {/if}
            </td>
            <td style="white-space: pre-wrap;"
              >{fmtMultiline(r.fields["Ticket Block"])}{#if r.fields["Note"]}
                <div class="w3-text-red w3-small">{r.fields["Note"]}</div>
              {/if}</td
            >
            <td>{formatCurrency(costOf(r))}</td>
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
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  .filter-bar label {
    white-space: nowrap;
  }
  .cost-input {
    width: 5.5em;
    display: inline-block;
  }
  th.sortable {
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
  }
  th.sortable:hover {
    background: #f0f0f0;
  }
  .sort-arrow {
    font-size: 0.8em;
  }
</style>
