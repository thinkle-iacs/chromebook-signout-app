import { get } from "svelte/store";
import { user } from "./user";

export type Notification = {
  "Signout History": string[];
  Messages: string[];
  Recipient?: string;
  Recipient2?: string;
  Recipient3?: string;
  Recipient4?: string;
  ExtraText?: string;
};

export type NotificationFields = {
  Num?: number;
  "Signout History"?: string[];
  Messages?: string[];
  ExtraText?: string;
  Recipient?: string[];
  Recipient2?: string;
  "Subject (from Messages)"?: string[];
  "Body (from Messages)"?: string[];
  "ID (from Messages)"?: string[];
  Created?: string;
  "Make (from Asset) (from Signout History)"?: string[];
  "Model (from Asset) (from Signout History)"?: string[];
  "Asset (from Signout History)"?: string[];
  "Serial (from Asset) (from Signout History)"?: string[];
  MachineInfo?: string[];
  "Status (from Signout History)"?: string[];
  "Staff Email"?: string[];
  "Student Email"?: string[];
  "Time (from Signout History)"?: string[];
  "FormUser (from Signout History)"?: string[];
  StatusInfo?: string;
  "Student (from Signout History)"?: string[];
  "Name (from Student) (from Signout History)"?: string[];
  Sent?: boolean;
  Send?: boolean;
  SignoutEntry?: number;
};

export type NotificationUpdates = {
  id: string;
  fields: NotificationFields;
};

export type NotificationResult = {
  id: string;
  fields: NotificationFields;
};

function splitIntoTens(lst) {
  let copy = lst.slice();
  let batches = [];
  while (copy.length > 10) {
    let batch = copy.slice(0, 10);
    copy = copy.slice(10);
    batches.push(batch);
  }
  if (copy.length) {
    batches.push(copy);
  }
  return batches;
}

export async function updateNotifications(
  updates: NotificationUpdates[]
): Promise<NotificationResult[]> {
  if (updates.length > 10) {
    let batched = splitIntoTens(updates);
    let results = [];
    for (let b of batched) {
      console.log("Working on batch");
      results = [...results, await updateNotifications(b)];
      console.log("Have results:", results);
    }
    return results;
  }

  let params = { mode: "notifications" };
  let response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params),
    {
      method: "PATCH",
      body: JSON.stringify(updates),
    }
  );
  let json = await response.json();
  return json;
}

export async function getNotifications(): Promise<NotificationResult[]> {
  let params = {
    mode: "notifications",
    //records : notifications,
  };
  let response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params),
    {
      method: "GET",
    }
  );
  let json = await response.json();
  return json;
}

export async function createNotifications(
  notifications: Notification[]
): Promise<NotificationResult[]> {
  if (notifications.length > 10) {
    let batched = splitIntoTens(notifications);
    let results = [];
    for (let b of batched) {
      console.log("Working on batch");
      results = [...results, await createNotifications(b)];
      console.log("Have results:", results);
    }
    return results;
  }
  let params = {
    mode: "notifications",
    //records : notifications,
  };
  let $user = get(user);
  console.log("Firing off request to create notifications", notifications);
  let response = await fetch(
    "/.netlify/functions/index?" + new URLSearchParams(params),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notifications),
    }
  );
  let json = await response.json();
  return json;
}
