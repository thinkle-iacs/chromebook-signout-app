import type { Asset } from "./inventory";
import { getAllChromebooks } from "./inventory";
import { getDevicesForUser, type ChromebookInfo } from "./google";
import type { Student } from "./students";
import { fetchStudentsForReport } from "./students";
import {
  lookupSignoutHistory,
  type SignoutHistoryEntry,
} from "./signoutHistory";
import { logger } from "@utils/log";

export type StudentDeviceMachineStatus =
  | "normal"
  | "signedOutToOther"
  | "signedOutToStaff"
  | "checkedInAfterUse"
  | "checkedInSameDay"
  | "checkedInAfterGoogleUse"
  | "checkedInUnknown"
  | "unknown";

export type StudentDeviceReportMachine = {
  serial: string;
  assetTag: string;
  model: string;
  purpose: string | null;
  lastUsed: string | null;
  lastUser: string;
  status: StudentDeviceMachineStatus;
  statusLabel: string;
  currentOwner: string;
  checkoutTime: string | null;
  checkInTime: string | null;
  asset: Asset | null;
  googleData: ChromebookInfo;
  latestHistory: SignoutHistoryEntry | null;
};

export type StudentDeviceReportRow = {
  student: Student;
  currentLoans: Asset[];
  machines: StudentDeviceReportMachine[];
  currentLoanCount: number;
  lastUsedMachineCount: number;
  problemCount: number;
};

export type StudentDeviceReportProgress = {
  completed: number;
  total: number;
  student?: Student;
};

const MAX_CONCURRENT_GOOGLE_LOOKUPS = 6;

function firstValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value[0] ? String(value[0]) : "";
  }
  return value ? String(value) : "";
}

function normalizeEmail(value: unknown): string {
  return firstValue(value).trim().toLowerCase();
}

function normalizeSerial(value: unknown): string {
  return firstValue(value).trim().toLowerCase();
}

function getLastUsed(device: ChromebookInfo) {
  const ranges = device.activeTimeRanges || [];
  return ranges.length ? ranges[ranges.length - 1].date : null;
}

function getLastActiveTime(device: ChromebookInfo) {
  const ranges = device.activeTimeRanges || [];
  return ranges.length ? ranges[ranges.length - 1].activeTime : null;
}

function formatDuration(ms: number | null) {
  if (!ms && ms !== 0) return "";
  const totalMinutes = Math.round(ms / 1000 / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, "0")}`;
  return `${minutes} min`;
}

function recentUserEmails(device: ChromebookInfo) {
  return (device.recentUsers || []).map((user) => user.email).filter(Boolean);
}

function getAssetTag(asset: Asset | null, device: ChromebookInfo) {
  return asset?.["Asset Tag"] || device.annotatedUser || "(unknown asset)";
}

function dateKey(value: string | null | undefined) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function checkedInClassification(
  lastUsed: string | null,
  latestHistory: SignoutHistoryEntry | null,
): Pick<
  StudentDeviceReportMachine,
  "status" | "statusLabel" | "currentOwner" | "checkoutTime" | "checkInTime"
> {
  if (latestHistory?.Status !== "Returned") {
    return {
      status: "checkedInUnknown",
      statusLabel: latestHistory?.Status
        ? `No current owner; latest status is ${latestHistory.Status}`
        : "Checked in; no check-in date found",
      currentOwner: "",
      checkoutTime: null,
      checkInTime: latestHistory?.Time || null,
    };
  }

  const lastUsedDate = dateKey(lastUsed);
  const checkInDate = dateKey(latestHistory.Time);

  if (!lastUsedDate || !checkInDate) {
    return {
      status: "checkedInUnknown",
      statusLabel: "Checked in; date comparison unavailable",
      currentOwner: "",
      checkoutTime: null,
      checkInTime: latestHistory.Time || null,
    };
  }

  if (lastUsedDate < checkInDate) {
    return {
      status: "checkedInAfterUse",
      statusLabel: "Checked in after Google activity",
      currentOwner: "",
      checkoutTime: null,
      checkInTime: latestHistory.Time,
    };
  }

  if (lastUsedDate > checkInDate) {
    return {
      status: "checkedInAfterGoogleUse",
      statusLabel: "Google activity after check-in",
      currentOwner: "",
      checkoutTime: null,
      checkInTime: latestHistory.Time,
    };
  }

  return {
    status: "checkedInSameDay",
    statusLabel: "Checked in same day as Google activity; order unknown",
    currentOwner: "",
    checkoutTime: null,
    checkInTime: latestHistory.Time,
  };
}

function classifyMachine(
  student: Student,
  asset: Asset | null,
  lastUsed: string | null,
  latestHistory: SignoutHistoryEntry | null,
): Pick<
  StudentDeviceReportMachine,
  "status" | "statusLabel" | "currentOwner" | "checkoutTime" | "checkInTime"
> {
  if (!asset) {
    return {
      status: "unknown",
      statusLabel: "Not found in inventory",
      currentOwner: "",
      checkoutTime: null,
      checkInTime: null,
    };
  }

  const studentEmail = student.Email.toLowerCase();
  const currentStudentEmail = normalizeEmail(
    asset["Email (from Student (Current))"],
  );
  const currentStaffEmail = normalizeEmail(asset["Staff Email"]);

  if (currentStudentEmail) {
    if (currentStudentEmail === studentEmail) {
      return {
        status: "normal",
        statusLabel: "Signed out to this student",
        currentOwner: currentStudentEmail,
        checkoutTime:
          latestHistory?.Status === "Out" ? latestHistory.Time : null,
        checkInTime: null,
      };
    }
    return {
      status: "signedOutToOther",
      statusLabel: "Signed out to another student",
      currentOwner: currentStudentEmail,
      checkoutTime: latestHistory?.Status === "Out" ? latestHistory.Time : null,
      checkInTime: null,
    };
  }

  if (currentStaffEmail) {
    return {
      status: "signedOutToStaff",
      statusLabel: "Signed out to staff",
      currentOwner: currentStaffEmail,
      checkoutTime: latestHistory?.Status === "Out" ? latestHistory.Time : null,
      checkInTime: null,
    };
  }

  return checkedInClassification(lastUsed, latestHistory);
}

function normalizeAssetRecord(record): Asset {
  return {
    ...record.fields,
    _id: record.id,
  };
}

function indexAssets(assets: Asset[]) {
  const bySerial = new Map<string, Asset>();
  const loansByStudentEmail = new Map<string, Asset[]>();

  for (const asset of assets) {
    const serial = normalizeSerial(asset.Serial);
    if (serial) {
      bySerial.set(serial, asset);
    }

    const studentEmail = normalizeEmail(
      asset["Email (from Student (Current))"],
    );
    if (studentEmail) {
      const loans = loansByStudentEmail.get(studentEmail) || [];
      loans.push(asset);
      loansByStudentEmail.set(studentEmail, loans);
    }
  }

  return { bySerial, loansByStudentEmail };
}

function indexLatestHistory(entries: SignoutHistoryEntry[]) {
  const byAssetTag = new Map<string, SignoutHistoryEntry>();

  for (const entry of entries) {
    const assetTag = firstValue(entry["Asset Tag (from Asset)"]);
    if (!assetTag) continue;

    const existing = byAssetTag.get(assetTag);
    const existingTime = existing?.Time ? new Date(existing.Time).getTime() : 0;
    const entryTime = entry.Time ? new Date(entry.Time).getTime() : 0;
    if (!existing || entryTime > existingTime) {
      byAssetTag.set(assetTag, entry);
    }
  }

  return byAssetTag;
}

function isProblemMachine(machine: StudentDeviceReportMachine) {
  return !["normal", "checkedInAfterUse"].includes(machine.status);
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
) {
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        await worker(items[index], index);
      }
    },
  );
  await Promise.all(workers);
}

export function flattenStudentDeviceReport(
  rows: StudentDeviceReportRow[],
): Record<string, any>[] {
  const exportedRows: Record<string, any>[] = [];

  for (const row of rows) {
    if (!row.machines.length) {
      exportedRows.push({
        Student: row.student.Email,
        Name: row.student.Name,
        YOG: row.student.YOG,
        Status: row.student.Status,
        "Machine Number": "",
        "Machine Count": 0,
        "Asset Tag": "",
        Serial: "",
        "Last Activity Date": "",
        "Google Last Sync": "",
        "Last Activity Duration": "",
        "Recent Users": "",
        "Checkout Status": "",
        "Checkout Time": "",
        "Check-In Time": "",
        Summary: "No Google last-used machines",
      });
      continue;
    }

    row.machines.forEach((machine, index) => {
      exportedRows.push({
        Student: row.student.Email,
        Name: row.student.Name,
        YOG: row.student.YOG,
        Status: row.student.Status,
        "Machine Number": index + 1,
        "Machine Count": row.lastUsedMachineCount,
        "Asset Tag": machine.assetTag,
        Serial: machine.serial,
        "Last Activity Date": machine.lastUsed || "",
        "Google Last Sync": machine.googleData.lastSync || "",
        "Last Activity Duration": formatDuration(
          getLastActiveTime(machine.googleData),
        ),
        "Recent Users": recentUserEmails(machine.googleData).join(";"),
        "Checkout Status": machine.currentOwner
          ? `Signed out to ${machine.currentOwner}`
          : machine.checkInTime
            ? `Checked in ${machine.checkInTime}`
            : machine.status === "unknown"
              ? "Not found in inventory"
              : "Checked in; no check-in date found",
        "Checkout Time": machine.checkoutTime || "",
        "Check-In Time": machine.checkInTime || "",
        Summary: machine.statusLabel,
      });
    });
  }

  return exportedRows;
}

export async function buildStudentDeviceReport({
  yog,
  status,
  emails,
  onProgress,
}: {
  yog?: string;
  status?: string;
  emails?: string[];
  onProgress?: (progress: StudentDeviceReportProgress) => void;
} = {}): Promise<StudentDeviceReportRow[]> {
  const students = await fetchStudentsForReport({ yog, status, emails });
  const rawAssets = await getAllChromebooks();
  const assets = (rawAssets || []).map(normalizeAssetRecord);
  const { bySerial, loansByStudentEmail } = indexAssets(assets);
  const latestHistoryByAssetTag = indexLatestHistory(
    await lookupSignoutHistory({ isLatest: true }),
  );
  const rows = new Array<StudentDeviceReportRow>(students.length);
  let completed = 0;

  await runWithConcurrency(
    students,
    MAX_CONCURRENT_GOOGLE_LOOKUPS,
    async (student, index) => {
      const studentEmail = normalizeEmail(student.Email);
      const currentLoans = loansByStudentEmail.get(studentEmail) || [];
      let googleDevices: ChromebookInfo[] = [];

      if (studentEmail) {
        try {
          googleDevices = (await getDevicesForUser(student)) || [];
        } catch (error) {
          logger.logError("Student device report Google lookup failed:", {
            student,
            error,
          });
        }
      } else {
        logger.logRegular(
          "Student device report: missing student email; skipping Google lookup",
          {
            studentId: student._id,
            studentName: student.Name,
          },
        );
      }

      const machines = googleDevices
        .filter(
          (device) =>
            studentEmail &&
            device.recentUsers?.[0]?.email?.toLowerCase() === studentEmail,
        )
        .map((device) => {
          const serial = normalizeSerial(device.serialNumber);
          const asset = bySerial.get(serial) || null;
          const assetTag = getAssetTag(asset, device);
          const lastUsed = getLastUsed(device);
          const latestHistory = asset
            ? latestHistoryByAssetTag.get(asset["Asset Tag"]) || null
            : null;
          const classification = classifyMachine(
            student,
            asset,
            lastUsed,
            latestHistory,
          );
          return {
            serial: device.serialNumber,
            assetTag,
            model: asset?.Model || device.model || "",
            purpose: asset?.Purpose || null,
            lastUsed,
            lastUser: device.recentUsers?.[0]?.email || "",
            asset,
            googleData: device,
            latestHistory,
            ...classification,
          };
        })
        .sort((a, b) => {
          const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return bTime - aTime;
        });

      rows[index] = {
        student,
        currentLoans,
        machines,
        currentLoanCount: currentLoans.length,
        lastUsedMachineCount: machines.length,
        problemCount: machines.filter(isProblemMachine).length,
      };

      completed += 1;
      onProgress?.({ completed, total: students.length, student });
    },
  );

  return rows;
}
