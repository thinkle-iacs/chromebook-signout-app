<script lang="ts">
  export let value: string[];
  let textValue;
  $: textValue = (value && value.join(", ")) || "";

  function updateValue(e) {
    textValue = e.target.value;
    value = e.target.value.split(/\s*[,;]\s*/);
  }
</script>

<input class="w3-input" on:input={updateValue} value={textValue} />
