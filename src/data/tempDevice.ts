import { logger } from "@utils/log";
import { get } from "svelte/store";
import { user } from "./user";
import {
  getTicketsForAsset,
  getTicketsForStudent,
  updateTicket,
} from "./tickets";
import type { Ticket } from "./tickets";
import type { Asset } from "./inventory";
import type { Student } from "./students";

// A ticket counts as "open" for temp-swap purposes if it isn't Closed.
function isOpen(ticket: Ticket): boolean {
  return ticket["Ticket Status"] !== "Closed";
}

// Asset Tag that a ticket currently lists as its Temporary Device, if any.
function tempTagOf(ticket: Ticket): string | undefined {
  return (
    (ticket as any)._linked?.["Temporary Device"]?.["Asset Tag"] ||
    (ticket as any)["Asset Tag (from Temporary Device)"]?.[0]
  );
}

/**
 * Open tickets that currently list `assetTag` as their Temporary Device.
 * Used on check-in to offer to unlink a temp loaner being returned.
 */
export async function getOpenTicketsWithTempDevice(
  assetTag: string
): Promise<Ticket[]> {
  try {
    const tickets = await getTicketsForAsset(assetTag);
    return tickets.filter((t) => isOpen(t) && tempTagOf(t) === assetTag);
  } catch (e) {
    logger.logError("Failed to look up tickets with temp device:", e);
    return [];
  }
}

/**
 * Open tickets belonging to a student — used on check-out to offer to link a
 * freshly loaned device as that ticket's temporary device.
 */
export async function getOpenTicketsForStudentObj(
  student: Student
): Promise<Ticket[]> {
  if (!student?.Email) return [];
  try {
    const tickets = await getTicketsForStudent(student.Email);
    return tickets.filter(isOpen);
  } catch (e) {
    logger.logError("Failed to look up open tickets for student:", e);
    return [];
  }
}

function appendHistory(
  ticket: Ticket,
  entry: Record<string, unknown>
): string {
  let entries: any[] = [];
  try {
    entries = JSON.parse(ticket.History || "{}").entries || [];
  } catch (e) {
    // unparseable history — start fresh rather than fail the swap
  }
  entries.push({
    timestamp: new Date().toISOString(),
    user: (get(user) as any)?.email || "system",
    ...entry,
  });
  return JSON.stringify({ entries });
}

/**
 * Remove a device as the temporary device on a ticket (e.g. a flaky loaner is
 * being returned). Sets Temp Status back to "Needed" since the student still
 * has a device in repair and may need another loaner.
 */
export async function unlinkTempDevice(
  ticket: Ticket,
  assetTag: string
): Promise<Ticket> {
  const history = appendHistory(ticket, {
    action: "temp_device_unlinked",
    status: ticket["Ticket Status"],
    note: `Removed temp device ${assetTag} (returned at check-in).`,
    changes: {
      "Temporary Device": { from: (ticket as any)["Temporary Device"], to: [] },
      "Temp Status": { from: ticket["Temp Status"], to: "Needed" },
    },
  });
  return await updateTicket(ticket._id, {
    "Temporary Device": [] as any,
    "Temp Status": "Needed",
    History: history,
  } as Partial<Ticket>);
}

/**
 * Link a device as the temporary device on a ticket (e.g. handing a student a
 * loaner while their machine is in repair). Sets Temp Status to "Loaned".
 */
export async function linkTempDevice(
  ticket: Ticket,
  asset: Asset
): Promise<Ticket> {
  const history = appendHistory(ticket, {
    action: "temp_device_linked",
    status: ticket["Ticket Status"],
    note: `Linked temp device ${asset["Asset Tag"]} (loaned at check-out).`,
    changes: {
      "Temporary Device": {
        from: (ticket as any)["Temporary Device"],
        to: [asset._id],
      },
      "Temp Status": { from: ticket["Temp Status"], to: "Loaned" },
    },
  });
  return await updateTicket(ticket._id, {
    "Temporary Device": [asset._id] as any,
    "Temp Status": "Loaned",
    History: history,
  } as Partial<Ticket>);
}
