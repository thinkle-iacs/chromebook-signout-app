<script lang="ts">
  export let value: number | undefined = undefined;
  export let onSave: (newValue: number | undefined) => void;
  export let disabled: boolean = false;
  export let inputClass: string = "";
  export let buttonClass: string = "";
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step: number = 5; // $5 increments by default
  export let placeholder: string = "";

  let editedValue: string = value != null ? String(value) : "";
  let origValue: number | undefined = value;

  $: if (value !== origValue) {
    editedValue = value != null ? String(value) : "";
    origValue = value;
  }

  function handleSave() {
    if (!disabled) {
      const numValue = editedValue === "" ? undefined : parseFloat(editedValue);
      if (numValue !== value) {
        onSave(numValue);
      }
    }
  }

  function handleRevert() {
    editedValue = value != null ? String(value) : "";
  }
</script>

<div style="display: flex; align-items: center; gap: 0.5em;">
  <span>$</span>
  <input
    type="number"
    class={inputClass}
    bind:value={editedValue}
    {min}
    {max}
    {step}
    {placeholder}
    {disabled}
    style="width: 100px;"
    on:keydown={(e) => {
      if (e.key === "Enter") handleSave();
    }}
  />
  <button
    class={buttonClass + " w3-gray"}
    type="button"
    on:click={handleRevert}
    disabled={disabled || editedValue === (value != null ? String(value) : "")}
    title="Revert"
    style="padding: 4px 8px;"
  >
    ⤺
  </button>
  <button
    class={buttonClass}
    type="button"
    on:click={handleSave}
    disabled={disabled || editedValue === (value != null ? String(value) : "")}
    title="Save"
    style="padding: 4px 8px;"
  >
    ✔
  </button>
</div>
