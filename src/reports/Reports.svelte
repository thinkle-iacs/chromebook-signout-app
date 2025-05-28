<script lang="ts">
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

  async function fetchData() {
    loading = true;
    if (activeTab === "studentLoans") {
      studentLoans = await normalizeAssets(await getStudentLoans(true));
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
  $: console.log(studentLoans);
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
      {#if studentLoans.length}
        <table class="w3-table w3-bordered w3-striped">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Student Email</th>
            </tr>
          </thead>
          <tbody>
            {#each studentLoans as asset}
              <tr>
                <td><AssetDisplay {asset} /></td>
                <td>{asset["Email (from Student (Current))"]?.[0] || "N/A"}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p>No student loans found.</p>
      {/if}
    {:else if activeTab === "staffLoans"}
      <h2>Staff Loans</h2>
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
</style>
