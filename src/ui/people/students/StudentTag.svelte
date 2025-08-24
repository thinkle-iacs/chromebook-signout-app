<script lang="ts">
  import type { Student } from "@data/students";
  import { contactStore } from "@data/contacts";
  import Contacts from "@people/contacts/Contacts.svelte";
  import StudentScheduleButton from "@scheduling/components/StudentScheduleButton.svelte";

  export let student: Student;

  let expanded = false;

  // Determine if student is MS or HS based on YOG
  function getSchoolLevel(yog: string): string {
    const currentYear = new Date().getFullYear();
    const graduationYear = parseInt(yog);
    const grade = 12 - (graduationYear - currentYear);

    if (grade <= 8) {
      return "MS";
    } else {
      return "HS";
    }
  }

  $: contacts = student.LASID ? $contactStore[student.LASID] : null;

  // Check if contact emails are available as direct fields (from tickets lookup)
  $: hasDirectContactEmails =
    student["Contact1Email"] || student["Contact2Email"];
  $: contactEmails = [
    student["Contact1Email"],
    student["Contact2Email"],
  ].filter(Boolean);
</script>

<div class="student-tag">
  <span
    class="compact-display w3-text-blue w3-hover-light-gray"
    class:inactive={student.Status === "Inactive"}
    on:click={() => (expanded = !expanded)}
    on:keydown={(e) => e.key === "Enter" && (expanded = !expanded)}
    role="button"
    tabindex="0"
  >
    {student.Name}
    {#if student.YOG}
      ({student.YOG}) {getSchoolLevel(student.YOG)}
    {/if}
  </span>
  {#if student?.Email}
    <StudentScheduleButton
      style="margin-left: 4px;"
      studentEmail={student.Email}
    />
  {/if}

  {#if expanded}
    <div class="expanded-details w3-card w3-white w3-padding w3-margin-top">
      <div class="w3-small">
        <div><strong>Advisor:</strong> {student.Advisor || "N/A"}</div>
        <div>
          <strong>Email:</strong>
          <a href="mailto:{student.Email}" class="w3-text-blue"
            >{student.Email}</a
          >
          {#if student?.Email}
            <StudentScheduleButton
              style="margin-left: 4px;"
              studentEmail={student.Email}
            />
          {/if}
        </div>
        <div><strong>LASID:</strong> {student.LASID}</div>
        <div>
          <a
            href="/student/{student.Name}"
            class="w3-text-blue w3-hover-text-dark-blue"
          >
            → Student View
          </a>
        </div>
        {#if hasDirectContactEmails}
          <div>
            <strong>Contacts:</strong>
            {#each contactEmails as email, i}
              <a href="mailto:{email}" class="w3-text-blue">{email}</a
              >{#if i < contactEmails.length - 1},
              {/if}
            {/each}
          </div>
        {:else if contacts}
          <div>
            <strong>Contacts:</strong>
            <Contacts contact={contacts} />
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .student-tag {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .compact-display {
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    transition: background-color 0.2s;
  }

  .compact-display:hover {
    background-color: #f1f1f1;
  }

  .inactive {
    text-decoration: line-through;
    color: #9e9e9e !important;
  }

  .expanded-details {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    min-width: 200px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
</style>
