import { writable, get } from "svelte/store";

export const assetStore = writable({});

export type Asset = {
  "Asset Tag": string;
  Category: string;
  Make: string;
  Model: string;
  Serial: string;
  "Year of Purchase": string;
  "MAC-Wireless": string;
  _id: string;
  Purpose: string;
  "Staff User": string;
  "Email (from Student (Current))": string;
  "Student (Current)": string;
  "Device Type": string;
  Location: string;
  "Charger Type": string | null;
};

export async function searchForAsset(tag, lasid, serial) {
  let params: any = { mode: "asset" };
  if (tag) {
    params.tag = tag;
  }
  if (lasid) {
    params.lasid = lasid;
  }
  if (serial) {
    params.serial = serial;
  }
  let paramString = new URLSearchParams(params);
  let response = await fetch("/.netlify/functions/index?" + paramString);
  let json = await response.json();
  console.log("Got asset data:", json);
  assetStore.update(($assetStore) => {
    for (let result of json) {
      let item = {
        ...result.fields,
        _id: result.id,
      };
      $assetStore[result.fields["Asset Tag"]] = item;
      if (result.fields["Serial"]) {
        $assetStore[result.fields["Serial"].toLowerCase()] = item;
      }
    }
    console.log("assetStore:", JSON.stringify($assetStore));
    return $assetStore;
  });

  return json;
}

export async function getCurrentLoansForStudent(student) {
  let results = await searchForAsset(null, student.LASID, null);
  if (results.length) {
    let $assetStore = get(assetStore);
    return results.map((result) => $assetStore[result.fields["Asset Tag"]]);
  } else {
    return [];
  }
}
