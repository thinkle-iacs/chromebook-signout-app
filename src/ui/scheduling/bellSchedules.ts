// Bell schedule definitions for different grade levels
// These are updated annually but can be hard-coded since they don't change frequently
//
// Middle School schedules live in ./msSchedules (per grade, 2026-2027).
import { getMSBellSchedule, MS_SCHEDULES_BY_GRADE } from "./msSchedules";

export interface BellPeriod {
  id: string;
  name: string;
  displayName: string;
  startTime: string; // "08:05"
  endTime: string; // "09:27"
  durationMinutes: number;
}

export interface DaySchedule {
  days: number[]; // [1, 3, 5] = Monday, Wednesday, Friday (0=Sunday, 1=Monday, etc.)
  periods: BellPeriod[];
}

export interface BellSchedule {
  name: string;
  description: string;
  grades: string[]; // ["05", "06"] etc.
  schedules: DaySchedule[]; // Different schedules for different days
}

export const HIGH_SCHOOL_SCHEDULE: BellSchedule = {
  name: "high_school",
  description: "High School Bell Schedule (Grades 9-12)",
  grades: ["09", "10", "11", "12"],
  schedules: [
    {
      days: [1, 2, 3, 4, 5], // Monday through Friday
      periods: [
        {
          id: "block_1",
          name: "Block 1",
          displayName: "Block 1",
          startTime: "08:05",
          endTime: "09:27",
          durationMinutes: 82,
        },
        {
          id: "block_2",
          name: "Block 2",
          displayName: "Block 2",
          startTime: "09:40",
          endTime: "11:02",
          durationMinutes: 82,
        },
        {
          id: "block_3",
          name: "Block 3",
          displayName: "Block 3",
          startTime: "11:05",
          endTime: "12:27",
          durationMinutes: 82,
        },
        {
          id: "adv_l_1",
          name: "Adv/L 1",
          displayName: "Adv/Lunch 1",
          startTime: "12:30",
          endTime: "12:54",
          durationMinutes: 24,
        },
        {
          id: "adv_l_2",
          name: "Adv/L 2",
          displayName: "Adv/Lunch 2",
          startTime: "12:55",
          endTime: "13:19",
          durationMinutes: 24,
        },
        {
          id: "block_4",
          name: "Block 4",
          displayName: "Block 4",
          startTime: "13:22",
          endTime: "14:45",
          durationMinutes: 83,
        },
      ],
    },
  ],
};

// All available schedules
export const ALL_SCHEDULES: BellSchedule[] = [
  HIGH_SCHOOL_SCHEDULE,
  ...Object.values(MS_SCHEDULES_BY_GRADE),
];

/**
 * Get periods for a specific day of the week from a bell schedule
 */
export function getPeriodsForDay(
  schedule: BellSchedule,
  dayOfWeek: number
): BellPeriod[] {
  for (const daySchedule of schedule.schedules) {
    if (daySchedule.days.includes(dayOfWeek)) {
      return daySchedule.periods;
    }
  }
  return []; // No schedule found for this day
}

/**
 * Get the appropriate bell schedule for a student based on their grade
 */
export function getBellScheduleForGrade(grade: string): BellSchedule | null {
  return (
    ALL_SCHEDULES.find((schedule) => schedule.grades.includes(grade)) || null
  );
}

/**
 * Get the appropriate bell schedule for a student object
 */
export function getBellScheduleForStudent(student: any): BellSchedule | null {
  if (!student?.grades || student.grades.length === 0) {
    return null;
  }

  // Use the first grade if multiple grades exist
  const primaryGrade = student.grades[0];
  return getBellScheduleForGrade(primaryGrade);
}

/**
 * STEP 1: Parse Aspen's period strings into readable schedule JSON
 * Takes raw SIS data and returns a clean day-by-day schedule map
 *
 * Middle School periods name a numbered slot and the days it meets, e.g.
 * "BLOCK 3(Mon-Tues) BLOCK 6(Thur-Fri)", plus named periods like
 * "Adv(Mon-Tues,Thur-Fri)", "WIN(...)", "LUNCH(Mon-Fri)" and "RECESS(...)".
 * High School periods use cycle days instead: "Block 2(D1,D3)".
 *
 * Example output:
 * {
 *   monday: { block_1: ["ELA Honors Gr 7"], block_3: ["Art Gr 7"], adv: ["Advisory Gr 7"], ... },
 *   thursday: { block_4: ["ELA Honors Gr 7"], block_6: ["Art Gr 7"], ... },
 *   ...
 * }
 */
export function parseScheduleFromSIS(
  sisSchedule: any
): Record<string, Record<string, string[]>> {
  const weekSchedule: Record<string, Record<string, string[]>> = {
    monday: {},
    tuesday: {},
    wednesday: {},
    thursday: {},
    friday: {},
  };

  if (!sisSchedule?.classes) {
    return weekSchedule;
  }

  const dayMap: Record<string, string> = {
    Mon: "monday",
    Tues: "tuesday",
    Wed: "wednesday",
    Thur: "thursday",
    Fri: "friday",
  };

  // Helper: expand strings like "Mon-Tues,Thur-Fri" to ["monday","tuesday","thursday","friday"]
  const expandDays = (daysExpr: string): string[] => {
    const order = ["Mon", "Tues", "Wed", "Thur", "Fri"];
    const out: string[] = [];
    if (!daysExpr) return out;
    // Split on commas first (e.g., "Mon-Tues,Thur-Fri" or "Mon,Wed,Fri")
    const parts = daysExpr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      if (part.includes("-")) {
        const [startRaw, endRaw] = part.split("-").map((p) => p.trim());
        const startIdx = order.indexOf(startRaw as any);
        const endIdx = order.indexOf(endRaw as any);
        if (startIdx !== -1 && endIdx !== -1) {
          for (let i = startIdx; i <= endIdx; i++) {
            const full = dayMap[order[i]];
            if (full) out.push(full);
          }
        }
      } else {
        const full = dayMap[part as any];
        if (full) out.push(full);
      }
    }
    return out;
  };

  const className = (cls: any): string =>
    cls.title || cls.courseName || "Unknown Class";

  // A slot can hold more than one class across the year: Art/Challenge/Health,
  // for instance, rotate through the same block in different terms. Keep them
  // all rather than letting the last one win.
  const addClass = (day: string, periodId: string, cls: any) => {
    const titles = (weekSchedule[day][periodId] ||= []);
    const title = className(cls);
    if (!titles.includes(title)) titles.push(title);
  };

  // Named (non-class) periods Aspen reports alongside the numbered blocks.
  const namedPeriods: Record<string, string> = {
    Adv: "adv",
    WIN: "win",
    LUNCH: "lunch",
    RECESS: "recess",
    "L/R": "l_r", // legacy: pre-2026 combined lunch/recess
  };

  // Process each class
  for (const cls of sisSchedule.classes) {
    if (!cls.periods || cls.periods.length === 0) continue;

    for (const periodString of cls.periods) {
      // Always attempt to match all relevant patterns that may coexist within the string

      // 1) Middle School numbered blocks, e.g. "BLOCK 3(Mon-Tues) BLOCK 6(Thur-Fri)".
      // The number is the slot's position in that day's bell schedule.
      const msBlockMatches =
        periodString.match(/BLOCK (\d+)\(([^)]+)\)/g) || [];
      for (const blockMatch of msBlockMatches) {
        const match = blockMatch.match(/BLOCK (\d+)\(([^)]+)\)/);
        if (!match) continue;
        const slot = match[1];
        const days = expandDays(match[2]);
        for (const fullDay of days) {
          addClass(fullDay, `block_${slot}`, cls);
        }
      }

      // 2) Middle School named periods with weekday lists/ranges,
      // e.g. "Adv(Mon-Tues,Thur-Fri)" or "LUNCH(Mon-Fri)".
      for (const [label, periodId] of Object.entries(namedPeriods)) {
        const escaped = label.replace(/\//g, "\\/");
        const matches =
          periodString.match(new RegExp(`\\b${escaped}\\(([^)]+)\\)`, "g")) || [];
        for (const m of matches) {
          const mm = m.match(new RegExp(`\\b${escaped}\\(([^)]+)\\)`));
          if (!mm) continue;
          for (const fullDay of expandDays(mm[1])) {
            addClass(fullDay, periodId, cls);
          }
        }
      }

      // 3) High School "Block n(Dx)" style
      const hsBlockMatches =
        periodString.match(/Block (\d+)\(([^)]+)\)/g) || [];
      if (hsBlockMatches.length) {
        const cycleToDay: Record<string, string> = {
          D1: "monday",
          D2: "tuesday",
          D3: "wednesday",
          D4: "thursday",
          D5: "friday",
        };
        for (const blockMatch of hsBlockMatches) {
          const match = blockMatch.match(/Block (\d+)\(([^)]+)\)/);
          if (!match) continue;
          const blockNum = match[1];
          const cycleDaysString = match[2];
          const cycleDays = cycleDaysString.split(",").map((d) => d.trim());
          for (const cycleDay of cycleDays) {
            const weekDay = cycleToDay[cycleDay];
            if (weekDay) {
              addClass(weekDay, `block_${blockNum}`, cls);
            }
          }
        }
      }

      // 4) High School "Adv/L n(Dx-Dy,...)" style
      const advLunchMatches =
        periodString.match(/(Adv\/L \d+)\(([^)]+)\)/g) || [];
      for (const advMatch of advLunchMatches) {
        const match = advMatch.match(/(Adv\/L \d+)\(([^)]+)\)/);
        if (!match) continue;
        const periodName = match[1].toLowerCase().replace(/[\/\s]+/g, "_"); // e.g., adv_l_1
        const cycleDaysString = match[2];
        const cycleToDay: Record<string, string> = {
          D1: "monday",
          D2: "tuesday",
          D3: "wednesday",
          D4: "thursday",
          D5: "friday",
        };
        const parts = cycleDaysString.split(",");
        for (const part of parts) {
          if (part.includes("-")) {
            const [start, end] = part.split("-").map((p) => p.trim());
            const startNum = parseInt(start.replace("D", ""));
            const endNum = parseInt(end.replace("D", ""));
            for (let i = startNum; i <= endNum; i++) {
              const weekDay = cycleToDay[`D${i}`];
              if (weekDay) {
                addClass(weekDay, periodName, cls);
              }
            }
          } else {
            const weekDay = cycleToDay[part.trim()];
            if (weekDay) {
              addClass(weekDay, periodName, cls);
            }
          }
        }
      }
    }
  }

  return weekSchedule;
}

/**
 * STEP 2: Get the appropriate bell schedule for a student on a specific day
 * This is where the mind-numbing logic lives!
 */
export function getBellScheduleForStudentDay(
  student: any,
  dayOfWeek: number, // 0=Sunday, 1=Monday, etc.
  scheduleMap?: Record<string, Record<string, string>>
): BellSchedule | null {
  if (!student?.grades || student.grades.length === 0) {
    return null;
  }

  const grade = student.grades[0];

  // High school uses standard scheduling
  if (["09", "10", "11", "12"].includes(grade)) {
    return HIGH_SCHOOL_SCHEDULE;
  }

  // Middle school: each grade has its own schedule, and that schedule already
  // carries the right periods for each day (Wednesday included).
  return getMSBellSchedule(grade);
}

/**
 * Parse time string (e.g. "08:05") into hours and minutes for comparison
 */
export function parseTimeString(timeStr: string): {
  hours: number;
  minutes: number;
} {
  const [time, period] = timeStr.split(" ");
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Get the current period based on current time and bell schedule
 */
export function getCurrentPeriod(
  schedule: BellSchedule,
  now: Date = new Date()
): BellPeriod | null {
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const dayOfWeek = now.getDay();

  const periodsForToday = getPeriodsForDay(schedule, dayOfWeek);

  for (const period of periodsForToday) {
    const startTime = parseTimeString(period.startTime);
    const endTime = parseTimeString(period.endTime);
    const startTotalMinutes = startTime.hours * 60 + startTime.minutes;
    const endTotalMinutes = endTime.hours * 60 + endTime.minutes;

    if (
      currentTotalMinutes >= startTotalMinutes &&
      currentTotalMinutes < endTotalMinutes
    ) {
      return period;
    }
  }

  return null; // Not currently in any period
}

