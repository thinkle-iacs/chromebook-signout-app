<script lang="ts">
  export let errors : string[]|null = null  
  export let name : string|null;
</script>

<div class="field">    
  <slot name="label">
    <label for={name && name.toLowerCase().replace(/\s+/g,'')}>
      {name}
    </label>
  </slot>    
  <slot>
    <!-- Input goes here -->
  </slot>
    {#if errors}
      <div class="error">
        {#each errors as error}
          <span>{error}</span>
        {/each}
      </div>
    {/if}
    <div class="details">
      <slot name="details">
      </slot>      
    </div>
    <div class="dropdown-container">
      <slot name="dropdown">
      </slot>
    </div>

  </div>

<style>
  
  .field {
    position: relative;
    margin-top: 1em;
    margin-bottom: 1em;
  }
  .field:nth-child(1) {
    margin-top: 0;
  }
  
  .field .error {
    color: var(--red, red);
    position: absolute;
    top: 0;
    right: 5px;
  }
  .dropdown-container {
    position: relative;
  }
  

</style>

