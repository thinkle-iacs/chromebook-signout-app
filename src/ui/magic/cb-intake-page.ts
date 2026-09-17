// Copied from thinkle-iacs/cb-intake-extension client/cb-intake-page.ts @ d23d46f — keep in sync; do not edit here.
import {
  ANNOUNCE_TYPE,
  MESSAGE_SOURCE,
  PRESENT_TYPE,
  PROTOCOL_VERSION,
  REQUEST_TYPE,
  type DeviceIdentity,
  type IntakeCredentials,
} from "./protocol";

/**
 * The page's side of the conversation.
 *
 * The extension announces the device on `/magic/` by `postMessage`. All this does is wait
 * for that announcement, with the two bits of care that matter on a bench: a timeout, so a
 * machine with no extension falls through to manual entry instead of hanging, and a
 * re-request, for a page whose script finishes loading after the announcement went out.
 *
 * To use it in the signout app, copy this file and `src/protocol.ts` into the page's
 * source and fix the one import path. It has no dependencies.
 */

/** The announcement as it arrives: every field optional until we have checked it. */
type InboundAnnouncement = Partial<{
  source: string;
  type: string;
  protocol: number;
  extensionVersion: string;
  ok: boolean;
  device: DeviceIdentity;
  credentials: IntakeCredentials;
  error: { code?: string; message?: string };
}>;

export type IntakeDevice = {
  device: DeviceIdentity;
  credentials: IntakeCredentials;
  extensionVersion: string;
};

export type WaitResult =
  | { available: true; value: IntakeDevice }
  | { available: false; reason: string; code?: string };

export type WaitOptions = {
  /**
   * How long to wait for the extension to say it exists at all. Its presence beacon goes
   * out at document_start, so this only has to cover the page's own startup. Design §8
   * wants state 1 brief, and this is the whole of it on a machine with no extension.
   */
  presenceTimeoutMs?: number;
  /**
   * How long to then wait for the device itself. Generous on purpose: waking the service
   * worker and reading device attributes and enterprise policy measured at nearly two
   * seconds cold, and a device that *has* the extension must never be dropped to manual
   * entry over a slow start.
   */
  deviceTimeoutMs?: number;
  /** For tests. Defaults to the real window. */
  target?: Pick<Window, "addEventListener" | "removeEventListener" | "postMessage">;
};

const DEFAULT_PRESENCE_TIMEOUT_MS = 800;
const DEFAULT_DEVICE_TIMEOUT_MS = 10_000;

/** The page's own origin — the only target we ever postMessage to. */
function currentOrigin(): string {
  return (globalThis as { location?: { origin?: string } }).location?.origin ?? "/";
}

export function waitForIntakeDevice(options: WaitOptions = {}): Promise<WaitResult> {
  const target = options.target ?? window;
  const presenceTimeoutMs = options.presenceTimeoutMs ?? DEFAULT_PRESENCE_TIMEOUT_MS;
  const deviceTimeoutMs = options.deviceTimeoutMs ?? DEFAULT_DEVICE_TIMEOUT_MS;

  return new Promise((resolve) => {
    let settled = false;
    let deviceTimer: ReturnType<typeof setTimeout> | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const finish = (result: WaitResult) => {
      if (settled) return;
      settled = true;
      for (const timer of timers) clearTimeout(timer);
      target.removeEventListener("message", onMessage as EventListener);
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      // Untrusted until checked: anything on the page can postMessage.
      const data = event.data as InboundAnnouncement | null;
      if (data?.source !== MESSAGE_SOURCE) return;

      if (data.type === PRESENT_TYPE) {
        // There is an extension here, so stop counting down to "no extension" and give it
        // the longer deadline instead.
        clearTimeout(presenceTimer);
        if (!deviceTimer) {
          deviceTimer = setTimeout(
            () =>
              finish({
                available: false,
                reason: `The intake extension answered but did not report a device within ${Math.round(deviceTimeoutMs / 1000)}s.`,
                code: "extension_stalled",
              }),
            deviceTimeoutMs
          );
          timers.push(deviceTimer);
        }
        return;
      }

      if (data.type !== ANNOUNCE_TYPE) return;

      if (data.protocol !== PROTOCOL_VERSION) {
        finish({
          available: false,
          reason: `This page speaks intake protocol ${PROTOCOL_VERSION}; the installed extension speaks ${data.protocol}. Update one of them.`,
        });
        return;
      }
      if (!data.ok) {
        finish({
          available: false,
          reason: data.error?.message ?? "The extension could not read this device.",
          code: data.error?.code,
        });
        return;
      }
      finish({
        available: true,
        value: {
          device: data.device!,
          credentials: data.credentials!,
          extensionVersion: data.extensionVersion!,
        },
      });
    };

    const ask = () =>
      target.postMessage({ source: MESSAGE_SOURCE, type: REQUEST_TYPE }, currentOrigin());

    const presenceTimer = setTimeout(
      () =>
        finish({
          available: false,
          reason: "No intake extension on this machine.",
          code: "no_extension",
        }),
      presenceTimeoutMs
    );
    // Asked twice on purpose. The extension announces on its own, but on a fast page this
    // request can still land before its content script is listening, and a bench tool that
    // silently falls back to manual entry because of a few milliseconds is worse than one
    // extra postMessage.
    const retry = setTimeout(ask, Math.min(300, Math.floor(presenceTimeoutMs / 3)));
    timers.push(presenceTimer, retry);

    target.addEventListener("message", onMessage as EventListener);
    ask();
  });
}

/**
 * Attach whatever credential this machine has.
 *
 * On an enrolled device the extension supplies the policy token and the page never logs
 * in. Anywhere else there is no token, and the request rides the app's ordinary session —
 * which is the whole reason the endpoint accepts either.
 */
export function intakeHeaders(credentials: IntakeCredentials | null): Record<string, string> {
  return credentials?.token ? { "X-Intake-Token": credentials.token } : {};
}

export function intakeUrl(
  credentials: IntakeCredentials | null,
  params: Record<string, string>
): string {
  const base = credentials?.apiBaseUrl ?? "/.netlify/functions/index";
  const url = new URL(base, currentOrigin() === "/" ? "http://localhost" : currentOrigin());
  url.searchParams.set("mode", "intake");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}
