<script lang="ts">
  import type { Contact } from "@data/contacts";
  import { getEmails } from "@data/contacts";
  export let contact: Contact;
  let emails = [];
  $: emails = (contact && getEmails(contact)) || [];
</script>

<span>
  {#each emails as email}
    <a href={`mailto:${email}`}>{email}</a>
  {/each}
</span>

<style>
  span {
    display: inline-flex;
    gap: 5px;
  }
</style>
