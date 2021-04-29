<script type="ts">
  import router from "page";
  import type { Student } from "./students";
  import type { Asset } from "./inventory";
  import type { SignoutHistoryEntry } from "./signoutHistory";
  import AssetDisplay from "./AssetDisplay.svelte";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";
  import { validateStudent, studentName } from "./validators";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import NameDropdown from "./NameDropdown.svelte";
  import { getStudent, studentsStore } from "./students";
  import { assetStore, getCurrentLoansForStudent } from "./inventory";
  import { lookupSignoutHistory } from "./signoutHistory";
  import App from "./App.svelte";
  export let name;
  if (name) {
    $studentName = name;
    console.log("Got student", $studentName, name);
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
      console.log("Validate!");
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

  async function getCurrentLoans() {
    current = await getCurrentLoansForStudent(student);
  }

  async function getSignoutHistory() {
    let studentResults = await lookupSignoutHistory({ student });
    console.log("Got student results", studentResults);
    studentResults.reverse();
    loans = studentResults;
    let recordNumbers = new Set();
    let assetTags = new Set();
    studentResults.forEach((r) => {
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

  $: if (student) {
    getCurrentLoans();
    getSignoutHistory();
  }

  let nameInput: HTMLInputElement | null;
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
      <div slot="details">
        {#if student}
          <div class="w3-container">
            <article class="w3-card w3-cell-middle">
              <header class="w3-container w3-blue w3-bar-block w3-padding-24">
                {student.Name}
              </header>
              <div class="w3-container">
                <p>
                  Name: {student.Name}
                </p>
                <p>Advisor: {student.Advisor}</p>
                <p>YOG: {student.YOG}</p>
                <p>
                  Email: <a href={`mailto:${student.Email}`}>{student.Email}</a>
                </p>
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
                  <SignoutHistoryTable signoutHistoryItems={loans} {student} />
                {:else}
                  Never signed anything out.
                {/if}
              </div>
            </article>
          </div>
        {/if}
      </div>
    </FormField>
  </SimpleForm>
</div>

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
