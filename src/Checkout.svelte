<script lang="ts">
  import type { Student } from "./students";
  import type { Asset } from "./inventory";
  import { signoutAsset } from "./signout";
  import { searchForStudent, getStudent } from "./students";
  import { searchForAsset, assetStore } from "./inventory";
  import { form } from "svelte-forms";
  import { onMount, tick } from "svelte";
  import { select_option, time_ranges_to_array } from "svelte/internal";
  let assetTag = "";
  let studentName = "";
  let notes = "";
  let signoutForm;
  let updateCount = 0;
  let student: Student | null = null;
  let asset: Asset | null = null;
  let studentDropdown = [];
  const cachedValidations = {
    students: {},
    assets: {},
  };

  function sleep(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(true), ms);
    });
  }

  onMount(() => {
    signoutForm = form(
      () => ({
        assetTag: {
          value: assetTag,
          validators: [
            "required",
            (s) => ({ name: "4 or 5 digit code", valid: s.length > 3 }),
            async (s) => {
              if (s && s.length > 3) {
                if ($assetStore[s]) {
                  return {
                    name: "Asset found",
                    valid: true,
                  };
                }
                if (cachedValidations.assets[s]) {
                  return cachedValidations.assets[s];
                }
                let valid = false;
                let results = await searchForAsset(s);
                if (results.length) {
                  valid = true;
                }
                if (results.length == 1) {
                  assetTag = results[0].fields["Asset Tag"];
                }
                return {
                  name: "Asset not found",
                  valid,
                };
              }
            },
          ],
        },
        studentName: {
          value: studentName,
          validators: [
            "required",
            (s) => ({
              name: "Name should have a comma in it (last, first)",
              valid: s.indexOf(",") > -1,
            }),
            async (s) => {
              studentDropdown = [];
              updateCount += 1;
              let myUpdateNumber = updateCount;
              if (cachedValidations.students[s]) {
                return cachedValidations.students[s];
              }
              await tick();
              await sleep(500);
              if (!s || updateCount != myUpdateNumber) {
                return {
                  name: "still typing nevermind",
                  valid: true,
                };
              } else {
                let valid = false;
                let results = await searchForStudent(s);
                if (results.length > 0) {
                  valid = true;
                }
                let result = {
                  name: "Student not found",
                  valid,
                };
                cachedValidations[s] = result;
                if (results.length == 1) {
                  studentName = results[0].fields.Name;
                  cachedValidations.students[studentName] = result;
                } else if (results.length < 20) {
                  studentDropdown = results.map((result) => result.fields.Name);
                }
                return result;
              }
            },
          ],
        },
      }),
      {
        initCheck: true,
        validateOnChange: false,
        stopAtFirstError: false,
        stopAtFirstFieldError: false,
      }
    );
  });

  $: assetTag && signoutForm.validate();
  $: studentName && signoutForm.validate();
  $: student = getStudent(studentName);
  $: asset = $assetStore[assetTag];
  /* afterUpdate(() => {
    console.log("validate?");
    signoutForm.validate();
  });  */
  let checkedOut: {
    _id: string;
    fields: {
      Time: string;
    };
    asset: Asset;
    student: Student;
  }[] = [];
  async function checkOut() {
    console.log("check out", assetTag, "to", studentName);
    let result = await signoutAsset(student, asset, notes, "Out");
    if (result && result.length == 1) {
      let record = result[0];
      record.student = student;
      record.asset = asset;
      record._id = record.id; // for consistency -- airtable IDs we call _id
      checkedOut = [record, ...checkedOut];
      studentName = "";
      assetTag = "";
      notes = "";
    }
  }
</script>

<h1 class="w3-center">IACS Chromebook Signout</h1>

<!-- svelte-ignore component-name-lowercase -->
<form class="w3-container" on:submit|preventDefault>
  <div class="field">
    <label for="asset">Asset Tag</label>
    <input
      bind:value={assetTag}
      id="asset"
      type="text"
      class="w3-input"
      placeholder="Asset Tag"
      autocomplete="off"
    />
    {#if assetTag && $signoutForm?.fields?.assetTag?.errors}
      <span class="error">{$signoutForm.fields.assetTag.errors}</span>
    {/if}
    <div class="details">
      {#if asset}
        {asset.Make}
        {asset.Model} ({asset["Year of Purchase"]})
        <small>
          {asset.Serial}
          {asset["MAC-Wireless"]}
        </small>
      {/if}
    </div>
  </div>
  <div class="field">
    <label for="student">Student</label>
    <input
      bind:value={studentName}
      id="student"
      type="text"
      class="w3-input"
      autocomplete="off"
      placeholder="Last, First"
    />
    {#if studentName && $signoutForm?.fields?.studentName?.errors}
      <span class="error">{$signoutForm.fields.studentName.errors}</span>
    {/if}

    <div class="details">
      {#if student}
        {student.LASID}
        <a href={`mailto:${student.Email}`}>{student.Email}</a>
        {student.Advisor} Class of {student.YOG}
      {/if}
    </div>
    {#if studentDropdown.length}
      <ul class="w3-ul w3-border">
        {#each studentDropdown as option}
          <li
            class="w3-bar-item w3-button"
            on:click={() => (studentName = option)}
          >
            {option}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  <div class="field">
    <label for="notes">Notes</label>
    <textarea
      bind:value={notes}
      id="notes"
      class="w3-input"
      placeholder="Notes about the loan."
    />
  </div>

  <input
    class:w3-red={!!asset && !!student && signoutForm?.valid}
    disabled={!asset || !student || !$signoutForm?.valid}
    on:click={checkOut}
    type="submit"
    value="Check out"
  />
</form>
{#if checkedOut.length}
  <h4>You have just checked out...</h4>
  <table class="w3-table w3-bordered">
    <tr class="w3-blue">
      <th>Time</th>
      <th>Student</th>
      <th>Tag</th>
      <th>Make</th>
      <th>Model</th>
    </tr>
    {#each checkedOut as record (record.id)}
      <tr>
        <td>{new Date(record.fields.Time).toLocaleTimeString()} </td>
        <td>
          <a href={`mailto:${record.student.Email}`}>
            {record.student.Name}
          </a>
        </td>
        <td>{record.asset["Asset Tag"]}</td>
        <td>{record.asset.Make} </td>
        <td>{record.asset.Model}</td>
      </tr>
    {/each}
  </table>
{/if}

<style>
  ul {
    flex-direction: column;
    display: flex;
  }
  form {
    display: flex;
    flex-direction: column;
  }
  .field {
    position: relative;
    margin-top: 1em;
    margin-bottom: 1em;
  }
  .field:nth-child(1) {
    margin-top: 0;
  }
  input[type="submit"] {
    display: inline-block;
    margin-left: auto;
  }
  .field .error {
    color: var(--red, red);
    position: absolute;
    top: 0;
    right: 5px;
  }
  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
