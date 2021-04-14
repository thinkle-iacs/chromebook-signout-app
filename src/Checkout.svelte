<script lang="ts">
  import { form } from "svelte-forms";
  import { onMount, tick } from "svelte";
  import { select_option, time_ranges_to_array } from "svelte/internal";
  let assetTag = "";
  let studentName = "";
  let signoutForm;
  let updateCount = 0;

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
              updateCount += 1;
              let myUpdateNumber = updateCount;
              console.log("Update", myUpdateNumber);
              await tick();
              await sleep(500);
              console.log("Wake up and check!", myUpdateNumber, updateCount);
              if (updateCount != myUpdateNumber) {
                return {
                  name: "still typing nevermind",
                  valid: true,
                };
              } else {
                return {
                  name: "Student not found",
                  valid: s == "Hinkle, Thomas",
                };
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
  /* afterUpdate(() => {
    console.log("validate?");
    signoutForm.validate();
  });  */
  function checkOut() {
    console.log("check out", assetTag, "to", studentName);
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
    />
    {#if assetTag && $signoutForm?.fields?.assetTag?.errors}
      <span class="error">{$signoutForm.fields.assetTag.errors}</span>
    {/if}
  </div>
  <div class="field">
    <label for="student">Student</label>
    <input
      bind:value={studentName}
      id="student"
      type="text"
      class="w3-input"
      placeholder="Last, First"
    />
    {#if studentName && $signoutForm?.fields?.studentName?.errors}
      <span class="error">{$signoutForm.fields.studentName.errors}</span>
    {/if}
  </div>
  <div class="field">
    <label for="notes">Notes</label>
    <textarea id="notes" class="w3-input" placeholder="Notes about the loan." />
  </div>
  <input
    disabled={!$signoutForm?.valid}
    on:click={checkOut}
    type="submit"
    value="Check out"
  />
</form>

<style>
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
