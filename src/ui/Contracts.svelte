<script lang="ts">
  import { onMount } from "svelte";
  import { getContracts, contractStore, mapContract } from "@data/contracts";
  import type { Contract } from "@data/contracts";
  import FormField from "./FormField.svelte";
  import SimpleForm from "@components/SimpleForm.svelte";
  import NameDropdown from "./NameDropdown.svelte";
  import StudentInfo from "./StudentInfo.svelte";
  import { studentName, validateStudent } from "./validators";
  import { getStudent, studentsStore } from "@data/students";

  let contract: Contract;
  let lastMode;
  let student: Student | null;

  let contractList = Object.keys($contractStore);
  $: contractList = Object.keys($contractStore).filter((contractKey) => {
    if (mode == "Mapped") {
      return $contractStore[contractKey].Student?.length;
    } else {
      return !$contractStore[contractKey].Student?.length;
    }
  });

  $: student = getStudent($studentName, $studentsStore);
  onMount(() => {
    changeMode();
  });
  let mode = "Unmapped";

  function changeMode() {
    if (mode != lastMode) {
      if (mode == "Unmapped") {
        getContracts(true);
      } else if (mode == "Mapped") {
        getContracts(false, false, true);
      } else {
        getContracts(false, true);
      }
      lastMode = mode;
    }
  }

  $: changeMode(mode);
  let contractFields = [
    "ID",
    "Signature",
    "Student First",
    "Student Last",
    "Parent First",
    "Parent Last",
    "WiFi",
    "Grade Level",
    "Date",
  ];

  let validators = () => ({
    student: {
      value: $studentName,
      validators: [validateStudent],
    },
  });
  let contractForm;
  let theContract: Contract;
  function selectContractForMapping(contract: Contract) {
    theContract = contract;
    student = null;
    $studentName =
      theContract["Student Last"].replace(/\s+$/, "") +
      ", " +
      theContract["Student First"].replace(/\s+$/, "");
  }

  async function doMapContract() {
    let nextContract;
    if (autoContinue) {
      let id = theContract.ID;
      let currentIndex = contractList.indexOf(`${id}`);
      if (currentIndex > -1) {
        nextContract = $contractStore[contractList[currentIndex + 1]];
      }
    }
    let newContract = await mapContract(theContract, student);
    if (autoContinue) {
      if (nextContract) {
        selectContractForMapping(nextContract);
      }
    } else {
      theContract = null;
    }
  }

  $: {
    if (autoMode && student) {
      console.log("Autoconfirm!");
      doMapContract();
    }
  }

  function doValidation(...args) {
    console.log("Do validate!", $studentName);
    if (contractForm) {
      console.log("Validate");
      contractForm.validate();
    }
  }
  $: doValidation(contractForm, $studentName);
  let nameInput;
  let autoMode = true;
  let autoContinue = true;
</script>

<h2>Map Contracts</h2>
<input type="checkbox" bind:checked={autoMode} /> Autoconfirm matched students
<input type="checkbox" bind:checked={autoContinue} /> Move to next student
automatically
{#if theContract}
  <div class="float-me w3-card w3-border w3-white w3-container w3-padding-32">
    <div class="w3-container">
      <input type="checkbox" bind:checked={autoMode} /> Autoconfirm matched
      students
      <input type="checkbox" bind:checked={autoContinue} /> Move to next student
    </div>
    <SimpleForm
      {validators}
      on:submit={doMapContract}
      onFormCreated={(f) => {
        contractForm = f;
      }}
    >
      <table class="w3-table w3-responsive">
        <tr>
          <th colspan="2">Contract as filled out...</th>
        </tr>
        <tr>
          <th>Has wifi?:</th>
          <td>{theContract.WiFi}</td>
        </tr>
        <tr>
          <th>Parent name:</th>
          <td>{theContract["Parent First"]} {theContract["Parent Last"]}</td>
        </tr>
        <tr>
          <th>Parent signature:</th>
          <td>{theContract.Signature}</td>
        </tr>
        <tr>
          <th>Student name:</th>
          <td
            >{theContract["Student First"]}
            {theContract["Student Last"]}</td
          >
        </tr>
      </table>
      <h2>Map to student in database:</h2>

      <FormField
        name="Search:"
        errors={contractForm && $contractForm?.fields?.student?.errors}
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

      {#if student}
        Found student: <StudentInfo {student} />
      {:else}
        Searching...
      {/if}
      <div class="w3-bar button-bar">
        <button class="w3-button w3-round" on:click={() => (theContract = null)}
          >&times; Close</button
        >
        <input
          class="w3-button w3-blue nospace"
          disabled={!student}
          type="submit"
          value="Confirm"
        />
      </div>
    </SimpleForm>
  </div>
{/if}

<div>
  <nav class="w3-bar w3-border-bottom">
    <button
      class="w3-bar-item w3-button"
      class:w3-blue={mode == "Unmapped"}
      on:click={() => (mode = "Unmapped")}
    >
      New Contracts
    </button>
    <button
      class="w3-bar-item w3-button"
      class:w3-blue={mode == "Mapped"}
      on:click={() => (mode = "Mapped")}
    >
      Existing Contracts
    </button>
    <!-- <button
      class="w3-bar-item w3-button"
      class:w3-blue={mode == "All"}
      on:click={() => (mode = "All")}
    >
      All Contracts
    </button> -->
  </nav>
  <table class="w3-table w3-striped w3-bordered w3-responsive">
    <!-- {#each Object.keys($contractStore) as contractId} -->
    <tr class="w3-pale-blue">
      {#each contractFields as field}
        <th>{field}</th>
      {/each}
      <td>Student</td>
    </tr>
    {#each contractList as contractId}
      {@const contract = $contractStore[contractId]}
      <tr>
        {#each contractFields as field}
          <td class:signature={field == "Signature"}>
            <span>{contract[field]}</span>
          </td>
        {/each}
        <td>
          {#if contract.Student && contract.Student.length}
            {#if contract["Name (from Student)"]}<b
                >{contract["Name (from Student)"][0]}</b
              >{/if}
            <div class="w3-small">
              {#if contract["LASID (from Student)"]}{contract[
                  "LASID (from Student)"
                ][0]}{/if}

              {#if contract["Email (from Student)"]}<br />{contract[
                  "Email (from Student)"
                ][0]}{/if}
            </div>
          {:else}
            <button on:click={() => selectContractForMapping(contract)}
              >Find Student</button
            >
          {/if}
        </td>
      </tr>
    {/each}
  </table>
</div>

<style>
  .float-me {
    background-color: white;
    width: 80vw;
    max-height: 70vh;
    overflow-y: scroll;
    position: fixed;
    top: 10vh;
    left: 10vh;
    z-index: 99;
  }
  .signature {
    font-style: italic;
  }
  .button-bar {
    display: flex;
    justify-content: end;
  }
  input[type="submit"].nospace {
    margin-left: 0;
  }
</style>
