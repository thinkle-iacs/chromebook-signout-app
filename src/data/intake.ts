import { authedFetch } from "@utils/authedFetch";
import { intakeHeaders, intakeUrl } from "@ui/magic/cb-intake-page";
import type { IntakeCredentials } from "@ui/magic/protocol";
import type { ChromebookInfo } from "./google";

/*
 * Client for mode=intake (src/functions/intake.ts), used by the /magic/ page.
 *
 * One request path: the extension's policy token goes on if this machine has one, and
 * authedFetch adds the login JWT if someone is signed in. The endpoint takes either.
 */

export type IntakeDefaults = {
  Purpose?: string;
  Status?: string;
  Location?: string;
};

export type LookupResult = {
  serial: string;
  google: ChromebookInfo | null;
  suggested: Record<string, string> | null;
  existingRecord: Record<string, any> | null;
  duplicateSerial: boolean;
  defaults: IntakeDefaults | null;
  defaultsError: string | null;
};

export type CommitResult = {
  ok: true;
  created: boolean;
  updated: boolean;
  idempotent: boolean;
  retagged: boolean;
  record: Record<string, any>;
  fieldsWritten: Record<string, string | number>;
  googleAssetIdWriteBack: { ok: boolean; annotatedAssetId?: string; error?: string };
  recordUrl: string;
};

export type IntakeResponse<T> =
  | { ok: true; data: T }
  /** 401 that a login would fix: the page offers sign-in rather than dead-ending. */
  | { ok: false; needsLogin: true; status: 401; error: any }
  | { ok: false; needsLogin: false; status: number; error: any };

async function intakeFetch<T>(
  credentials: IntakeCredentials | null,
  params: Record<string, string>,
  body?: unknown
): Promise<IntakeResponse<T>> {
  const url = new URL(intakeUrl(credentials, params));
  let response: Response;
  try {
    response = await authedFetch(url.pathname + url.search, {
      method: body ? "POST" : "GET",
      headers: {
        ...intakeHeaders(credentials),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (err) {
    return {
      ok: false,
      needsLogin: false,
      status: 0,
      error: { error: "network", detail: `Could not reach the server: ${err?.message ?? err}` },
    };
  }
  const payload = await response.json().catch(() => ({}));
  if (response.ok) return { ok: true, data: payload as T };
  if (response.status === 401 && payload?.canFallBackToLogin) {
    return { ok: false, needsLogin: true, status: 401, error: payload };
  }
  return { ok: false, needsLogin: false, status: response.status, error: payload };
}

export function lookupDevice(credentials: IntakeCredentials | null, serial: string) {
  return intakeFetch<LookupResult>(credentials, { action: "lookup", serial });
}

export function commitDevice(
  credentials: IntakeCredentials | null,
  body: { serial: string; assetTag: string; fields: Record<string, string>; allowRetag?: boolean }
) {
  return intakeFetch<CommitResult>(credentials, { action: "commit" }, body);
}

export function saveDefaults(credentials: IntakeCredentials | null, defaults: IntakeDefaults) {
  return intakeFetch<{ ok: true; defaults: IntakeDefaults }>(
    credentials,
    { action: "setDefaults" },
    { defaults }
  );
}
