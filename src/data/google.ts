import { authedFetch } from "@utils/authedFetch";
import { writable, get } from "svelte/store";
import { logger } from "@utils/log";
import type { Asset } from "./inventory";
import type { Student } from "./students";

export type ChromebookInfo = {
  recentUsers: { type: "USER_TYPE_MANAGED"; email: string }[];
  orgUnitId: string;
  cpuStatusReports: {
    cpuUtilizationPercentageInfo: number[];
    reportTime: string;
  }[];
  autoUpdateExpiration: string;
  platformVersion: string;
  model: string;
  deviceLicenseType: string;
  systemRamFreeReports: { reportTime: string; systemRamFreeInfo: string[] }[];
  bootMode: string;
  deviceId: string;
  osVersion: string;
  annotatedUser: string;
  systemRamTotal: string;
  manufactureDate: string;
  lastKnownNetwork: { ipAddress: string; wanIpAddress: string }[];
  serialNumber: string;
  macAddress: string;
  cpuInfo: {
    maxClockSpeedKhz: number;
    model: string;
    architecture: string;
  }[];
  etag: string;
  activeTimeRanges: {
    date: string;
    activeTime: number;
  }[];
  lastSync: string;
  status: string;
  firstEnrollmentTime: string;
  lastEnrollmentTime: string;
  orgUnitPath: string;
  osUpdateStatus: {
    updateTime: string;
    state: string;
    targetOsVersion: string;
    updateCheckTime: string;
    rebootTime: string;
  };
  firmwareVersion: string;
  diskVolumeReports: {
    volumeInfo: {
      storageTotal: string;
      storageFree: string;
      volumeId: string;
    }[];
  }[];
};

let serialCache = {};

export async function getDeviceInfo(
  device: Asset
): Promise<ChromebookInfo | void> {
  if (serialCache[device.Serial]) {
    return serialCache[device.Serial];
  }
  let response = await authedFetch(
    "/.netlify/functions/index?mode=google&serial=" +
      encodeURIComponent(device.Serial)
  );
  logger.logVerbose("Fetching device Info for ", device.Serial);
  if (response.status == 200) {
    let json = await response.json();
    logger.logVerbose("getDeviceInfo returning", json);
    serialCache[device.Serial] = json.result;
    return json.result as ChromebookInfo;
  }
}

let userCache = {};

export async function getDevicesForUser(
  user: Student
): Promise<ChromebookInfo[] | void> {
  if (userCache[user.Email]) {
    return userCache[user.Email];
  }
  let response = await authedFetch(
    "/.netlify/functions/index?mode=google&user=" +
      encodeURIComponent(user.Email)
  );

  logger.logVerbose("Fetching devices for ", user.Email);
  if (response.status == 200) {
    let json = await response.json();
    logger.logVerbose("getDevicesForUser returning", json);
    userCache[user.Email] = json.result;
    return json.result as ChromebookInfo[];
  }
}

export async function setDeviceDisabled(
  asset: Asset,
  disabled: boolean
): Promise<{ success: boolean; errorMessage?: string }> {
  try {
    const action = disabled ? "disable" : "reenable";
    const response = await fetch(
      "/.netlify/functions/index?mode=google&action=" +
        action +
        "&serial=" +
        encodeURIComponent(asset.Serial)
    );
    if (!response.ok && response.status !== 500) {
      return { success: false, errorMessage: `Server error: ${response.status}` };
    }
    const json = await response.json();
    if (json.status === "success") {
      // Invalidate cache so next fetch reflects new status
      delete serialCache[asset.Serial];
      return { success: true };
    }
    return { success: false, errorMessage: json.errorMessage || json.detail || "Unknown error" };
  } catch (err) {
    return { success: false, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

export async function checkMachineStatus(asset: Asset) {
  const googleData = await getDeviceInfo(asset);

  if (!googleData) {
    logger.logError(
      "No Google Admin data found for asset:",
      asset["Asset Tag"]
    );
    return {
      status: "No data",
      lastUserMatch: false,
      lastUsed: null,
      googleData,
    };
  }

  const lastUser = googleData.recentUsers?.[0]?.email?.toLowerCase() || null;
  const signedOutTo =
    asset["Email (from Student (Current))"]?.[0]?.toLowerCase() || null;

  const lastUserMatch = lastUser && signedOutTo && lastUser === signedOutTo;

  const lastUsedDate =
    googleData.activeTimeRanges?.[googleData.activeTimeRanges.length - 1]
      ?.date || null;

  return {
    status: lastUserMatch ? "Match" : "Mismatch",
    lastUserMatch,
    lastUsed: lastUsedDate,
    googleData,
  };
}
