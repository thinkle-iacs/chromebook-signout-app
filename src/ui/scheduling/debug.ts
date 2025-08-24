// Simple debugging script to check what's happening
import {
  parseProjectScheduleFromSIS,
  getBellScheduleForStudentDay,
} from "./bellSchedules";
import { test56schedule } from "./scheduleSampleData";
import { logger } from "@utils/log";
const { student, schedule } = test56schedule;

logger.logPriority("=== DEBUGGING SCHEDULE PARSING ===\n");

// Step 1: Parse schedule map
logger.logPriority("1. Parsing SIS data...");
const scheduleMap = parseProjectScheduleFromSIS(schedule);
logger.logPriority("Schedule Map:");
for (const [day, classes] of Object.entries(scheduleMap)) {
  logger.logPriority(`  ${day}:`);
  for (const [block, className] of Object.entries(classes)) {
    logger.logPriority(`    ${block} -> ${className}`);
  }
}

logger.logPriority("\n2. Getting bell schedules...");
const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday"];
for (let weekday = 1; weekday <= 5; weekday++) {
  const dayName = dayNames[weekday - 1];
  const bellSchedule = getBellScheduleForStudentDay(
    student,
    weekday,
    scheduleMap
  );
  logger.logPriority(`  ${dayName}: ${bellSchedule?.name || "NO SCHEDULE"}`);

  if (bellSchedule) {
    logger.logPriority("    Bell periods:");
    for (const period of bellSchedule.schedules[0].periods) {
      logger.logPriority(`      ${period.id} (${period.displayName})`);
    }

    logger.logPriority("    Mapped classes:");
    const daySchedule = scheduleMap[dayName] || {};
    for (const [blockId, className] of Object.entries(daySchedule)) {
      logger.logPriority(`      ${blockId} -> ${className}`);
    }

    logger.logPriority("    Matches:");
    for (const period of bellSchedule.schedules[0].periods) {
      const className = daySchedule[period.id];
      logger.logPriority(`      ${period.id} -> ${className || "NO CLASS"}`);
    }
  }
  logger.logPriority("");
}

export {};
