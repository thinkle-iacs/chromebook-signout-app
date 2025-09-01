import ScheduleTester from "./ScheduleTester.svelte";
import TestMenu from "./TestMenu.svelte";
import SisTest from "./SISTest.svelte";
import LoaderTest from "./ui/LoaderTest.svelte";
import TicketWorkflowTest from "./tickets/TicketWorkflowTest.svelte";
import NewTicketWorkflowTest from "./tickets/NewTicketWorkflowTest.svelte";
import PickupWorkflowTest from "./tickets/PickupWorkflowTest.svelte";
import InProgressWorkflowTest from "./tickets/InProgressWorkflowTest.svelte";

ScheduleTester;

export const testRoutes = {
  "/test/": {
    page: TestMenu,
    title: "Test Menu",
  },
  "/test/schedule": {
    page: ScheduleTester,
    title: "Schedule Structure Tester",
  },
  "/test/sis": {
    page: SisTest,
    title: "SIS API Test Tool",
  },
  "/test/ui/loader": {
    page: LoaderTest,
    title: "UI Loader Test",
  },
  "/test/tickets/workflow": {
    page: TicketWorkflowTest,
    title: "Ticket Workflow Test (All Statuses)",
  },
  "/test/tickets/new": {
    page: NewTicketWorkflowTest,
    title: "New Ticket Workflow Test",
  },
  "/test/tickets/pickup": {
    page: PickupWorkflowTest,
    title: "Pickup Workflow Test",
  },
  "/test/tickets/inprogress": {
    page: InProgressWorkflowTest,
    title: "In Progress Workflow Test",
  },
};
