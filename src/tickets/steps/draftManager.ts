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

export function mergeUpdates<T extends Record<string, any>>(
  ticket: T,
  draftUpdates: Partial<T>
) {
  const updates: Partial<T> = {};
  const merged = { ...ticket, ...draftUpdates } as T;

  for (const key of Object.keys(draftUpdates) as (keyof T)[]) {
    const newVal = draftUpdates[key];
    const oldVal = ticket[key];
    if (!valuesEqual(oldVal, newVal)) {
      updates[key] = newVal as any;
    }
  }

  return { merged, updates };
}
