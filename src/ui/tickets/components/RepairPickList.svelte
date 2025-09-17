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

  export let onSelect: (items: RepairItem[]) => void = () => {};
  export let disabled: boolean = false;

  let selectedItems: boolean[] = new Array(items.length).fill(false);

  function handleSelectionChange() {
    const selected = items.filter((_, index) => selectedItems[index]);
    onSelect(selected);
  }

  function clearAll() {
    selectedItems = new Array(items.length).fill(false);
    handleSelectionChange();
  }

  $: totalCost = items
    .filter((_, index) => selectedItems[index])
    .reduce((sum, item) => sum + item.amount, 0);
</script>

<div>
  <label class="w3-text-blue"><b>Repair Items Quick Pick</b></label>
  
  <div class="w3-border w3-padding">
    {#each items as item, index}
      <label class="w3-check w3-block">
        <input
          type="checkbox"
          bind:checked={selectedItems[index]}
          on:change={handleSelectionChange}
          {disabled}
        />
        <span class="w3-checkmark"></span>
        {item.label} (${item.amount})
      </label>
    {/each}
  </div>
  
  <div class="w3-margin-top w3-small">
    {#if totalCost > 0}
      <div class="w3-text-blue">
        <strong>Total Cost: ${totalCost}</strong>
      </div>
    {/if}
    <button 
      class="w3-button w3-small w3-border w3-margin-top" 
      on:click={clearAll}
      {disabled}
    >
      Clear All
    </button>
  </div>
  
  <div class="w3-small w3-text-grey w3-padding-small">
    Check items to add their costs and notes. Costs are additive.
  </div>
</div>
