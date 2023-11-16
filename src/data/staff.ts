import { writable, get } from "svelte/store";

export type Staff = {
  _id: string;
  Email: string;
  First: string;
  Last: string;
  Role: string;
  Department: string;
  psnOID: string;
  School: string;
  "Full Name": string;
};
export let staffStore = writable({});

let searchCache = {};

export async function searchForStaff(name) {
  if (searchCache[name]) {
    return searchCache[name];
  } else {
    let response = await fetch(
      "/.netlify/functions/index?mode=staff&name=" + encodeURIComponent(name)
    );
    let json = await response.json();
    console.log("Got staff data", json);
    const results = [];
    staffStore.update(($staffStore) => {
      for (let result of json) {
        const staffObject: Staff = { ...result.fields, _id: result.id };
        results.push(staffObject);
        $staffStore[staffObject["Full Name"]] = staffObject;
        $staffStore[staffObject.Email] = staffObject;
        $staffStore[staffObject.psnOID] = staffObject;
        $staffStore[staffObject._id] = staffObject;
      }
      return $staffStore;
    });
    searchCache[name] = results;
    return results;
  }
}
