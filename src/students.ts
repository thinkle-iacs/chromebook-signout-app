import { writable, get } from "svelte/store";

let studentsStore = writable({});

export type Student {
  Name : string;
  LASID : number;
  YOG : string;
  Advisor : string;
  Email : string;
  _id : string;
}

export async function searchForStudent(name) {
  let response = await fetch(
    "/.netlify/functions/index?mode=student&name=" + encodeURIComponent(name)
  );
  let json = await response.json();
  console.log("Got data:", json);
  studentsStore.update(($studentsStore) => {
    for (let result of json) {
      $studentsStore[result.fields.LASID] = {...result.fields, _id:result.id};
    }
    return $studentsStore;
  });

  return json;
}

export function getStudent(name: string) : Student {
  for (let item of Object.values(get(studentsStore))) {
    if (item.Name == name) {
      return item;
    }
  }
}
