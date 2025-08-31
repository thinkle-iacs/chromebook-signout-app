<script lang="ts">
  // Minimal CSS-only style wrapper for a sticky bottom action bar inside a scrolling panel.
  // Customization via optional class props; logic kept minimal on purpose.
  export let colorClass: string = "w3-yellow"; // background color class
  export let paddingClass: string = "w3-padding"; // spacing class
  export let className: string = ""; // any extra classes
</script>

<div
  class={`sticky-bottom-action-bar ${colorClass} ${paddingClass} ${className}`.trim()}
>
  <slot />
</div>

<style>
  .sticky-bottom-action-bar {
    position: sticky;
    bottom: 0;
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    border-top: 2px solid #c79500;
    box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.15);
    z-index: 10;
  }
  @media (max-width: 640px) {
    .sticky-bottom-action-bar {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
