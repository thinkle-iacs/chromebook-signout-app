<script lang="ts">
  import {
    getAllChromebooks,
    updateAsset,
    ALL_PURPOSES,
    type Asset,
    type MachinePurpose,
  } from "@data/inventory";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import Loader from "@components/Loader.svelte";
  import { logger } from "@utils/log";

  let assets: Asset[] = [];
  let loading = false;
  let loadError = "";

  let filterPurpose = "";
  let filterModel = "";
  let selectedIds = new Set<string>();

  let targetPurpose: MachinePurpose = "Student Loan";
  let updating = false;
  let updateResult: { succeeded: number; failed: number } | null = null;

  $: uniqueModels = [...new Set(assets.map((a) => a.Model).filter(Boolean))].sort();

  $: filtered = assets.filter((a) => {
    if (filterPurpose && a.Purpose !== filterPurpose) return false;
    if (filterModel && a.Model !== filterModel) return false;
    return true;
  });

  $: allFilteredSelected =
    filtered.length > 0 && filtered.every((a) => selectedIds.has(a._id));

  async function load() {
    loading = true;
    loadError = "";
    selectedIds = new Set();
    updateResult = null;
    try {
      const raw = await getAllChromebooks();
      assets = (raw || []).map((r) => ({ ...r.fields, _id: r.id }));
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
      logger.logError("PurposeManager load failed", err);
    } finally {
      loading = false;
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedIds = next;
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      const next = new Set(selectedIds);
      for (const a of filtered) next.delete(a._id);
      selectedIds = next;
    } else {
      const next = new Set(selectedIds);
      for (const a of filtered) next.add(a._id);
      selectedIds = next;
    }
  }

  function clearFilters() {
    filterPurpose = "";
    filterModel = "";
  }

  async function applyPurpose() {
    const targets = assets.filter((a) => selectedIds.has(a._id));
    if (!targets.length) return;
    updating = true;
    updateResult = null;
    let succeeded = 0;
    let failed = 0;

    await Promise.allSettled(
      targets.map(async (asset) => {
        try {
          await updateAsset(asset._id, { Purpose: targetPurpose });
          asset.Purpose = targetPurpose;
          succeeded += 1;
        } catch (err) {
          logger.logError("PurposeManager update failed for", asset["Asset Tag"], err);
          failed += 1;
        }
      }),
    );

    assets = [...assets];
    selectedIds = new Set();
    updateResult = { succeeded, failed };
    updating = false;
  }
</script>

<section class="purpose-manager">
  <h2>Purpose Manager</h2>
  <p class="w3-text-gray">
    Load all Chromebooks, filter by current purpose or model, select machines,
    then bulk-update their purpose.
  </p>

  <div class="toolbar">
    <button class="w3-button w3-blue" on:click={load} disabled={loading}>
      {assets.length ? "Reload" : "Load Chromebooks"}
    </button>

    {#if assets.length}
      <label>
        Filter purpose
        <select class="w3-select w3-border" bind:value={filterPurpose}>
          <option value="">All</option>
          {#each ALL_PURPOSES as p}
            <option value={p}>{p}</option>
          {/each}
        </select>
      </label>

      <label>
        Filter model
        <select class="w3-select w3-border" bind:value={filterModel}>
          <option value="">All</option>
          {#each uniqueModels as m}
            <option value={m}>{m}</option>
          {/each}
        </select>
      </label>

      {#if filterPurpose || filterModel}
        <button class="w3-button w3-border" on:click={clearFilters}>
          Clear filters
        </button>
      {/if}
    {/if}
  </div>

  {#if loading}
    <Loader working={true} text="Loading Chromebooks…" />
  {:else if loadError}
    <div class="w3-panel w3-pale-red w3-border">{loadError}</div>
  {:else if assets.length}
    <div class="summary-bar">
      <span>{filtered.length} shown</span>
      <span>{selectedIds.size} selected</span>
      {#if selectedIds.size}
        <button
          class="w3-button w3-tiny w3-border"
          on:click={() => (selectedIds = new Set())}>Deselect all</button
        >
      {/if}
    </div>

    {#if selectedIds.size}
      <div class="apply-bar w3-panel w3-pale-blue w3-border">
        <strong>Set {selectedIds.size} machine{selectedIds.size === 1 ? "" : "s"} to:</strong>
        <select class="w3-select w3-border" bind:value={targetPurpose}>
          {#each ALL_PURPOSES as p}
            <option value={p}>{p}</option>
          {/each}
        </select>
        <button
          class="w3-button w3-green"
          disabled={updating}
          on:click={applyPurpose}
        >
          {updating ? "Updating…" : "Apply"}
        </button>
      </div>
    {/if}

    {#if updateResult}
      <div
        class="w3-panel w3-border"
        class:w3-pale-green={updateResult.failed === 0}
        class:w3-pale-red={updateResult.failed > 0}
      >
        {updateResult.succeeded} updated
        {#if updateResult.failed}
          · {updateResult.failed} failed
        {/if}
      </div>
    {/if}

    <div class="table-wrap">
      <table class="w3-table w3-bordered w3-striped">
        <thead>
          <tr>
            <th class="check-col">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                on:change={toggleSelectAll}
                title="Select/deselect all visible"
              />
            </th>
            <th>Asset</th>
            <th>Current Purpose</th>
            <th>Year</th>
            <th>Current User</th>
          </tr>
        </thead>
        <tbody>
          {#each filtered as asset (asset._id)}
            <tr class:selected={selectedIds.has(asset._id)}>
              <td class="check-col">
                <input
                  type="checkbox"
                  checked={selectedIds.has(asset._id)}
                  on:change={() => toggleSelect(asset._id)}
                />
              </td>
              <td><AssetDisplay {asset} openInNewTab={true} /></td>
              <td>
                {#if asset.Purpose === "MCAS"}
                  <span class="purpose-badge purpose-mcas">MCAS</span>
                {:else if asset.Purpose === "Daily Loaner"}
                  <span class="purpose-badge purpose-daily">Daily Loaner</span>
                {:else if asset.Purpose === "Staff Spare"}
                  <span class="purpose-badge purpose-spare">Staff Spare</span>
                {:else}
                  {asset.Purpose || "—"}
                {/if}
              </td>
              <td class="w3-small">{asset["Year of Purchase"] || "—"}</td>
              <td class="w3-small">
                {asset["Email (from Student (Current))"] ||
                  asset["Staff User"] ||
                  "—"}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  .purpose-manager {
    padding: 16px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
    margin-bottom: 12px;
  }
  .toolbar label {
    font-weight: bold;
    min-width: 140px;
  }
  .summary-bar {
    display: flex;
    gap: 16px;
    align-items: center;
    font-size: 13px;
    margin-bottom: 8px;
    color: #555;
  }
  .apply-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 8px;
  }
  .apply-bar select {
    min-width: 160px;
  }
  .table-wrap {
    overflow-x: auto;
  }
  .check-col {
    width: 36px;
    text-align: center;
  }
  tr.selected {
    background: #e8f5e9 !important;
  }
  .purpose-badge {
    display: inline-block;
    font-size: 11px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .purpose-mcas {
    background: #111;
    color: #ff4444;
    border: 1px solid #ff4444;
  }
  .purpose-daily {
    background: #e3f2fd;
    color: #0d47a1;
    border: 1px solid #90caf9;
  }
  .purpose-spare {
    background: #fff3e0;
    color: #bf360c;
    border: 1px solid #ffcc80;
  }
</style>
