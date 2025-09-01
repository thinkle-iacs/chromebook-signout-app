<script lang="ts">
  import { testRoutes } from "./test-routes";

  // No direct rendering of those components here, just links.
  // Optionally gate with a prop if needed later.
</script>

<div class="w3-container">
  <h3>Test Utilities</h3>
  <p class="w3-small w3-text-gray">
    Internal tools not shown in main navigation.
  </p>
  <ul class="w3-ul w3-card w3-small" style="max-width:480px;">
    {#each Object.entries(testRoutes) as [path, { title }]}
      <li>
        <a class="w3-text-blue" href={path}>{title}</a>
      </li>
    {/each}
  </ul>
</div>
