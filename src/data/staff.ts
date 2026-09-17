import { authedFetch } from "@utils/authedFetch";
import { writable, get } from "svelte/store";
import { logger } from "@utils/log";
import { createSearchCache } from "@utils/searchCache";

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

// Must match maxRecords in src/functions/staff.ts
const STAFF_SEARCH_LIMIT = 100;

const staffSearchCache = createSearchCache<Staff>({
  limit: STAFF_SEARCH_LIMIT,
  getName: (staff) => staff["Full Name"],
  fetchResults: async (name) => {
    let response = await authedFetch(
      "/.netlify/functions/index?mode=staff&name=" + encodeURIComponent(name)
    );
    if (!response.ok) {
      throw new Error(`Staff search failed: ${response.status}`);
    }
    let json = await response.json();
    logger.logVerbose("Got staff data", json);
    const results: Staff[] = [];
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
    return results;
  },
});

/** Cached results for a name search, or null if we'd need to hit the server. */
export const peekStaffSearch = staffSearchCache.peek;

export async function searchForStaff(name): Promise<Staff[]> {
  return staffSearchCache.search(name);
}
