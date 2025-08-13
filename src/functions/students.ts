import type { APIGatewayEvent, Context } from "aws-lambda";
import { studentsBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const { name } = event.queryStringParameters;
  let query = studentsBase.select({
    maxRecords: 100,
    filterByFormula: `Search("${name.toLowerCase()}",LOWER({Name}))`,
    fields: [
      "LASID",
      "Name",
      "Email",
      "YOG",
      "Advisor",
      "Notes",
      "Status",
      // Include linked Ticket record IDs for integration (list of Airtable record IDs)
      "Tickets",
    ],
  });
  let result = await query.firstPage();
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
