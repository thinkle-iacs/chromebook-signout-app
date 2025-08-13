<script lang="ts">
  import StudentInfo from "./StudentInfo.svelte";
  import router from "page";
  import { onMount } from "svelte";

  import type { Staff } from "@data/staff"; // Import Staff type
  import type { Asset } from "@data/inventory";
  import type { SignoutHistoryEntry } from "@data/signoutHistory";
  import AssetDisplay from "./AssetDisplay.svelte";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";
  import { validateStaff, staffName } from "./validators"; // Use staff validators
  import FormField from "./FormField.svelte";
  import SimpleForm from "@components/SimpleForm.svelte";
  import NameDropdown from "./NameDropdown.svelte";
  import { searchForStaff, staffStore } from "@data/staff"; // Use staff data functions
  import { getCurrentLoansForStaff } from "@data/inventory"; // Replace student loans with staff loans
  import { lookupSignoutHistory } from "@data/signoutHistory";
  import MessageSender from "./MessageSender.svelte";
  import StudentGoogleAdminHistory from "./StudentGoogleAdminHistory.svelte";

  export let name;
  if (name) {
    $staffName = name;
    console.log("Got staff", $staffName, name);
  }

  let lookupForm;
  let validators = () => ({
    staff: {
      value: $staffName,
      validators: [validateStaff], // Validate staff
    },
  });

  function doValidation(...args) {
    if (lookupForm) {
      console.log("Validate!");
      lookupForm.validate();
    }
  }
  $: doValidation(lookupForm, $staffName);

  let staff: Staff | null;
  $: staff = $staffStore[$staffName];

  $: if (staff) {
    console.log("Found staff:", staff);
    router(`/staff/${staff["Full Name"]}`);
  } else {
    router(`/staff/`);
  }

  let loans: SignoutHistoryEntry[] | null;
  let current: Asset[] | null;

  async function getCurrentLoans() {
    current = await getCurrentLoansForStaff(staff); // Fetch current loans for staff
    console.log("Current loans for staff:", current);
  }

  async function getSignoutHistory() {
    let staffResults = await lookupSignoutHistory({ staff });
    console.log("Got staff results", staffResults);
    staffResults.reverse();
    loans = staffResults;
    let recordNumbers = new Set();
    let assetTags = new Set();
    staffResults.forEach((r) => {
      assetTags.add(r["Asset Tag (from Asset)"][0]);
      recordNumbers.add(r.Num);
    });
    console.log("We have tags:", assetTags);
    for (let tag of Array.from(assetTags)) {
      console.log("Now look up other results for ", tag);
      let assetResults = await lookupSignoutHistory({
        asset: { "Asset Tag": tag },
      });
      for (let result of assetResults) {
        if (!recordNumbers.has(result.Num)) {
          console.log("Adding", result);
          loans = [...loans, result];
          recordNumbers.add(result.Num);
        }
      }
    }
    console.log("Now sort", loans);
    loans.sort((a, b) => b.Num - a.Num);
    loans = loans;
  }

  $: if (staff) {
    getCurrentLoans();
    getSignoutHistory();
  }

  let nameInput: HTMLInputElement | null;
  let latestLoan;

  function getLatestLoan(loans: SignoutHistoryEntry[]) {
    if (!loans) {
      return;
    }
    latestLoan = loans.find((l) => {
      if (l.LASID == staff.psnOID) {
        // Match staff identifier
        if (l.Status == "Out") {
          return true;
        }
      }
    });
  }

  $: getLatestLoan(loans);
  let activeTab: "loans" | "google" = "loans";
</script>

<div class="search w3-xlarge w3-container">
  <SimpleForm
    {validators}
    onFormCreated={(f) => {
      lookupForm = f;
    }}
  >
    <FormField
      name="Staff"
      errors={lookupForm && $lookupForm?.fields?.staff?.errors}
    >
      <input
        autocomplete="off"
        id="staff"
        bind:value={$staffName}
        type="text"
        bind:this={nameInput}
      />
      <div slot="dropdown">
        <NameDropdown inputElement={nameInput} mode="staff" />
      </div>
    </FormField>
  </SimpleForm>
</div>
{#if staff}
  <div class="w3-container">
    <article class="w3-card w3-cell-middle">
      <div>
        <h2>{staff["Full Name"]}</h2>
        <div class="role">{staff.Role}</div>
        <div class="dept">{staff.Department}</div>
      </div>
      <nav class="w3-nav w3-bar w3-border-bottom">
        <button
          class="w3-bar-item w3-button"
          class:w3-blue={activeTab == "loans"}
          on:click={() => (activeTab = "loans")}>Loan History</button
        >
      </nav>

      <div class="w3-container">
        {#if activeTab == "loans"}
          <h3>Current Loans:</h3>
          {#if !current}
            <p class="w3-opacity w3-ital">Fetching...</p>
          {:else}
            {#each current as asset}
              <AssetDisplay {asset} />
            {:else}
              No current loans
            {/each}
          {/if}
          <h3>Signout History:</h3>
          {#if !loans}
            <p class="w3-opacity w3-ital">Fetching...</p>
          {:else if loans.length}
            {#if latestLoan}
              <MessageSender signoutItem={latestLoan} />
            {/if}
            <SignoutHistoryTable
              signoutHistoryItems={loans}
              studentOnlyMode={false}
            />
          {:else}
            Never signed anything out.
          {/if}
        {/if}
      </div>
    </article>
    <article class="w3-card w3-cell-middle">
      <StudentGoogleAdminHistory student={staff} />
    </article>
  </div>
{/if}

<style>
  article,
  .search {
    max-width: 1100px;
    margin: auto;
    margin-bottom: 32px;
    margin-top: 16px;
  }

  article {
    padding-bottom: 32px;
  }

  input {
    width: min(100vh - 32px, 800px);
  }
</style>
