import type { Asset } from "./inventory";
import type { Student } from "./students";
import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
import type { Staff } from "./staff";
export type SignoutHistoryEntry = {
  Status: string;
  "Asset Tag (from Asset)": string[];
  Student: string[];
  "Email (from Students)": string[];
  "Email (from Staff)": string[];
  Notes: string;
  Time: string;
  "Is Latest Change": number;
  LatestUpdate: number;
  Num: number;
  DailyLoan: boolean;
  LASID: string;
  Name: string;
  YOG: string;
};

export function getStudentLinkFromHistoryItem(
  entry: SignoutHistoryEntry
): string | null {
  if (entry["Email (from Students"]) {
  } else {
    return undefined;
  }
}

export async function lookupSignoutHistory({
  asset,
  student,
  staff,
  isLatest,
  onlyOut,
  status,
}: {
  asset?: Asset;
  student?: Student;
  staff?: Staff;
  isLatest?: boolean;
  onlyOut?: boolean;
  status?: string;
} = {}): Promise<SignoutHistoryEntry[]> {
  let params: Record<string, string> = { mode: "signoutHistory" };
  if (asset) {
    params.assetTag = asset["Asset Tag"];
  }
  if (student) {
    params.lasid = String(student.LASID);
  }
  if (onlyOut) {
    params.onlyOut = "true";
  }
  if (isLatest) {
    params.isLatest = "true";
  }
  if (status) {
    params.status = status;
  }
  if (staff) {
    params.staffId = staff._id;
  }
  let paramString = new URLSearchParams(params);
  let response = await fetch("/.netlify/functions/index?" + paramString);
  let json = await response.json();
  return json.map((item) => ({ ...item.fields, _id: item.id }));
}

// Cache of asset tags whose latest signout record is "Repairing" — i.e. the
// device is physically in our hands for repair even though it stays assigned
// to its student. One bulk query powers the "IN REPAIR" indicator across the
// asset lookup, student loans, reports, and check-in scan.
let repairingTagsCache: Set<string> | null = null;

export async function getRepairingAssetTags(
  force = false
): Promise<Set<string>> {
  if (repairingTagsCache && !force) return repairingTagsCache;
  const records = await lookupSignoutHistory({
    isLatest: true,
    status: "Repairing",
  });
  const tags = new Set<string>();
  for (const r of records) {
    const tag = r["Asset Tag (from Asset)"]?.[0];
    if (tag) tags.add(tag);
  }
  repairingTagsCache = tags;
  return tags;
}

export function clearRepairingTagsCache() {
  repairingTagsCache = null;
}

export let fetching = writable(false);
export let fullHistory: Writable<SignoutHistoryEntry[]> = writable([]);

export async function fetchFullHistory(onlyOut = false) {
  let $fullHistory = await lookupSignoutHistory({ onlyOut, isLatest: true });
  fullHistory.set($fullHistory);
}
