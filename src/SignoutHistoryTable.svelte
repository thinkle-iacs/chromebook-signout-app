<script type="ts">
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import type { SignoutHistoryEntry } from "./signoutHistory";
  import type { Student } from "./students";
  export let signoutHistoryItems: SignoutHistoryEntry[];
  export let student: Student | null;
  let currentOnlyMode = false;
  let studentOnlyMode = false;
  $: console.log(signoutHistoryItems);
</script>

<table class="w3-table">
  <tr>
    <th> Time </th>
    <th> Asset </th>
    <th>
      Student
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
  </tr>
  {#each signoutHistoryItems.filter((i) => (!currentOnlyMode || i["Is Latest Change"]) && (!studentOnlyMode || (i["Email (from Students)"] && i["Email (from Students)"][0] == student.Email))) as item (item.Num)}
    <tr
      in:fade
      out:fade
      class:match={student &&
        item["Email (from Students)"] &&
        item["Email (from Students)"][0] == student.Email}
      class:w3-lime={item.Status == "Returned" && item["Is Latest Change"]}
      class:w3-amber={item.Status == "Out" && item["Is Latest Change"]}
      class:w3-red={item.Status == "Lost" && item["Is Latest Change"]}
    >
      <td>
        {new Date(item.Time).toLocaleDateString()}
        {new Date(item.Time).toLocaleTimeString()}
      </td>
      <td>
        <div class="tag w3-round-xlarge w3-indigo">
          {item["Asset Tag (from Asset)"]}
        </div>
      </td>
      <td>
        {#if item["Email (from Students)"] && item["Email (from Students)"].length}
          <a href={`mailto:${item["Email (from Students)"][0]}`}>
            {item["Email (from Students)"][0].replace(
              "@innovationcharter.org",
              ""
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
