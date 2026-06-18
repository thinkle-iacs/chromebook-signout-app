import type { APIGatewayEvent, Context } from "aws-lambda";
import { getAuthLevel, forbidden } from "./auth";
const SHIM_SECRET = process.env.SHIM_SECRET;
const SHIM_URL = process.env.SHIM_URL;

async function callShim(params: Record<string, string>) {
  const response = await fetch(SHIM_URL + "?" + new URLSearchParams(params), {
    method: "GET",
    redirect: "follow",
  });
  return response.json();
}

export async function handler(event: APIGatewayEvent, context: Context) {
  console.log("Google Shim Handler");
  if (!SHIM_SECRET || !SHIM_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfiguration: missing SHIM_SECRET or SHIM_URL" }) };
  }
  if (event.httpMethod == "GET") {
    const { user, serial, action } = event.queryStringParameters || {};
    if (action) {
      // Device actions (disable/reenable) require IT-level access
      if (getAuthLevel(context) !== "it") {
        return forbidden("IT access required for device actions");
      }
      if (!serial) {
        return { statusCode: 400, body: JSON.stringify({ error: "serial required for action" }) };
      }
      if (action !== "disable" && action !== "reenable") {
        return { statusCode: 400, body: JSON.stringify({ error: "action must be disable or reenable" }) };
      }
      const json = await callShim({ mode: "action", secret: SHIM_SECRET, serial, action });
      const statusCode = json.status === "success" ? 200 : 500;
      return { statusCode, body: JSON.stringify(json) };
    } else if (user) {
      const json = await callShim({ mode: "user", secret: SHIM_SECRET, user });
      return { statusCode: 200, body: JSON.stringify(json) };
    } else if (serial) {
      const json = await callShim({ mode: "serial", secret: SHIM_SECRET, id: serial });
      return { statusCode: 200, body: JSON.stringify(json) };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No user, serial, or action provided" }),
      };
    }
  }
}
