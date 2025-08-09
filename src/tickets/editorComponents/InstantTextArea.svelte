<script lang="ts">
  export let value: string = "";
  export let rows: number = 5;
  export let placeholder: string = "";
  export let disabled: boolean = false;
  export let onChange: (val: string) => void = () => {};

  let text: string = value;
  $: if (value !== text) text = value || "";

  function handleInput(e: Event) {
    text = (e.target as HTMLTextAreaElement).value;
    onChange(text);
  }
</script>

<textarea
  class="w3-input w3-border w3-small"
  {rows}
  {placeholder}
  {disabled}
  value={text}
  on:input={handleInput}
/>
