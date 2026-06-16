<script lang="ts">
  export let email: string | string[] | null | undefined;

  $: resolved = Array.isArray(email) ? (email[0] ?? "") : (email ?? "");
  $: username = resolved
    ? resolved.slice(0, resolved.indexOf("@") + 1) || resolved
    : "";
</script>

{#if resolved}
  <a href={`mailto:${resolved}`} title={resolved} target="_blank" rel="noreferrer">{username}</a>
{/if}
