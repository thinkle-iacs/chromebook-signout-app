<script lang="ts">
  export let textValue: string = "";
  export let onSave: (newValue: string) => void;
  export let disabled: boolean = false;
  export let rows: number = 8;
  export let placeholder: string = "";

  let editedValue = textValue;
  let origTextValue = textValue;

  $: if (textValue !== origTextValue) {
    editedValue = textValue || "";
    origTextValue = textValue;
  }

  function handleSave() {
    if (editedValue !== textValue && !disabled) {
      onSave(editedValue);
    }
  }

  function handleRevert() {
    editedValue = textValue || "";
  }
</script>

<textarea
  bind:value={editedValue}
  class="w3-input w3-border w3-small"
  {rows}
  {placeholder}
  {disabled}
/>
<div
  class="w3-margin-top"
  style="display:flex; gap:0.5em; justify-content:flex-end; flex-wrap:wrap;"
>
  <button
    type="button"
    class="w3-btn w3-gray w3-small"
    on:click={handleRevert}
    disabled={disabled || editedValue === textValue}
  >
    Revert
  </button>
  <button
    class="w3-btn w3-green w3-small"
    on:click={handleSave}
    disabled={disabled || editedValue === textValue}
  >
    Save
  </button>
</div>
