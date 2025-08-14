import type { APIGatewayEvent, Context } from "aws-lambda";
import { ticketsBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const httpMethod = event.httpMethod;

  if (httpMethod === "POST") {
    return await createTicket(event);
  } else if (httpMethod === "PUT" || httpMethod === "PATCH") {
    return await updateTicket(event);
  } else {
    return await getTickets(event);
  }
}

async function createTicket(event: APIGatewayEvent) {
  try {
    const body = JSON.parse(event.body || "{}");
    const record = await ticketsBase.create(body);
    return {
      statusCode: 201,
      body: JSON.stringify(record),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
}

async function updateTicket(event: APIGatewayEvent) {
  try {
    const body = JSON.parse(event.body || "{}");
    const { id, ...fields } = body;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Record ID is required for updates" }),
      };
    }

    const record = await ticketsBase.update(id, fields);
    return {
      statusCode: 200,
      body: JSON.stringify(record),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
}

async function getTickets(event: APIGatewayEvent) {
  const {
    minNumber,
    maxNumber,
    ticketStatus,
    tempStatus,
    deviceStatus,
    ticketNumber,
    user,
    asset,
    // NEW optional filters
    assignee,
    resolution,
    // Priority filters
    priority,
    minPriority,
    maxPriority,
    // Explicit list of Airtable record IDs to fetch
    ticketIds,
  } = event.queryStringParameters || {};

  let filterConditions: string[] = [];

  if (ticketIds) {
    const ids = ticketIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 1) {
      filterConditions.push(`RECORD_ID() = '${ids[0]}'`);
    } else if (ids.length > 1) {
      filterConditions.push(
        `OR(${ids.map((id) => `RECORD_ID() = '${id}'`).join(",")})`
      );
    }
  }

  if (ticketNumber) {
    filterConditions.push(`{Number} = ${ticketNumber}`);
  } else {
    if (minNumber) {
      filterConditions.push(`{Number} >= ${minNumber}`);
    }
    if (maxNumber) {
      filterConditions.push(`{Number} <= ${maxNumber}`);
    }
  }

  if (user) {
    // Match either FormEmail, Email (from Student), or Email (from Staff)
    filterConditions.push(
      `OR({FormEmail} = '${user}', {Email (from Student)} = '${user}', {Email (from Staff)} = '${user}')`
    );
  }

  if (asset) {
    // Match Asset Tag (from Device) OR Asset Tag (from Temporary Device) so asset lookup shows tickets where this device is primary or temp loaner
    filterConditions.push(
      `OR({Asset Tag (from Device)} = '${asset}', {Asset Tag (from Temporary Device)} = '${asset}')`
    );
  }

  if (ticketStatus) {
    filterConditions.push(`{Ticket Status} = "${ticketStatus}"`);
  }

  if (tempStatus) {
    filterConditions.push(`{Temp Status} = "${tempStatus}"`);
  }

  if (deviceStatus) {
    filterConditions.push(`{Device Status} = "${deviceStatus}"`);
  }

  if (assignee) {
    filterConditions.push(`{Assignee} = '${assignee}'`);
  }

  if (resolution) {
    filterConditions.push(`{Resolution} = "${resolution}"`);
  }

  // Priority: exact or range
  if (priority) {
    filterConditions.push(`{Priority} = ${priority}`);
  } else {
    if (minPriority) filterConditions.push(`{Priority} >= ${minPriority}`);
    if (maxPriority) filterConditions.push(`{Priority} <= ${maxPriority}`);
  }

  let filterByFormula =
    filterConditions.length > 0 ? `AND(${filterConditions.join(", ")})` : "";

  let query = ticketsBase.select({
    // maxRecords: 100,
    filterByFormula,
    sort: [{ field: "Number", direction: "desc" }],
    fields: [
      "Number",
      "Created",
      "FormID",
      "User Description",
      "Ticket Status",
      "Temp Status",
      "Form Name",
      "FormEmail",
      "Staff",
      "Student",
      "FormAsset",
      "Device",
      "PrivateNotes",
      "History",
      "Notes",
      "Temporary Device",
      "SubmittedBy",
      "Repair Cost",
      // NEW fields
      "Assignee",
      "Resolution",
      "Priority",
      // Relations for summaries
      "Notifications",
      "Invoices",
      // Student fields
      "Name (from Student)",
      "LASID (from Student)",
      "Email (from Student)",
      "Contact1Email (from Student)",
      "Contact2Email (from Student)",
      "YOG (from Student)",
      "Advisor (from Student)",
      "Status (from Student)",
      // Staff fields
      "Email (from Staff)",
      "Full Name (from Staff)",
      "Role (from Staff)",
      "Department (from Staff)",
      // Asset fields
      "Asset Tag (from Device)",
      "Model (from Device)",
      "Serial (from Device)",
      "Year of Purchase (from Device)",
      "Status (from Device)",
      // Temporary Device fields
      "Asset Tag (from Temporary Device)",
    ],
  });
  let result = await query.all();
  console.log("Got tickets:", result.length, "records found");
  console.log("First one: ", result[0] ? result[0].fields : "No records");
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
