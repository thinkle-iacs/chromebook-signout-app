<script lang="ts">
  import { fly, fade } from "svelte/transition";
  import NameDropdown from "./NameDropdown.svelte";
  import AssetDisplay from "./AssetDisplay.svelte";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import type { Student } from "./students";
  import type { Staff } from "./staff";
  import type { Asset } from "./inventory";
  import type { CheckoutStatus } from "./signout";
  import { signoutAsset } from "./signout";
  import { getStudent } from "./students";
  import { assetStore } from "./inventory";
  import { staffStore } from "./staff";
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
      console.log("validate!");
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
  $: student = getStudent($studentName);
  $: staff = $staffStore[$staffName];
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
    console.log("check out", $assetTag, "to", $studentName);
    if (powerNote) {
      notes = `${powerNote}. ${notes}`;
    }
    if (keyboardNote) {
      notes = `${keyboardNote}. ${notes}`;
    }
    if (screenNote) {
      notes = `${screenNote}. ${notes}`;
    }
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
      screenNote = null;
      keyboardNote = null;
      powerNote = null;
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

  let keyboardNote;
  let screenNote;
  let powerNote;
  let notePlaceholder;

  $: {
    if (
      (screenNote && screenNote.match(/damage/)) ||
      (keyboardNote && keyboardNote.match(/damage/))
    ) {
      notePlaceholder = "Please describe damage";
    } else {
      notePlaceholder = "Type any notes about state of machine or return here.";
    }
  }
</script>

<article>
  <SimpleForm
    {validators}
    onFormCreated={(f) => {
      signoutForm = f;
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
        <span slot="details">
          {#if studentMode && student}
            <a tabindex="-1" href={`mailto:${student.Email}`}>{student.Email}</a
            >
            {student.Advisor} Class of {student.YOG}
            (LASID: {student.LASID})
          {/if}
          {#if !studentMode && staff}
            <a tabindex="-1" href={`mailto:${staff.Email}`}>{staff.Email}</a>
            {(staff.School &&
              staff.School.replace(/Innovation Academy Charter/, "")) ||
              ""}
            {staff.Department}
            {staff.Role}
          {/if}
        </span>
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
      <div in:fly={{ y: -30 }} out:fade class="rowDetail row">
        {#if asset}
          <div in:fade out:fade>
            <AssetDisplay {asset} showOwner={true} />
          </div>
        {/if}
        {#if charger}
          <div in:fade out:fade>
            <AssetDisplay asset={charger} showOwner={true} />
          </div>
        {/if}
        {#if charger && asset["Charger Type"]}
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
      <div in:fly={{ y: -30 }} out:fade class="row">
        <FormField name="Machine Notes">
          <select class="w3-select" bind:value={screenNote}>
            <option value={undefined}>Please check screen</option>
            <option value="Screen intact when returned">Screen intact</option>
            <option value="Screen damaged when returned">Screen damaged</option>
          </select>
          <select class="w3-select" bind:value={keyboardNote}>
            <option value={undefined}>Please check keyboard</option>
            <option value="Keyboard intact when returned"
              >Keyboard intact</option
            >
            <option value="Keyboard damaged when returned"
              >Keyboard damaged</option
            >
          </select>
          <select class="w3-select" bind:value={powerNote}>
            <option value={undefined}>Please check that screen comes on</option>
            <option value="Screen displayed when returned"
              >Screen displayed when opened</option
            >
            <option value="Machine not powered on when returned"
              >Machine did not power on, may be out of battery.</option
            >
            <option
              value="Machine unable to power when returned (after charging)"
              >Machine unable to power on, even after charging.</option
            >
          </select>
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
      on:click={checkOut}
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
</style>
