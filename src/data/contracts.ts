import { writable, get } from "svelte/store";
import type { Student } from "./students";
//import type { Writable } from "svelte/store";

/* export const contractStore: Writable<{
  [key: number]: Contract;
}> = writable({});
 */
export const contractStore = writable({});

export type Contract = {
  LASID: number;
  Signature: string;
  "Student First": string;
  "Student Last": string;
  "Parent First": string;
  "Parent Last": string;
  "Contract Signed": boolean;
  WiFi: boolean;
  "Grade Level": string;
  Date: string;
  Student: string[];
  "LASID (from Student)": string[];
  ID: string;
  _id: string; // Airtable record id
  [key: string]: any; // permit additional Airtable-mapped fields
};

let lastFetch = null;

export function getContractForStudent(student: Student) {
  let $contractStore = get(contractStore);
  let contracts: Contract[] = Object.values($contractStore);
  let contract = contracts.find(
    (c) =>
      c["LASID (from Student)"] &&
      Number(c["LASID (from Student)"][0]) == Number(student.LASID)
  );
  return contract;
}

export async function updateContracts() {
  getContracts(false, false, true);
}
export async function updateContractsIfNeeded() {
  let time = new Date().getTime();
  let threshhold = 60 * 15 * 1000;
  if (!lastFetch || time - lastFetch > threshhold) {
    updateContracts();
  }
}

export async function getContracts(
  unmapped = true,
  all = false,
  mapped = false
) {
  let params: { [key: string]: string } = { mode: "contract" };
  if (mapped) {
    params.mapped = "true";
  }
  if (unmapped) {
    params.unmapped = "true";
  }
  if (all) {
    params.all = "true";
  }
  let paramString = new URLSearchParams(params);
  let response = await fetch("/.netlify/functions/index?" + paramString);
  let json = await response.json();
  console.log("Got asset data:", json);
  contractStore.update(($contractStore) => {
    //$contractStore = {};
    for (let result of json) {
      $contractStore[result.fields["ID"]] = {
        ...result.fields,
        _id: result.id,
      };
    }
    console.log("contractStore:", JSON.stringify($contractStore));
    return $contractStore;
  });
  if (mapped || all) {
    lastFetch = new Date().getTime();
  }
  return json;
}

export async function mapContract(contract: Contract, student: Student) {
  let params = { mode: "contract" };
  let newContract = {
    id: contract._id,
    fields: { Student: [student._id], "Contract Signed": true },
  };
  let response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params),
    {
      method: "PATCH",
      body: JSON.stringify([newContract]),
    }
  );
  let json = await response.json();
  if (json && json[0] && json[0].id) {
    // probably worked then...
    contractStore.update(($store) => {
      let updatedContract = $store[contract.ID];
      updatedContract.Student = [student._id];
      updatedContract["LASID (from Student)"] = [student.LASID];
      updatedContract["Name (from Student)"] = [student.Name];
      updatedContract["Email (from Student)"] = [student.Email];
      return $store;
    });
  }
  return json;
}
