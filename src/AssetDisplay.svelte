<script type="ts">
  import type { Asset } from "./inventory";
  export let asset: Asset;
  export let showOwner: boolean = false;
</script>

<div class="w3-container row">
  <div
    class="tag w3-round-xlarge"
    class:w3-indigo={asset["Asset Tag"].match(/^[0-9][0-9][0-9][0-9]$/)}
    class:w3-red={asset["Asset Tag"].match(/A[0-9][0-9][0-9][0-9]/)}
    class:w3-black={asset["Asset Tag"].match(/^[0-9][0-9][0-9]$/)}
  >
    {asset["Asset Tag"]}
  </div>
  <div class="column">
    <div class="model limit w3-small">
      <b
        >{asset.Make || ""}
        {asset.Model || ""}</b
      >
      {#if asset["Year of Purchase"]}
        ({asset["Year of Purchase"]})
      {/if}
    </div>
    <div class="limit w3-tiny">
      {#if asset["Charger Type"]}
        <span class="charger">
          {asset["Charger Type"]}
        </span>
      {/if}
      {#if asset.Serial}
        <div class="w3-monospace">
          s/n: {asset.Serial}
        </div>
      {/if}
      {#if asset["MAC-Wireless"]}
        <span class="w3-monospace">
          mac: {asset["MAC-Wireless"]}
        </span>
      {/if}
    </div>
    {#if showOwner}
      <div class="w3-small">
        {#if asset["Email (from Student (Current))"]}
          Currently signed out to
          <b>{asset["Email (from Student (Current))"]}</b>
        {/if}
        {#if asset["Full Name (from User)"]}
          Currently signed out to staff
          <b>{asset["Full Name (from User)"]}</b>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .charger {
    font-size: x-small;
  }
  .limit {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .limit:hover {
    text-overflow: initial;
    overflow: initial;
  }
  .tag {
    display: inline-block;
    padding: 8px;
    align-self: center;
    align-items: center;
    margin-right: 4px;
  }
  .row {
    padding-bottom: 8px;
    display: flex;
    flex-direction: row;
  }
  .column {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
</style>
