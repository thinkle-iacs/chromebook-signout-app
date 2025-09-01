import type { Ticket } from "@data/tickets";
import TicketWorkflowTest from "./TicketWorkflowTest.svelte";
import NewTicketWorkflowTest from "./NewTicketWorkflowTest.svelte";
import PickupWorkflowTest from "./PickupWorkflowTest.svelte";
import InProgressWorkflowTest from "./InProgressWorkflowTest.svelte";

// Re-export the main test components
export {
  TicketWorkflowTest,
  NewTicketWorkflowTest,
  PickupWorkflowTest,
  InProgressWorkflowTest,
};

// Export mock data for use in other tests
export { mockTickets, createMockUpdateTicket, getMockTicketByStatus } from "./mockTicketData";

// Utility function to get all available ticket statuses for testing
export const getAllTicketStatuses = (): Ticket["Ticket Status"][] => [
  "New",
  "Awaiting Drop-Off",
  "Have Device", 
  "In Repair",
  "Ready for Pickup",
  "In Progress",
  "Closed"
];

// Documentation for developers on how to use the testing harness
export const TESTING_README = `
# Ticket Testing Harness

This directory contains comprehensive testing tools for the ticket workflow system.

## Available Test Routes

- \`/test/tickets/workflow\` - Test complete ticket workflow with all statuses
- \`/test/tickets/new\` - Test new ticket workflow specifically  
- \`/test/tickets/pickup\` - Test pickup workflow specifically
- \`/test/tickets/inprogress\` - Test in-progress workflow specifically

## Features

- **No Database Calls**: All tests use mock data only
- **Mock Update Functions**: updateTicket calls are logged to console instead of making API calls
- **Interactive Testing**: Switch between different ticket statuses and see real UI behavior
- **Debug Information**: Side panel shows ticket state and update history
- **Realistic Data**: Mock tickets include linked student, device, and staff data

## Usage

1. Navigate to any test route (requires authentication)
2. Select different ticket statuses to test various workflows
3. Interact with the UI components (forms, buttons, etc.)
4. Check the debug panel to see updates being captured
5. Check browser console to see mock API calls being logged

## Mock Data Structure

Each mock ticket includes:
- Realistic student information (Jane Smith, Grade 2025)
- Device information (asset tags, models, serial numbers)
- Temporary device data where applicable
- Staff assignments and repair costs
- Complete ticket history and status progression

## Extending Tests

To add new test scenarios:
1. Add new mock tickets to \`mockTicketData.ts\`
2. Create new test components following existing patterns
3. Add routes to \`../test-routes.ts\`
4. Import and use \`createMockUpdateTicket\` for consistent mock behavior
`;