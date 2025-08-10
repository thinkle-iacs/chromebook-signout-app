import type { APIGatewayEvent, Context } from "aws-lambda";
import { notificationsBase } from "./Airtable";

/*
  A POST event is required to create new records.
  A PATCH event is used to update...
*/
export async function handler(event: APIGatewayEvent, context: Context) {
  if (event.httpMethod == "POST") {
    console.log("Create!");
    const records = JSON.parse(event.body);
    let result = await notificationsBase.create(
      records.map((r) => ({ fields: r }))
    );
    return { statusCode: 200, body: JSON.stringify(result) };
  } else if (event.httpMethod == "PATCH") {
    console.log("Update!");
    const records = JSON.parse(event.body);
    let results = await notificationsBase.update(records);
    return { statusCode: 200, body: JSON.stringify(results) };
  } else if (event.httpMethod == "GET") {
    console.log("Get!");
    const { ticketNumber, signout, assetTag, minCreated } =
      event.queryStringParameters || ({} as any);

    let filters: string[] = [];

    if (ticketNumber) {
      // Simple equality on lookup/rollup of Ticket Number
      // Field is expected to be a lookup named "Number (from Ticket)"
      const num = `${ticketNumber}`.replace(/[^0-9]/g, "");
      if (num) {
        filters.push(`{Number (from Ticket)} = ${num}`);
      }
    }

    if (signout) {
      // Linked Signout History records (keep for future use)
      const clause = `FIND("," & "${signout}" & ",", "," & ARRAYJOIN({Signout History}, ",") & ",")`;
      filters.push(clause);
    }

    if (assetTag) {
      // If rollup/lookup exists from Signout History
      const clause = `{Asset (from Signout History)} = "${assetTag}"`;
      filters.push(clause);
    }

    if (minCreated) {
      // Filter records created after a timestamp
      const clause = `IS_AFTER({Created}, DATETIME_PARSE("${minCreated}"))`;
      filters.push(clause);
    }

    const filterByFormula = filters.length ? `AND(${filters.join(", ")})` : "";
    console.log("Notifications filterByFormula:", filterByFormula);

    const query = notificationsBase.select({ filterByFormula });
    const result = await query.all();
    console.log("Notifications query result count:", result.length);
    return { statusCode: 200, body: JSON.stringify(result) };
  }
}
