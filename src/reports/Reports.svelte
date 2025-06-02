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

  // New variables for filtering and sorting
  let selectedYOG: string | null = null;

  // Add filtering by Student Status
  let selectedStudentStatus: string | null = null; // New variable for Student Status

  // Ensure YOG filtering is applied when fetching student loans
  async function fetchData() {
    loading = true;
    if (activeTab === "studentLoans") {
      studentLoans = await normalizeAssets(
        await getStudentLoans(true, selectedYOG, selectedStudentStatus) // Pass Student Status
      );
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

  let loginDataLoading = false;
  let loginDataProgress = 0;

  const MAX_CONCURRENT_REQUESTS = 10; // Limit concurrency

  async function checkAllStatuses() {
    loginDataLoading = true;
    loginDataProgress = 0;
    const assets = displayData;
    const assetTags = assets.map((asset) => asset["Asset Tag"]);

    let index = 0;
    const total = assets.length;

    async function processBatch() {
      const batch = assets.slice(index, index + MAX_CONCURRENT_REQUESTS);
      await Promise.all(
        batch.map(async (asset) => {
          const status = await checkMachineStatus(asset);
          machineStatuses[asset["Asset Tag"]] = status;
        })
      );
      index += MAX_CONCURRENT_REQUESTS;
      loginDataProgress = Math.min(index, total);
      if (index < total) {
        await processBatch(); // Process next batch
      }
    }

    await processBatch();
    loginDataLoading = false;
    loginDataProgress = total;
    console.log("All statuses updated:", machineStatuses);
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

  // Remove all per-tab table rendering, just keep displayData/columns/headers logic
  let displayData = [];
  let columns = [];
  let headers = [];
  let filename = "chromebook_report.csv";
  $: {
    if (activeTab === "studentLoans") {
      displayData = addMachineInfo(studentLoans, machineStatuses);
      filename = "student-loans-report.csv";
      if (selectedYOG) {
        filename = `${selectedYOG}-${filename}`;
      }
      if (selectedStudentStatus) {
        filename = `${selectedStudentStatus}-${filename}`;
      }
      columns = [
        "_ASSET",
        "Email (from Student (Current))",
        "YOG (from Student (Current))",
        "Student Status",
        "Purpose",
        "Location",
        "Status",
      ];
      headers = [
        "Asset Tag",
        "Email",
        "YOG",
        "Active Student",
        "Purpose",
        "Location",
        "Status",
      ];
    } else if (activeTab === "staffLoans") {
      filename = "staff-loans-report.csv";
      displayData = addMachineInfo(staffLoans, machineStatuses);
      columns = [
        "_ASSET",
        "Staff Email",
        "Full Name (from User)",
        "Purpose",
        "Location",
        "Status",
      ];
      headers = [
        "Asset Tag",
        "Staff Email",
        "Full Name",
        "Purpose",
        "Location",
        "Status",
      ];
    } else if (activeTab === "nonLoaned") {
      filename = "non-loaned-chromebooks-report.csv";
      displayData = addMachineInfo(nonLoanedChromebooks, machineStatuses);
      columns = ["_ASSET", "Location", "Purpose", "Status"];
      headers = ["Asset Tag", "Location", "Purpose", "Status"];
    }
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
        <label for="yog" class="w3-margin-right">YOG:</label>
        <input
          id="yog"
          type="text"
          class="w3-input w3-border w3-inline"
          placeholder="Enter YOG (e.g., 2023)"
          bind:value={selectedYOG}
        />
        <label for="studentStatus" class="w3-margin-left"
          >Active/Inactive Student:</label
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
      disabled={loading || displayData.length === 0 || loginDataLoading}
    >
      Get Login Data
    </button>

    {#if loginDataLoading}
      <div class="progress-bar-container w3-margin-top">
        <div
          class="progress-bar"
          style="width: {displayData.length
            ? (100 * loginDataProgress) / displayData.length
            : 0}%"
        >
          {displayData.length
            ? Math.round((100 * loginDataProgress) / displayData.length)
            : 0}%
        </div>
      </div>
    {/if}

    {#if loading}
      <p class="w3-opacity">Loading...</p>
    {:else}
      <!-- Single ReportTable for all tabs -->
      <ReportTable data={displayData} {columns} {headers} {filename} />
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

  .progress-bar-container {
    width: 100%;
    background: #eee;
    border-radius: 6px;
    height: 24px;
    margin-bottom: 12px;
    overflow: hidden;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4caf50, #2196f3);
    color: #fff;
    text-align: center;
    line-height: 24px;
    font-weight: bold;
    transition: width 0.3s;
    border-radius: 6px 0 0 6px;
    font-size: 1em;
  }
</style>
