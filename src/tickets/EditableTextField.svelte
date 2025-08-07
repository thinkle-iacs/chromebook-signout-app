<script lang="ts">
  export let textValue: string = "";
  export let onSave: (newValue: string) => void;
  export let disabled: boolean = false;
  export let textareaClass: string = "";
  export let buttonClass: string = "";
  export let rows: number = 8;
  export let placeholder: string = "";

  let editedValue = textValue;
  let origTextValue = textValue;

  if (textValue != origTextValue) {
    // change from on high...
    editedValue = textValue;
    origTextValue = textValue;
  }

  function handleSave() {
    if (editedValue !== textValue && !disabled) {
      onSave(editedValue);
    }
  }

  function handleRevert() {
    editedValue = textValue;
  }
</script>

ETF:
<textarea
  bind:value={editedValue}
  class={textareaClass}
  {rows}
  {placeholder}
  {disabled}
/>
<div
  style="
    display: flex;
    gap: 0.5em;
    margin-top: 0.5em;
    justify-content: flex-end;
    flex-wrap: wrap;
  "
>
  <button
    type="button"
    class={buttonClass + " w3-gray"}
    on:click={handleRevert}
    disabled={disabled || editedValue === textValue}
  >
    Revert
  </button>
  <button
    class={buttonClass}
    on:click={handleSave}
    disabled={disabled || editedValue === textValue}
  >
    Save
  </button>
</div>
