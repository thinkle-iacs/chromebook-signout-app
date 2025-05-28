<script lang="ts">
  import DataExporter from "./DataExporter.svelte";

  import {
    getStudentLoans,
    getStaffLoans,
    getNonLoanedChromebooks,
    assetStore,
  } from "../data/inventory";
  import AssetDisplay from "../AssetDisplay.svelte";
  import { get } from "svelte/store";

  let activeTab: "studentLoans" | "staffLoans" | "nonLoaned" = "studentLoans";
  let studentLoans = [];
  let staffLoans = [];
  let nonLoanedChromebooks = [];
  let loading = false;

  // New variables for filtering and sorting
  let selectedYOG: string | null = null;
  let sortBy: "alphabetical" | "yog" = "alphabetical";

  async function fetchData() {
    loading = true;
    if (activeTab === "studentLoans") {
      studentLoans = await normalizeAssets(
        await getStudentLoans(true, selectedYOG)
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
        ]}
      ></DataExporter>
      {#if studentLoans.length}
        <table class="w3-table w3-bordered w3-striped">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Student Email</th>
              <th>YOG</th>
            </tr>
          </thead>
          <tbody>
            {#each studentLoans as asset}
              <tr>
                <td><AssetDisplay {asset} /></td>
                <td>{asset["Email (from Student (Current))"]?.[0] || "N/A"}</td>
                <td>{asset["YOG (from Student (Current))"]?.[0] || "N/A"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
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
</style>
