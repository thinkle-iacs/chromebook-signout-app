import type { APIGatewayEvent, Context } from "aws-lambda";
import { invoicesBase } from "./Airtable";

/*
  Invoices handler
  - POST:  create invoices (expects an array of Airtable fields objects)
  - PATCH: update invoices (expects an array of { id, fields })
  - GET:   list invoices, optional filters (e.g., ticketNumber, studentEmail, assetTag)
*/
export async function handler(event: APIGatewayEvent, context: Context) {
  try {
    if (event.httpMethod === "POST") {
      const records = JSON.parse(event.body || "[]");
      const result = await invoicesBase.create(
        records.map((r: any) => ({ fields: r }))
      );
      return { statusCode: 200, body: JSON.stringify(result) };
    }

    if (event.httpMethod === "PATCH") {
      const records = JSON.parse(event.body || "[]");
      const result = await invoicesBase.update(records as any);
      return { statusCode: 200, body: JSON.stringify(result) };
    }

    // Default to GET
    const { ticketNumber, studentEmail, assetTag } =
      event.queryStringParameters || ({} as any);

    let filters: string[] = [];

    if (ticketNumber) {
      const num = `${ticketNumber}`.replace(/[^0-9]/g, "");
      if (num) filters.push(`{Number (from Ticket)} = ${num}`);
    }

    if (studentEmail) {
      filters.push(`{Student Email (from Student)} = '${studentEmail}'`);
    }

    if (assetTag) {
      filters.push(`{Device Asset Tag (from Ticket)} = '${assetTag}'`);
    }

    const filterByFormula = filters.length ? `AND(${filters.join(", ")})` : "";

    const fields = [
      "Invoice Number",
      // Lookup/rollup fields used for filtering and UI
      "Number (from Ticket)",
      "Repair Cost (from Ticket)",
      // Core invoice fields
      "Student",
      "Ticket",
      "Date Created",
      "Send Email",
      "Email Sent",
      "Ticket Block",
      "Contact Info",
      "Device Asset Tag (from Ticket)",
      "Student Email (from Student)",
    ];

    const query = invoicesBase.select({
      filterByFormula,
      fields,
    });
    const result = await query.all();
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Invoices handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
}
