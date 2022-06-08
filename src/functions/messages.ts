import type { APIGatewayEvent, Context } from "aws-lambda";
import { messagesBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const { lasid } = event.queryStringParameters;
  let filterByFormula = "";
  let query = messagesBase.select({
    maxRecords: 100,
    filterByFormula,
    fields: ["Body", "ID", "Subject"],
  });
  let result = await query.all();
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
