import type { Ticket } from "@data/tickets";

function isEmpty(v: any) {
  return v === undefined || v === null || v === "";
}

function valuesEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (isEmpty(a) && isEmpty(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  return false; // shallow
}

export function mergeUpdates(ticket: Ticket, draftUpdates: Partial<Ticket>) {
  const updates: Partial<Ticket> = {};
  const merged = { ...ticket, ...draftUpdates } as Ticket;

  // If there are linked fields, we want to merge the whole _linked object...
  const linkDraftUpdates = draftUpdates._linked;
  if (linkDraftUpdates) {
    let mergedLinked = { ...ticket._linked };
    for (const key of Object.keys(
      linkDraftUpdates
    ) as (keyof Ticket["_linked"])[]) {
      mergedLinked[key] = linkDraftUpdates[key];
    }
    merged._linked = mergedLinked;
  }

  for (const key of Object.keys(draftUpdates) as (keyof Ticket)[]) {
    // _linked are derived and not part of updates...
    if (key[0] === "_") continue;
    const newVal = draftUpdates[key];
    const oldVal = ticket[key];
    if (!valuesEqual(oldVal, newVal)) {
      updates[key] = newVal;
    }
  }

  return { merged, updates };
}
