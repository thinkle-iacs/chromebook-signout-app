<script type="ts">
  import type { Asset } from "./inventory";
  export let asset: Asset;
</script>

<div class="w3-container row">
  <div class="tag w3-round-xlarge w3-indigo">
    {asset["Asset Tag"]}
  </div>
  <span class="model">
    {asset.Make || ""}
    {asset.Model || ""}
    {#if asset["Year of Purchase"]}
      ({asset["Year of Purchase"]})
    {/if}
  </span>
  {#if asset.Serial}
    <span class="w3-monospace">
      s/n: {asset.Serial}
    </span>
  {/if}
  {#if asset["MAC-Wireless"]}
    <span class="w3-monospace">
      mac: {asset["MAC-Wireless"]}
    </span>
  {/if}
  <slot />
</div>

<style>
  .tag {
    display: inline-block;
    padding: 8px;
  }
  .row {
    padding-bottom: 8px;
  }
</style>
