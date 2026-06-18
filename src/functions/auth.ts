import type { Context } from "aws-lambda";

const IT_USERS = new Set([
  "thinkle@innovationcharter.org",
  "ntroy@innovationcharter.org",
  "aspence@innovationcharter.org",
]);

export type AuthLevel = "none" | "teacher" | "it";

// Netlify sets CONTEXT="production" in prod; undefined in local dev via `netlify dev`.
// Trust local dev so the Identity widget bypass in user.ts doesn't break the dev loop.
const IS_PRODUCTION = process.env.CONTEXT === "production";

export function getAuthLevel(context: Context): AuthLevel {
  if (!IS_PRODUCTION) return "it";

  const email: string | undefined = (context as any).clientContext?.user?.email;
  if (!email) return "none";

  const at = email.indexOf("@");
  if (at < 0) return "none";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (domain !== "innovationcharter.org") return "none";
  if (local.includes(".")) return "none"; // student account (john.smith@...)
  if (IT_USERS.has(email)) return "it";
  return "teacher";
}

export function forbidden(detail?: string) {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: "Forbidden", detail: detail ?? "Insufficient permissions" }),
  };
}
