// Structured schedule data types for frontend consumption
import {
  getBellScheduleForStudentDay,
  parseScheduleFromSIS,
  getPeriodsForDay,
} from "./bellSchedules";
import { STRUCTURAL_PERIOD_IDS } from "./msSchedules";
import type {
  ScheduleBlock,
  StructuredDaySchedule,
  StructuredSchedule,
  BellSchedule,
  SISSchedule,
} from "./types";

export type { ScheduleBlock, StructuredDaySchedule, StructuredSchedule };

/**
 * Convert SIS schedule data into structured format for frontend
 */
export function buildStructuredSchedule(
  student: any,
  sisSchedule: SISSchedule
): StructuredDaySchedule[] {
  // STEP 1: Parse SIS schedule into day-by-day mapping
  const scheduleMap = parseScheduleFromSIS(sisSchedule);

  // Create schedule for each weekday (1-5 = Mon-Fri)
  const weekSchedule: StructuredDaySchedule[] = [];

  for (let weekday = 1; weekday <= 5; weekday++) {
    const dayName = getDayName(weekday);
    const blocks: ScheduleBlock[] = [];

    // STEP 2: Get the bell schedule for this specific day
    const bellSchedule = getBellScheduleForStudentDay(
      student,
      weekday,
      scheduleMap
    );

    if (!bellSchedule) {
      continue; // Skip days without bell schedules
    }

    // Get the periods for this specific weekday
    const periodsForThisDay = getPeriodsForDay(bellSchedule, weekday);
    const daySchedule = scheduleMap[dayName] || {};

    // For each bell schedule period, map the specific class for that day
    for (const bellPeriod of periodsForThisDay) {
      const blockId = bellPeriod.id; // e.g. "block_3", "adv", "win", "lunch"

      // Aspen's period ids and our bell period ids use the same vocabulary,
      // so the classes for this block are a direct lookup.
      const classNames = daySchedule[blockId] || [];
      // Classes that rotate through a block by term are shown together.
      const className = classNames.join(" / ");

      if (classNames.length) {
        // Find the full class details from SIS data
        const classDetails = findClassByName(
          sisSchedule.classes || [],
          classNames[0]
        );

        blocks.push({
          start: formatTime(bellPeriod.startTime),
          end: formatTime(bellPeriod.endTime),
          class: className,
          room: classDetails?.location || "",
          isFree: classNames.every((title) =>
            isFreeTimeClass({
              title,
              subjects: findClassByName(sisSchedule.classes || [], title)
                ?.subjects,
            })
          ),
          blockName: bellPeriod.displayName,
          teachers: classDetails?.teachers || [],
          subject:
            classDetails?.subjects?.[0] ||
            getSubjectFromClassName(classNames[0]),
        });
      } else if (STRUCTURAL_PERIOD_IDS.includes(blockId) || blockId === "l_r") {
        // Part of the day's structure (advisory, WIN, lunch, recess, brunch)
        // that Aspen didn't roster this student into by name.
        blocks.push({
          start: formatTime(bellPeriod.startTime),
          end: formatTime(bellPeriod.endTime),
          class: bellPeriod.displayName,
          room: "",
          isFree: true,
          blockName: bellPeriod.displayName,
          subject: "N/A",
        });
      } else {
        // An actual class block with nothing scheduled in it
        blocks.push({
          start: formatTime(bellPeriod.startTime),
          end: formatTime(bellPeriod.endTime),
          class: "Free Period",
          room: "",
          isFree: true,
          blockName: bellPeriod.displayName,
          subject: "Free",
        });
      }
    }

    weekSchedule.push({
      weekday,
      blocks: blocks.sort((a, b) => compareTimeStrings(a.start, b.start)),
    });
  }

  return weekSchedule;
}

/**
 * Find a class by its name/title in the SIS classes array
 */
function findClassByName(classes: any[], className: string): any | null {
  return classes.find((cls) => cls.title === className) || null;
}

/**
 * Extract subject from class name when class details aren't available
 */
function getSubjectFromClassName(className: string): string {
  const lowerName = className.toLowerCase();

  if (lowerName.includes("math")) return "Math";
  if (lowerName.includes("science")) return "Science";
  if (lowerName.includes("social studies") || lowerName.includes("history"))
    return "Social Studies";
  if (lowerName.includes("ela") || lowerName.includes("english"))
    return "English";
  if (lowerName.includes("art")) return "Art";
  if (lowerName.includes("music")) return "Music";
  if (lowerName.includes("pe") || lowerName.includes("challenge")) return "PE";
  if (lowerName.includes("health")) return "Health and Wellness";
  if (lowerName.includes("project")) {
    if (lowerName.includes("science")) return "Science";
    if (lowerName.includes("social")) return "Social Studies";
    return "Project";
  }
  if (lowerName.includes("advisory")) return "N/A";
  if (lowerName.includes("enrichment")) return "N/A";
  if (lowerName.includes("iacs")) return "Interdisciplinary";

  return "Unknown";
}

/**
 * Find classes that meet on a specific day during a specific bell period
 * DEPRECATED - replaced with direct schedule map lookup
 */
function findClassesForDayAndPeriod(
  classes: any[],
  dayName: string,
  bellPeriod: any,
  bellSchedule: any
): any[] {
  // This function is now deprecated but kept for compatibility
  return [];
}

/**
 * Check if a class meets on the specified day
 */
function classMetesOnDay(periodString: string, dayName: string): boolean {
  const dayAbbreviations: { [key: string]: string } = {
    monday: "Mon",
    tuesday: "Tues",
    wednesday: "Wed",
    thursday: "Thur",
    friday: "Fri",
  };

  const dayAbbr = dayAbbreviations[dayName.toLowerCase()];
  if (!dayAbbr) return false;

  return periodString.includes(dayAbbr);
}

/**
 * Get day name from weekday number
 */
function getDayName(weekday: number): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[weekday] || "";
}

/**
 * Check if a class represents "free time"
 */
function isFreeTimeClass(classInfo: any): boolean {
  const freeTimeIndicators = [
    /lunch/i,
    /win\s*block/i,
    /advisory/i,
    /enrichment/i,
    /study\s*hall/i,
    /free/i,
    /break/i,
  ];

  return freeTimeIndicators.some(
    (pattern) =>
      pattern.test(classInfo.title) ||
      pattern.test(classInfo.subjects?.join(" ") || "")
  );
}

/**
 * Format time from "8:05 AM" to "8:05"
 */
function formatTime(timeString: string): string {
  const [time] = timeString.split(" ");
  return time;
}

/**
 * Compare two time strings for sorting
 */
function compareTimeStrings(time1: string, time2: string): number {
  const [hours1, minutes1] = time1.split(":").map(Number);
  const [hours2, minutes2] = time2.split(":").map(Number);

  const total1 = hours1 * 60 + minutes1;
  const total2 = hours2 * 60 + minutes2;

  return total1 - total2;
}
