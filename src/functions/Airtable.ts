import Airtable from "airtable";
const AIRTABLE_KEY = process.env.AIRTABLE_KEY;
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: AIRTABLE_KEY,
});
export let base = Airtable.base("appFim2L4assVgjdk");
export let studentsBase = base("Students");
export let signoutHistoryBase = base("Signout History");
export let inventoryBase = base("Inventory");
export let staffBase = base("Staff");
