import type { APIGatewayEvent, Context } from "aws-lambda";
import { getAuthLevel } from "./auth";
import { inventoryBase, intakeDefaultsBase } from "./Airtable";
import { callShim } from "./googleAdmin";
import {
  DEFAULT_FIELDS,
  formulaString,
  isValidAssetTag,
  isValidSerial,
  planCommit,
  suggestedFields,
  tokenMatches,
  type ExistingRecord,
  type GoogleDevice,
  type IntakeDefaults,
} from "./intakeFields";

/**
 * mode=intake — the endpoint behind /magic/, the new-Chromebook intake page.
 *
 * Full design and the security model live in thinkle-iacs/cb-intake-extension
 * (docs/design.md, docs/protocol.md). The short version:
 *
 *  - Called *before* the router's login gate. It accepts either an `X-Intake-Token`
 *    (delivered by enterprise policy to cbenroll sessions via the extension) or an
 *    it-level login. A cbenroll session has no JWT at all.
 *  - Writes one table, keyed by serial, never deletes. A serial carrying a different tag
 *    is refused without `allowRetag`; a tag already on another serial is refused outright.
 *  - The annotatedAssetId write-back to Google is best-effort and never fails a commit.
 */

type Response = { statusCode: number; body: string; headers?: Record<string, string> };

const json = (statusCode: number, body: unknown): Response => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function header(event: APIGatewayEvent, name: string): string | undefined {
  const headers = event.headers ?? {};
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

export type IntakeAuth = { ok: true; via: "token" | "login" } | { ok: false; response: Response };

export function authenticateIntake(event: APIGatewayEvent, context: Context): IntakeAuth {
  const presented = header(event, "x-intake-token");
  if (tokenMatches(presented, process.env.INTAKE_TOKEN)) return { ok: true, via: "token" };
  if (getAuthLevel(context) === "it") return { ok: true, via: "login" };
  return {
    ok: false,
    response: json(401, presented
      ? {
          error: "bad_token",
          detail: "This device's intake token was rejected. Sign in to continue.",
          canFallBackToLogin: true,
        }
      : {
          error: "unauthenticated",
          detail: "Sign in with an IT account to use intake on this machine.",
          canFallBackToLogin: true,
        }),
  };
}

function parseBody(event: APIGatewayEvent): Record<string, any> | null {
  if (!event.body) return {};
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// --- data access -------------------------------------------------------------------

async function googleBySerial(serial: string): Promise<GoogleDevice | null> {
  if (!process.env.SHIM_SECRET || !process.env.SHIM_URL) {
    throw new Error("Server misconfiguration: missing SHIM_SECRET or SHIM_URL");
  }
  const result = await callShim({ mode: "serial", secret: process.env.SHIM_SECRET, id: serial });
  if (result?.status !== "success") {
    throw new Error(`Google lookup failed: ${result?.detail ?? "unknown error"}`);
  }
  return result.result ?? null;
}

async function inventoryWhere(formula: string): Promise<ExistingRecord[]> {
  const records = await inventoryBase.select({ filterByFormula: formula, maxRecords: 3 }).firstPage();
  return records.map((r) => ({ id: r.id, fields: r.fields as ExistingRecord["fields"] }));
}

const bySerial = (serial: string) => inventoryWhere(`LOWER({Serial}) = ${formulaString(serial.toLowerCase())}`);
const byTag = (tag: string) =>
  inventoryWhere(`LOWER(TRIM({Asset Tag})) = ${formulaString(tag.trim().toLowerCase())}`);

async function readDefaults(): Promise<{ id: string | null; defaults: IntakeDefaults }> {
  const [row] = await intakeDefaultsBase.select({ maxRecords: 1 }).firstPage();
  const defaults: IntakeDefaults = {};
  for (const key of DEFAULT_FIELDS) {
    const value = row?.fields?.[key];
    if (typeof value === "string" && value) defaults[key] = value;
  }
  return { id: row?.id ?? null, defaults };
}

/** Best-effort: set annotatedAssetId in Admin Directory. Never throws. */
async function writeBackAssetId(serial: string, assetTag: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const result = await callShim(
      { mode: "setAssetId", secret: process.env.SHIM_SECRET ?? "", serial, assetId: assetTag },
      { signal: controller.signal as any },
    ).finally(() => clearTimeout(timer));
    if (result?.status === "success") return { ok: true, annotatedAssetId: assetTag };
    return { ok: false, error: result?.errorMessage ?? result?.detail ?? "unknown error" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function recordView(record: { id: string; fields: any }) {
  return { _id: record.id, ...record.fields };
}

// --- actions -----------------------------------------------------------------------

async function lookup(event: APIGatewayEvent): Promise<Response> {
  const serial = event.queryStringParameters?.serial?.trim();
  if (!isValidSerial(serial)) return json(400, { error: "bad_serial", detail: "A serial number is required." });

  const [google, existing, defaultsResult] = await Promise.all([
    googleBySerial(serial),
    bySerial(serial),
    readDefaults().then(
      (r) => ({ defaults: r.defaults, error: null }),
      (err) => ({ defaults: null, error: String(err?.message ?? err) }),
    ),
  ]);

  const existingRecord = existing[0] ? recordView(existing[0]) : null;
  const suggested = google ? suggestedFields(google) : null;
  // A known device's recorded DOP is the prefill, and commit keeps it unless changed.
  if (suggested && existingRecord?.DOP) suggested.DOP = String(existingRecord.DOP);

  return json(200, {
    serial: google?.serialNumber ?? serial,
    google,
    suggested,
    existingRecord,
    duplicateSerial: existing.length > 1,
    defaults: defaultsResult.defaults,
    defaultsError: defaultsResult.error,
  });
}

async function commit(event: APIGatewayEvent): Promise<Response> {
  if (event.httpMethod !== "POST") return json(405, { error: "commit must be POST" });
  const body = parseBody(event);
  if (!body) return json(400, { error: "bad_body", detail: "Body must be JSON." });

  const { serial, assetTag, fields = {}, allowRetag = false } = body;
  if (!isValidSerial(serial)) return json(400, { error: "bad_serial", detail: "A serial number is required." });
  if (!isValidAssetTag(assetTag)) {
    return json(400, { error: "bad_asset_tag", detail: "Type the asset tag from the sticker." });
  }

  const google = await googleBySerial(serial);
  if (!google) {
    return json(422, {
      error: "not_in_google",
      detail: `Google Admin has no enrolled Chromebook with serial ${serial}. Enroll it first, or check the serial.`,
    });
  }

  const [existing, holders] = await Promise.all([bySerial(google.serialNumber), byTag(assetTag)]);
  if (existing.length > 1) {
    return json(409, {
      error: "duplicate_serial",
      detail: `Inventory already has ${existing.length} records for serial ${google.serialNumber}. Merge them in Airtable first.`,
      records: existing.map(recordView),
    });
  }

  // A missing Intake Defaults table shouldn't block intake; the record just has no batch fields.
  const defaults = await readDefaults().then((r) => r.defaults, () => null);
  const plan = planCommit({
    google,
    assetTag,
    existing: existing[0] ?? null,
    tagHolder: holders.find((h) => h.id !== existing[0]?.id) ?? null,
    defaults,
    overrides: fields,
    allowRetag: allowRetag === true,
  });

  if (plan.kind === "retag_conflict") {
    return json(409, {
      error: "retag_conflict",
      detail: "This serial already carries a different asset tag.",
      existingTag: plan.existingTag,
      incomingTag: assetTag.trim(),
      record: recordView(existing[0]),
    });
  }
  if (plan.kind === "tag_in_use") {
    return json(409, {
      error: "tag_in_use",
      detail: `Asset tag ${assetTag.trim()} is already on serial ${plan.otherSerial}. Fix that record first.`,
      incomingTag: assetTag.trim(),
      otherSerial: plan.otherSerial,
      recordUrl: `/asset/${encodeURIComponent(assetTag.trim())}`,
    });
  }

  // typecast so "2026" lands in a number field and batch defaults match select options.
  const written = plan.recordId
    ? await inventoryBase.update(plan.recordId, plan.fields as any, { typecast: true })
    : await inventoryBase.create(plan.fields as any, { typecast: true });

  const tag = String(plan.fields["Asset Tag"]);
  const googleAssetIdWriteBack = await writeBackAssetId(google.serialNumber, tag);

  console.log(
    `[intake] ${plan.recordId ? (plan.idempotent ? "refreshed" : "updated") : "created"} ${tag} -> ${google.serialNumber}` +
      (defaults === null && !plan.recordId ? " (no batch defaults)" : ""),
  );

  return json(200, {
    ok: true,
    created: !plan.recordId,
    updated: Boolean(plan.recordId),
    idempotent: plan.idempotent,
    retagged: plan.retagged,
    record: recordView(written as any),
    fieldsWritten: plan.fields,
    googleAssetIdWriteBack,
    recordUrl: `/asset/${encodeURIComponent(tag)}`,
  });
}

async function setDefaults(event: APIGatewayEvent): Promise<Response> {
  if (event.httpMethod !== "POST") return json(405, { error: "setDefaults must be POST" });
  const body = parseBody(event);
  if (!body || typeof body.defaults !== "object" || body.defaults === null) {
    return json(400, { error: "bad_body", detail: "A defaults object is required." });
  }
  const fields: Record<string, string> = {};
  for (const key of DEFAULT_FIELDS) {
    const value = body.defaults[key];
    if (typeof value === "string") fields[key] = value.trim();
  }
  const { id } = await readDefaults();
  const row = id
    ? await intakeDefaultsBase.update(id, fields, { typecast: true })
    : await intakeDefaultsBase.create(fields, { typecast: true });
  const defaults: IntakeDefaults = {};
  for (const key of DEFAULT_FIELDS) {
    const value = (row as any).fields?.[key];
    if (typeof value === "string" && value) defaults[key] = value;
  }
  return json(200, { ok: true, defaults });
}

const actions: Record<string, (event: APIGatewayEvent) => Promise<Response>> = {
  lookup,
  commit,
  setDefaults,
};

export async function handler(event: APIGatewayEvent, context: Context): Promise<Response> {
  const auth = authenticateIntake(event, context);
  if (auth.ok === false) return auth.response;

  const action = event.queryStringParameters?.action;
  const run = action ? actions[action] : undefined;
  if (!run) return json(400, { error: "bad_action", detail: `Unknown action "${action}".` });

  try {
    return await run(event);
  } catch (err) {
    console.error(`[intake] ${action} failed`, err);
    return json(500, {
      error: "internal_error",
      detail: err instanceof Error ? err.message : String(err),
      // The Airtable write is the last thing that can throw (the Google write-back
      // catches its own errors), so a failure here means nothing was written.
      written: false,
    });
  }
}
