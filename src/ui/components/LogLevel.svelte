<script lang="ts">
  import {
    logger,
    logLevel,
    LOG_ERROR,
    LOG_PRIORITY,
    LOG_REGULAR,
    LOG_VERBOSE,
  } from "@utils/log";
</script>

<div>
  <label for="log-level">Log Level:</label>
  <select id="log-level" bind:value={$logLevel}>
    <option value={LOG_VERBOSE}>Verbose</option>
    <option value={LOG_REGULAR}>Regular</option>
    <option value={LOG_PRIORITY}>Priority</option>
    <option value={LOG_ERROR}>Error</option>
  </select>
</div>
