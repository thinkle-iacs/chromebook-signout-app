<script type="ts">
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import { l } from "./util";
  import AssetDisplay from "./AssetDisplay.svelte";
  import { assetStore } from "./data/inventory";
  import type { SignoutHistoryEntry } from "./data/signoutHistory";
  import type { Student } from "./students";
  export let signoutHistoryItems: SignoutHistoryEntry[];
  export let student: Student | null;
  export let currentOnlyMode = false;
  export let studentOnlyMode = false;
  export let dailyOnlyMode = false;
  $: console.log(signoutHistoryItems);
</script>

<table class="w3-table w3-small">
  <tr>
    <th>#</th>
    <th> Time </th>
    <th> Asset </th>
    <th>
      User
      {#if student}
        <div class="w3-small normal">
          <input type="checkbox" bind:checked={studentOnlyMode} /> only {student.Name}
        </div>
      {/if}
    </th>
    <th> Notes </th>
    <th>
      Status
      <div class="w3-small normal">
        <input type="checkbox" bind:checked={currentOnlyMode} />
        current only
      </div>
    </th>
    <th
      >Daily
      <div class="w3-small normal">
        <input type="checkbox" bind:checked={dailyOnlyMode} />
      </div>
    </th>
  </tr>
  {#each signoutHistoryItems.filter((i) => (!dailyOnlyMode || i.DailyLoan) && (!currentOnlyMode || i["Is Latest Change"]) && (!studentOnlyMode || (i["Email (from Students)"] && i["Email (from Students)"][0] == student.Email))) as item, n}
    <tr
      in:fade|local
      out:fade|local
      class:match={student &&
        item["Email (from Students)"] &&
        item["Email (from Students)"][0] == student.Email}
      class:w3-lime={item.Status == "Returned" && item["Is Latest Change"]}
      class:w3-amber={item.Status == "Out" && item["Is Latest Change"]}
      class:w3-red={item.Status == "Lost" && item["Is Latest Change"]}
    >
      <td>
        {n + 1}
      </td>
      <td>
        {new Date(item.Time).toLocaleDateString()}
        {new Date(item.Time).toLocaleTimeString()}
      </td>
      <td>
        <AssetDisplay
          asset={$assetStore[item["Asset Tag (from Asset)"][0]] || {
            "Asset Tag": item["Asset Tag (from Asset)"][0] || "",
          }}
        />
      </td>
      <td>
        {#if item["Email (from Students)"] && item["Email (from Students)"].length}
          <a
            href={`mailto:${item["Email (from Students)"][0]}`}
            target="_blank"
          >
            {item["Email (from Students)"][0].replace(
              "innovationcharter.org",
              "..."
            )}
          </a>
        {/if}
        {#if item["Email (from Staff)"] && item["Email (from Staff)"].length}
          <a href={`mailto:${item["Email (from Staff)"][0]}`} target="_blank">
            {item["Email (from Staff)"][0].replace(
              "innovationcharter.org",
              "..."
            )}
          </a>
        {/if}
      </td>
      <td>
        {item.Notes || ""}
      </td>
      <td>
        {item.Status}
      </td>
      <td>{(item.DailyLoan && "Daily") || "Long term"}</td>
    </tr>
  {/each}
</table>

<style>
  .tag {
    display: inline-block;
    padding: 8px;
  }
  tr {
    color: grey;
  }
  .match {
    font-weight: bold;
    color: black;
  }
  .normal {
    font-weight: 200;
    white-space: nowrap;
  }
</style>
