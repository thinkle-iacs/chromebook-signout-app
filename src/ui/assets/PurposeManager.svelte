<script lang="ts">
  import {
    fetchReport,
    searchForAsset,
    getAllChromebooks,
    updateAsset,
    ALL_PURPOSES,
    type Asset,
    type MachinePurpose,
  } from "@data/inventory";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import Loader from "@components/Loader.svelte";
  import { logger } from "@utils/log";

  type LoadMode = "purpose" | "tags" | "all";

  let loadMode: LoadMode = "purpose";
  let loadPurpose: MachinePurpose = "MCAS";
  let tagInput = "";

  let assets: Asset[] = [];
  let loading = false;
  let loadError = "";
  let notFoundTags: string[] = [];

  let filterModel = "";
  let selectedIds = new Set<string>();

  let targetPurpose: MachinePurpose = "Student Loan";
  let updating = false;
  let updateResult: { succeeded: number; failed: number } | null = null;

  $: uniqueModels = [...new Set(assets.map((a) => a.Model).filter(Boolean))].sort();

  $: filtered = assets.filter((a) => {
    if (filterModel && a.Model !== filterModel) return false;
    return true;
  });

  $: allFilteredSelected =
    filtered.length > 0 && filtered.every((a) => selectedIds.has(a._id));

  function parseTags(value: string): string[] {
    return value
      .split(/[\n\r,;\t ]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function normalizeRecord(r: any): Asset {
    return { ...r.fields, _id: r.id };
  }

  async function load() {
    loading = true;
    loadError = "";
    notFoundTags = [];
    selectedIds = new Set();
    updateResult = null;
    assets = [];

    try {
      if (loadMode === "purpose") {
        const raw = await fetchReport({ chromebookOnly: true, purpose: loadPurpose });
        assets = (raw || []).map(normalizeRecord);
      } else if (loadMode === "tags") {
        const tags = parseTags(tagInput);
        if (!tags.length) {
          loadError = "Paste at least one asset tag.";
          return;
        }
        const results = await Promise.all(tags.map((tag) => searchForAsset(tag)));
        const found: Asset[] = [];
        const missing: string[] = [];
        tags.forEach((tag, i) => {
          const hits = results[i];
          if (hits && hits.length) {
            found.push(...hits.map(normalizeRecord));
          } else {
            missing.push(tag);
          }
        });
        // Deduplicate by _id
        const seen = new Set<string>();
        assets = found.filter((a) => {
          if (seen.has(a._id)) return false;
          seen.add(a._id);
          return true;
        });
        notFoundTags = missing;
        // Auto-select all found when loading by tag list
        selectedIds = new Set(assets.map((a) => a._id));
      } else {
        const raw = await getAllChromebooks();
        assets = (raw || []).map(normalizeRecord);
      }
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

  <div class="load-panel w3-panel w3-light-grey w3-border">
    <div class="mode-row">
      <label class="mode-option">
        <input type="radio" bind:group={loadMode} value="purpose" />
        By current purpose
      </label>
      <label class="mode-option">
        <input type="radio" bind:group={loadMode} value="tags" />
        By asset tags
      </label>
      <label class="mode-option">
        <input type="radio" bind:group={loadMode} value="all" />
        All Chromebooks
      </label>
    </div>

    {#if loadMode === "purpose"}
      <div class="mode-controls">
        <label>
          Purpose to load
          <select class="w3-select w3-border" bind:value={loadPurpose}>
            {#each ALL_PURPOSES as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </label>
        <button class="w3-button w3-blue" on:click={load} disabled={loading}>
          Load {loadPurpose} machines
        </button>
      </div>
    {:else if loadMode === "tags"}
      <div class="mode-controls">
        <label class="tag-label">
          Asset tags (one per line, or comma/space separated)
          <textarea
            class="w3-input w3-border tag-input"
            rows="4"
            bind:value={tagInput}
            placeholder="1234&#10;A5678&#10;..."
          ></textarea>
        </label>
        <button
          class="w3-button w3-blue"
          on:click={load}
          disabled={loading || !tagInput.trim()}
        >
          Load {parseTags(tagInput).length || ""} tags
        </button>
      </div>
    {:else}
      <div class="mode-controls">
        <p class="w3-text-gray w3-small">
          Loads every Chromebook in inventory — may be slow.
        </p>
        <button class="w3-button w3-blue" on:click={load} disabled={loading}>
          Load all Chromebooks
        </button>
      </div>
    {/if}
  </div>

  {#if loading}
    <Loader working={true} text="Loading…" />
  {:else if loadError}
    <div class="w3-panel w3-pale-red w3-border">{loadError}</div>
  {:else if assets.length || notFoundTags.length}
    {#if notFoundTags.length}
      <div class="w3-panel w3-pale-yellow w3-border">
        {notFoundTags.length} tag{notFoundTags.length === 1 ? "" : "s"} not found:
        {notFoundTags.join(", ")}
      </div>
    {/if}

    <div class="results-toolbar">
      <span class="summary">{assets.length} loaded · {filtered.length} shown · {selectedIds.size} selected</span>

      {#if uniqueModels.length > 1}
        <label>
          Filter model
          <select class="w3-select w3-border" bind:value={filterModel}>
            <option value="">All models</option>
            {#each uniqueModels as m}
              <option value={m}>{m}</option>
            {/each}
          </select>
        </label>
      {/if}

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
                {:else if asset.Purpose === "Temp"}
                  <span class="purpose-badge purpose-temp">Temp</span>
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
  .load-panel {
    margin-bottom: 16px;
  }
  .mode-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;
  }
  .mode-option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: bold;
    cursor: pointer;
    min-width: unset;
  }
  .mode-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-end;
  }
  .mode-controls label {
    font-weight: bold;
    min-width: 160px;
  }
  .tag-label {
    min-width: min(400px, 100%) !important;
  }
  .tag-input {
    font-family: monospace;
    font-size: 13px;
  }
  .results-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    margin-bottom: 8px;
  }
  .results-toolbar label {
    font-weight: bold;
    min-width: 140px;
  }
  .summary {
    font-size: 13px;
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
  .purpose-temp {
    background: #f5f5f5;
    color: #616161;
    border: 1px solid #bdbdbd;
  }
</style>
