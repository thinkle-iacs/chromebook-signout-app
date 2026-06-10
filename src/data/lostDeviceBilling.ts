import { get } from "svelte/store";
import { logger } from "@utils/log";
import { createTicket, updateTicket, getTicketsForAsset } from "./tickets";
import type { Ticket } from "./tickets";
import { createInvoices } from "./invoices";
import type { InvoiceResult } from "./invoices";
import type { Asset } from "./inventory";
import { user } from "./user";

// Default matches the "Full Machine" price in RepairPickList
export const DEFAULT_REPLACEMENT_COST = 220;

// FormID marker so lost-billing tickets can be found later (e.g. for
// cancelling the invoice when a device is recovered).
export const LOST_BILLING_FORM_ID = "lost-device-billing";

function linkedRecordIds(value: unknown): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(
    (id): id is string => typeof id === "string" && id.startsWith("rec")
  );
}

// Record ID of the student currently signed out to this asset, if any.
export function getBillableStudentId(asset: Partial<Asset>): string | null {
  const ids = linkedRecordIds((asset as any)["Student (Current)"]);
  return ids[0] || null;
}

export type LostDeviceBillingResult = {
  ticket: Ticket;
  invoices: InvoiceResult[];
};

/**
 * Bill the family of the student currently holding `asset` for a lost
 * device. Creates a Closed ticket (Device Status: Lost) carrying the
 * replacement cost, then queues an invoice with "Send Email" set so the
 * existing Airtable automation emails the business office.
 */
export async function billForLostDevice(
  asset: Partial<Asset>,
  options: { cost?: number; note?: string } = {}
): Promise<LostDeviceBillingResult> {
  const cost = options.cost ?? DEFAULT_REPLACEMENT_COST;
  const studentId = getBillableStudentId(asset);
  if (!studentId) {
    throw new Error(
      `No current student on asset ${asset["Asset Tag"]}; cannot bill for lost device.`
    );
  }
  const userEmail = (get(user) as any)?.email || "system";
  const description =
    `Lost device ${asset["Asset Tag"]}: not returned; ` +
    `billing family for replacement cost ($${cost}).` +
    (options.note ? ` Note: ${options.note}` : "");

  const historyEntry = {
    timestamp: new Date().toISOString(),
    action: "create_ticket",
    status: "Closed",
    note: "Created to bill family for lost device",
    user: userEmail,
    changes: {
      "Ticket Status": { to: "Closed" },
      "Repair Cost": { to: cost },
    },
  };

  // Note: the device itself is marked Lost via the signout flow; the
  // Tickets table has no writable "Device Status" field in Airtable.
  const ticket = await createTicket({
    "Ticket Status": "Closed",
    "Repair Cost": cost,
    Student: [studentId],
    Device: [asset._id as string],
    "User Description": description,
    SubmittedBy: userEmail,
    FormID: LOST_BILLING_FORM_ID,
    History: JSON.stringify({ entries: [historyEntry] }),
  } as Partial<Ticket>);
  if ((ticket as any).error) {
    throw new Error(
      `Failed to create lost-device ticket for ${asset["Asset Tag"]}: ${
        (ticket as any).error
      }`
    );
  }

  const invoices = await createInvoices([
    { Student: [studentId], Ticket: [ticket._id], "Send Email": true },
  ]);
  logger.logRegular(
    "Created lost-device billing ticket and invoice",
    ticket,
    invoices
  );
  return { ticket, invoices };
}

/**
 * Most recent lost-device billing ticket for this asset, or null. Matches
 * the FormID marker on new tickets, falling back to the description prefix
 * for tickets created before the marker existed.
 */
export async function findLostBillingTicket(
  assetTag: string
): Promise<Ticket | null> {
  const tickets = await getTicketsForAsset(assetTag);
  const billingTickets = tickets.filter(
    (t) =>
      ((t as any).Invoices || []).length &&
      (t.FormID === LOST_BILLING_FORM_ID ||
        (t["User Description"] || "").startsWith("Lost device"))
  );
  billingTickets.sort((a, b) => (b.Number || 0) - (a.Number || 0));
  return billingTickets[0] || null;
}

/**
 * Queue a cancellation notice for a lost-device invoice after the device
 * was recovered. Creates an Invoices record linked to the same ticket and
 * student with the "Cancellation" box checked, so the email automation
 * tells the business office to cancel (or refund) rather than bill. Also
 * appends a history entry to the ticket.
 */
export async function cancelLostDeviceBilling(
  ticket: Ticket,
  options: { note?: string } = {}
): Promise<InvoiceResult[]> {
  const userEmail = (get(user) as any)?.email || "system";
  const note =
    `Device recovered ${new Date().toLocaleDateString()}; ` +
    `please cancel the invoice (or refund if already paid).` +
    (options.note ? ` ${options.note}` : "");

  const invoices = await createInvoices([
    {
      Student: ticket.Student,
      Ticket: [ticket._id],
      "Send Email": true,
      Cancellation: true,
      Note: note,
    },
  ]);
  if ((invoices as any)?.error) {
    throw new Error(
      `Failed to create cancellation invoice: ${(invoices as any).error}`
    );
  }

  try {
    let entries = [];
    try {
      entries = JSON.parse(ticket.History || "{}").entries || [];
    } catch (e) {
      // unparseable history; start fresh rather than fail the cancellation
    }
    entries.push({
      timestamp: new Date().toISOString(),
      action: "billing_cancellation",
      status: ticket["Ticket Status"],
      note,
      user: userEmail,
    });
    await updateTicket(ticket._id, {
      History: JSON.stringify({ entries }),
    } as Partial<Ticket>);
  } catch (e) {
    // Cancellation went out; a history write failure shouldn't fail the flow
    logger.logError("Failed to record cancellation on ticket history:", e);
  }
  logger.logRegular("Queued lost-device billing cancellation", invoices);
  return invoices;
}
