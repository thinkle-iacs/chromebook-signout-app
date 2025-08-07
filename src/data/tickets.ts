import { writable, get } from "svelte/store";
import { restructureLookupFields } from "./restructureLookups";

export let ticketsStore = writable({});

export type Ticket = {
  Number: number;
  FormID: string;
  "User Description": string;
  "Ticket Status":
    | "Untriaged"
    | "Triaged"
    | "Assigned"
    | "In Progress"
    | "Waiting on Student"
    | "Waiting on Tech"
    | "Resolved"
    | "Closed";
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
    return allTickets.filter(
      (ticket) =>
        ticket["Ticket Status"] !== "Closed" &&
        ticket["Ticket Status"] !== "Resolved"
    );
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
    return allTickets.filter(
      (ticket) =>
        ticket["Ticket Status"] !== "Closed" &&
        ticket["Ticket Status"] !== "Resolved"
    );
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
  console.log("Created ticket:", json);

  // Update store with new ticket
  ticketsStore.update(($ticketsStore) => {
    $ticketsStore[json.id] = {
      ...json.fields,
      _id: json.id,
    };
    return $ticketsStore;
  });

  // Clear cache since we have new data
  cachedQueries = {};

  return json;
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
    ticket = {
      ...json.fields,
      _id: json.id,
    };
  } else if (json._id) {
    ticket = json;
  } else {
    // fallback, just return as-is
    ticket = json;
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
