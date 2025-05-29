<!-- TODO

1. Clean up this code (it's part vibe-coded so needs some love).
2. Add nice filters/sorting to just show the problem machines.
3. Add the Active/Inactive status into the asset table in air table 
   so we can see whether these students are actually enrolled or not. 
   Then add a filter to show only active or inactive students. 
4. Get CSV export working nicely. 
5. Integrate emailing directly here w/ our notifications system. 
6. Integrate notes into the emailing so we can keep track of what we have said/done. 

-->

<script lang="ts">
  import DataExporter from "./DataExporter.svelte";
  import { checkMachineStatus } from "../data/google";

  import {
    getStudentLoans,
    getStaffLoans,
    getNonLoanedChromebooks,
    assetStore,
  } from "../data/inventory";
  import AssetDisplay from "../AssetDisplay.svelte";
  import { get } from "svelte/store";
  import ReportTable from "./ReportTable.svelte";

  let activeTab: "studentLoans" | "staffLoans" | "nonLoaned" = "studentLoans";
  let studentLoans = [];
  let staffLoans = [];
  let nonLoanedChromebooks = [];
  let loading = false;
  let machineStatuses = {}; // Store statuses for each asset
  let expandedUsers = {}; // Track expanded user lists
  let expandedTimeRanges = {}; // Track expanded time ranges

  // New variables for filtering and sorting
  let selectedYOG: string | null = null;
  let sortBy: "alphabetical" | "yog" = "alphabetical";

  // Add filtering by Student Status
  let selectedStudentStatus: string | null = null; // New variable for Student Status

  // Ensure YOG filtering is applied when fetching student loans
  async function fetchData() {
    loading = true;
    if (activeTab === "studentLoans") {
      studentLoans = await normalizeAssets(
        await getStudentLoans(true, selectedYOG, selectedStudentStatus) // Pass Student Status
      );
      sortStudentLoans();
    } else if (activeTab === "staffLoans") {
      staffLoans = await normalizeAssets(await getStaffLoans(true));
    } else if (activeTab === "nonLoaned") {
      nonLoanedChromebooks = await normalizeAssets(
        await getNonLoanedChromebooks()
      );
    }
    loading = false;
  }

  function normalizeAssets(rawAssets) {
    const $assetStore = get(assetStore);
    return rawAssets.map((rawAsset) => {
      const assetTag = rawAsset.fields["Asset Tag"];
      return (
        $assetStore[assetTag] || {
          ...rawAsset.fields,
          _id: rawAsset.id,
        }
      );
    });
  }

  function sortStudentLoans() {
    if (sortBy === "alphabetical") {
      studentLoans.sort((a, b) => {
        const emailA = a["Email (from Student (Current))"]?.[0] || "";
        const emailB = b["Email (from Student (Current))"]?.[0] || "";
        return emailA.localeCompare(emailB);
      });
    } else if (sortBy === "yog") {
      studentLoans.sort((a, b) => {
        const yogA = parseInt(a["YOG (from Student (Current))"]?.[0]) || 0;
        const yogB = parseInt(b["YOG (from Student (Current))"]?.[0]) || 0;
        return yogA - yogB;
      });
    }
  }

  async function checkStatus(asset) {
    const status = await checkMachineStatus(asset);
    machineStatuses[asset["Asset Tag"]] = status; // Save status by Asset Tag
    console.log("Machine status:", status);
  }

  function toggleExpandUsers(assetTag) {
    expandedUsers[assetTag] = !expandedUsers[assetTag];
  }

  function toggleExpandTimeRanges(assetTag) {
    expandedTimeRanges[assetTag] = !expandedTimeRanges[assetTag];
  }

  function isStale(lastUsed) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(lastUsed) < thirtyDaysAgo;
  }

  const MAX_CONCURRENT_REQUESTS = 10; // Limit concurrency

  async function checkAllStatuses() {
    const assets = studentLoans; // Adjust based on activeTab
    const assetTags = assets.map((asset) => asset["Asset Tag"]);

    let index = 0;

    async function processBatch() {
      const batch = assets.slice(index, index + MAX_CONCURRENT_REQUESTS);
      await Promise.all(
        batch.map(async (asset) => {
          const status = await checkMachineStatus(asset);
          machineStatuses[asset["Asset Tag"]] = status;
        })
      );
      index += MAX_CONCURRENT_REQUESTS;
      if (index < assets.length) {
        await processBatch(); // Process next batch
      }
    }

    await processBatch();
    console.log("All statuses updated:", machineStatuses);
  }

  function getLastLoginForAssignedUser(googleData, assignedUser) {
    if (!googleData || !googleData.recentUsers || !assignedUser)
      return "Unknown";

    const assignedUserEntry = googleData.recentUsers.find(
      (user) => user.email === assignedUser
    );

    return assignedUserEntry?.lastLoginTime || "Unknown";
  }

  function addMachineInfo(assets, machineStatuses) {
    return assets.map((asset) => {
      const assetTag = asset["Asset Tag"];
      const status = machineStatuses[assetTag] || {};
      return {
        ...asset,
        status: status.status || "Unknown",
        lastUsed: status.lastUsed || "Unknown",
        lastUserMatch: status.lastUserMatch || false,
        googleData: status.googleData || {},
        recentUsers: status.googleData?.recentUsers?.map((u) => u.email) || [],
        sessions: status.googleData?.activeTimeRanges.map((r) => r.date) || [],
      };
    });
  }

  let displayData = [];
  let columns = [];
  let headers = [];
  $: if (activeTab === "studentLoans") {
    console.log("Update display data for students");
    displayData = addMachineInfo(studentLoans, machineStatuses);
    columns = [
      "_ASSET",
      "Email (from Student (Current))",
      "YOG (from Student (Current))",
      "Student Status",
    ];
    headers = ["Asset Tag", "Email", "YOG", "Active Student"];
  } else if (activeTab === "staffLoans") {
    displayData = addMachineInfo(staffLoans, machineStatuses);
  } else if (activeTab === "nonLoaned") {
    displayData = addMachineInfo(nonLoanedChromebooks, machineStatuses);
  }
  $: console.log(displayData);
</script>

<div class="w3-container">
  <h1>Reports</h1>
  <nav class="w3-bar w3-border-bottom">
    <button
      class="w3-bar-item w3-button"
      class:w3-blue={activeTab === "studentLoans"}
      on:click={() => (activeTab = "studentLoans")}
    >
      All Student Loans
    </button>
    <button
      class="w3-bar-item w3-button"
      class:w3-blue={activeTab === "staffLoans"}
      on:click={() => (activeTab = "staffLoans")}
    >
      All Staff Loans
    </button>
    <button
      class="w3-bar-item w3-button"
      class:w3-blue={activeTab === "nonLoaned"}
      on:click={() => (activeTab = "nonLoaned")}
    >
      Non-Loaned Chromebooks
    </button>
  </nav>

  <div class="w3-container">
    {#if activeTab === "studentLoans"}
      <div class="w3-margin-top">
        <label for="yog" class="w3-margin-right">Filter by YOG:</label>
        <input
          id="yog"
          type="text"
          class="w3-input w3-border w3-inline"
          placeholder="Enter YOG (e.g., 2023)"
          bind:value={selectedYOG}
        />
        <label for="studentStatus" class="w3-margin-left"
          >Filter by Student Status:</label
        >
        <select
          id="studentStatus"
          class="w3-select w3-border w3-inline"
          bind:value={selectedStudentStatus}
        >
          <option value="">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <label for="sort" class="w3-margin-left">Sort by:</label>
        <select
          id="sort"
          class="w3-select w3-border w3-inline"
          bind:value={sortBy}
          on:change={sortStudentLoans}
        >
          <option value="alphabetical">Alphabetical</option>
          <option value="yog">YOG</option>
        </select>
      </div>
    {/if}

    <button
      class="w3-button w3-green w3-margin-top"
      on:click={fetchData}
      disabled={loading}
    >
      Run Report
    </button>
    <button
      class="w3-button w3-green w3-margin-top"
      on:click={checkAllStatuses}
    >
      Check All Statuses
    </button>

    {#if loading}
      <p class="w3-opacity">Loading...</p>
    {:else if activeTab === "studentLoans"}
      <h2>Student Loans</h2>
      <DataExporter
        items={studentLoans}
        filename="student_loans_report.csv"
        headers={[
          "Asset Tag",
          "Serial",
          "LASID",
          "Model",
          "Year of Purchase",
          "Email (from Student (Current))",
          "YOG (from Student (Current))",
          "Status",
          "Last Used",
          "Last User",
        ]}
      ></DataExporter>
      <ReportTable data={displayData} {columns} {headers} />
      {#if studentLoans.length}
        <div class="w3-responsive">
          <table class="w3-table w3-bordered w3-striped">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Student Email</th>
                <th>YOG</th>
                <th>Assigned User?</th>
                <th>Last User</th>
                <th>Last Used</th>
              </tr>
            </thead>
            <tbody>
              {#each studentLoans as asset}
                <tr
                  class={isStale(machineStatuses[asset["Asset Tag"]]?.lastUsed)
                    ? "stale"
                    : ""}
                >
                  <td><AssetDisplay {asset} /></td>
                  <td
                    >{asset["Email (from Student (Current))"]?.[0] || "N/A"}</td
                  >
                  <td>{asset["YOG (from Student (Current))"]?.[0] || "N/A"}</td>
                  <td
                    >{machineStatuses[asset["Asset Tag"]]?.lastUserMatch
                      ? "Yes"
                      : "No"}</td
                  >
                  <td>
                    <span
                      class={machineStatuses[asset["Asset Tag"]]?.lastUserMatch
                        ? ""
                        : "mismatch"}
                    >
                      {machineStatuses[asset["Asset Tag"]]?.googleData
                        ?.recentUsers?.[0]?.email || "Unknown"}
                    </span>
                    <button
                      class="w3-button w3-small w3-blue"
                      on:click={() => toggleExpandUsers(asset["Asset Tag"])}
                    >
                      +
                    </button>
                    {#if expandedUsers[asset["Asset Tag"]]}
                      <ul>
                        {#each machineStatuses[asset["Asset Tag"]]?.googleData?.recentUsers || [] as user}
                          <li>{user.email}</li>
                        {/each}
                      </ul>
                    {/if}
                  </td>
                  <td>
                    <span
                      class={isStale(
                        machineStatuses[asset["Asset Tag"]]?.lastUsed
                      )
                        ? "bold"
                        : ""}
                    >
                      {machineStatuses[asset["Asset Tag"]]?.lastUsed ||
                        "Unknown"}
                    </span>
                    <button
                      class="w3-button w3-small w3-blue"
                      on:click={() =>
                        toggleExpandTimeRanges(asset["Asset Tag"])}
                    >
                      +
                    </button>
                    {#if expandedTimeRanges[asset["Asset Tag"]]}
                      <ul>
                        {#each machineStatuses[asset["Asset Tag"]]?.googleData?.activeTimeRanges || [] as range}
                          <li>{range.date}: {range.activeTime} ms</li>
                        {/each}
                      </ul>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p>No student loans found.</p>
      {/if}
    {:else if activeTab === "staffLoans"}
      <h2>Staff Loans</h2>
      <DataExporter
        items={staffLoans}
        filename="staff_loans_report.csv"
        headers={[
          "Asset Tag",
          "Serial",
          "Model",
          "Year of Purchase",
          "Staff Email",
          "Full Name (from User)",
        ]}
      ></DataExporter>
      {#if staffLoans.length}
        <table class="w3-table w3-bordered w3-striped">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Staff Email</th>
              <th>Full Name</th>
            </tr>
          </thead>
          <tbody>
            {#each staffLoans as asset}
              <tr>
                <td><AssetDisplay {asset} /></td>
                <td>{asset["Staff Email"]?.[0] || "N/A"}</td>
                <td>{asset["Full Name (from User)"]?.[0] || "N/A"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p>No staff loans found.</p>
      {/if}
    {:else if activeTab === "nonLoaned"}
      <h2>Non-Loaned Chromebooks</h2>
      <DataExporter
        items={nonLoanedChromebooks}
        filename="non_loaned_chromebooks_report.csv"
        headers={[
          "Asset Tag",
          "Serial",
          "Model",
          "Year of Purchase",
          "Location",
        ]}
      ></DataExporter>
      {#if nonLoanedChromebooks.length}
        <table class="w3-table w3-bordered w3-striped">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {#each nonLoanedChromebooks as asset}
              <tr>
                <td><AssetDisplay {asset} /></td>
                <td>{asset.Location || "N/A"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p>No non-loaned Chromebooks found.</p>
      {/if}
    {/if}
  </div>
</div>

<style>
  h1 {
    margin-bottom: 16px;
  }
  nav {
    margin-bottom: 16px;
  }
  .w3-bar-item.w3-blue {
    font-weight: bold;
  }
  .w3-button.w3-green {
    font-weight: bold;
  }
  table {
    margin-top: 16px;
    width: 100%;
  }
  .w3-margin-top {
    margin-top: 16px;
  }
  .stale {
    background-color: #ffdddd; /* Light red background */
  }
  .bold {
    font-weight: bold; /* Bold text for stale dates */
  }
  .mismatch {
    font-weight: bold; /* Bold text for mismatched users */
    color: #ff0000; /* Red text for mismatched users */
  }
</style>
