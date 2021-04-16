<script type="ts">
  import { onMount } from "svelte";
  import { form } from "svelte-forms";
  export let onFormCreated: Function;

  export let validators;
  let formObject;
  onMount(() => {
    console.log("Create for mwith ", validators);
    formObject = form(validators, {
      initCheck: true,
      validateOnChange: false,
      stopAtFirstError: false,
      stopAtFirstFieldError: true,
    });
    onFormCreated(formObject);
  });
</script>

<!-- svelte-ignore component-name-lowercase -->
<form class="w3-container" on:submit|preventDefault>
  <slot />
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
  }
  form :global(input[type="submit"]) {
    display: inline-block;
    margin-left: auto;
  }
</style>
