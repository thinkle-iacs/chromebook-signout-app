import type { Context } from "aws-lambda";

const IT_USERS = new Set([
  "thinkle@innovationcharter.org",
  "ntroy@innovationcharter.org",
  "aspence@innovationcharter.org",
]);

export type AuthLevel = "none" | "teacher" | "it";

// Skip auth only under `netlify dev`, which sets NETLIFY_DEV=true. Do not key this off
// CONTEXT: Netlify provides CONTEXT at build time only, so deployed functions see it as
// undefined — checking `!process.env.CONTEXT` left production with no auth at all.
const IS_LOCAL_DEV = process.env.NETLIFY_DEV === "true";

export function getAuthLevel(context: Context): AuthLevel {
  if (IS_LOCAL_DEV) return "it";

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
