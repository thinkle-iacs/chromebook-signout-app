// General purpose logging plan.

import { writable, get } from "svelte/store";

const LOG_ERROR = 4;
const LOG_PRIORITY = 3;
const LOG_REGULAR = 2;
const LOG_VERBOSE = 1;

let logLevel = writable(LOG_REGULAR);
if (window.location.hostname === "localhost") {
  logLevel.set(LOG_REGULAR);
} else {
  logLevel.set(LOG_ERROR); // production default...
}

export function setLogLevel(level: number) {
  logLevel.set(level);
}

export function log(level: number, ...args: any[]) {
  if (level == LOG_PRIORITY) {
    args = ["***", ...args, "***"];
  } else if (level == LOG_ERROR) {
    args = ["!!!", ...args, "!!!"];
  }
  if (level >= get(logLevel)) {
    if (level === 1) {
      console.info(...args);
    } else if (level === 4) {
      console.error(...args);
    } else {
      console.log(...args);
    }
  }
}

export function logError(...args: any[]) {
  log(LOG_ERROR, ...args);
}
export function logPriority(...args: any[]) {
  log(LOG_PRIORITY, ...args);
}
export function logRegular(...args: any[]) {
  log(LOG_REGULAR, ...args);
}
export function logVerbose(...args: any[]) {
  log(LOG_VERBOSE, ...args);
}

export const logger = {
  log,
  logError,
  logPriority,
  logRegular,
  logVerbose,
  setLogLevel,
};
