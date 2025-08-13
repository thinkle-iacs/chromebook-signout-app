import { writable } from "svelte/store";

export type ToastKind = "success" | "error" | "info";
export type ToastPosition = "top" | "bottom";

export interface ToastState {
  kind: ToastKind;
  message: string;
  timeout?: number;
  position?: ToastPosition;
}

export const toastStore = writable<ToastState | null>(null);

export function showToast(
  message: string,
  kind: ToastKind = "info",
  options: { timeout?: number; position?: ToastPosition } = {}
) {
  toastStore.set({ kind, message, ...options });
}
