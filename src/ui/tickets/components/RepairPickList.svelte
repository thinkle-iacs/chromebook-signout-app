<script lang="ts">
  export interface RepairItem {
    label: string;
    amount: number;
  }

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
  let expanded = false;

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

<style>
  .accordion-header {
    cursor: pointer;
    background: #eef3fa;
    border: 1px solid #b9d3fa;
    padding: 0.75em 1em;
    border-radius: 5px;
    font-weight: bold;
    transition: background 0.2s;
  }
  .accordion-header:hover {
    background: #dbeaff;
  }
  .accordion-content {
    padding: 1em;
    border: 1px solid #b9d3fa;
    border-top: none;
    border-radius: 0 0 5px 5px;
    margin-bottom: 1em;
    background: white;
  }
  .chevron {
    float: right;
    font-size: 1.2em;
    transition: transform 0.2s;
  }
  .chevron.expanded {
    transform: rotate(90deg);
  }
</style>

<div>
  <div class="accordion-header" on:click={() => expanded = !expanded} aria-expanded={expanded}>
    Repair Items Quick Pick
    <span class="chevron {expanded ? 'expanded' : ''}">&#9654;</span>
    {#if totalCost > 0}
      <span class="w3-text-blue" style="float:right; margin-right:1.5em;">
        Total: ${totalCost}
      </span>
    {/if}
  </div>
  {#if expanded}
    <div class="accordion-content">
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
  {/if}
</div>
