import type { Student } from "./students";
import type { Asset } from "./inventory";
import { assetStore } from "./inventory";]
import { update, get } from "svelte/store";
export type CheckoutStatus = "Out" | "Returned" | "Lost";

export async function signoutAsset(
  student: Student,
  asset: Asset,
  Notes: string = "",
  Status: CheckoutStatus = "Out"
) {
  let params = {mode:'signout',Notes,Status, assetRecordId:asset._id}
  if (student) {
    params.studentRecordId = student._id
  }  
  let response = await fetch(
    "/.netlify/functions/index?" +
      new URLSearchParams(params)
  );
  let json = await response.json();
  if (json && json.length == 1) {
    let record = json[0];
    // manually update email since we might display that...
    if (student && Status=='Out') {
      assetStore.update(($assetStore) => {
        console.log("update store based on record", record);
        let tag = asset["Asset Tag"];
        let oldRecord = $assetStore[tag] || {};
        $assetStore[tag] = {
          ...oldRecord,
          "Email (from Student (Current))": student.Email,
        };
        console.log($assetStore);
        return $assetStore;
      });
    }
  }
  return json;
}
