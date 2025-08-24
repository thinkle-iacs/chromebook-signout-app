// Structured schedule data types for frontend consumption
import {
  getBellScheduleForStudent,
  getBellScheduleForStudentDay,
  parseProjectScheduleFromSIS,
  mapSISPeriodToBellPeriod,
  parseTimeString,
  getPeriodsForDay,
} from "./bellSchedules";
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
  const scheduleMap = parseProjectScheduleFromSIS(sisSchedule);

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
      const blockId = bellPeriod.id; // e.g. "block_a", "adv", "win", "l_r"

      // Try multiple key formats to find the class
      let className = daySchedule[blockId]; // Try exact match first

      if (!className) {
        // Try uppercase format: "block_a" -> "BLOCK_A"
        const upperKey = blockId.replace("block_", "BLOCK_").toUpperCase();
        className = daySchedule[upperKey];
      }

      if (!className) {
        // Try without prefix: "block_a" -> "A"
        const letterOnly = blockId.replace("block_", "").toUpperCase();
        className = daySchedule[letterOnly];
      }

      if (className) {
        // Find the full class details from SIS data
        const classDetails = findClassByName(
          sisSchedule.classes || [],
          className
        );

        blocks.push({
          start: formatTime(bellPeriod.startTime),
          end: formatTime(bellPeriod.endTime),
          class: className,
          room: classDetails?.location || "",
          isFree: isFreeTimeClass({
            title: className,
            subjects: classDetails?.subjects,
          }),
          blockName: bellPeriod.displayName,
          teachers: classDetails?.teachers || [],
          subject:
            classDetails?.subjects?.[0] || getSubjectFromClassName(className),
        });
      } else {
        // No class mapped for this block on this day - check if it's a structural period
        if (blockId === "adv") {
          blocks.push({
            start: formatTime(bellPeriod.startTime),
            end: formatTime(bellPeriod.endTime),
            class: "Advisory",
            room: "",
            isFree: true,
            blockName: bellPeriod.displayName,
            subject: "N/A",
          });
        } else if (blockId === "l_r") {
          blocks.push({
            start: formatTime(bellPeriod.startTime),
            end: formatTime(bellPeriod.endTime),
            class: "Lunch/Recess",
            room: "",
            isFree: true,
            blockName: bellPeriod.displayName,
            subject: "N/A",
          });
        } else if (blockId === "win") {
          blocks.push({
            start: formatTime(bellPeriod.startTime),
            end: formatTime(bellPeriod.endTime),
            class: "WIN",
            room: "",
            isFree: true,
            blockName: bellPeriod.displayName,
            subject: "N/A",
          });
        } else if (
          !bellPeriod.id.includes("lunch") &&
          !bellPeriod.id.includes("l_r") &&
          !bellPeriod.id.includes("win")
        ) {
          // Only add free periods for actual class blocks
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
