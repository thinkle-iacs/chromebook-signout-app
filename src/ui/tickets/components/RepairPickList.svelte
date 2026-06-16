<script lang="ts">
  export interface RepairItem {
    label: string;
    amount: number;
  }

  // Hardcoded list so tech staff can edit directly in repo.
  // To modify: adjust items below. Amounts are raw numbers (USD).
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
  // Labels already on the ticket (e.g. parsed from saved notes) so the
  // checkboxes reflect existing repair items when a ticket is reopened.
  export let initialLabels: string[] = [];

  let selectedItems: boolean[] = new Array(items.length).fill(false);
  let expanded = false;
  let containerEl: HTMLElement;

  // Initialize (or re-initialize) checkboxes from initialLabels whenever they
  // change to a new set — i.e. a different ticket loads or one is saved. Guard
  // on a sorted signature so the user's in-progress toggles aren't clobbered,
  // and do NOT call onSelect here (these items are already on the ticket).
  let lastInitSig: string | null = null;
  $: {
    const sig = [...initialLabels].sort().join("|");
    if (sig !== lastInitSig) {
      lastInitSig = sig;
      selectedItems = items.map((it) => initialLabels.includes(it.label));
    }
  }

  function handleSelectionChange() {
    onSelect(items.filter((_, index) => selectedItems[index]));
  }

  function clearAll() {
    selectedItems = new Array(items.length).fill(false);
    handleSelectionChange();
  }

  function toggle() {
    if (disabled) return;
    expanded = !expanded;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      expanded = false;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  // Close when clicking anywhere outside the control + popover.
  function onWindowClick(e: MouseEvent) {
    if (expanded && containerEl && !containerEl.contains(e.target as Node)) {
      expanded = false;
    }
  }

  $: selectedList = items.filter((_, i) => selectedItems[i]);
  $: totalCost = selectedList.reduce((sum, item) => sum + item.amount, 0);
  // Condensed summary for the closed control: first two names, then "+N".
  $: summary = (() => {
    const names = selectedList.map((i) => i.label);
    if (names.length === 0) return "";
    if (names.length <= 2) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  })();
</script>

<svelte:window on:click={onWindowClick} />

<div class="repair-pick" bind:this={containerEl}>
  <span class="rp-label">Repair Items</span>
  <div
    class="rp-control"
    class:disabled
    role="button"
    tabindex={disabled ? -1 : 0}
    aria-haspopup="listbox"
    aria-expanded={expanded}
    on:click={toggle}
    on:keydown={onKeydown}
  >
    {#if summary}
      <span class="rp-summary">{summary}</span>
      <span class="rp-total">${totalCost}</span>
    {:else}
      <span class="rp-summary rp-empty">Add repair items…</span>
    {/if}
    <span class="rp-caret" class:open={expanded}>&#9650;</span>
  </div>

  {#if expanded}
    <div class="rp-pop" role="listbox" aria-multiselectable="true">
      <div class="rp-pop-head">
        <span class="rp-hint">Check all that apply</span>
        <span class="rp-total">${totalCost}</span>
      </div>
      <div class="rp-list">
        {#each items as item, index}
          <label class="rp-row" class:checked={selectedItems[index]}>
            <input
              type="checkbox"
              bind:checked={selectedItems[index]}
              on:change={handleSelectionChange}
              {disabled}
            />
            <span class="rp-name">{item.label}</span>
            <span class="rp-amt">${item.amount}</span>
          </label>
        {/each}
      </div>
      <div class="rp-pop-foot">
        <button
          type="button"
          class="w3-button w3-small w3-border"
          on:click|stopPropagation={clearAll}
          {disabled}
        >
          Clear all
        </button>
        <button
          type="button"
          class="w3-button w3-small w3-blue"
          on:click|stopPropagation={() => (expanded = false)}
        >
          Done
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .repair-pick {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
  }
  .rp-label {
    font-size: 13px;
    font-weight: bold;
    color: #2196f3;
  }
  .rp-control {
    min-width: 280px;
    min-height: 38px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: #fff;
    border: 1px solid #b9d3fa;
    border-radius: 5px;
    cursor: pointer;
  }
  .rp-control:hover {
    border-color: #2196f3;
  }
  .rp-control.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .rp-summary {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    color: #1a1a1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .rp-empty {
    color: #999;
  }
  .rp-total {
    font-weight: bold;
    color: #2196f3;
    white-space: nowrap;
  }
  .rp-caret {
    font-size: 0.75em;
    color: #888;
    transition: transform 0.15s;
  }
  .rp-caret.open {
    transform: rotate(180deg);
  }
  .rp-pop {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 0;
    width: 320px;
    z-index: 30;
    background: #fff;
    border: 1px solid #b9d3fa;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  }
  .rp-pop-head,
  .rp-pop-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
  }
  .rp-pop-head {
    border-bottom: 1px solid #eee;
  }
  .rp-pop-foot {
    border-top: 1px solid #eee;
  }
  .rp-hint {
    font-size: 13px;
    color: #777;
  }
  .rp-list {
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
  }
  .rp-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 8px;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
  }
  .rp-row:hover {
    background: #f1f6ff;
  }
  .rp-row.checked {
    background: #eef3fa;
  }
  .rp-name {
    flex: 1;
  }
  .rp-amt {
    color: #777;
    font-variant-numeric: tabular-nums;
  }
</style>
