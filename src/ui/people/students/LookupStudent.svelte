<script lang="ts">
  import { logger } from "@utils/log";
  import StudentInfo from "./StudentInfo.svelte";
  import router from "page";
  import type { Student } from "@data/students";
  import type { Asset } from "@data/inventory";
  import type { SignoutHistoryEntry } from "@data/signoutHistory";
  import AssetDisplay from "@assets/AssetDisplay.svelte";
  import SignoutHistoryTable from "@history/SignoutHistoryTable.svelte";
  import { validateStudent, studentName } from "@utils/validators";
  import FormField from "@components/FormField.svelte";
  import SimpleForm from "@components/SimpleForm.svelte";
  import NameDropdown from "@people/components/NameDropdown.svelte";
  import { getStudent, studentsStore } from "@data/students";
  import { getCurrentLoansForStudent } from "@data/inventory";
  import { lookupSignoutHistory } from "@data/signoutHistory";
  import MessageSender from "@notifications/MessageSender.svelte";
  import StudentGoogleAdminHistory from "@googleAdmin/StudentGoogleAdminHistory.svelte";
  import StudentTicketsTab from "./StudentTicketsTab.svelte";
  import Loader from "@components/Loader.svelte";
  export let name = "";
  if (name) {
    $studentName = name;
    logger.logVerbose("LookupStudent got student", $studentName, name);
  }
  let lookupForm;
  let validators = () => ({
    student: {
      value: $studentName,
      validators: [validateStudent],
    },
  });
  function doValidation(...args) {
    if (lookupForm) {
      lookupForm.validate();
    }
  }
  $: doValidation(lookupForm, $studentName);
  let student: Student | null;
  $: student = getStudent($studentName, $studentsStore);
  $: if (student) {
    router(`/student/${student.Name}`);
  } else {
    router(`/student/`);
  }
  let loans: SignoutHistoryEntry[] | null;
  let current: Asset[] | null;
  let loansLoaded = false;
  let loadingLoans = false;
  let lastLoansStudentId: string | null = null;
  async function ensureLoansLoaded() {
    if (!student || loansLoaded || loadingLoans) return;
    loadingLoans = true;
    try {
      current = await getCurrentLoansForStudent(student);
      await loadSignoutHistory();
      loansLoaded = true;
    } finally {
      loadingLoans = false;
    }
  }
  async function loadSignoutHistory() {
    let studentResults = await lookupSignoutHistory({ student });
    studentResults.reverse();
    loans = studentResults;
    let recordNumbers = new Set();
    let assetTags = new Set();
    studentResults.forEach((r) => {
      assetTags.add(r["Asset Tag (from Asset)"][0]);
      recordNumbers.add(r.Num);
    });
    for (let tag of Array.from(assetTags)) {
      let assetResults = await lookupSignoutHistory({
        asset: { "Asset Tag": tag },
      });
      for (let result of assetResults) {
        if (!recordNumbers.has(result.Num)) {
          loans = [...loans, result];
          recordNumbers.add(result.Num);
        }
      }
    }
    loans.sort((a, b) => b.Num - a.Num);
    loans = loans;
  }
  // Remove previous reactive blocks that reset state each render and replace with guarded logic
  $: if (student && student._id !== lastLoansStudentId) {
    // student changed
    lastLoansStudentId = student._id;
    loans = null;
    current = null;
    loansLoaded = false;
    loadingLoans = false;
    if (activeTab === "loans") ensureLoansLoaded();
  }
  $: if (activeTab === "loans" && student && !loansLoaded && !loadingLoans) {
    ensureLoansLoaded();
  }
  let nameInput: HTMLInputElement | null;
  let latestLoan;
  function getLatestLoan(loans: SignoutHistoryEntry[]) {
    if (!loans) return;
    latestLoan = loans.find(
      (l) => l.LASID == student.LASID && l.Status == "Out"
    );
  }
  $: getLatestLoan(loans);
  let activeTab: "loans" | "google" | "tickets" = "loans";
</script>

<div class="search w3-xlarge w3-container">
  <SimpleForm
    {validators}
    onFormCreated={(f) => {
      lookupForm = f;
    }}
  >
    <FormField
      name="Student"
      errors={lookupForm && $lookupForm?.fields?.student?.errors}
    >
      <input
        autocomplete="off"
        id="student"
        bind:value={$studentName}
        type="text"
        bind:this={nameInput}
      />
      <div slot="dropdown"><NameDropdown inputElement={nameInput} /></div>
    </FormField>
  </SimpleForm>
</div>
{#if student}
  <div class="w3-container">
    <article class="w3-card w3-cell-middle">
      <StudentInfo {student} />
      <nav class="w3-nav w3-bar w3-border-bottom">
        <button
          class="w3-bar-item w3-button"
          class:w3-blue={activeTab == "loans"}
          on:click={() => (activeTab = "loans")}>Loan History</button
        >
        <button
          class="w3-bar-item w3-button"
          class:w3-blue={activeTab == "google"}
          on:click={() => (activeTab = "google")}>Google Admin Data</button
        >
        <button
          class="w3-bar-item w3-button"
          class:w3-blue={activeTab == "tickets"}
          on:click={() => (activeTab = "tickets")}
          >Tickets{#if student?.Tickets}&nbsp;({student.Tickets
              .length}){/if}</button
        >
      </nav>
      <div class="w3-container">
        <StudentGoogleAdminHistory {student} active={activeTab === "google"} />
        <StudentTicketsTab {student} active={activeTab === "tickets"} />
        {#if activeTab == "loans"}
          <h3>Current Loans:</h3>
          {#if !current}
            <p class="w3-opacity w3-ital">
              {loansLoaded ? "No current loans" : "Fetching..."}
            </p>
          {:else}
            {#each current as asset}
              <AssetDisplay {asset} />
            {:else}
              No current loans
            {/each}
          {/if}
          <h3>Signout History:</h3>
          {#if !loans}
            <p class="w3-opacity w3-ital">
              {#if loansLoaded}
                No history
              {:else}
                <Loader text="Fetching..." working={true} />
              {/if}
            </p>
          {:else if loans.length}
            {#if latestLoan}
              <MessageSender signoutItem={latestLoan} />
            {/if}
            <SignoutHistoryTable
              signoutHistoryItems={loans}
              {student}
              studentOnlyMode={true}
            />
          {:else}
            Never signed anything out.
          {/if}
        {/if}
      </div>
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
