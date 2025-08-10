import type { APIGatewayEvent, Context } from "aws-lambda";
import { handler as studentHandler } from "./students";
import { handler as staffHandler } from "./staff";
import { handler as inventoryHandler } from "./inventory";
import { handler as signoutHandler } from "./signout";
import { handler as signoutHistoryHandler } from "./signoutHistory";
import { handler as contractHandler } from "./contracts";
import { handler as notificationsHandler } from "./notifications";
import { handler as contactHandler } from "./contacts";
import { handler as messageHandler } from "./messages";
import { handler as googleHandler } from "./googleAdmin";
import { handler as updateStudent } from "./updateStudent";
import { handler as sisApiHandler } from "./sisApi";
import { handler as ticketHandler } from "./tickets";
import { handler as invoicesHandler } from "./invoices";

let modes = {
  student: studentHandler,
  asset: inventoryHandler,
  signout: signoutHandler,
  signoutHistory: signoutHistoryHandler,
  staff: staffHandler,
  contract: contractHandler,
  contact: contactHandler,
  notifications: notificationsHandler,
  message: messageHandler,
  google: googleHandler,
  updateStudent: updateStudent,
  sisApi: sisApiHandler,
  tickets: ticketHandler,
  invoices: invoicesHandler,
};

export async function handler(
  event: APIGatewayEvent,
  context: Context
): Promise<{ statusCode: number; body: string }> {
  if (modes[event.queryStringParameters.mode]) {
    return modes[event.queryStringParameters.mode](event, context);
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `No known mode provided. We only understand mode : ${Object.keys(
          modes
        )}`,
        params: JSON.stringify(event.queryStringParameters),
      }),
    };
  }
}
/*   let params = event.queryStringParameters;
  let jsonBody;
  if (event.body) {
    try {
      jsonBody = JSON.parse(event.body);
    } catch (err) {
      console.log(`ERROR PARSING "${event.body}"`);
      throw err;
    }
  }
  params = {
    ...params,
    ...jsonBody,
  };
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello world",
      content: "I echo params",
      params,
    }),
  };
}
 */
