import { writable, get } from "svelte/store";

export const assetStore = writable({});

export type Asset {
  'Asset Tag' : string;
  Category : string;
  Make : string;
  Model : string;
  Serial : string;
  'Year of Purchase' : string;
  'MAC-Wireless' : string;
  _id : string;
}

export async function searchForAsset (tag) {
  let response = await fetch(
    "./.netlify/functions/index?mode=asset&tag=" + encodeURIComponent(tag)
  );
  let json = await response.json();
  console.log("Got asset data:", json);
  assetStore.update(($assetStore) => {
    for (let result of json) {
      $assetStore[result.fields['Asset Tag']] = {...result.fields, _id : result.id};
    }
    console.log('assetStore:',JSON.stringify($assetStore));
    return $assetStore;
  });

  return json;
}


