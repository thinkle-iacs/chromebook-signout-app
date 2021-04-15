<script type="ts">
  import type { SignoutHistoryEntry } from "./signoutHistory";
  import type { Student } from "./students";
  export let signoutHistoryItems: SignoutHistoryEntry[];
  export let student: Student | null;
</script>

<table class="w3-table">
  {#each signoutHistoryItems as item}
    <tr
      class:match={item["Email (from Students)"][0] == student.Email}
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
</style>
