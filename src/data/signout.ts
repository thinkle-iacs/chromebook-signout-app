import type { Student } from "./students";
import type { Staff } from "./staff";
import type { Asset } from "./inventory";
import { assetStore } from "./inventory";
import { get } from "svelte/store";
import { user } from "./user";
export type CheckoutStatus =
  | "Out"
  | "Returned"
  | "Lost"
  | "Retire"
  | "Repairing";

export async function signoutAsset(
  student: Student,
  staff: Staff,
  asset: Asset,
  Notes: string = "",
  Status: CheckoutStatus = "Out",
  daily: boolean = false
) {
  let params = {
    mode: "signout",
    Notes,
    Status,
    assetRecordId: asset._id,
    FormUser: "",
    DailyLoan: daily,
  };
  let $user = get(user);
  if (student) {
    params.studentRecordId = student._id;
  }
  if (staff) {
    params.staffRecordId = staff._id;
  }
  params.FormUser = $user.email;
  let response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params)
  );
  let json = await response.json();
  if (json && json.length == 1) {
    let record = json[0];
    // manually update email since we might display that...
    if (student && Status == "Out") {
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
