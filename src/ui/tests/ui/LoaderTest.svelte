<script lang="ts">
  import FormField from "@components/FormField.svelte";
  import Loader from "@components/Loader.svelte";
  let working = false;
  let currentStep = 0;

  let doSteps = (time, steps: number) => {
    return new Promise((resolve) => {
      currentStep = 0;
      working = true;
      const interval = setInterval(() => {
        if (currentStep < steps) {
          currentStep++;
        } else {
          clearInterval(interval);
          working = false;
          resolve("Done");
        }
      }, time / steps);
    });
  };

  let doSomething = (time = 2000, fail = false) => {
    return new Promise((resolve, reject) => {
      working = true;
      setTimeout(() => {
        if (fail) {
          working = false;
          reject(new Error("Failed!"));
        } else {
          working = false;
          resolve("Success!");
        }
      }, time);
    });
  };

  let timeout = 2000;
  let success = true;
  let text = "Doing really important stuff";
  let steps = 0;
</script>

<label for="text">Loader Text: </label>
<input id="text" type="text" bind:value={text} />

<label for="steps">Loader Steps: </label>
<input id="steps" type="number" bind:value={steps} />

<label for="timeout">Timeout (ms): </label>
<input id="timeout" type="number" bind:value={timeout} />

<label for="success">Success: </label>
<input id="success" type="checkbox" bind:checked={success} />

<button
  class="w3-button w3-blue"
  on:click={() => {
    if (steps) {
      doSteps(timeout, steps);
    } else {
      doSomething(timeout, !success);
    }
  }}
>
  Start Loader
</button>
Bare loader is here :<Loader {text} {working} {steps} {currentStep} />
<div>Loader in a div below...</div>
<hr />
<div>
  <Loader {text} {working} {steps} {currentStep} />
</div>
<div class="w3-container">
  <h3>Example UI with Progress In It</h3>
  <FormField name="test-progress-field">
    <span slot="label">In a Form Example:</span>
    <input />
    <Loader {text} {working} {steps} {currentStep} />
  </FormField>
</div>
