// Simple debugging script to check what's happening
import {
  parseProjectScheduleFromSIS,
  getBellScheduleForStudentDay,
} from "./bellSchedules";
import { test56schedule } from "./scheduleSampleData";

const { student, schedule } = test56schedule;

console.log("=== DEBUGGING SCHEDULE PARSING ===\n");

// Step 1: Parse schedule map
console.log("1. Parsing SIS data...");
const scheduleMap = parseProjectScheduleFromSIS(schedule);
console.log("Schedule Map:");
for (const [day, classes] of Object.entries(scheduleMap)) {
  console.log(`  ${day}:`);
  for (const [block, className] of Object.entries(classes)) {
    console.log(`    ${block} -> ${className}`);
  }
}

console.log("\n2. Getting bell schedules...");
const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday"];
for (let weekday = 1; weekday <= 5; weekday++) {
  const dayName = dayNames[weekday - 1];
  const bellSchedule = getBellScheduleForStudentDay(
    student,
    weekday,
    scheduleMap
  );
  console.log(`  ${dayName}: ${bellSchedule?.name || "NO SCHEDULE"}`);

  if (bellSchedule) {
    console.log("    Bell periods:");
    for (const period of bellSchedule.schedules[0].periods) {
      console.log(`      ${period.id} (${period.displayName})`);
    }

    console.log("    Mapped classes:");
    const daySchedule = scheduleMap[dayName] || {};
    for (const [blockId, className] of Object.entries(daySchedule)) {
      console.log(`      ${blockId} -> ${className}`);
    }

    console.log("    Matches:");
    for (const period of bellSchedule.schedules[0].periods) {
      const className = daySchedule[period.id];
      console.log(`      ${period.id} -> ${className || "NO CLASS"}`);
    }
  }
  console.log("");
}

export {};
