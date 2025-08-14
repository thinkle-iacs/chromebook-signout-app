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
  "YOG (from Student (Current))"; // Ensure YOG is included in the fields
  "Student (Current)": string;
  "Device Type": string;
  Location: string;
  "Charger Type": string | null;
  "Student Status": string[] | null;
  // NEW lookup arrays for ticket integration
  "Ticket Numbers"?: number[]; // primary device on these ticket numbers
  "Temp Ticket Numbers"?: number[]; // temp/loaner device on these ticket numbers
};

export async function searchForAsset(
  tag,
  lasid?,
  serial?,
  staffEmail?,
  purpose?
) {
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
  if (purpose) {
    params.purpose = purpose;
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
      // New: also index by record id for quick lookup when we only have the id
      $assetStore[result.id] = item;
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
  let results = await searchForAsset(null, student.LASID, null, "Student Loan");
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
  purpose = undefined, // New field for filtering by Purpose
}: {
  chromebookOnly?: boolean;
  studentLoan?: boolean;
  staffLoan?: boolean;
  notLoaned?: boolean;
  yog?: string | undefined;
  studentStatus?: string | undefined; // Allow querying by Student Status
  purpose?: string | undefined; // Allow querying by Purpose
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
  if (purpose) {
    params.purpose = purpose; // Pass Purpose to query
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
export async function getStudentLoans(
  chromebookOnly = false,
  yog?: string,
  studentStatus?: string
) {
  return await fetchReport({
    chromebookOnly,
    studentLoan: true,
    yog,
    studentStatus,
    purpose: "Student Loan",
  });
}

// Convenience function: Get non-loaned Chromebooks
export async function getNonLoanedChromebooks() {
  return await fetchReport({ chromebookOnly: true, notLoaned: true });
}

// Update asset function
export async function updateAsset(id: string, fields: any) {
  try {
    const response = await fetch("/.netlify/functions/index?mode=asset", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, fields }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const updatedAsset = await response.json();

    // Update the store with the new data
    assetStore.update(($assetStore) => {
      const assetTag = updatedAsset.fields["Asset Tag"];
      if (assetTag) {
        $assetStore[assetTag] = {
          ...updatedAsset.fields,
          _id: updatedAsset.id,
        };
      }
      return $assetStore;
    });

    return updatedAsset;
  } catch (error) {
    console.error("Error updating asset:", error);
    throw error;
  }
}
