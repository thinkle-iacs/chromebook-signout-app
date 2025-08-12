<script lang="ts">
  import SISTest from "./SISTest.svelte"; // only to ensure bundler keeps route components available
  import ScheduleTester from "./scheduling/ScheduleTester.svelte";
  // No direct rendering of those components here, just links.
  // Optionally gate with a prop if needed later.
</script>

<div class="w3-container">
  <h3>Test Utilities</h3>
  <p class="w3-small w3-text-gray">
    Internal tools not shown in main navigation.
  </p>
  <ul class="w3-ul w3-card w3-small" style="max-width:480px;">
    <li>
      <a class="w3-text-blue" href="/sis-test/">SIS API Test Tool</a>
    </li>
    <li>
      <a class="w3-text-blue" href="/schedule-test/"
        >Schedule Structure Tester</a
      >
    </li>
  </ul>
</div>
