<script>
  export let notifications;
</script>

{#each notifications as n}
  <br />{JSON.stringify(n)}
{/each}
