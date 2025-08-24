<script lang="ts">
  import { logger } from "@utils/log";
  export let draft: Record<string, any> | null = null;
  export let onSave: () => Promise<void> | void = () => {};
  export let saving: boolean = false;
  export let showCount: boolean = true;

  $: hasPending = !!draft && Object.keys(draft).length > 0;

  function handleSave() {
    if (saving) return;
    const r = onSave();
    // allow promise but do not await here (parent controls saving flag)
    if (r && typeof (r as any).catch === "function") {
      (r as Promise<any>).catch((e) =>
        logger.logError("Save failed in ShowPendingChanges:", e)
      );
    }
  }
</script>

{#if hasPending}
  <div
    class="w3-small w3-padding-small"
    style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;"
  >
    <span class="w3-tag w3-amber w3-round">
      Unsaved Changes{#if showCount}
        ({Object.keys(draft || {}).length}){/if}
    </span>
    <button
      class="w3-button w3-tiny w3-blue"
      on:click={handleSave}
      disabled={saving}
      aria-label="Save pending changes"
      >{saving ? "Saving..." : "Save Now"}</button
    >
  </div>
{/if}
