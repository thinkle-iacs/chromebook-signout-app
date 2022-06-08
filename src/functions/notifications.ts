import type { APIGatewayEvent, Context } from "aws-lambda";
import { notificationsBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const {
    signoutHistoryId,
    messageId,
    studentRecordId,
    Recipient,
    Recipient2,
    Recipient3,
    Recipient4,
    ExtraText,
  } = event.queryStringParameters;
  console.log(
    "Got params",
    JSON.stringify({
      signoutHistoryId,
      messageId,
      Recipient,
      Recipient2,
      Recipient3,
      Recipient4,
      ExtraText,
    })
  );
  let fields = {
    "Signout History": [signoutHistoryId],
    Messages: [messageId],
    Recipient,
    Recipient2,
    Recipient3,
    Recipient4,
    ExtraText,
  };

  let result = await notificationsBase.create([
    {
      fields,
    },
  ]);
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
