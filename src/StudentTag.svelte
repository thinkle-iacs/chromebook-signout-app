<script lang="ts">
  import type { Student } from "./students";
  export let student: Student;
</script>

<table
  class="w3-table"
  class:inactive={student.Status === "Inactive"}
  class:active={student.Status === "Active"}
>
  <tr>
    <th> Name: </th>
    <td class="name">
      {student.Name}
    </td>
  </tr>
  <tr>
    <th> Advisor: </th>
    <td>
      {student.Advisor}
    </td>
  </tr>
  <tr>
    <th> YOG: </th>
    <td>
      {student.YOG}
    </td>
  </tr>
  <tr>
    <th> LASID: </th>
    <td>
      {student.LASID}
    </td>
  </tr>
  <tr>
    <th> Email: </th>
    <td>
      <a href={`mailto:${student.Email}`}>{student.Email}</a>
    </td>
  </tr>
  <tr>
    <th> Status: </th>
    <td>
      {student.Status}
    </td>
  </tr>
</table>

<style>
  .inactive {
    text-decoration: line-through;
    color: #9e9e9e;
  }
  .name {
    font-weight: bold;
  }
  th {
    color: #607d8b;
    font-weight: 400;
    font-size: 75%;
  }
</style>
