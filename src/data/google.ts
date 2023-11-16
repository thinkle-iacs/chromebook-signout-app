import { writable, get } from "svelte/store";
import type { Asset } from "./inventory";
import type { Student } from "./students";

export let studentsStore = writable({});

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
  manufatureDate: string;
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

export async function getDeviceInfo(
  device: Asset
): Promise<ChromebookInfo | void> {
  let response = await fetch(
    "/.netlify/functions/index?mode=google&serial=" +
      encodeURIComponent(device.Serial)
  );
  console.log("Fetching device Info for ", device.Serial);
  if (response.status == 200) {
    let json = await response.json();
    console.log("getDeviceInfo returning", json);
    return json.result as ChromebookInfo;
  }
}

export async function getDevicesForUser(
  user: Student
): Promise<ChromebookInfo[] | void> {
  let response = await fetch(
    "/.netlify/functions/index?mode=google&user=" +
      encodeURIComponent(user.Email)
  );
  console.log("Fetching devices for ", user.Email);
  if (response.status == 200) {
    let json = await response.json();
    console.log("getDevicesForUser returning", json);
    return json.result as ChromebookInfo[];
  }
}
