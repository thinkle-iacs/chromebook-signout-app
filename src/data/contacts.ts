import { writable, get } from "svelte/store";
//import type { Writable } from "svelte/store";

/* export const contractStore: Writable<{
  [key: number]: Contract;
}> = writable({});
 */
export const contactStore = writable({});

export type Contact = {
  LASID: number;
  Contact1Email;
  Contact1ReceivesEmail;
  Contact2Email;
  Contact2ReceivesEmail;
};

export function getEmails(contact: Contact) {
  let emails = [];
  if (contact.Contact1Email && contact.Contact1ReceivesEmail) {
    emails.push(contact.Contact1Email);
  }
  if (contact.Contact2Email && contact.Contact2ReceivesEmail) {
    emails.push(contact.Contact2Email);
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
