import { writable, get } from "svelte/store";
//import type { Writable } from "svelte/store";

/* export const contractStore: Writable<{
  [key: number]: Contract;
}> = writable({});
 */
export const contactStore = writable({});

export type Contact = {
  LASID: number;
  Contact1Email: string;
  Contact2Email: string;
  Contact3Email: string;
  Contact4Email: string;
  Contact5Email: string;
  Contact6Email: string;
  Contact7Email: string;
};

export function getEmails(contact: Contact) {
  let emails = [];
  for (let i = 1; i < 8; i++) {
    let field = `Contact${i}Email`;
    if (contact[field]) {
      emails.push(contact[field]);
    }
  }
  return emails;
}

export async function getContacts() {
  let params: { [key: string]: string } = { mode: "contact" };
  let paramString = new URLSearchParams(params);
  let response = await fetch("/.netlify/functions/index?" + paramString);
  let json = await response.json();
  console.log("Got contact data:", json);
  contactStore.update(($contactStore) => {
    $contactStore = {};
    for (let result of json) {
      let lasid = result.fields["LASID (from Student)"];
      $contactStore[lasid] = {
        ...result.fields,
        LASID: lasid,
        _id: result.id,
      };
    }
    console.log("contactStore:", JSON.stringify($contactStore));
    return $contactStore;
  });
  return json;
}
