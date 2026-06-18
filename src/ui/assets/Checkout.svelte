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
  import { getCurrentLoansForStudent, updateAsset } from "@data/inventory";
  import type { Asset } from "@data/inventory";
  import { l, withLoadingIndicator } from "@utils/util";
  import type { CheckoutStatus } from "@data/signout";
  import { signoutAsset } from "@data/signout";
  import { getRepairingAssetTags } from "@data/signoutHistory";
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
  import Loader from "@components/Loader.svelte";
  import {
    billForLostDevice,
    getBillableStudentId,
    findLostBillingTicket,
    cancelLostDeviceBilling,
    DEFAULT_REPLACEMENT_COST,
  } from "@data/lostDeviceBilling";
  import { showToast } from "@components/toastStore";
  import {
    getOpenTicketsWithTempDevice,
    getOpenTicketsForStudentObj,
    unlinkTempDevice,
    linkTempDevice,
  } from "@data/tempDevice";
  import type { Ticket } from "@data/tickets";

  // Set via the /checkout/lost/:tag route to land here with the asset
  // pre-filled and "Mark as Lost" selected (e.g. from student lookup).
  export let lostTag: string = "";

  let status: CheckoutStatus = "Out";
  let notes = "";
  let studentNotes = "";
  let showStudentNoteMode = false;
  let daily = false;
  let scanMode = false;
  let signoutForm;
  let student: Student | null = null;
  let staff: Staff | null = null;
  let assets: Asset[] | null = null;
  /* let charger: null = null; */

  let validating = writable({
    assetTag: false,
    staffName: false,
    studentName: false,
  });

  let repairingTags: Set<string> = new Set();

  onMount(async () => {
    if (lostTag) {
      $assetTags = [lostTag];
      status = "Lost";
    }
    logger.logVerbose("Fetch contacts!");
    await getContacts();
    logger.logVerbose($contactStore);
    // So a scanned device that's in for repair shows "IN REPAIR" rather than
    // reading as a normal loan — avoids re-issuing a device we already hold.
    try {
      repairingTags = await getRepairingAssetTags();
    } catch (e) {
      logger.logError("Failed to load in-repair devices:", e);
    }
  });

  let validators = () => ({
    assetTag: {
      value: $assetTags,
      validators: [
        withLoadingIndicator(validateAssets, validating, "assetTag"),
      ],
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
        withLoadingIndicator(validateStaff, validating, "staffName"),
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
        withLoadingIndicator(validateStudent, validating, "studentName"),
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
  $: assets = $assetTags.map(
    (t) => $assetStore[t.toUpperCase()] || $assetStore[t.toLowerCase()]
  );
  /* $: charger = $assetStore[$chargerTag]; */

  let checkedOut: {
    _id: string;
    fields: {
      Time: string;
    };
    asset: Asset;
    student: Student;
  }[] = [];

  let checkoutStatus = writable("");

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

  let billLostReplacement = false;
  let lostReplacementCost = DEFAULT_REPLACEMENT_COST;

  function currentStudentEmail(asset) {
    const email = asset && asset["Email (from Student (Current))"];
    return (Array.isArray(email) ? email.join(", ") : email) || "";
  }

  // --- Recovery: checking in a device that was marked Lost ---
  let cancelLostBilling = true;
  let lostBillingTickets = {}; // asset tag -> Ticket | null (null = none found)
  let lostBillingLookups = new Set();

  $: returnedLostAssets =
    (status == "Returned" &&
      (assets || []).filter((a) => a && a.Status === "Lost")) ||
    [];
  $: if (status == "Returned") lookupLostBillingTickets(assets);

  async function lookupLostBillingTickets(assets) {
    for (let asset of assets || []) {
      if (!asset || asset.Status !== "Lost") continue;
      const tag = asset["Asset Tag"];
      if (lostBillingLookups.has(tag)) continue;
      lostBillingLookups.add(tag);
      try {
        const ticket = await findLostBillingTicket(tag);
        lostBillingTickets = { ...lostBillingTickets, [tag]: ticket };
      } catch (e) {
        logger.logError("Failed to look up lost-billing ticket:", e);
        lostBillingLookups.delete(tag); // allow retry
      }
    }
  }
  $: billableLostAssets = (assets || []).filter(
    (asset) => asset && getBillableStudentId(asset)
  );

  // --- Temp device swap: checking IN a device that's a temp on a ticket ---
  // tag -> open Ticket that lists it as Temporary Device (or null if none)
  let tempTicketsByTag: Record<string, Ticket | null> = {};
  let tempTicketLookups = new Set<string>();
  // tag -> whether to unlink (default true)
  let unlinkTempByTag: Record<string, boolean> = {};

  $: returnedTempAssets =
    (status == "Returned" &&
      (assets || []).filter(
        (a) => a && tempTicketsByTag[a["Asset Tag"]]
      )) ||
    [];
  $: if (status == "Returned") lookupTempTickets(assets);

  async function lookupTempTickets(assets) {
    for (let asset of assets || []) {
      if (!asset) continue;
      const tag = asset["Asset Tag"];
      if (tempTicketLookups.has(tag)) continue;
      tempTicketLookups.add(tag);
      try {
        const tickets = await getOpenTicketsWithTempDevice(tag);
        tempTicketsByTag = { ...tempTicketsByTag, [tag]: tickets[0] || null };
        if (tickets[0] && unlinkTempByTag[tag] === undefined) {
          unlinkTempByTag = { ...unlinkTempByTag, [tag]: true };
        }
      } catch (e) {
        logger.logError("Failed to look up temp-device tickets:", e);
        tempTicketLookups.delete(tag); // allow retry
      }
    }
  }

  // --- Temp device swap: checking OUT a loaner to a student with a ticket ---
  let studentOpenTickets: Ticket[] = [];
  let lastTicketStudentId: string | null = null;
  let linkTempForCheckout = false;
  let linkTempTouched = false; // user overrode the default — stop auto-setting
  let lastCheckoutTag = "";
  let selectedTempTicketId = "";
  // Only offer linking on a single-device checkout (a ticket has one temp).
  $: checkoutAsset =
    status == "Out" && studentMode && (assets || []).length === 1
      ? assets[0]
      : null;

  $: if (status == "Out" && studentMode && student) {
    loadStudentOpenTickets(student);
  } else if (!student) {
    studentOpenTickets = [];
    lastTicketStudentId = null;
  }

  async function loadStudentOpenTickets(student) {
    if (student._id === lastTicketStudentId) return;
    lastTicketStudentId = student._id;
    studentOpenTickets = [];
    selectedTempTicketId = "";
    linkTempForCheckout = false;
    linkTempTouched = false;
    try {
      const tickets = await getOpenTicketsForStudentObj(student);
      // Guard against a later student selection winning the race
      if (student._id !== lastTicketStudentId) return;
      studentOpenTickets = tickets;
      if (tickets.length) selectedTempTicketId = tickets[0]._id;
    } catch (e) {
      logger.logError("Failed to load student open tickets:", e);
      // Clear the guard so a later interaction retries instead of being
      // stuck with no checkbox until the page is refreshed.
      if (student._id === lastTicketStudentId) lastTicketStudentId = null;
    }
  }

  // Default the link on for a Temp-purpose loaner, but only until the user
  // overrides it; re-derive when the checkout device changes.
  $: if (checkoutAsset && checkoutAsset["Asset Tag"] !== lastCheckoutTag) {
    lastCheckoutTag = checkoutAsset["Asset Tag"];
    linkTempTouched = false;
  }
  $: if (checkoutAsset && studentOpenTickets.length && !linkTempTouched) {
    linkTempForCheckout = checkoutAsset.Purpose === "Temp";
  }

  // Distinct asset tags just checked back in, for the "open a ticket" shortcut.
  $: recentReturnedTags = [
    ...new Set(
      checkedOut
        .filter((r) => r.status === "Returned" && r.asset)
        .map((r) => r.asset["Asset Tag"])
    ),
  ];

  async function billLostAsset(asset) {
    $checkoutStatus = `Sending invoice for ${asset["Asset Tag"]}`;
    try {
      const { ticket } = await billForLostDevice(asset, {
        cost: lostReplacementCost,
        note: notes,
      });
      showToast(
        `Asked business office to invoice family for ${asset["Asset Tag"]}`,
        "success"
      );
      return ticket;
    } catch (e) {
      logger.logError("Lost-device billing failed:", e);
      showToast(`Invoice failed for ${asset["Asset Tag"]}: ${e.message}`, "error");
      return null;
    } finally {
      $checkoutStatus = "";
    }
  }

  async function checkOut() {
    getNote();
    logger.logVerbose("Updated note:", notes);
    let success: boolean = false;
    let verb = statusToVerb[status] || "Updating";
    let billing = status == "Lost" && billLostReplacement;
    if (assets) {
      let count = 0;
      for (let asset of assets) {
        count++;
        // Bill first so the signout note can record the ticket number.
        let assetNotes = notes;
        if (billing && asset) {
          if (getBillableStudentId(asset)) {
            const ticket = await billLostAsset(asset);
            if (ticket) {
              assetNotes =
                (notes ? notes + " " : "") +
                `Billed family $${lostReplacementCost} for replacement` +
                (ticket.Number ? ` (Ticket #${ticket.Number}).` : ".");
            }
          } else {
            showToast(
              `${asset["Asset Tag"]}: no current student, so no invoice was sent`,
              "info"
            );
          }
        }
        // Recovered lost device: queue an invoice cancellation notice
        if (
          status == "Returned" &&
          cancelLostBilling &&
          asset?.Status === "Lost" &&
          lostBillingTickets[asset["Asset Tag"]]
        ) {
          const billingTicket = lostBillingTickets[asset["Asset Tag"]];
          $checkoutStatus = `Sending cancellation for ${asset["Asset Tag"]}`;
          try {
            await cancelLostDeviceBilling(billingTicket, { note: notes });
            assetNotes =
              (notes ? notes + " " : "") +
              `Recovered — billing cancellation sent (Ticket #${billingTicket.Number}).`;
            showToast(
              `Asked business office to cancel invoice for ${asset["Asset Tag"]}`,
              "success"
            );
          } catch (e) {
            logger.logError("Billing cancellation failed:", e);
            showToast(
              `Cancellation failed for ${asset["Asset Tag"]}: ${e.message}`,
              "error"
            );
          }
          $checkoutStatus = "";
        }
        $checkoutStatus = `${verb} ${count} of ${assets.length}`;
        success = await doCheckout(asset, assetNotes, daily);
        $checkoutStatus = "";
        if (success && asset) {
          if (status == "Lost") {
            await updateAsset(asset._id, { Status: "Lost" });
          } else if (
            (status == "Out" || status == "Returned") &&
            asset.Status == "Lost"
          ) {
            // Lost device turned up again — clear the Lost flag
            await updateAsset(asset._id, { Status: "Active" });
          }
        }
        // Temp swap: returned a loaner that's a temp on a ticket -> unlink it
        if (
          success &&
          asset &&
          status == "Returned" &&
          unlinkTempByTag[asset["Asset Tag"]] &&
          tempTicketsByTag[asset["Asset Tag"]]
        ) {
          const t = tempTicketsByTag[asset["Asset Tag"]];
          $checkoutStatus = `Updating Ticket #${t.Number}`;
          try {
            await unlinkTempDevice(t, asset["Asset Tag"]);
            showToast(
              `Removed ${asset["Asset Tag"]} as temp device on Ticket #${t.Number}`,
              "success"
            );
          } catch (e) {
            logger.logError("Failed to unlink temp device:", e);
            showToast(
              `Couldn't update Ticket #${t.Number}: ${e.message}`,
              "error"
            );
          }
          $checkoutStatus = "";
        }
        // Temp swap: loaned a device to a ticket-holder -> link it as temp
        if (
          success &&
          asset &&
          status == "Out" &&
          linkTempForCheckout &&
          selectedTempTicketId &&
          checkoutAsset &&
          asset["Asset Tag"] === checkoutAsset["Asset Tag"]
        ) {
          const t = studentOpenTickets.find(
            (x) => x._id === selectedTempTicketId
          );
          if (t) {
            $checkoutStatus = `Linking to Ticket #${t.Number}`;
            try {
              await linkTempDevice(t, asset);
              showToast(
                `Linked ${asset["Asset Tag"]} as temp device on Ticket #${t.Number}`,
                "success"
              );
            } catch (e) {
              logger.logError("Failed to link temp device:", e);
              showToast(
                `Couldn't update Ticket #${t.Number}: ${e.message}`,
                "error"
              );
            }
            $checkoutStatus = "";
          }
        }
      }
    }
    /* if (charger) {
      success = await doCheckout(charger, (!assets && notes) || "", daily);
    } */
    if (studentNotes) {
      $checkoutStatus = `Adding student note`;
      success = await addStudentNote(student, studentNotes);
      $checkoutStatus = "";
      logger.logVerbose("student note success?", success);
    }
    if (success) {
      $studentName = "";
      $assetTags = [];
      notes = "";
      billLostReplacement = false;
      // Reset temp-swap state for the next transaction
      tempTicketsByTag = {};
      tempTicketLookups = new Set();
      unlinkTempByTag = {};
      studentOpenTickets = [];
      lastTicketStudentId = null;
      linkTempForCheckout = false;
      linkTempTouched = false;
      lastCheckoutTag = "";
      selectedTempTicketId = "";
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

  const statusToVerb = {
    Out: "Checking out",
    Returned: "Returning",
    Lost: "Marking as Lost",
    Repairing: "Repairing",
    Retire: "Retiring",
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
          <Loader
            working={$studentName && $validating.studentName}
            text="Finding student..."
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
          <Loader
            working={$staffName && $validating.staffName}
            text="Finding staff..."
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
                <AssetDisplay
                  asset={loan}
                  signoutStatus={repairingTags.has(loan["Asset Tag"])
                    ? "Repairing"
                    : ""}
                />
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
          {scanMode}
          id="assettag"
          placeholder={scanMode ? "Scan tag, press Enter to add…" : "Asset tag or serial number"}
          autocomplete="off"
        />
        <label class="scan-mode-label w3-small">
          <input type="checkbox" bind:checked={scanMode} />
          Batch scan mode (Enter adds to list)
        </label>
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
        {#each assets as asset, i}
          <div in:fade|local out:fade|local>
            {#if asset}
              <AssetDisplay
                {asset}
                showOwner={true}
                signoutStatus={repairingTags.has(asset["Asset Tag"])
                  ? "Repairing"
                  : ""}
              />
            {:else if $validating.assetTag}
              <Loader working={true} text="Finding asset..." />
            {:else if $assetTags[i].length > 3}
              <span class="w3-text-red">No Matching Asset Found</span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
    {#if status == "Lost"}
      <div in:fly|local={{ y: -30 }} out:fade|local class="row">
        <FormField name="Billing">
          <label class:bold={billLostReplacement}>
            <input type="checkbox" bind:checked={billLostReplacement} />
            Bill family for replacement
          </label>
          {#if billLostReplacement}
            <label style="margin-left: 16px;">
              Replacement cost ($):
              <input
                type="number"
                min="0"
                bind:value={lostReplacementCost}
                class="w3-input w3-border"
                style="width: 7em; display: inline-block; margin-left: 8px;"
              />
            </label>
            <div class="w3-small w3-text-gray" style="margin-top: 4px;">
              {#if billableLostAssets.length}
                We'll create a closed "Lost" ticket and ask the business office
                to invoice
                {billableLostAssets
                  .map(
                    (a) =>
                      `${currentStudentEmail(a) || "the current student"} for ${
                        a["Asset Tag"]
                      }`
                  )
                  .join("; ")}.
              {:else}
                None of these devices have a current student, so there is no
                one to invoice. Sign the device out to the student first if you
                need to bill them.
              {/if}
            </div>
          {/if}
        </FormField>
      </div>
    {/if}
    {#if status == "Returned" && returnedLostAssets.length}
      <div in:fly|local={{ y: -30 }} out:fade|local class="row">
        <FormField name="Recovery">
          <div>
            {#each returnedLostAssets as asset (asset["Asset Tag"])}
              {#if lostBillingTickets[asset["Asset Tag"]] === undefined}
                <div class="w3-small w3-text-gray">
                  {asset["Asset Tag"]} was marked lost — checking for invoices…
                </div>
              {:else if lostBillingTickets[asset["Asset Tag"]]}
                <div class="w3-small">
                  <b>{asset["Asset Tag"]}</b> was marked lost and the family was
                  billed ${lostBillingTickets[asset["Asset Tag"]][
                    "Repair Cost"
                  ] || "?"} (Ticket #{lostBillingTickets[asset["Asset Tag"]]
                    .Number}).
                </div>
              {:else}
                <div class="w3-small w3-text-gray">
                  {asset["Asset Tag"]} was marked lost; no invoice found, so
                  it will simply be checked back in.
                </div>
              {/if}
            {/each}
            {#if returnedLostAssets.some((a) => lostBillingTickets[a["Asset Tag"]])}
              <label class:bold={cancelLostBilling}>
                <input type="checkbox" bind:checked={cancelLostBilling} />
                Ask business office to cancel the invoice
              </label>
            {/if}
          </div>
        </FormField>
      </div>
    {/if}
    {#if status == "Returned" && returnedTempAssets.length}
      <div in:fly|local={{ y: -30 }} out:fade|local class="row">
        <FormField name="Temp Device">
          <div>
            {#each returnedTempAssets as asset (asset["Asset Tag"])}
              {@const t = tempTicketsByTag[asset["Asset Tag"]]}
              {#if t}
                <label class:bold={unlinkTempByTag[asset["Asset Tag"]]}>
                  <input
                    type="checkbox"
                    bind:checked={unlinkTempByTag[asset["Asset Tag"]]}
                  />
                  Remove <b>{asset["Asset Tag"]}</b> as the temp device on
                  Ticket #{t.Number}
                </label>
              {/if}
            {/each}
          </div>
        </FormField>
      </div>
    {/if}
    {#if checkoutAsset && studentOpenTickets.length}
      <div in:fly|local={{ y: -30 }} out:fade|local class="row">
        <FormField name="Temp Device">
          <div>
            <label class:bold={linkTempForCheckout}>
              <input
                type="checkbox"
                bind:checked={linkTempForCheckout}
                on:change={() => (linkTempTouched = true)}
              />
              Link <b>{checkoutAsset["Asset Tag"]}</b> as the temp device for
              {#if studentOpenTickets.length === 1}
                Ticket #{studentOpenTickets[0].Number}
              {:else}
                ticket:
              {/if}
            </label>
            {#if studentOpenTickets.length > 1}
              <select
                class="w3-select w3-border"
                style="width:auto; display:inline-block; margin-left:8px;"
                bind:value={selectedTempTicketId}
                disabled={!linkTempForCheckout}
              >
                {#each studentOpenTickets as t (t._id)}
                  <option value={t._id}>
                    #{t.Number} — {t["Ticket Status"]}
                  </option>
                {/each}
              </select>
            {/if}
          </div>
        </FormField>
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
    <Loader working={Boolean($checkoutStatus)} text={$checkoutStatus} />
    <input
      class:w3-red={valid}
      disabled={!valid || Boolean($checkoutStatus)}
      type="submit"
      class="w3-button"
      value={statusToButtonName[status]}
    />
  </SimpleForm>
</article>
<article class="w3-container">
  {#if recentReturnedTags.length}
    <div class="w3-margin-bottom">
      <span class="w3-small w3-text-gray">Need to open a ticket?</span>
      {#each recentReturnedTags as tag (tag)}
        <a
          class="w3-button w3-small w3-border w3-round w3-margin-left"
          href={`/tickets/new/device/${tag}`}
          on:click={l(`/tickets/new/device/${tag}`)}
        >
          Open a ticket about {tag}
        </a>
      {/each}
    </div>
  {/if}
  {#if checkedOut.length}
    Send Message:
    <MessageSender signoutItem={checkedOut[0]} />
    <article class="w3-container">
      <h4>Recent Updates</h4>
      <SignoutHistoryTable signoutHistoryItems={checkedOut} />
    </article>
  {/if}
</article>

<style>
  .scan-mode-label {
    display: block;
    margin-top: 4px;
    color: #555;
    gap: 4px;
  }
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
