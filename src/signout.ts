import type { Student } from "./students";
import type { Asset } from "./inventory";

export type CheckoutStatus = "Out" | "Returned" | "Lost";

export async function signoutAsset(
  student: Student,
  asset: Asset,
  Notes: string = "",
  Status: CheckoutStatus = "Out"
) {
  let response = await fetch(
    "./.netlify/functions/index?" +
      new URLSearchParams({
        mode: "signout",
        Notes,
        Status,
        studentRecordId: student._id,
        assetRecordId: asset._id,
      })
  );
  let json = await response.json();
  return json;
}
