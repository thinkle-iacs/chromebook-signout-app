import type { APIGatewayEvent, Context } from "aws-lambda";
import { inventoryBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const {
    tag,
    lasid,
    serial,
    staffEmail,
    onlyChromebooks,
    studentLoan,
    staffLoan,
    notLoaned,
    yog, // Add YOG filter parameter
  } = event.queryStringParameters;
  let filterByFormula = "";

  // Build the filter formula based on query parameters
  if (tag) {
    filterByFormula = `Search("${tag}",{Asset Tag})`;
  } else if (lasid) {
    filterByFormula = `ARRAYJOIN({Student (Current)}, "")="${lasid}"`;
  } else if (serial) {
    filterByFormula = `LOWER({Serial}) = "${serial.toLowerCase()}"`;
  } else if (staffEmail) {
    filterByFormula = `LOWER(ARRAYJOIN({Staff Email}, "")) = "${staffEmail.toLowerCase()}"`;
  }

  // Add filter for Chromebooks if the flag is set
  if (onlyChromebooks === "true") {
    const chromebookFilter = `{Device Type}="Chromebook"`;
    filterByFormula = filterByFormula
      ? `AND(${filterByFormula},${chromebookFilter})`
      : chromebookFilter;
  }

  // Add filter for student loans (Student (Current) is not blank)
  if (studentLoan === "true") {
    const studentLoanFilter = `NOT(ARRAYJOIN({Student (Current)}, "") = "")`;
    filterByFormula = filterByFormula
      ? `AND(${filterByFormula},${studentLoanFilter})`
      : studentLoanFilter;
  }

  // Add filter for staff loans (Staff Email is not blank)
  if (staffLoan === "true") {
    const staffLoanFilter = `NOT(ARRAYJOIN({Staff Email}, "") = "")`;
    filterByFormula = filterByFormula
      ? `AND(${filterByFormula},${staffLoanFilter})`
      : staffLoanFilter;
  }

  // Add filter for items not loaned (both Staff Email and Student (Current) are blank)
  if (notLoaned === "true") {
    const notLoanedFilter = `AND(ARRAYJOIN({Student (Current)}, "") = "", ARRAYJOIN({Staff Email}, "") = "")`;
    filterByFormula = filterByFormula
      ? `AND(${filterByFormula},${notLoanedFilter})`
      : notLoanedFilter;
  }

  // Add filter for YOG (Year of Graduation)
  if (yog) {
    const yogFilter = `ARRAYJOIN({YOG (from Student (Current))}, "") = "${yog}"`;
    filterByFormula = filterByFormula
      ? `AND(${filterByFormula},${yogFilter})`
      : yogFilter;
  }

  console.log("Query with filter:", filterByFormula);

  let allRecords = [];
  let offset = 0;
  let totalRecordsFetched = 0;

  // Fetch all records using pagination
  do {
    const query = inventoryBase.select({
      filterByFormula,
      fields: [
        "Asset Tag",
        "Category",
        "Device Type",
        "Make",
        "Model",
        "Serial",
        "MAC-Wireless",
        "Location",
        "Staff User",
        "Purpose",
        "Year of Purchase",
        "Student (Current)",
        "Email (from Student (Current))",
        "YOG (from Student (Current))", // Ensure YOG is included in the fields
        "Full Name (from User)",
        "SignoutRecordNumber",
        "Charger Type",
        "Staff Email",
        "LASID",
      ],
      offset, // Pass the offset for pagination
    });

    const result = await query.firstPage();
    allRecords = allRecords.concat(result); // Append the current batch of records
    offset = query.offset; // Update the offset for the next request
    totalRecordsFetched += result.length;

    // Sanity check: Stop fetching if more than 2000 records are retrieved
    if (totalRecordsFetched > 2000) {
      console.warn("Sanity check triggered: Too many records fetched.");
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Too many records requested. Please refine your query.",
        }),
      };
    }
  } while (offset); // Continue until there is no offset

  console.log(`Total records fetched: ${totalRecordsFetched}`);

  // Return all records as a list
  return {
    statusCode: 200,
    body: JSON.stringify(allRecords), // Return original records
  };
}
