<script lang="ts">
  import type { Student } from "./students";
  export let student: Student;
</script>

<table class="w3-table">
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
</table>

<style>
  .name {
    font-weight: bold;
  }
  th {
    color: #607d8b;
    font-weight: 400;
    font-size: 75%;
  }
</style>
