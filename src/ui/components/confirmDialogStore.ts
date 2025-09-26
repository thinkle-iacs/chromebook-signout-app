import { writable } from "svelte/store";

export type ConfirmDialogOptions = {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

function createConfirmDialogStore() {
  const { subscribe, set, update } = writable<ConfirmDialogOptions | null>(
    null
  );

  function show(options: ConfirmDialogOptions) {
    set(options);
  }

  function hide() {
    set(null);
  }

  return {
    subscribe,
    show,
    hide,
  };
}

export const confirmDialogStore = createConfirmDialogStore();

// Async confirm dialog utility for global reuse
export function confirmWithUser(
  message: string,
  confirmText = "Confirm",
  cancelText = "Cancel"
): Promise<boolean> {
  return new Promise((resolve) => {
    confirmDialogStore.show({
      message,
      confirmText,
      cancelText,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
}
