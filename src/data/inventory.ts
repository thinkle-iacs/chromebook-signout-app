import { writable, get } from "svelte/store";
import { Staff } from "./staff";

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

export async function searchForAsset(tag, lasid?, serial?, staffEmail?) {
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
  if (staffEmail) {
    params.staffEmail = staffEmail;
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

export async function getCurrentLoansForStaff(staff) {
  let results = await searchForAsset(null, null, null, staff.Email);
  if (results.length) {
    let $assetStore = get(assetStore);
    return results.map((result) => $assetStore[result.fields["Asset Tag"]]);
  } else {
    return [];
  }
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

// General function for fetching reports
export async function fetchReport({
  chromebookOnly = false,
  studentLoan = false,
  staffLoan = false,
  notLoaned = false,
  yog = undefined,
  studentStatus = undefined, // New field for filtering by Student Status
}: {
  chromebookOnly?: boolean;
  studentLoan?: boolean;
  staffLoan?: boolean;
  notLoaned?: boolean;
  yog?: string | undefined;
  studentStatus?: string | undefined; // Allow querying by Student Status
} = {}) {
  let params: any = { mode: "asset" };

  if (chromebookOnly) {
    params.onlyChromebooks = true;
  }
  if (studentLoan) {
    params.studentLoan = true;
  }
  if (staffLoan) {
    params.staffLoan = true;
  }
  if (notLoaned) {
    params.notLoaned = true;
  }
  if (yog) {
    params.yog = yog;
  }
  if (studentStatus) {
    params.studentStatus = studentStatus; // Pass Student Status to query
  }

  let paramString = new URLSearchParams(params);
  let response = await fetch("/.netlify/functions/index?" + paramString);
  let json = await response.json();
  console.log("Got report data:", json);

  assetStore.update(($assetStore) => {
    for (let result of json) {
      let item = {
        ...result.fields,
        _id: result.id,
      };
      $assetStore[item["Asset Tag"]] = item;
    }
    return $assetStore;
  });

  return json;
}

// Convenience function: Get staff loans
export async function getStaffLoans(chromebookOnly = false) {
  return await fetchReport({ chromebookOnly, staffLoan: true });
}

// Convenience function: Get student loans
export async function getStudentLoans(chromebookOnly = false, yog?: string, studentStatus?: string) {
  return await fetchReport({ chromebookOnly, studentLoan: true, yog, studentStatus });
}

// Convenience function: Get non-loaned Chromebooks
export async function getNonLoanedChromebooks() {
  return await fetchReport({ chromebookOnly: true, notLoaned: true });
}
