<script>
  import AssetDisplay from "../AssetDisplay.svelte";

  export let data;
  export let columns = [];
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
</div>

<p>Sorting by: {sortColumn} {sortDirection}</p>

<div class="w3-responsive">
  <table class="w3-table w3-bordered w3-striped">
    <thead>
      <tr>
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
          <th> Last User? </th>
          <th> Last Used </th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each filteredData as row (row.Serial)}
        <tr
          class:highlight-stale={haveGoogleData && isStale(row.lastUsed)}
          class:highlight-wrong-user={haveGoogleData && !row.lastUserMatch}
        >
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
</style>
