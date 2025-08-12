<script>
  export let disabled = false;
</script>

<button
  class="w3-button w3-transparent w3-hover-light-grey w3-round-large"
  title="Edit"
  {disabled}
  on:click
>
  <span class="w3-xlarge">✎</span>
</button>

<style>
  button {
    transform: rotateY(180deg);
  }
</style>
