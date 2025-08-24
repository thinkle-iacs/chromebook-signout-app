<script lang="ts">
  import MessageSender from "@notifications/MessageSender.svelte";

  import StudentContractStatus from "@contracts/StudentContractStatus.svelte";

  export let mode: "normal" | "it" = "normal";
  import { fly, fade } from "svelte/transition";
  import NameDropdown from "@people/components/NameDropdown.svelte";
  import AssetDisplay from "./AssetDisplay.svelte";
  import ListInput from "@components/ListInput.svelte";
  import FormField from "@components/FormField.svelte";
  import SimpleForm from "@components/SimpleForm.svelte";
  import type { Student } from "@data/students";
  import type { Staff } from "@data/staff";
  import { getCurrentLoansForStudent } from "@data/inventory";
  import type { Asset } from "@data/inventory";
  import { l } from "@utils/util";
  import type { CheckoutStatus } from "@data/signout";
  import { signoutAsset } from "@data/signout";
  import { addStudentNote, getStudent } from "@data/students";
  import { assetStore } from "@data/inventory";
  import { staffStore } from "@data/staff";
  import { writable, get } from "svelte/store";

  import {
    studentName,
    staffName,
    assetTags,
    /* chargerTag, */
    validateStudent,
    validateStaff,
    validateAssets,
    validateAsset,
  } from "@utils/validators";
  import SignoutHistoryTable from "@history/SignoutHistoryTable.svelte";
  import { contactStore, getContacts } from "@data/contacts";
  import { onMount } from "svelte";
  import { createEmail } from "@notifications/messageUtils";
  import StudentNote from "@people/students/StudentNote.svelte";
  import StudentTag from "@people/students/StudentTag.svelte";
  import CheckoutTicketLink from "@ui/tickets/components/CheckoutTicketLink.svelte";
  import { logger } from "@utils/log";
  let status: CheckoutStatus = "Out";
  let notes = "";
  let studentNotes = "";
  let showStudentNoteMode = false;
  let daily = false;
  let signoutForm;
  let student: Student | null = null;
  let staff: Staff | null = null;
  let assets: Asset[] | null = null;
  /* let charger: null = null; */

  onMount(async () => {
    logger.logVerbose("Fetch contacts!");
    await getContacts();
    logger.logVerbose($contactStore);
  });

  let validators = () => ({
    assetTag: {
      value: $assetTags,
      validators: [validateAssets],
    },
    /* charger: {
      value: $chargerTag,

      validators: [
        (s) => ({
          name: "3 digit code",
          valid: !s || s.length == 3,
          type: "warning",
        }),
        (s) => validateAsset(s, true),
      ],
    }, */
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
        /* (s) => ({
          name: "Enter name in format: Last, First",
          // show warning if there is a string with a space but no comma
          valid: !s || s.indexOf(" ") == -1 || s.indexOf(",") > -1,
          type: "warning",
        }), */
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
    $assetTags,
    /* $chargerTag, */
    $studentName,
    student,
    assets,
    status
  );
  $: student = studentMode && getStudent($studentName);
  $: staff = !studentMode && $staffStore[$staffName];
  $: assets = $assetTags.map((assetTag) => $assetStore[assetTag.toUpperCase()]);
  /* $: charger = $assetStore[$chargerTag]; */

  let checkedOut: {
    _id: string;
    fields: {
      Time: string;
    };
    asset: Asset;
    student: Student;
  }[] = [];

  async function doCheckout(assetObject, notes, daily) {
    let result = await signoutAsset(
      studentMode && student,
      !studentMode && staff,
      assetObject,
      notes,
      status,
      daily
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
      logger.logError("Unexpected result", result);
      return false;
    }
  }

  async function checkOut() {
    getNote();
    logger.logVerbose("Updated note:", notes);
    let success: boolean = false;
    if (assets) {
      for (let asset of assets) {
        success = await doCheckout(asset, notes, daily);
      }
    }
    /* if (charger) {
      success = await doCheckout(charger, (!assets && notes) || "", daily);
    } */
    if (studentNotes) {
      success = await addStudentNote(student, studentNotes);
      logger.logVerbose("student note success?", success);
    }
    if (success) {
      $studentName = "";
      $assetTags = [];
      notes = "";
      $screenNote = null;
      $keyboardNote = null;
      $powerNote = null;
      /* $chargerTag = ""; */
    }
  }

  const statusToButtonName = {
    Out: "Sign Out",
    Returned: "Return",
    Lost: "Mark as Lost",
    Repairing: "Repairing",
    Retire: "Retire",
  };
  let valid;
  $: valid =
    !!assets &&
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

  let extraButtons = [
    { label: "Kybard", note: "Taped keyboard cable" },
    { label: "Screen", note: "Screen needed to be replaced" },
    { label: "Hinge", note: "New screws needed for display hinges" },
    {
      label: "Keyboard Damage",
      note: "Keyboard section needed to be replaced",
    },
    { label: "Display Reseat", note: "Reseated display cable" },
    { label: "ResetOS", note: "Reset ChromeOS (Esc+Rfrsh+Power)" },

    /* kybard:Taped keyboard cable
Screen damage:Screen needed to be replaced
Display reseat:Reseated display cable
Keyboard damage:Keyboard section needed to be replaced
Hinge bolts:New screws needed for display hinges*/
  ];

  let formHeight;
  let outerDiv;
  let textHeight = 30;

  $: {
    if (outerDiv && status) {
      setTimeout(() => {
        let bod = outerDiv.closest("body");
        let top = outerDiv.closest(".w3-main");
        let room = bod.clientHeight - top.clientHeight;
        if (room > 0) {
          textHeight += room;
        }
      }, 100);
    }
  }
</script>

<article bind:clientHeight={formHeight} bind:this={outerDiv}>
  <SimpleForm
    {validators}
    onFormCreated={(f) => {
      signoutForm = f;
    }}
    on:submit={() => {
      if (valid) {
        checkOut();
      } else {
        logger.logRegular("Not ready to check out!");
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
            <StudentTag {student} />
            <StudentNote {student} />
            <StudentContractStatus {student} />
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
        name={(mode == "it" && "Asset Tag(s)") || "Asset Tag"}
        errors={$assetTags && $signoutForm?.fields?.assetTag?.errors}
      >
        <ListInput
          bind:value={$assetTags}
          id="assettag"
          type="text"
          class="w3-input"
          placeholder="Asset Tag"
          autocomplete="off"
        />
      </FormField>
      {#if mode != "it"}
        <!-- <FormField
          fullWidth={false}
          name="Charger"
          errors={$chargerTag && $signoutForm?.fields?.chargerTag?.errors}
        >
          <input
            bind:value={$chargerTag}
            id="charger"
            type="text"
            class="w3-input"
            placeholder="Charger (3 digit number)"
            autocomplete="off"
          />
        </FormField> -->
      {/if}
      <FormField name="Action" fullWidth={false}>
        {#if mode == "it"}
          <label class:bold={status == "Repairing"}
            ><input type="radio" bind:group={status} value="Repairing" /> In for
            Repair</label
          >
          <label class:bold={status == "Retire"}
            ><input type="radio" bind:group={status} value="Retire" /> Retire
          </label>
        {/if}
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
    {#if assets.length}
      <div in:fly|local={{ y: -30 }} out:fade class="rowDetail row">
        {#each assets as asset}
          {#if asset}
            <div in:fade|local out:fade|local>
              <AssetDisplay {asset} showOwner={true} />
            </div>
          {/if}
        {/each}
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
    {#if status == "Out"}
      <div class="dailyChoice">
        <label class:bold={!daily}>
          <input type="radio" bind:group={daily} value={false} />
          Long Term</label
        >
        <label class:bold={daily}>
          <input type="radio" bind:group={daily} value={true} />
          Daily Loan</label
        >
      </div>
    {/if}
    {#if mode == "it"}
      <div class="row">
        {#each extraButtons as extraButton}
          <button
            on:click={() => (notes += `${notes && "\n"}${extraButton.note}`)}
          >
            {extraButton.label}
          </button>
        {/each}
      </div>
    {/if}
    <FormField name={(status == "Returned" && "Other Notes") || "Notes"}>
      <textarea
        bind:value={notes}
        id="notes"
        class="w3-input w3-border"
        placeholder={notePlaceholder}
        style:height="80px"
      />
    </FormField>

    {#if student}
      <div class="w3-right-align w3-margin-bottom">
        <button
          class="w3-button"
          class:w3-light-grey={!showStudentNoteMode}
          class:w3-blue={showStudentNoteMode}
          style="width: auto;"
          on:click={() => {
            showStudentNoteMode = !showStudentNoteMode;
            if (showStudentNoteMode && !studentNotes && student?.Notes) {
              studentNotes = student.Notes;
            }
          }}>{showStudentNoteMode ? "Hide" : "Edit"} Student Notes</button
        >
      </div>
      {#if showStudentNoteMode}
        <textarea
          bind:value={studentNotes}
          class="w3-input w3-border"
          placeholder="Notes to add for this student"
          style:height="60px"
        />
      {/if}
    {/if}
    <div class="w3-right-align w3-margin-bottom">
      <CheckoutTicketLink {student} asset={assets && assets[0]} />
    </div>
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
  Send Message:
  <MessageSender signoutItem={checkedOut[0]} />
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
  textarea {
    height: 4em;
  }
</style>
