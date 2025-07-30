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
      FullName: string;
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

  ticketsStore.update(($ticketsStore) => {
    for (let result of json) {
      $ticketsStore[result.id] = {
        ...result.fields,
        _id: result.id,
        _linked: result.linkedFields || {},
      };
    }
    return $ticketsStore;
  });

  cachedQueries[cacheKey] = json;
  return json;
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

  // Update store with updated ticket
  ticketsStore.update(($ticketsStore) => {
    $ticketsStore[id] = {
      ...json.fields,
      _id: json.id,
    };
    return $ticketsStore;
  });

  // Clear cache since we have updated data
  cachedQueries = {};

  return json;
}
