<script type="ts">
  import type { Student } from "./students";
  import type { Asset } from "./inventory";
  import type { SignoutHistoryEntry } from "./signoutHistory";
  import AssetDisplay from "./AssetDisplay.svelte";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";
  import { form } from "svelte-forms";
  import {
    validateStudent,
    studentName,
    studentDropdown,
    assetTag,
  } from "./validators";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import StudentDropdown from "./StudentDropdown.svelte";
  import { onMount } from "svelte";
  import { getStudent } from "./students";
  import { assetStore, searchForAsset } from "./inventory";
  import { lookupSignoutHistory } from "./signoutHistory";
  import App from "./App.svelte";

  let lookupForm;
  let validators = () => ({
    student: {
      value: $studentName,
      validators: [validateStudent],
    },
  });
  $: lookupForm && $studentName && lookupForm.validate();
  let student: Student | null;
  $: student = getStudent($studentName);

  let loans: SignoutHistoryEntry[] | null;
  let current: Asset[] | null;

  async function getCurrentLoans() {
    let results = await searchForAsset(null, student.LASID);
    if (results.length) {
      current = results.map(
        (result) => $assetStore[result.fields["Asset Tag"]]
      );
    } else {
      current = [];
    }
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
    loans.sort(
      (a, b) => new Date(b.Time).getTime() - new Date(a.Time).getTime()
    );
    loans = loans;
  }

  $: if (student) {
    getCurrentLoans();
    getSignoutHistory();
  }
</script>

<div class="search w3-card-4" class:no-results={!student}>
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
      />
      <div slot="dropdown"><StudentDropdown /></div>
    </FormField>
  </SimpleForm>
</div>
{#if student}
  <article class="w3-card-4 w3-cell-middle">
    <header class="w3-container w3-blue w3-bar-block w3-padding-24">
      {student.Name}
    </header>
    <div class="w3-container">
      <p>
        Name: {student.Name}
      </p>
      <p>Advisor: {student.Advisor}</p>
      <p>YOG: {student.YOG}</p>
      <p>Email: <a href={`mailto:${student.Email}`}>{student.Email}</a></p>
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
{/if}

<style>
  article,
  .search {
    max-width: 800px;
    margin: auto;
  }

  article {
    padding-bottom: 32px;
  }
  .search {
    padding: 16px;
    transition: all 300ms;
    box-sizing: border-box;
    height: 64px;
    align-items: center;
    justify-content: center;
    display: flex;
  }
  .no-results {
    margin-top: calc(min(50vh - 150px, 75px));
    height: 300px;
  }
</style>
