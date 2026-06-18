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
      const newTag = textValue.trim();
      if (newTag) {
        value = [...(value || []), newTag];
      }
      textValue = "";
    }
  }

  function removeTag(tag: string) {
    value = value.filter((t) => t !== tag);
  }
</script>

{#if scanMode && value && value.length > 0}
  <div class="tag-list">
    {#each value as tag}
      <span class="tag">
        {tag}
        <button type="button" on:click={() => removeTag(tag)}>×</button>
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
    background: #e3f2fd;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.85em;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tag button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-size: 1.1em;
    line-height: 1;
    color: #555;
  }
  .tag button:hover {
    color: #c00;
  }
</style>
