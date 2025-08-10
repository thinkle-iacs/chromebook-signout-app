import Airtable from "airtable";
const AIRTABLE_KEY = process.env.AIRTABLE_KEY;
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: AIRTABLE_KEY as any,
  apiVersion: "0.1.0" as unknown as any,
  noRetryIfRateLimited: false as unknown as any,
} as any);
export let base = Airtable.base("appFim2L4assVgjdk");
export let studentsBase = base("Students");
export let signoutHistoryBase = base("Signout History");
export let inventoryBase = base("Inventory");
export let staffBase = base("Staff");
export let contractsBase = base("Contracts");
export let contactsBase = base("Contacts");
export let notificationsBase = base("Notifications");
export let messagesBase = base("Messages");
export let ticketsBase = base("Tickets");
export let invoicesBase = base("Invoices");
