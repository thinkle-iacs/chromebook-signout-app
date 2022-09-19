import { get } from "svelte/store";
import { contactStore, getEmails } from "./data/contacts";

import type { SignoutHistoryEntry } from "./data/signoutHistory";

export function buildMessageForExtras(extras: SignoutHistoryEntry[]) {
  let message = `\nStudent also has ${extras.length} additional computer out: `;
  for (let e of extras) {
    message += `\n\tAsset Tag ${e["Asset Tag (from Asset)"]} (signed ${e.Status} @ ${e.Time})`;
  }
  return message;
}

export function createEmail(
  message,
  entry: SignoutHistoryEntry,
  emailStudent = true,
  emailContact = true,
  others: SignoutHistoryEntry[]
) {
  let $contactStore = get(contactStore);
  let LASID = entry.LASID && entry.LASID[0];
  let notification = {};
  notification.message = message;
  notification.entry = entry;
  let student = notification.entry.Student && notification.entry.Student[0];

  if (others && others.length > 1) {
    let extras = others.filter((e) => e != entry);
    if (extras) {
      notification.ExtraText = buildMessageForExtras(extras);
    }
  }

  if (emailStudent) {
    let email = entry["Email (from Students)"] || entry["Email (from Staff)"];
    if (email) {
      notification.Recipient = email.join(",");
    }
  }
  if (emailContact && LASID && $contactStore[LASID]) {
    notification.Recipient2 = getEmails($contactStore[LASID]).join(",");
  }
  notification.studentIdentifier = entry.Student && entry.Student[0];
  return notification;
}
