import type { APIGatewayEvent, Context } from "aws-lambda";
import { invoicesBase } from "./Airtable";

// Legacy handler kept for compatibility; prefer using mode=invoices and src/functions/invoices.ts
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
      const result = await invoicesBase.update(records);
      return { statusCode: 200, body: JSON.stringify(result) };
    }

    const query = invoicesBase.select({
      fields: [
        "Invoice Number",
        "Student",
        "Ticket",
        "Date Created",
        "Send Email",
        "Ticket Block",
        "Contact Info",
        "Device Asset Tag (from Ticket)",
        "Student Email (from Ticket)",
      ],
    });
    const result = await query.all();
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Legacy billing handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
}
