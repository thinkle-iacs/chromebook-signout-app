import type { APIGatewayEvent, Context } from "aws-lambda";
import { studentsBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const { name, report, yog, status, emails } = event.queryStringParameters || {};

  if (report === "true") {
    return getStudentsForReport({ yog, status, emails });
  }

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
      // Include open ticket numbers for quick lookup
      "Ticket Numbers",
    ],
  });
  let result = await query.firstPage();
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}

function airtableString(value: string) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function parseEmails(value?: string) {
  return (value || "")
    .split(/[,\n\r\t ;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function getStudentsForReport({
  yog,
  status,
  emails,
}: {
  yog?: string;
  status?: string;
  emails?: string;
}) {
  let filters = [];
  const requestedEmails = parseEmails(emails);

  if (yog) {
    filters.push(`{YOG}="${airtableString(yog)}"`);
  }
  if (status) {
    filters.push(`{Status}="${airtableString(status)}"`);
  }
  if (requestedEmails.length) {
    filters.push(
      `OR(${requestedEmails
        .map((email) => `LOWER({Email})="${airtableString(email)}"`)
        .join(",")})`
    );
  }

  const filterByFormula = filters.length ? `AND(${filters.join(",")})` : "";
  let allRecords = [];
  let totalRecordsFetched = 0;

  try {
    await new Promise<void>((resolve, reject) => {
      studentsBase
        .select({
          filterByFormula,
          fields: [
            "LASID",
            "Name",
            "Email",
            "YOG",
            "Advisor",
            "Notes",
            "Status",
            "Tickets",
            "Ticket Numbers",
          ],
        })
        .eachPage(
          (records, fetchNextPage) => {
            allRecords = allRecords.concat(records);
            totalRecordsFetched += records.length;
            if (totalRecordsFetched > 2000) {
              reject(new Error("TOO_MANY_RECORDS"));
              return;
            }
            fetchNextPage();
          },
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
    });
  } catch (err) {
    if (err.message === "TOO_MANY_RECORDS") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Too many students requested. Please refine your query.",
        }),
      };
    }
    throw err;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(allRecords),
  };
}
