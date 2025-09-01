import type { Ticket } from "@data/tickets";
import type { HistoryEntry } from "@ui/tickets/history";

// Mock student data
const mockStudent = {
  _id: "student123",
  Name: "Jane Smith",
  Email: "jane.smith@innovationcharter.org",
  LASID: 123456,
  YOG: "2025",
  Status: "Active" as const,
  Advisor: "Mr. Johnson",
  Contact1Email: "parent1@email.com",
  Contact2Email: "parent2@email.com"
};

// Mock device/asset data
const mockDevice = {
  _id: "device123", 
  "Asset Tag": "ICN-001234",
  Model: "Chromebook 11",
  Status: "Active",
  "Serial Number": "ABCD123456"
};

const mockTempDevice = {
  _id: "tempdevice123",
  "Asset Tag": "ICN-TEMP-001", 
  Model: "Loaner Chromebook",
  Status: "Available",
  "Serial Number": "TEMP123456"
};

// Mock staff data
const mockStaff = {
  _id: "staff123",
  Name: "Ms. Librarian",
  Email: "librarian@innovationcharter.org"
};

// Base ticket data that can be extended for different statuses
const baseTicket: Omit<Ticket, "_id" | "Ticket Status"> = {
  Created: new Date("2024-01-15T10:00:00Z"),
  Number: 1001,
  FormID: "form123",
  "User Description": "Chromebook screen is cracked and won't turn on properly. Happened when dropped in hallway.",
  Resolution: undefined,
  Assignee: "tech@innovationcharter.org",
  Priority: 3,
  "Device Status": "Needs Diagnosis",
  "Temp Status": "Not Needed",
  "Form Name": "Hardware Issue Report",
  FormEmail: "jane.smith@innovationcharter.org",
  Staff: mockStaff._id,
  Student: mockStudent._id,
  FormAsset: mockDevice._id,
  Device: mockDevice._id,
  Notes: "Student reports screen cracked after dropping device",
  "Temporary Device": "",
  SubmittedBy: "jane.smith@innovationcharter.org",
  History: JSON.stringify([
    {
      timestamp: "2024-01-15T10:00:00Z",
      action: "Ticket Created",
      status: "New",
      user: "jane.smith@innovationcharter.org"
    }
  ]),
  PrivateNotes: "Check for other damage beyond screen",
  "Repair Cost": 0,
  _linked: {
    Device: mockDevice,
    "Temporary Device": null,
    Student: mockStudent,
    Staff: mockStaff
  }
};

// Create tickets with different statuses for testing
export const mockTickets: Record<string, Ticket> = {
  new: {
    ...baseTicket,
    _id: "ticket_new",
    "Ticket Status": "New",
    Number: 1001
  },
  
  awaitingDropoff: {
    ...baseTicket,
    _id: "ticket_awaiting_dropoff", 
    "Ticket Status": "Awaiting Drop-Off",
    Number: 1002,
    "User Description": "Chromebook keyboard not responding to key presses",
    "Temp Status": "Needed"
  },
  
  haveDevice: {
    ...baseTicket,
    _id: "ticket_have_device",
    "Ticket Status": "Have Device", 
    Number: 1003,
    "User Description": "Screen flickers and goes black randomly",
    "Device Status": "Needs Diagnosis",
    "Temp Status": "Assigned",
    "Temporary Device": mockTempDevice._id,
    _linked: {
      ...baseTicket._linked,
      "Temporary Device": mockTempDevice
    }
  },
  
  inRepair: {
    ...baseTicket,
    _id: "ticket_in_repair",
    "Ticket Status": "In Repair",
    Number: 1004, 
    "User Description": "Won't charge, battery seems dead",
    "Device Status": "Waiting on Part",
    "Temp Status": "Loaned",
    "Temporary Device": mockTempDevice._id,
    _linked: {
      ...baseTicket._linked,
      "Temporary Device": mockTempDevice
    }
  },
  
  readyForPickup: {
    ...baseTicket,
    _id: "ticket_ready_pickup",
    "Ticket Status": "Ready for Pickup",
    Number: 1005,
    "User Description": "Screen completely black, no display",
    "Device Status": "Repaired", 
    "Temp Status": "Loaned",
    "Repair Cost": 125.50,
    "Temporary Device": mockTempDevice._id,
    _linked: {
      ...baseTicket._linked,
      "Temporary Device": mockTempDevice
    }
  },
  
  inProgress: {
    ...baseTicket,
    _id: "ticket_in_progress",
    "Ticket Status": "In Progress",
    Number: 1006,
    "User Description": "Software issues - Chrome won't open, frequent crashes",
    "Device Status": undefined,
    "Temp Status": "Not Needed"
  },
  
  closed: {
    ...baseTicket,
    _id: "ticket_closed",
    "Ticket Status": "Closed",
    Number: 1007, 
    "User Description": "Touchpad not working",
    Resolution: "Fixed",
    "Device Status": "Active",
    "Temp Status": "Returned",
    "Repair Cost": 0,
    "Temporary Device": "",
    _linked: {
      ...baseTicket._linked,
      "Temporary Device": null
    }
  }
};

// Mock updateTicket function that just logs instead of making API calls
export function createMockUpdateTicket(ticketId: string, onUpdate?: (ticket: Ticket, historyEntry: HistoryEntry) => void) {
  return async (updates: Partial<Ticket>, historyEntry: HistoryEntry) => {
    console.log(`[MOCK] Updating ticket ${ticketId}:`, {
      updates,
      historyEntry
    });
    
    // Simulate a successful update by calling the onUpdate callback if provided
    if (onUpdate) {
      // Create updated ticket by merging updates
      const currentTicket = mockTickets[ticketId] || mockTickets.new;
      const updatedTicket = { ...currentTicket, ...updates };
      onUpdate(updatedTicket, historyEntry);
    }
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
  };
}

// Helper to get a mock ticket by status
export function getMockTicketByStatus(status: Ticket["Ticket Status"]): Ticket {
  const statusMap: Record<Ticket["Ticket Status"], keyof typeof mockTickets> = {
    "New": "new",
    "Awaiting Drop-Off": "awaitingDropoff", 
    "Have Device": "haveDevice",
    "In Repair": "inRepair",
    "Ready for Pickup": "readyForPickup",
    "In Progress": "inProgress",
    "Closed": "closed"
  };
  
  return mockTickets[statusMap[status]] || mockTickets.new;
}