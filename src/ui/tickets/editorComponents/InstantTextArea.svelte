<script lang="ts">
  export let value: string = "";
  export let rows: number = 5;
  export let placeholder: string = "";
  export let disabled: boolean = false;
  export let onChange: (val: string) => void = () => {};

  let text: string = value;
  let internalUpdate = false;

  // Only adopt parent value if it truly changed externally (avoid cursor jump)
  $: if (!internalUpdate && value !== text) {
    text = value || "";
  }

  function handleInput(e: Event) {
    internalUpdate = true;
    text = (e.target as HTMLTextAreaElement).value;
    onChange(text);
    // Release the guard after the parent has had a chance to process this tick
    queueMicrotask(() => {
      internalUpdate = false;
    });
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
