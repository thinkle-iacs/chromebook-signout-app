import type { Ticket } from "@data/tickets";

// Generic history entry used by workflow steps and editor
export type HistoryEntry<TChanges = Record<string, unknown>> = {
  // ISO string preferred when persisted
  timestamp?: string | Date;
  // Human-readable description of what happened
  action: string;
  // Ticket status at the time of this entry
  status?: Ticket["Ticket Status"];
  // Arbitrary changes payload. Suggested shape: { field: { from, to } }
  changes?: TChanges;
  // Optional metadata
  note?: string;
  user?: string;
  // Extra data if needed by automations
  payload?: unknown;
};
