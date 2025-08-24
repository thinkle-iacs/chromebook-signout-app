import { writable, get } from "svelte/store";
import { logger } from "@utils/log";

export const messagesStore = writable({});

type Message = {
  ID: string;
  Body: string;
  Subject: string;
};

export async function getMessages() {
  let params: { [key: string]: string } = { mode: "message" };

  let paramString = new URLSearchParams(params);
  let response = await fetch("/.netlify/functions/index?" + paramString);
  let json = await response.json();
  logger.logVerbose("Got message data:", json);
  messagesStore.update(($messageStore) => {
    $messageStore = {};
    for (let result of json) {
      $messageStore[result.fields.ID] = {
        ...result.fields,
        _id: result.id,
      };
    }
    logger.logVerbose("messageStore:", JSON.stringify($messageStore));
    return $messageStore;
  });
  return json;
}
