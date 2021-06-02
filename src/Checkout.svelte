<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import NameDropdown from "./NameDropdown.svelte";
  import AssetDisplay from "./AssetDisplay.svelte";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import type { Student } from "./students";
  import type { Staff } from "./staff";
  import { getCurrentLoansForStudent } from "./inventory";
  import type { Asset } from "./inventory";
  import { l } from "./util";
  import type { CheckoutStatus } from "./signout";
  import { signoutAsset } from "./signout";
  import { getStudent } from "./students";
  import { assetStore } from "./inventory";
  import { staffStore } from "./staff";
  import { writable, get } from "svelte/store";
  import {
    studentName,
    staffName,
    assetTag,
    chargerTag,
    validateStudent,
    validateStaff,
    validateAsset,
  } from "./validators";
  import SignoutHistoryTable from "./SignoutHistoryTable.svelte";

  let status: CheckoutStatus = "Out";
  let notes = "";
  let signoutForm;
  let student: Student | null = null;
  let staff: Staff | null = null;
  let asset: Asset | null = null;
  let charger: Asset | null = null;

  let validators = () => ({
    assetTag: {
      value: $assetTag,
      validators: [
        (s) => ({
          name: "4 or 5 digit code",
          valid: s.length > 3,
          type: "warning",
        }),
        validateAsset,
      ],
    },
    charger: {
      value: $chargerTag,

      validators: [
        (s) => ({
          name: "3 digit code",
          valid: !s || s.length == 3,
          type: "warning",
        }),
        (s) => validateAsset(s, true),
      ],
    },
    staffName: {
      value: $staffName,
      validators: [
        (s) => {
          let valid = !(status == "Out" && !s);
          return {
            name: "Staff required for check out",
            valid,
          };
        },
        validateStaff,
      ],
    },
    studentName: {
      value: $studentName,
      validators: [
        (s) => {
          let valid = !(status == "Out" && studentMode && !s);
          return {
            name: "Student required for check out",
            valid,
          };
        },
        (s) => ({
          name: "Enter name in format: Last, First",
          // show warning if there is a string with a space but no comma
          valid: !s || s.indexOf(" ") == -1 || s.indexOf(",") > -1,
          type: "warning",
        }),
        validateStudent,
      ],
    },
  });

  function validateOn(signoutForm, ...args) {
    if (signoutForm) {
      signoutForm.validate();
    }
  }

  $: validateOn(
    signoutForm,
    $staffName,
    staff,
    $assetTag,
    $chargerTag,
    $studentName,
    student,
    asset,
    status
  );
  $: student = studentMode && getStudent($studentName);
  $: staff = !studentMode && $staffStore[$staffName];
  $: asset = $assetStore[$assetTag];
  $: charger = $assetStore[$chargerTag];

  let checkedOut: {
    _id: string;
    fields: {
      Time: string;
    };
    asset: Asset;
    student: Student;
  }[] = [];

  async function doCheckout(assetObject, notes) {
    let result = await signoutAsset(
      studentMode && student,
      !studentMode && staff,
      assetObject,
      notes,
      status
    );
    if (result && result.length == 1) {
      let record = result[0];
      record = {
        ...record,
        ...record.fields,
      };
      record.student = student;
      record.asset = assetObject;
      record.status = status;
      record._id = record.id; // for consistency -- airtable IDs we call _id
      checkedOut = [record, ...checkedOut];
      return true;
    } else {
      console.log("Unexpected result", result);
      return false;
    }
  }

  async function checkOut() {
    getNote();
    console.log("Updated note:", notes);
    let success: boolean = false;
    if (asset) {
      success = await doCheckout(asset, notes);
    }
    if (charger) {
      success = await doCheckout(charger, (!asset && notes) || "");
    }
    if (success) {
      $studentName = "";
      $assetTag = "";
      notes = "";
      $screenNote = null;
      $keyboardNote = null;
      $powerNote = null;
      $chargerTag = "";
    }
  }

  const statusToButtonName = {
    Out: "Sign Out",
    Returned: "Return",
    Lost: "Mark as Lost",
  };
  let valid;
  $: valid =
    (!!asset || !!charger) &&
    (status != "Out" ||
      (studentMode && !!student) ||
      (!studentMode && !!staff));
  let studentMode = true;
  let nameInput; // For passing to dropdown for focus tracking

  let keyboardNote = writable("");
  let screenNote = writable("");
  let powerNote = writable("");
  let notePlaceholder;
  let INTACT = "Intact";
  let DAMAGED = "Damaged";
  let UNKNOWN = "Unknown";

  var noteTypes = [
    { store: keyboardNote, name: "Keyboard" },
    { store: screenNote, name: "Screen" },
    {
      store: powerNote,
      damagedNote: "Does not power on, even when plugged in",
      name: "Powers on",
      unknownNote: "Did not power on; may be out of battery",
    },
  ];

  function getNote() {
    if (!$keyboardNote && !$powerNote && !$screenNote) {
      return;
    }
    let additionalNote = "";
    let intact = [];
    let unknown = [];
    let damaged = [];
    let notchecked = [];
    noteTypes.forEach(({ store, name, unknownNote, damagedNote }) => {
      let val = get(store);
      if (val == INTACT) {
        intact.push(name);
      } else if (val == DAMAGED) {
        damaged.push(damagedNote || name);
      } else if (val == UNKNOWN) {
        unknown.push(unknownNote || name);
      } else {
        notchecked.push(name);
      }
    });
    if (damaged.length) {
      additionalNote += "Damaged: " + damaged.join(", ") + ".  ";
    }
    if (unknown.length) {
      additionalNote += "Unknown: " + unknown.join(", ") + ".  ";
    }
    if (intact.length) {
      additionalNote += "Intact: " + intact.join(", ") + ".  ";
    }
    notes = additionalNote + "  " + notes;
  }

  $: {
    if ($screenNote == DAMAGED || $keyboardNote == DAMAGED) {
      notePlaceholder = "Please describe damage";
    } else {
      notePlaceholder = "Type any notes about state of machine or return here.";
    }
  }

  let currentLoans = [];
  $: updateCurrentLoans(status, student);
  async function updateCurrentLoans(...reactiveArguments) {
    if (status == "Out" && student) {
      currentLoans = await getCurrentLoansForStudent(student);
    } else {
      currentLoans = [];
    }
  }
</script>

<article>
  <SimpleForm
    {validators}
    onFormCreated={(f) => {
      signoutForm = f;
    }}
    on:submit={() => {
      if (valid) {
        checkOut();
      } else {
        console.log("Not ready to check out!");
      }
    }}
  >
    <div class="row">
      <FormField
        fullWidth={true}
        errors={(studentMode && $signoutForm?.fields?.studentName?.errors) ||
          $signoutForm?.fields?.staffName?.errors}
        name={(studentMode && "Student") || "Staff"}
      >
        <nav slot="label" class="w3-bar w3-border-bottom">
          <button
            class:w3-button={studentMode == false}
            class:w3-blue={studentMode == true}
            class="w3-bar-item"
            on:click={() => (studentMode = true)}>Student</button
          >
          <button
            class:w3-button={studentMode == true}
            class:w3-blue={studentMode == false}
            class:w3-border={studentMode == false}
            class="w3-bar-item w3-button"
            on:click={() => (studentMode = false)}>Staff</button
          >
        </nav>
        {#if studentMode}
          <input
            bind:value={$studentName}
            bind:this={nameInput}
            id="student"
            type="text"
            class="w3-input"
            autocomplete="off"
            placeholder="Last, First"
          />
        {:else}
          <input
            bind:value={$staffName}
            bind:this={nameInput}
            id="staff"
            type="text"
            class="w3-input"
            autocomplete="off"
            placeholder="Last, First"
          />
        {/if}
        <div slot="details">
          {#if studentMode && student}
            <a
              tabindex="-1"
              href={`/student/${student.Name}`}
              on:click={l(`/student/${student.Name}`)}
            >
              {student.Email}
              {student.Advisor} Class of {student.YOG}
              (LASID: {student.LASID})
            </a>
          {/if}
          {#if !studentMode && staff}
            <a tabindex="-1" href={`mailto:${staff.Email}`}>{staff.Email}</a>
            {(staff.School &&
              staff.School.replace(/Innovation Academy Charter/, "")) ||
              ""}
            {staff.Department}
            {staff.Role}
          {/if}
          {#if currentLoans.length}
            <div in:fade|local class="w3-deep-orange w3-card w3-container">
              <h3>Student already has loans out:</h3>
              {#each currentLoans as loan}
                <AssetDisplay asset={loan} />
              {/each}
            </div>
          {/if}
        </div>
        <div slot="dropdown">
          <NameDropdown
            inputElement={nameInput}
            mode={(studentMode && "student") || "staff"}
          />
        </div>
      </FormField>
    </div>
    <div class="row">
      <FormField
        fullWidth={false}
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
      </FormField>
      <FormField
        fullWidth={false}
        name="Charger"
        errors={$assetTag && $signoutForm?.fields?.assetTag?.errors}
      >
        <input
          bind:value={$chargerTag}
          id="charger"
          type="text"
          class="w3-input"
          placeholder="Charger (3 digit number)"
          autocomplete="off"
        />
      </FormField>
      <FormField name="Action" fullWidth={false}>
        <label class:bold={status == "Out"}
          ><input type="radio" bind:group={status} value="Out" /> Sign Out</label
        >
        <label class:bold={status == "Returned"}
          ><input type="radio" bind:group={status} value="Returned" /> Check Back
          In</label
        >
        <label class:bold={status == "Lost"}
          ><input type="radio" bind:group={status} value="Lost" /> Mark as Lost</label
        >
      </FormField>
    </div>
    {#if asset || charger}
      <div in:fly|local={{ y: -30 }} out:fade class="rowDetail row">
        {#if asset}
          <div in:fade|local out:fade|local>
            <AssetDisplay {asset} showOwner={true} />
          </div>
        {/if}
        {#if charger}
          <div in:fade|local out:fade|local>
            <AssetDisplay asset={charger} showOwner={true} />
          </div>
        {/if}
        {#if charger && asset && asset["Charger Type"]}
          {#if charger["Model"] == asset["Charger Type"]}
            <span class="w3-text-blue">Correct charger!</span>
          {:else}
            <span class="w3-text-orange">
              Machine requires
              {asset["Charger Type"]}
              but you have {charger["Model"] || "Unknown"}?
            </span>
          {/if}
        {/if}
      </div>
    {/if}
    {#if status == "Returned"}
      <div in:fly|local={{ y: -30 }} out:fade|local class="row">
        <FormField name="Machine Notes">
          <div class="noteChoice">
            <label class:bold={$screenNote == ""}>
              <input
                style="display: none"
                type="radio"
                bind:group={$screenNote}
                value={undefined}
              />
              Check screen:
            </label>
            <label class:bold={$screenNote === INTACT}
              ><input type="radio" bind:group={$screenNote} value={INTACT} /> Screen
              intact</label
            >
            <label class:bold={$screenNote === DAMAGED}
              ><input type="radio" bind:group={$screenNote} value={DAMAGED} /> Screen
              damaged
            </label>
          </div>
          <div class="noteChoice">
            <label class:bold={$keyboardNote == ""}>
              <input
                style="display:none"
                type="radio"
                bind:group={$keyboardNote}
                value={undefined}
              />
              Check keyboard:
            </label>
            <label class:bold={$keyboardNote === INTACT}
              ><input type="radio" bind:group={$keyboardNote} value={INTACT} /> Keyboard
              intact</label
            >
            <label class:bold={$keyboardNote === DAMAGED}
              ><input type="radio" bind:group={$keyboardNote} value={DAMAGED} />
              Keyboard damaged
            </label>
          </div>
          <div class="noteChoice">
            <label class:bold={$powerNote == ""}>
              <input
                style="display:none"
                type="radio"
                bind:group={$powerNote}
                value={undefined}
              />
              Check power:
            </label>

            <label class:bold={$powerNote === INTACT}
              ><input type="radio" bind:group={$powerNote} value={INTACT} /> Powered
              on when opened</label
            >
            <label class:bold={$powerNote === UNKNOWN}
              ><input type="radio" bind:group={$powerNote} value={UNKNOWN} />
              Did not power on, may be out of battery
            </label>
            <label class:bold={$powerNote === DAMAGED}
              ><input type="radio" bind:group={$powerNote} value={DAMAGED} /> Did
              not power on, even after charging
            </label>
          </div>
        </FormField>
      </div>
    {/if}
    <FormField name={(status == "Returned" && "Other Notes") || "Notes"}>
      <textarea
        bind:value={notes}
        id="notes"
        class="w3-input"
        placeholder={notePlaceholder}
      />
    </FormField>

    <input
      class:w3-red={valid}
      disabled={!valid}
      type="submit"
      class="w3-button"
      value={statusToButtonName[status]}
    />
  </SimpleForm>
</article>

{#if checkedOut.length}
  <article class="w3-container">
    <h4>Recent Updates</h4>
    <SignoutHistoryTable signoutHistoryItems={checkedOut} />
  </article>
{/if}

<style>
  a {
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  label {
    display: inline-flex;
    align-items: center;
    color: #333;
    transition: all 300ms;
  }
  label input[type="radio"] {
    margin-right: 5px;
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
    margin-top: 1em;
  }
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .slot {
    display: contents;
  }
  .row {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .row > :global(*) {
    margin-left: 16px;
  }
  .row > :global(*):first-child {
    margin-left: 0;
  }
  .rowDetail {
    min-height: 72px;
  }

  .noteChoice > label:first-child {
    position: absolute;
    left: 0;
    max-width: 10em;
  }
  .noteChoice {
    margin-left: 10em;
    margin-top: 5px;
  }
</style>
