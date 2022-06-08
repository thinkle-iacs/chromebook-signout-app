import type { Asset } from "./inventory";
import type { Student } from "./students";
import { writable } from "svelte/store";
import type { Writable } from "svelte/store";
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
  isLatest,
  onlyOut,
}: {
  asset?: Asset;
  student?: Student;
  isLatest?: boolean;
  onlyOut?: boolean;
} = {}): SignoutHistoryEntry[] {
  let params: {
    mode: string;
    assetTag?: string;
    lasid?: number;
    isLatest?: boolean;
    onlyOut?: boolean;
  } = { mode: "signoutHistory" };
  if (asset) {
    params.assetTag = asset["Asset Tag"];
  }
  if (student) {
    params.lasid = student.LASID;
  }
  if (onlyOut) {
    params.onlyOut = true;
  }
  if (isLatest) {
    params.isLatest = true;
  }
  let paramString = new URLSearchParams(params);
  let response = await fetch("/.netlify/functions/index?" + paramString);
  let json = await response.json();
  return json.map((item) => item.fields);
}

export let fetching = writable(false);
export let fullHistory: Writable<SignoutHistoryEntry[]> = writable([]);

export async function fetchFullHistory(onlyOut = false) {
  let $fullHistory = await lookupSignoutHistory({ onlyOut, isLatest: true });
  fullHistory.set($fullHistory);
}
