import { writable, get } from "svelte/store";
import { logger } from "@utils/log";

export let studentsStore = writable({});

export type Student = {
  Name: string;
  LASID: number;
  YOG: string;
  Advisor: string;
  Email: string;
  Notes: string;
  _id: string;
  Status: "Active" | "Inactive";
  Tickets?: string[]; // list of Ticket record IDs (lookup from Airtable)
  "Ticket Numbers"?: number[]; // list of open ticket numbers associated with this student
};
let cachedSearch = {};

export async function searchForStudent(name) {
  if (cachedSearch[name]) {
    return cachedSearch[name];
  }
  let response = await fetch(
    "/.netlify/functions/index?mode=student&name=" + encodeURIComponent(name)
  );
  let json = await response.json();
  logger.logVerbose("Got data:", json);
  studentsStore.update(($studentsStore) => {
    for (let result of json) {
      $studentsStore[result.fields.LASID] = {
        ...result.fields,
        Tickets: result.fields.Tickets || [],
        _id: result.id,
      };
    }
    return $studentsStore;
  });
  cachedSearch[name] = json;
  return json;
}

export async function fetchStudentsForReport({
  yog,
  status,
  emails,
}: {
  yog?: string;
  status?: string;
  emails?: string[];
} = {}) {
  let params: any = { mode: "student", report: "true" };
  if (yog) {
    params.yog = yog;
  }
  if (status) {
    params.status = status;
  }
  if (emails?.length) {
    params.emails = emails.join(",");
  }

  let response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params)
  );
  if (!response.ok) {
    throw new Error(`Student report lookup failed: ${response.status}`);
  }
  let responseText = await response.text();
  let json;
  try {
    json = JSON.parse(responseText);
  } catch (error) {
    if (responseText.trim().startsWith("<!DOCTYPE")) {
      throw new Error(
        "Student report lookup returned the app HTML instead of function JSON. Open the app through Netlify Dev, for example http://localhost:8888 or http://localhost:8890, not the frontend-only Svelte port."
      );
    }
    throw new Error("Student report lookup returned invalid JSON.");
  }
  logger.logVerbose("Got student report data:", json);
  studentsStore.update(($studentsStore) => {
    for (let result of json) {
      const student = {
        ...result.fields,
        Tickets: result.fields.Tickets || [],
        _id: result.id,
      };
      $studentsStore[result.fields.LASID] = student;
    }
    return $studentsStore;
  });
  return json.map((result) => ({
    ...result.fields,
    Tickets: result.fields.Tickets || [],
    _id: result.id,
  })) as Student[];
}

export function getStudent(name: string): Student {
  for (let item of Object.values(get(studentsStore)) as Student[]) {
    if (item.Name == name) {
      return item;
    }
  }
}

export async function addStudentNote(student: Student, note: string) {
  let response = await fetch(
    "/.netlify/functions/index?mode=updateStudent&studentId=" +
      student._id +
      "&note=" +
      encodeURIComponent(note)
  );
  let json = await response.json();
  logger.logVerbose("Got data:", json);
  return json;
}
