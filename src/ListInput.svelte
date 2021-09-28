<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let value: string[];

  const dispatch = createEventDispatcher();

  let textValue;
  $: textValue = (value && value.join(", ")) || "";

  function updateValue(e) {
    textValue = e.target.value;
    value = e.target.value.split(/\s*[,;]\s*/);
  }
</script>

<input class="w3-input" on:input={updateValue} value={textValue} />
