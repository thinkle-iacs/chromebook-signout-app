import { staffBase } from "./Airtable";

// Use the reciprocal links on Staff: Airtable formulas stringify linked fields
// as their display values, so comparing {Staff} to a record ID never matches.
export async function staffLinkedRecordsFilter(
  staffId: string,
  field: "Inventory" | "Student Signout History"
): Promise<string> {
  if (!/^rec[a-zA-Z0-9]+$/.test(staffId)) {
    throw new Error("Invalid staff record ID");
  }
  const staff = await staffBase.find(staffId);
  const ids = (staff.get(field) || []) as string[];
  const matches = ids.map((id) => {
    if (!/^rec[a-zA-Z0-9]+$/.test(id)) {
      throw new Error("Invalid linked record ID");
    }
    return `RECORD_ID()="${id}"`;
  });
  return matches.length ? `OR(${matches.join(",")})` : "FALSE()";
}
