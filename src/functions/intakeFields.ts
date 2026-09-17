/**
 * The pure half of mode=intake: turning an Admin Directory device into Inventory fields,
 * and deciding what a commit is allowed to do. No Airtable, no network, so it is tested
 * directly. Design: thinkle-iacs/cb-intake-extension docs/design.md §5–7.
 */

import { timingSafeEqual } from "crypto";

/** The subset of the Admin Directory chromeosdevices resource that intake reads. */
export type GoogleDevice = {
  serialNumber: string;
  model?: string;
  macAddress?: string;
  autoUpdateExpiration?: string;
  firstEnrollmentTime?: string;
  manufactureDate?: string;
  annotatedAssetId?: string;
  orgUnitPath?: string;
  status?: string;
  deviceId?: string;
};

export type InventoryFields = Record<string, string | number | undefined>;

export const DEFAULT_FIELDS = ["Purpose", "Status", "Location"] as const;
export type IntakeDefaults = Partial<Record<(typeof DEFAULT_FIELDS)[number], string>>;

/** Fields the page may set per device on commit. Everything else is derived or refused. */
export const OVERRIDABLE_FIELDS = [
  "Year of Purchase",
  "Make",
  "Model",
  "Category",
  ...DEFAULT_FIELDS,
] as const;

/**
 * Serials are alphanumeric in practice. Anything else is refused rather than escaped, since
 * the serial is interpolated into an Airtable formula and a GAS query.
 */
export function isValidSerial(serial: unknown): serial is string {
  return typeof serial === "string" && /^[A-Za-z0-9-]{4,40}$/.test(serial);
}

export function isValidAssetTag(tag: unknown): tag is string {
  return typeof tag === "string" && tag.trim().length > 0 && tag.length <= 40 && !/["\\\n\r]/.test(tag);
}

/** For an Airtable formula string literal. */
export function formulaString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Admin Directory reports the full marketing name ("HP Chromebook 11A G8 EE"); Inventory
 * splits it into Make ("HP") and a brand-less Model ("11A G8 EE"). Brand spellings match
 * what Inventory already uses (Sept 2026: HP 879, Lenovo 556, Acer 347, Samsung 200, Asus 2).
 * Still a guess for models we haven't seen, so the page shows both as editable.
 */
const KNOWN_MAKES: [RegExp, string][] = [
  [/^hp\b/i, "HP"],
  [/^hewlett[- ]packard\b/i, "HP"],
  [/^lenovo\b/i, "Lenovo"],
  [/^acer\b/i, "Acer"],
  [/^samsung\b/i, "Samsung"],
  [/^asus\b/i, "Asus"],
  [/^dell\b/i, "Dell"],
  [/^google\b/i, "Google"],
  [/^ctl\b/i, "CTL"],
];

export function parseMake(model: string | undefined): string | undefined {
  const trimmed = model?.trim();
  if (!trimmed) return undefined;
  for (const [pattern, make] of KNOWN_MAKES) if (pattern.test(trimmed)) return make;
  return trimmed.split(/\s+/)[0];
}

/** The model without its brand or the word "Chromebook": "HP Chromebook 11A G8 EE" → "11A G8 EE". */
export function parseModel(model: string | undefined): string | undefined {
  const trimmed = model?.trim();
  if (!trimmed) return undefined;
  const brand = KNOWN_MAKES.find(([pattern]) => pattern.test(trimmed));
  if (!brand) return trimmed;
  const rest = trimmed
    .replace(brand[0], "")
    .replace(/\bchromebook\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return rest || trimmed;
}

/**
 * Admin Directory reports `macAddress` as 12 bare lowercase hex digits. Inventory stores
 * them upper case with no separators ("D039576D475B").
 */
export function formatMac(mac: string | undefined): string | undefined {
  const hex = mac?.replace(/[^0-9a-f]/gi, "");
  if (!hex || hex.length !== 12) return mac || undefined;
  return hex.toUpperCase();
}

/** Year of first enrollment. Right for new stock; a prefill, never written blind (§5). */
export function yearFromEnrollment(firstEnrollmentTime: string | undefined): string | undefined {
  if (!firstEnrollmentTime) return undefined;
  const year = new Date(firstEnrollmentTime).getUTCFullYear();
  return Number.isFinite(year) ? String(year) : undefined;
}

/** What Google tells us, mapped to Inventory. Does not include the asset tag. */
export function suggestedFields(google: GoogleDevice): InventoryFields {
  return compact({
    Serial: google.serialNumber,
    "Device Type": "Chromebook",
    Category: "Chromebook", // 1984 of 1986 Chromebook rows
    Model: parseModel(google.model),
    Make: parseMake(google.model),
    "MAC-Wireless": formatMac(google.macAddress),
    "Year of Purchase": yearFromEnrollment(google.firstEnrollmentTime),
  });
}

export type ExistingRecord = { id: string; fields: InventoryFields };

export type CommitInput = {
  google: GoogleDevice;
  assetTag: string;
  existing: ExistingRecord | null;
  /** Another Inventory record already carrying this asset tag, if any. */
  tagHolder: ExistingRecord | null;
  defaults: IntakeDefaults | null;
  overrides: Record<string, unknown>;
  allowRetag: boolean;
};

export type CommitPlan =
  | {
      kind: "write";
      recordId: string | null;
      fields: InventoryFields;
      idempotent: boolean;
      retagged: boolean;
    }
  | { kind: "retag_conflict"; existingTag: string }
  | { kind: "tag_in_use"; otherSerial: string; otherRecordId: string };

/**
 * Design §6. Same tag → refresh. Different tag → refuse unless `allowRetag`. And one rule
 * the design doesn't spell out: a tag already on a *different* serial is refused outright,
 * since two records with one tag breaks every lookup in the app. That one has no override —
 * fix the other record first.
 */
export function planCommit(input: CommitInput): CommitPlan {
  const { google, existing, tagHolder, allowRetag } = input;
  const assetTag = input.assetTag.trim();

  if (tagHolder && tagHolder.id !== existing?.id) {
    return {
      kind: "tag_in_use",
      otherSerial: String(tagHolder.fields.Serial ?? ""),
      otherRecordId: tagHolder.id,
    };
  }

  const existingTag = existing ? String(existing.fields["Asset Tag"] ?? "") : "";
  const idempotent = Boolean(existing) && sameTag(existingTag, assetTag);
  const retagged = Boolean(existing) && Boolean(existingTag) && !idempotent;
  if (retagged && !allowRetag) return { kind: "retag_conflict", existingTag };

  const overrides = pickOverrides(input.overrides);
  const suggested = suggestedFields(google);

  let fields: InventoryFields;
  if (existing) {
    // Refresh what Google knows. Year of Purchase is left alone unless the tech confirmed
    // one, since enrollment year is wrong for a device re-enrolled years later. Batch
    // defaults never apply to an existing record: changing the batch strip must not
    // silently relocate a device someone re-intakes.
    const { "Year of Purchase": _year, ...refresh } = suggested;
    fields = { ...refresh, ...overrides };
  } else {
    fields = { ...suggested, ...compact(input.defaults ?? {}), ...overrides };
  }
  // A refresh keeps the tag as recorded; "iacs-1234" typed against "IACS-1234" is the same tag.
  fields["Asset Tag"] = idempotent ? existingTag : assetTag;
  fields.Serial = google.serialNumber;

  return { kind: "write", recordId: existing?.id ?? null, fields: compact(fields), idempotent, retagged };
}

function sameTag(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function pickOverrides(raw: Record<string, unknown>): InventoryFields {
  const out: InventoryFields = {};
  for (const key of OVERRIDABLE_FIELDS) {
    const value = raw?.[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
    else if (typeof value === "number") out[key] = value;
  }
  return out;
}

function compact<T extends Record<string, unknown>>(obj: T): InventoryFields {
  const out: InventoryFields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== "") out[key] = value as string | number;
  }
  return out;
}

/** Constant-time comparison against the configured intake token. */
export function tokenMatches(presented: string | undefined, expected: string | undefined): boolean {
  if (!presented || !expected) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
