<script lang="ts">
  export interface RepairItem {
    label: string;
    amount: number;
  }

  // Hardcoded list so tech staff can edit directly in repo
  // To modify: adjust items below. Amounts are raw numbers (USD)
  const items: RepairItem[] = [
    { label: "LCD Screen", amount: 40 },
    { label: "Keyboard", amount: 50 },
    { label: "Single Key", amount: 10 },
    { label: "Hinge Cover", amount: 20 },
    { label: "Screen Edge Cover (Bevel)", amount: 20 },
    { label: "Lost Charger", amount: 30 },
    { label: "Back panel", amount: 30 },
    { label: "Full Machine", amount: 220 },
    { label: "Broken Charger", amount: 20 },
    { label: "Palmrest", amount: 30 },
    { label: "Camera", amount: 20 },
  ];

  export let onSelect: (item: RepairItem) => void = () => {};
  export let disabled: boolean = false;

  let selectedLabel = "";

  function handleSelect() {
    const item = items.find((i) => i.label === selectedLabel);
    if (item) {
      onSelect(item);
    }
  }
</script>

<div class="w3-section">
  <label class="w3-text-blue" for="repair-pick-select"
    ><b>Repair Item Quick Pick</b></label
  >
  <select
    id="repair-pick-select"
    class="w3-select w3-border"
    bind:value={selectedLabel}
    on:change={handleSelect}
    {disabled}
  >
    <option value="">-- Select Item --</option>
    {#each items as item}
      <option value={item.label}>{item.label} (${item.amount})</option>
    {/each}
  </select>
  <div class="w3-small w3-text-grey w3-padding-small">
    Selecting an item will set the Repair Cost and add a line to Public Notes.
  </div>
</div>
