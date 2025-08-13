import { writable, get } from "svelte/store";
import { restructureLookupFields } from "./restructureLookups";

export let ticketsStore = writable({});

export type Ticket = {
  Created: Date;
  Number: number;
  FormID: string;
  "User Description": string;
  "Ticket Status":
    | "New"
    | "Awaiting Drop-Off"
    | "Have Device"
    | "In Repair"
    | "Ready for Pickup"
    | "In Progress"
    | "Closed";
  // NEW fields
  Resolution?:
    | "Fixed"
    | "Replaced Device"
    | "Unable to Reproduce"
    | "Won't Fix"
    | "Duplicate"
    | "Canceled"
    | "No Issue Found"
    | "User Education";
  Assignee?: string; // email
  Priority?: number; // 1 (lowest) - 5 (highest)
  "Device Status":
    | undefined
    | "New"
    | "Waiting on Part"
    | "Waiting on Repair"
    | "Repaired"
    | "Discarded";
  "Temp Status":
    | undefined
    | "Not Needed"
    | "Needed"
    | "Assigned"
    | "Loaned"
    | "Returned";
  "Form Name": string;
  FormEmail: string;
  Staff: string;
  Student: string;
  FormAsset: string;
  Device: string;
  Notes: string;
  "Temporary Device": string;
  SubmittedBy: string;
  History: string;
  PrivateNotes: string;
  "Repair Cost": number;
  _id: string;
  _linked: {
    Device: {
      AssetTag: string;
      Model: string;
      "Serial Number": string;
      Status: string;
    };
    Student: {
      Name: string;
      "Year of Graduation": string;
      LASID: string;
      Email: string[];
      Contact1Email: string[];
      Contact2Email: string[];
      Advisor: string;
    };
    Staff: {
      Email: string[];
      "Full Name": string;
      Role: string;
      Department: string;
    };
  };
};

let cachedQueries = {};

export async function getTickets(
  params: {
    minNumber?: number;
    maxNumber?: number;
    ticketStatus?: string;
    tempStatus?: string;
    deviceStatus?: string;
    assetTag?: string;
    student?: string;
    ticketNumber?: number;
    user?: string;
    asset?: string;
    // NEW optional filters
    assignee?: string;
    resolution?: string;
    priority?: number;
    minPriority?: number;
    maxPriority?: number;
  } = {}
) {
  const queryString = new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, value.toString()])
  ).toString();

  const cacheKey = queryString || "all";
  if (cachedQueries[cacheKey]) {
    return cachedQueries[cacheKey];
  }

  let response = await fetch(
    "/.netlify/functions/index" +
      (queryString ? "?mode=tickets&" + queryString : "?mode=tickets")
  );
  let json = await response.json();
  json = json.map(restructureLookupFields); // restructure linked fields
  let tickets = json.map((ticket) => ({
    ...ticket.fields,
    _id: ticket.id,
    _linked: ticket.linkedFields || {},
  }));
  ticketsStore.update(($ticketsStore) => {
    for (let ticket of tickets) {
      $ticketsStore[ticket._id] = ticket;
    }
    return $ticketsStore;
  });

  cachedQueries[cacheKey] = json;
  return tickets;
}

// Helper function to get open tickets for a specific asset
export async function getOpenTicketsForAsset(
  assetTag: string
): Promise<Ticket[]> {
  try {
    const allTickets = await getTickets({ assetTag });
    return allTickets.filter((ticket) => ticket["Ticket Status"] !== "Closed");
  } catch (error) {
    console.error("Error getting tickets for asset:", error);
    return [];
  }
}

// Helper function to get open tickets for a specific student
export async function getOpenTicketsForStudent(
  studentName: string
): Promise<Ticket[]> {
  try {
    const allTickets = await getTickets({ student: studentName });
    return allTickets.filter((ticket) => ticket["Ticket Status"] !== "Closed");
  } catch (error) {
    console.error("Error getting tickets for student:", error);
    return [];
  }
}

export function getTicket(id: string): Ticket {
  return get(ticketsStore)[id];
}

export async function createTicket(ticketData: Partial<Ticket>) {
  let response = await fetch("/.netlify/functions/index?mode=tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ticketData),
  });
  let json = await response.json();
  json = restructureLookupFields(json); // restructure linked fields
  console.log("Created ticket:", json);
  if (json.error) {
    return json; // caller will handle toast / error path
  }
  let ticket = {
    ...json.fields,
    _id: json.id,
    _linked: json.linkedFields || {},
  };
  ticketsStore.update(($ticketsStore) => {
    $ticketsStore[json.id] = ticket;
    return $ticketsStore;
  });
  cachedQueries = {};
  return ticket;
}

export async function updateTicket(id: string, updates: Partial<Ticket>) {
  let response = await fetch("/.netlify/functions/index?mode=tickets", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, ...updates }),
  });
  let json = await response.json();
  console.log("Updated ticket:", json);

  // If the API returns the Airtable record object, convert it to our Ticket shape
  // (fields, id, etc). If already in Ticket shape, this is a no-op.
  let ticket: Ticket;
  if (json.fields && json.id) {
    json = restructureLookupFields(json); // restructure linked fields
    const existing = get(ticketsStore)[json.id] || {}; // merge with existing to prevent field loss
    ticket = {
      ...(existing as any),
      ...json.fields,
      _id: json.id,
      _linked: json.linkedFields || (existing as any)._linked || {},
    } as Ticket;
  } else if (json._id) {
    // Merge with existing if present
    const existing = get(ticketsStore)[json._id] || {};
    ticket = { ...(existing as any), ...json } as Ticket;
  } else {
    // fallback, just return as-is, merged with existing if possible
    const existing = get(ticketsStore)[id] || {};
    ticket = { ...(existing as any), ...json, _id: id } as Ticket;
  }

  // Normalize unknown / falsy status to "New" to avoid undefined workflow issues
  if (!ticket["Ticket Status"]) {
    (ticket as any)["Ticket Status"] = "New";
  }

  // Update store with updated ticket
  ticketsStore.update(($ticketsStore) => {
    $ticketsStore[ticket._id] = ticket;
    return $ticketsStore;
  });

  // Clear cache since we have updated data
  cachedQueries = {};

  return ticket;
}

export async function getTicketByNumber(
  number: number
): Promise<Ticket | null> {
  const tickets = await getTickets({ ticketNumber: number });
  return tickets.length > 0 ? tickets[0] : null;
}

export async function getTicketsForStudent(
  studentEmail: string
): Promise<Ticket[]> {
  // Uses the backend 'user' param to match FormEmail, student, or staff
  return await getTickets({ user: studentEmail });
}

export async function getTicketsForAsset(assetTag: string): Promise<Ticket[]> {
  // Uses the backend 'asset' param to match Asset Tag (from Device) or (from Temporary Device)
  return await getTickets({ asset: assetTag });
}
