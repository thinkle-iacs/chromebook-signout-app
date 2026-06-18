<script lang="ts">
  export let value: string[] = [];
  export let scanMode = false;
  export let id: string | undefined = undefined;
  export let placeholder: string | undefined = undefined;
  export let autocomplete: string | undefined = undefined;

  let textValue = "";

  // In normal mode keep textValue in sync with the array
  $: if (!scanMode) {
    textValue = (value && value.join(", ")) || "";
  }

  function updateValue(e) {
    textValue = e.target.value;
    if (!scanMode) {
      value = e.target.value.split(/\s*[,;]\s*/);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (scanMode && e.key === "Enter") {
      e.preventDefault(); // prevent form submit
      const newTag = textValue.trim().toUpperCase();
      if (newTag && !value.some((t) => t.toUpperCase() === newTag)) {
        value = [...(value || []), newTag];
      }
      textValue = "";
    }
  }

  function removeTag(index: number) {
    value = value.filter((_, i) => i !== index);
  }
</script>

{#if scanMode && value && value.length > 0}
  <div class="tag-list">
    {#each value as tag, i (i)}
      <span class="w3-tag w3-round w3-light-blue tag">
        {tag}
        <button
          type="button"
          class="w3-button w3-tiny"
          on:click={() => removeTag(i)}>×</button
        >
      </span>
    {/each}
  </div>
{/if}
<input
  class="w3-input w3-border"
  on:input={updateValue}
  on:keydown={handleKeydown}
  value={textValue}
  {id}
  {placeholder}
  {autocomplete}
/>

<style>
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 4px;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .tag button {
    padding: 0 2px;
    line-height: 1;
  }
</style>
