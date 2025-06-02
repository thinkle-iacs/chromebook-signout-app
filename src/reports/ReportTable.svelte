<script>
  import AssetDisplay from "../AssetDisplay.svelte";
  import DataExporter from "./DataExporter.svelte";
  import BulkMessageSender from "../BulkMessageSender.svelte";
  import { signoutAsset } from "../data/signout";

  export let data;
  export let columns = [];
  export let filename = "data.csv";
  // sortColumn is now a property name (string)
  let sortColumn = columns[0] || "";
  let sortDirection = "asc";
  export let headers = [];

  let sortedData = [];

  function isStale(lastUsed) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(lastUsed) < thirtyDaysAgo;
  }
  function resortData(data, direction, prop) {
    console.log("RT: Resorting data", direction, prop);
    sortedData = [...data]; // Create a copy...
    sortedData.sort((a, b) => {
      let sortProp = prop;
      if (prop === "_ASSET") {
        sortProp = "Asset Tag";
      }
      if (a[sortProp] === undefined || b[sortProp] === undefined) {
        return 0; // Handle undefined values gracefully
      }
      if (direction === "asc") {
        if (a[sortProp] < b[sortProp]) return -1;
        if (a[sortProp] > b[sortProp]) return 1;
      } else {
        if (a[sortProp] < b[sortProp]) return 1;
        if (a[sortProp] > b[sortProp]) return -1;
      }
      return 0;
    });
  }

  $: resortData(data, sortDirection, sortColumn);
  $: console.log("RT: Data changed: ", sortedData[0], "-", sortedData.at(-1));

  let haveGoogleData = false;
  $: {
    console.log("RT: Check for google data...");
    if (data && data.length > 0 && data[0].hasOwnProperty("googleData")) {
      console.log("RT: We have Google data!");
      haveGoogleData = true;
    } else {
      console.log("RT: No Google data found.");
      haveGoogleData = false;
    }
  }
  let expandedUsers = {};
  let expandedSessions = {};

  // Filter state
  let filterMismatched = false;
  let filterStale = false;
  let filterModel = "";

  // Derived filtered data
  $: filteredData = sortedData.filter((row) => {
    if (filterMismatched && row.lastUserMatch !== false) return false;
    if (filterStale && !isStale(row.lastUsed)) return false;
    if (
      filterModel &&
      !(row.Model || "").toLowerCase().includes(filterModel.toLowerCase())
    )
      return false;
    return true;
  });

  let includeGoogleDataInExport = haveGoogleData;
  let exportColumns = [];
  let ASSET_COLUMNS = [
    "Asset Tag",
    "Serial",
    "Make",
    "Model",
    "Year of Purchase",
  ];
  $: {
    // Expand _ASSET into ASSET_COLUMNS for exportColumns
    let baseColumns = columns.flatMap((col) =>
      col === "_ASSET" ? ASSET_COLUMNS : [col]
    );
    if (includeGoogleDataInExport) {
      exportColumns = [
        ...baseColumns,
        "lastUserMatch",
        "lastUsed",
        "recentUsers",
        "sessions",
      ];
    } else {
      exportColumns = [...baseColumns];
    }
  }

  let selectedAssetTags = new Set();
  let mountBulkMessageSender = false;
  let showBulkMessageSender = false;

  function openBulkMessageSender() {
    if (!mountBulkMessageSender) {
      mountBulkMessageSender = true;
    }
    showBulkMessageSender = true;
  }

  function toggleSelectAll() {
    if (selectedAssetTags.size === filteredData.length) {
      selectedAssetTags = new Set();
    } else {
      selectedAssetTags = new Set(filteredData.map((row) => row["Asset Tag"]));
    }
  }
  function toggleSelectRow(row) {
    const tag = row["Asset Tag"];
    if (selectedAssetTags.has(tag)) {
      selectedAssetTags.delete(tag);
    } else {
      selectedAssetTags.add(tag);
    }
    selectedAssetTags = new Set(selectedAssetTags); // trigger reactivity
  }

  let isUpdatingStatus = false;
  let updateStatusError = "";

  async function markSelectedAsLost() {
    isUpdatingStatus = true;
    updateStatusError = "";
    try {
      const tags = [...selectedAssetTags];
      await Promise.all(
        tags.map(async (tag) => {
          const asset = data.find((row) => row["Asset Tag"] === tag);
          if (!asset) throw new Error(`Asset not found: ${tag}`);
          await signoutAsset(null, null, asset, "", "Lost", false);
        })
      );
      selectedAssetTags = new Set();
    } catch (e) {
      updateStatusError = e.message || "Failed to update status.";
    } finally {
      isUpdatingStatus = false;
    }
  }

  let showLostConfirm = false;
  let lostNote = "";

  function openLostConfirm() {
    lostNote = "";
    showLostConfirm = true;
  }
  function closeLostConfirm() {
    showLostConfirm = false;
  }

  async function confirmMarkSelectedAsLost() {
    isUpdatingStatus = true;
    updateStatusError = "";
    try {
      const tags = [...selectedAssetTags];
      await Promise.all(
        tags.map(async (tag) => {
          const asset = data.find((row) => row["Asset Tag"] === tag);
          if (!asset) throw new Error(`Asset not found: ${tag}`);
          await signoutAsset(null, null, asset, lostNote, "Lost", false);
        })
      );
      selectedAssetTags = new Set();
      closeLostConfirm();
    } catch (e) {
      updateStatusError = e.message || "Failed to update status.";
    } finally {
      isUpdatingStatus = false;
    }
  }
</script>

<!-- Filter controls -->
<div class="w3-padding w3-bar">
  <label class="w3-bar-item">
    <input type="checkbox" bind:checked={filterMismatched} />
    Mismatched
  </label>
  <label class="w3-bar-item">
    <input type="checkbox" bind:checked={filterStale} />
    Stale
  </label>
  <label class="w3-bar-item">
    Model:
    <input
      type="text"
      bind:value={filterModel}
      class="w3-input w3-border"
      style="display:inline-block;width:auto;margin-left:4px;"
    />
  </label>
  {#if haveGoogleData}
    <label class="w3-bar-item">
      <input
        type="checkbox"
        class="w3-check"
        bind:checked={includeGoogleDataInExport}
      />
      Include Google Data in Export
    </label>
  {/if}
</div>

<div class="w3-responsive">
  <p>Showing <b>{filteredData.length}</b> records</p>

  <div
    class="w3-bar w3-center w3-margin-bottom"
    style="justify-content: center; display: flex; gap: 0.5em;"
  >
    <button
      class="w3-button w3-blue w3-bar-item"
      disabled={selectedAssetTags.size === 0}
      on:click={openBulkMessageSender}
    >
      Send Email to Selected
    </button>
    <button
      class="w3-button w3-orange w3-bar-item"
      disabled={selectedAssetTags.size === 0 || isUpdatingStatus}
      on:click={openLostConfirm}
    >
      Mark as Lost
    </button>
    <span class="w3-bar-item data-exporter-wrap" style="padding:0;">
      <DataExporter items={filteredData} {filename} headers={exportColumns} />
    </span>
  </div>

  {#if mountBulkMessageSender}
    <div
      class="modal-wrap modal-bulk-message"
      style:display={showBulkMessageSender ? "flex" : "none"}
    >
      <div class="modal-content modal-bulk-message-content">
        <BulkMessageSender assetTags={[...selectedAssetTags]} />
        <button
          class="w3-button w3-grey"
          on:click={() => (showBulkMessageSender = false)}
        >
          Close
        </button>
      </div>
    </div>
  {/if}

  <table class="w3-table w3-bordered w3-striped">
    <thead>
      <tr>
        <th>
          <input
            type="checkbox"
            checked={selectedAssetTags.size === filteredData.length &&
              filteredData.length > 0}
            indeterminate={selectedAssetTags.size > 0 &&
              selectedAssetTags.size < filteredData.length}
            on:change={toggleSelectAll}
          />
        </th>
        {#each headers as header, i}
          <th
            on:click={() => {
              const colProp = columns[i];
              if (sortColumn === colProp) {
                sortDirection = sortDirection === "asc" ? "desc" : "asc";
              } else {
                sortColumn = colProp;
                sortDirection = "asc";
              }
            }}
          >
            {header}
          </th>
        {/each}
        {#if haveGoogleData}
          <th
            on:click={() => {
              if (sortColumn === "lastUserMatch") {
                sortDirection = sortDirection === "asc" ? "desc" : "asc";
              } else {
                sortColumn = "lastUserMatch";
                sortDirection = "asc";
              }
            }}
            style="cursor:pointer"
          >
            Last User?
          </th>
          <th
            on:click={() => {
              if (sortColumn === "lastUsed") {
                sortDirection = sortDirection === "asc" ? "desc" : "asc";
              } else {
                sortColumn = "lastUsed";
                sortDirection = "asc";
              }
            }}
            style="cursor:pointer"
          >
            Last Used
          </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each filteredData as row (row.Serial)}
        <tr
          class:highlight-stale={haveGoogleData && isStale(row.lastUsed)}
          class:highlight-wrong-user={haveGoogleData && !row.lastUserMatch}
        >
          <td>
            <input
              type="checkbox"
              checked={selectedAssetTags.has(row["Asset Tag"])}
              on:change={() => toggleSelectRow(row)}
            />
          </td>
          {#each columns as column, i (i)}
            <td>
              {#if column == "_ASSET"}
                <AssetDisplay asset={row} />
              {:else}
                {row[column]}
              {/if}
            </td>
          {/each}
          {#if haveGoogleData}
            <td class="user">
              {row.recentUsers[0]}
              <button
                class="w3-button w3-small"
                on:click={() => {
                  expandedUsers[row.Serial] = !expandedUsers[row.Serial];
                }}>+</button
              >
              {#if expandedUsers[row.Serial]}
                <ul>
                  {#each row.recentUsers.slice(1) as user}
                    <li>{user}</li>
                  {/each}
                </ul>
              {/if}
            </td>
            <td class="session">
              {row.lastUsed}<button
                class="w3-button w3-small"
                on:click={() => {
                  expandedSessions[row.Serial] = !expandedSessions[row.Serial];
                }}>+</button
              >

              {#if expandedSessions[row.Serial]}
                <ul>
                  {#each row.sessions as session}
                    <li>{session}</li>
                  {/each}
                </ul>
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>

  {#if showLostConfirm}
    <div
      class="modal-wrap"
      style="display:flex;align-items:center;justify-content:center;z-index:2000;"
    >
      <div
        class="modal-content"
        style="max-width:400px;width:90vw;padding:2em;"
      >
        <h3>Mark {selectedAssetTags.size} asset(s) as Lost?</h3>
        <label>Optional Note:</label>
        <textarea
          class="w3-input w3-border"
          rows="3"
          bind:value={lostNote}
          placeholder="Add a note (optional)"
        ></textarea>
        <div class="w3-bar w3-margin-top">
          <button
            class="w3-button w3-orange w3-bar-item"
            on:click={confirmMarkSelectedAsLost}
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? "Marking as Lost..." : "Confirm"}
          </button>
          <button
            class="w3-button w3-grey w3-bar-item"
            on:click={closeLostConfirm}
            disabled={isUpdatingStatus}>Cancel</button
          >
        </div>
        {#if updateStatusError}
          <div class="w3-text-red">{updateStatusError}</div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .highlight-stale {
    background-color: #ffcccc; /* Light red for stale items */
  }
  .highlight-wrong-user {
    background-color: #ffcc99; /* Light orange for wrong user */
  }
  .highlight-wrong-user .user {
    font-weight: bold;
    color: #c6093b;
  }
  .highlight-stale .session {
    font-weight: bold;
    color: #c6093b;
  }

  /* Minimalist expander styling for <ul> in table cells */
  td ul {
    margin: 4px 0 0 0;
    padding: 6px 12px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    list-style: none;
    font-size: 0.95em;
    position: relative;
    z-index: 1;
  }
  td ul li {
    margin: 0;
    padding: 0;
    border: none;
    line-height: 1.5;
  }

  /* Modal styles */
  .modal-wrap {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    z-index: 1000;
    padding: 0;
  }
  .modal-content {
    background: #fff;
    border-radius: 0;
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    box-shadow: none;
    padding: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  .modal-bulk-message .modal-content {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
  }
  .modal-bulk-message-content {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  .data-exporter-wrap :global(button.w3-button) {
    margin-top: 0;
  }
</style>
