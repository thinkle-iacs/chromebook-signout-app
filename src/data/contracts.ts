import { writable, get } from "svelte/store";
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
  WiFi: boolean;
  "Grade Level": string;
  Date: string;
  Student: string[];
  "LASID (from Student)": string[];
};

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
    $contractStore = {};
    for (let result of json) {
      $contractStore[result.fields["ID"]] = {
        ...result.fields,
        _id: result.id,
      };
    }
    console.log("contractStore:", JSON.stringify($contractStore));
    return $contractStore;
  });
  return json;
}
