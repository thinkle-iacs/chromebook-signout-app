import type { APIGatewayEvent, Context } from "aws-lambda";
const SHIM_SECRET = process.env.SHIM_SECRET;
const SHIM_URL = process.env.SHIM_URL;

export async function handler(event: APIGatewayEvent, context: Context) {
  console.log("Google Shim Handler");
  if (event.httpMethod == "GET") {
    const { user, serial } = event.queryStringParameters;
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
