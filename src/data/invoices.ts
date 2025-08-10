import { get } from "svelte/store";
import { user } from "./user";

export type Invoice = {
  Ticket?: string[];
  "Send Email"?: boolean;
  Student?: string[];
};

export type InvoiceResult = {
  id: string;
  fields: InvoiceFields;
};

export type InvoiceFields = {
  "Invoice Number"?: number;
  // Useful lookups
  "Number (from Ticket)"?: number;
  "Repair Cost (from Ticket)"?: number;
  Student?: string[];
  Ticket?: string[];
  "Date Created"?: string;
  "Send Email"?: boolean;
  "Email Sent"?: boolean;
  "Ticket Block"?: string[];
  "Contact Info"?: string[];
  "Device Asset Tag (from Ticket)"?: string[];
  "Student Email (from Student)"?: string[];
};

function splitIntoTens<T>(lst: T[]): T[][] {
  let copy = lst.slice();
  let batches: T[][] = [];
  while (copy.length > 10) {
    let batch = copy.slice(0, 10);
    copy = copy.slice(10);
    batches.push(batch);
  }
  if (copy.length) {
    batches.push(copy);
  }
  return batches;
}

export async function createInvoices(
  records: Invoice[]
): Promise<InvoiceResult[]> {
  if (records.length > 10) {
    const batched = splitIntoTens(records);
    let results: InvoiceResult[] = [];
    for (const b of batched) {
      results = [...results, ...(await createInvoices(b))];
    }
    return results;
  }

  const params = { mode: "invoices" };
  await get(user); // ensure session
  const response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    }
  );
  const json = await response.json();
  return json;
}

export async function updateInvoices(
  updates: { id: string; fields: Partial<Invoice> }[]
): Promise<InvoiceResult[]> {
  if (updates.length > 10) {
    const batched = splitIntoTens(updates);
    let results: InvoiceResult[] = [];
    for (const b of batched) {
      results = [...results, ...(await updateInvoices(b))];
    }
    return results;
  }

  const params = { mode: "invoices" };
  const response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params),
    { method: "PATCH", body: JSON.stringify(updates) }
  );
  const json = await response.json();
  return json;
}

export async function getInvoices(
  params: {
    ticketNumber?: string;
    studentEmail?: string;
    assetTag?: string;
  } = {}
): Promise<InvoiceResult[]> {
  const qs = new URLSearchParams({ mode: "invoices", ...params } as any);
  const response = await fetch("/.netlify/functions/index?" + qs, {
    method: "GET",
  });
  const json = await response.json();
  return json;
}
