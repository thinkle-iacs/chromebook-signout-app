<script type="ts">
  import type {Student} from './students';
import { form } from "svelte-forms";
  import { validateStudent, studentName, studentDropdown } from "./validators";
  import FormField from "./FormField.svelte";
  import SimpleForm from "./SimpleForm.svelte";
  import StudentDropdown from "./StudentDropdown.svelte";
  import { onMount } from "svelte";
  import { getStudent } from './students'
import App from './App.svelte';

  let lookupForm;
  let validators = ()=>({
    student : {
      value : $studentName,
      validators : [validateStudent],
    }
  })
  $: lookupForm && $studentName && lookupForm.validate();
  let student : Student | null;
  $: student = getStudent($studentName);
  
  let loans;
  let current;

</script>

<SimpleForm 
  {validators} 
  onFormCreated={(f)=>{lookupForm=f}}  
>
  <FormField name="Student"
    errors={lookupForm && $lookupForm?.fields?.student?.errors}  
  >
    <input
      autocomplete="off"
    id="student" bind:value={$studentName} type="text" />
    <div slot="dropdown"><StudentDropdown /></div>
  </FormField>
</SimpleForm>
{#if student}
<article class="w3-card-4 w3-cell-middle w3-container">
  <header class="w3-container w3-blue">
    {student.Name}
  </header>
  <div class="w3-container">
  <p>
    Name: {student.Name}
  </p>
  <p>Advisor: {student.Advisor}</p>
  <p>YOG: {student.YOG}</p>
  <p>Email: <a href={`mailto:${student.Email}`}>{student.Email}</a></p>
  <h3>Current Loans:</h3>
  {#if !current}
    <p class="w3-opacity w3-ital">Fetching...</p>
  {/if}
  <h3>Signout History:</h3>
  {#if !loans}
  <p class="w3-opacity w3-ital">Fetching...</p>
  {/if}
  </div>

</article>


{/if}

<style>
  article {
    max-width: 800px;
    margin: auto;
  }
</style>