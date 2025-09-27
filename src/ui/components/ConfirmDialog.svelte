<script lang="ts">
  import { confirmDialogStore } from "./confirmDialogStore";
  import { onDestroy } from "svelte";
  let dialog = null;
  const unsubscribe = confirmDialogStore.subscribe((val) => {
    dialog = val;
  });
  onDestroy(unsubscribe);

  function handleConfirm() {
    dialog?.onConfirm?.();
    confirmDialogStore.hide();
  }
  function handleCancel() {
    dialog?.onCancel?.();
    confirmDialogStore.hide();
  }
</script>

{#if dialog}
  <div class="w3-modal" style="display:block">
    <div
      class="w3-modal-content w3-card-4 w3-animate-top"
      style="max-width:400px;margin:auto;"
    >
      <div class="w3-container w3-padding">
        <p>{dialog.message}</p>
        <div class="w3-right-align w3-margin-top">
          <button
            class="w3-button w3-gray w3-margin-right"
            on:click={handleCancel}>{dialog.cancelText || "Cancel"}</button
          >
          <button class="w3-button w3-blue" on:click={handleConfirm}
            >{dialog.confirmText || "Confirm"}</button
          >
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .w3-modal {
    z-index: 1000;
  }
</style>
