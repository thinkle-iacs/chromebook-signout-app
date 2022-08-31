import type { APIGatewayEvent, Context } from "aws-lambda";
import { contactsBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const { lasid } = event.queryStringParameters;
  let filterByFormula = "";
  let query = contactsBase.select({
    // maxRecords: 100,
    filterByFormula,
    fields: [
      "Contact1Email",
      "Contact2Email",
      "Contact3Email",
      "Contact4Email",
      "Contact5Email",
      "Contact6Email",
      "Contact7Email",
      "LASID (from Student)",
    ],
  });
  let result = await query.all();
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
