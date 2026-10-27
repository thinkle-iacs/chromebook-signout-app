<script lang="ts">
  import router from "page";
  import { logger } from "@utils/log";

  import type { Staff } from "@data/staff"; // Import Staff type
  import type { Asset } from "@data/inventory";
  import type { SignoutHistoryEntry } from "@data/signoutHistory";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import SignoutHistoryTable from "@history/SignoutHistoryTable.svelte";
  import { validateStaff, staffName } from "@utils/validators"; // Use staff validators
  import FormField from "@components/FormField.svelte";
  import SimpleForm from "@components/SimpleForm.svelte";
  import NameDropdown from "@people/components/NameDropdown.svelte";
  import { staffStore } from "@data/staff";
  import { getCurrentLoansForStaff } from "@data/inventory"; // Replace student loans with staff loans
  import { lookupSignoutHistory } from "@data/signoutHistory";
  import MessageSender from "@notifications/MessageSender.svelte";
  import StudentGoogleAdminHistory from "@googleAdmin/StudentGoogleAdminHistory.svelte";

  export let name = "";
  export let isIt: boolean = false;
  if (name) {
    $staffName = name;
    logger.logVerbose("Got staff", $staffName, name);
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
      logger.logVerbose("Validate!");
      lookupForm.validate();
    }
  }
  $: doValidation(lookupForm, $staffName);

  let staff: Staff | null;
  $: staff = $staffStore[$staffName];

  $: if (staff) {
    logger.logVerbose("Found staff:", staff);
    router(`/staff/${staff["Full Name"]}`);
  } else {
    router(`/staff/`);
  }

  let loans: SignoutHistoryEntry[] | null;
  let current: Asset[] | null;

  let currentError = "";
  let historyError = "";
  let request = 0;

  function loadLoans(selected: Staff | null) {
    const version = ++request;
    current = null;
    loans = null;
    currentError = "";
    historyError = "";
    if (!selected) return;

    getCurrentLoansForStaff(selected).then((results) => {
      if (version === request) current = results;
    }).catch((error) => {
      if (version === request) currentError = "Unable to load current assignments. Please try again.";
      logger.logError("Staff assignment lookup failed", error);
    });
    lookupSignoutHistory({ staff: selected }).then((results) => {
      if (version === request) loans = results.sort((a, b) => b.Num - a.Num);
    }).catch((error) => {
      if (version === request) historyError = "Unable to load signout history. Please try again.";
      logger.logError("Staff history lookup failed", error);
    });
  }

  $: loadLoans(staff);

  let nameInput: HTMLInputElement | null;
  $: latestLoan = loans?.find((loan) =>
    loan.LASID === staff?.psnOID && loan.Status === "Out"
  );
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
          <h3>Current Assignments:</h3>
          <p class="w3-small">Machines assigned in Airtable, including assignments without a signout entry.</p>
          {#if currentError}
            <p role="alert">{currentError}</p>
          {:else if !current}
            <p class="w3-opacity w3-ital">Fetching...</p>
          {:else}
            {#each current as asset}
              <AssetDisplay {asset} />
            {:else}
              No current assignments
            {/each}
          {/if}
          <h3>Signout History:</h3>
          {#if historyError}
            <p role="alert">{historyError}</p>
          {:else if !loans}
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
            No signout history entries recorded for this teacher. Assignments made directly in Airtable may have no signout entry.
          {/if}
        {/if}
      </div>
    </article>
    <article class="w3-card w3-cell-middle">
      <StudentGoogleAdminHistory student={staff} {isIt} />
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
