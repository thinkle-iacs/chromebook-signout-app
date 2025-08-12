<script lang="ts">
  export let kind: "success" | "error" | "info" = "info";
  export let message = "";
  export let show = false;
  export let timeout = 3500;
  export let position: "top" | "bottom" = "bottom";

  let timer: any;
  $: if (show) {
    clearTimeout(timer);
    timer = setTimeout(() => (show = false), timeout);
  }
</script>

{#if show}
  <div
    class="w3-panel {kind === 'success'
      ? 'w3-pale-green'
      : kind === 'error'
        ? 'w3-pale-red'
        : 'w3-pale-blue'} w3-border toast {position}"
  >
    {message}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    right: 16px;
    z-index: 1000;
    min-width: 240px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  .toast.bottom {
    bottom: 16px;
  }
  .toast.top {
    top: 16px;
  }
</style>
