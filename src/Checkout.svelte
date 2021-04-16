<script lang="ts">
  import StudentDropdown from "./StudentDropdown.svelte";
  import AssetDisplay from "./AssetDisplay.svelte";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import type { Student } from "./students";
  import type { Asset } from "./inventory";
  import type { CheckoutStatus } from './signout';
  import { signoutAsset } from "./signout";
  import { searchForStudent, getStudent } from "./students";
  import { searchForAsset, assetStore } from "./inventory";
  import { form } from "svelte-forms";
  import { onMount, tick } from "svelte";
  import { select_option, time_ranges_to_array } from "svelte/internal";
  import {
    studentName,
    studentDropdown,
    assetTag,
    validateStudent,
    validateAsset,
  } from "./validators";
  let status : CheckoutStatus = 'Out'
  let notes = "";
  let signoutForm;
  let updateCount = 0;
  let student: Student | null = null;
  let asset: Asset | null = null;

  let validators = () => ({
    assetTag: {
      value: $assetTag,
      validators: [
        "required",
        (s) => ({
          name: "4 or 5 digit code",
          valid: s.length > 3,
          type: "warning",
        }),
        validateAsset,
      ],
    },
    studentName: {
      value: $studentName,
      validators: [
         (s) => {
          if (status=='Out' && !s) {
            return {
              name : 'Student required for check out',
              valid : false
            }
          } else {
            return {
              name : 'Student required for check out',
              valid : true
            }
          }
        }, 
        (s) => ({
          name: "Enter name in format: Last, First",
          // show warning if there is a string with a space but no comma
          valid: !s || s.indexOf(" ") == -1 || s.indexOf(",") > -1,
          type: "warning",
        }),
        validateStudent,
        (s) => ({
          name : 'Choose a student',
          valid : status != 'Out' || !!student
        })
      ],
    },
  });

  function validateOn (signoutForm, ...args) {
    if (signoutForm) {      
      signoutForm.validate();      
    }
  }

  $: validateOn(signoutForm,$assetTag,$studentName,student,asset,status);
  $: student = getStudent($studentName);
  $: asset = $assetStore[$assetTag];
  let checkedOut: {
    _id: string;
    fields: {
      Time: string;
    };
    asset: Asset;
    student: Student;
  }[] = [];

  async function checkOut() {
    console.log("check out", $assetTag, "to", $studentName);
    let result = await signoutAsset(student, asset, notes, status);
    if (result && result.length == 1) {
      let record = result[0];
      record.student = student;
      record.asset = asset;
      record.status = status;
      record._id = record.id; // for consistency -- airtable IDs we call _id
      checkedOut = [record, ...checkedOut];
      $studentName = "";
      $assetTag = "";
      notes = "";
    }
  }

  const statusToButtonName = {
    'Out' : 'Sign Out',
    'Returned' : 'Return',
    'Lost' : 'Mark as Lost'
  }
  let valid;
  $: valid = !!asset && (status!='Out' || !!student)
</script>

<h1 class="w3-center w3-blue">IACS Chromebook Signout</h1>

<!-- svelte-ignore component-name-lowercase -->

<SimpleForm
  {validators}
  onFormCreated={(f) => {
    signoutForm = f;
  }}
>
  <FormField
    name="Asset Tag"
    errors={$assetTag && $signoutForm?.fields?.assetTag?.errors}
  >
    <input
      bind:value={$assetTag}
      id="assettag"
      type="text"
      class="w3-input"
      placeholder="Asset Tag"
      autocomplete="off"
    />
    <div class="slot" slot="details">
      {#if asset}
        <AssetDisplay {asset}>
          {#if asset["Email (from Student (Current))"]}
            Currently signed out to
            {asset["Email (from Student (Current))"]}
          {/if}
        </AssetDisplay>
      {/if}
    </div>
  </FormField>
  <FormField errors={$signoutForm?.fields?.studentName?.errors} name="Student">
    <input
      bind:value={$studentName}
      id="student"
      type="text"
      class="w3-input"
      autocomplete="off"
      placeholder="Last, First"
    />
    <span slot="details">
      {#if student}
        {student.LASID}
        <a tabindex="-1" href={`mailto:${student.Email}`}>{student.Email}</a>
        {student.Advisor} Class of {student.YOG}
      {/if}
    </span>
    <div slot="dropdown">
      <StudentDropdown />
    </div>
  </FormField>
  <FormField name="Notes">
    <textarea
      bind:value={notes}
      id="notes"
      class="w3-input"
      placeholder="Notes about the loan."
    />
  </FormField>
  <FormField name="Action">
      <label class:bold={status=='Out'}><input type="radio" bind:group={status} value="Out"> Sign Out</label>
      <label class:bold={status=='Returned'}><input type="radio" bind:group={status} value="Returned"> Check Back In</label>
      <label class:bold={status=='Lost'}><input type="radio" bind:group={status} value="Lost"> Mark as Lost</label>
  </FormField>
  <input
    class:w3-red={valid}
    disabled={!valid}
    on:click={checkOut}
    type="submit"
    class="w3-button"
    value={
      statusToButtonName[status]
    }
  />
</SimpleForm>

{#if checkedOut.length}
  <article class="w3-container">
    <h4>Recent Updates</h4>
    <table class="w3-table w3-bordered">
      <tr class="w3-grey">
        <th>Time</th>
        <th>Student</th>
        <th>Tag</th>
        <th>Make</th>
        <th>Model</th>
        <th>Status</th>
      </tr>
      {#each checkedOut as record (record.id)}
        <tr>
          <td>{new Date(record.fields.Time).toLocaleTimeString()} </td>
          <td>
            {#if record.student}
            <a href={`mailto:${record.student.Email}`}>
              {record.student.Name}
            </a>
            {/if}
          </td>
          <td>{record.asset["Asset Tag"]}</td>
          <td>{record.asset.Make} </td>
          <td>{record.asset.Model}</td>
          <td>{record.status}</td>
        </tr>
      {/each}
    </table>
  </article>
{/if}

<style>
  label {
    display: inline;
    color: #333;
    transition: all 300ms;
  }
  .bold {
    color: black;        
    text-shadow: 0px 0px 1px #222;
  }
  input[type="radio"] {
    margin-left: 16px;
  }  
  article {
    max-width: 1100px;
    margin: auto;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .slot {
    display: contents;
  }
</style>
