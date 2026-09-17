// Copied from thinkle-iacs/cb-intake-extension src/protocol.ts @ d23d46f — keep in sync; do not edit here.
/**
 * What the extension hands the page, and how.
 *
 * The extension's whole job is to answer "what Chromebook am I running on?" and to hand
 * over the credential that lets the page write the answer down. It does that with a
 * content script on `/magic/` — so the page needs no extension id, no messaging code, and
 * no cross-origin requests — and everything after that is the page's own same-origin API
 * call, authenticated with the token if there is one and the app login if there is not.
 *
 * Both halves are written by hand in different repos, so keep this small and versioned.
 */
export const PROTOCOL_VERSION = 2;

/** Marks our messages so the page can ignore everyone else's `postMessage` traffic. */
export const MESSAGE_SOURCE = "cb-intake";

/**
 * Extension → page, first thing at document_start: "I am here, the device is coming."
 *
 * Waking the service worker and reading device attributes and policy takes a moment —
 * measured at nearly two seconds on a cold worker, which is longer than any sane "is there
 * an extension?" timeout. Without this beacon a page has to choose between falling back to
 * manual entry on a device that does have the extension, or making every machine that
 * does not sit and wait. With it, the page knows within milliseconds which world it is in.
 */
export const PRESENT_TYPE = "cb-intake:present";

/** Extension → page: here is the device. Sent as soon as it is known, and again on request. */
export const ANNOUNCE_TYPE = "cb-intake:device";

/** Page → extension: ask again (a reload-free "next device", or a late-loading page). */
export const REQUEST_TYPE = "cb-intake:request";

export type DeviceIdentity = {
  serial: string;
  /** `annotatedAssetId` as Admin Directory already knows it, if anything. */
  assetId: string | null;
  annotatedLocation: string | null;
  directoryDeviceId: string | null;
};

export type IntakeCredentials = {
  /**
   * The intake token from enterprise policy, or `null` when this device has none. Null is
   * not an error: the page falls back to its ordinary login, which is also how the flow
   * works from a laptop.
   */
  token: string | null;
  /** Where to send the intake calls. Same origin as the page in every normal deployment. */
  apiBaseUrl: string;
};

export type ErrorCode =
  /** enterprise.deviceAttributes gave us nothing: unmanaged device, or unaffiliated user. */
  | "device_unavailable"
  /** The message did not come from our own content script on /magic/. */
  | "forbidden_sender"
  /** A bug in here. */
  | "internal_error";

export type IntakeError = { code: ErrorCode; message: string };

type PayloadBase = { protocol: number; extensionVersion: string };

export type DevicePayload =
  | (PayloadBase & { ok: true; device: DeviceIdentity; credentials: IntakeCredentials })
  | (PayloadBase & { ok: false; error: IntakeError });

/** What the page receives on `window.addEventListener("message", …)`. */
export type DeviceAnnouncement = DevicePayload & {
  source: typeof MESSAGE_SOURCE;
  type: typeof ANNOUNCE_TYPE;
};

export type PresenceBeacon = {
  source: typeof MESSAGE_SOURCE;
  type: typeof PRESENT_TYPE;
  protocol: number;
  extensionVersion: string;
};

/** The content script's request to the service worker. Never reaches the page. */
export type DeviceRequest = { type: "getDevice" };

export function isDeviceRequest(raw: unknown): raw is DeviceRequest {
  return (
    typeof raw === "object" &&
    raw !== null &&
    (raw as { type?: unknown }).type === "getDevice"
  );
}

export function errorPayload(
  code: ErrorCode,
  message: string,
  extensionVersion: string
): DevicePayload {
  return {
    ok: false,
    protocol: PROTOCOL_VERSION,
    extensionVersion,
    error: { code, message },
  };
}
