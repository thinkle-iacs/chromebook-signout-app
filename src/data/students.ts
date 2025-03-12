import { writable, get } from "svelte/store";

export let studentsStore = writable({});

export type Student = {
  Name: string;
  LASID: number;
  YOG: string;
  Advisor: string;
  Email: string;
  Notes: string;
  _id: string;
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
  console.log("Got data:", json);
  studentsStore.update(($studentsStore) => {
    for (let result of json) {
      $studentsStore[result.fields.LASID] = {
        ...result.fields,
        _id: result.id,
      };
    }
    return $studentsStore;
  });
  cachedSearch[name] = json;
  return json;
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
  console.log("Got data:", json);
  return json;
}
