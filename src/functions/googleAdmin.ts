import type { APIGatewayEvent, Context } from "aws-lambda";
import { getAuthLevel, forbidden } from "./auth";
const SHIM_SECRET = process.env.SHIM_SECRET;
const SHIM_URL = process.env.SHIM_URL;

export async function handler(event: APIGatewayEvent, context: Context) {
  console.log("Google Shim Handler");
  if (event.httpMethod == "GET") {
    const { user, serial, action } = event.queryStringParameters || {};
    // Device actions (disable/reenable) require IT-level access
    if (action && getAuthLevel(context) !== "it") {
      return forbidden("IT access required for device actions");
    }
    let params;
    if (user) {
      params = {
        mode: "user",
        secret: SHIM_SECRET,
        user,
      };
    } else if (serial) {
      params = {
        mode: "serial",
        id: serial,
        secret: SHIM_SECRET,
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `No user or serial provided`,
          params: JSON.stringify(event.queryStringParameters),
        }),
      };
    }
    let response = await fetch(SHIM_URL + "?" + new URLSearchParams(params), {
      method: "GET",
      redirect: "follow",
    });
    return {
      statusCode: 200,
      body: JSON.stringify(await response.json()),
    };
  }
}
