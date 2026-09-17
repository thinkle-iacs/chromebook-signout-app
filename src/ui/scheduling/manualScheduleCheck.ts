import { buildStructuredSchedule } from "./structuredSchedule";
import {
  parseScheduleFromSIS,
  getBellScheduleForStudentDay,
} from "./bellSchedules";
import { test56schedule } from "./scheduleSampleData";

/**
 * Quick unit test you can run to debug schedule parsing
 * Run with: npx ts-node src/ui/scheduling/manualScheduleCheck.ts
 */
function runScheduleTest() {
  console.log("🧪 Testing Schedule Parsing...\n");

  const { student, schedule } = test56schedule;

  console.log(
    "👤 Student:",
    student.givenName,
    student.familyName,
    "Grade:",
    student.grades[0]
  );
  console.log("");

  // Step 1: Parse SIS data
  console.log("📅 STEP 1: Parsing SIS data...");
  const scheduleMap = parseScheduleFromSIS(schedule);

  for (const [day, classes] of Object.entries(scheduleMap)) {
    console.log(`  ${day}:`, Object.keys(classes).length, "blocks");
    for (const [block, className] of Object.entries(classes)) {
      const isProject = className.toLowerCase().includes("project");
      console.log(`    ${block}: ${className} ${isProject ? "🔬" : ""}`);
    }
  }
  console.log("");

  // Step 2: Get bell schedules
  console.log("🔔 STEP 2: Bell schedule selection...");
  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  for (let weekday = 1; weekday <= 5; weekday++) {
    const dayName = dayNames[weekday - 1];
    const bellSchedule = getBellScheduleForStudentDay(
      student,
      weekday,
      scheduleMap
    );
    console.log(`  ${dayName}: ${bellSchedule?.name || "NONE"}`);
  }
  console.log("");

  // Step 3: Build final schedule
  console.log("📋 STEP 3: Building final schedule...");
  const structuredResult = buildStructuredSchedule(student, schedule);

  for (const day of structuredResult) {
    const dayName = dayNames[day.weekday - 1];
    console.log(`  ${dayName}: ${day.blocks.length} blocks`);

    // Check for duplicates
    const timeBlocks = new Map<string, string[]>();
    for (const block of day.blocks) {
      const timeKey = `${block.start}-${block.end}`;
      if (!timeBlocks.has(timeKey)) timeBlocks.set(timeKey, []);
      timeBlocks.get(timeKey)!.push(block.class);
    }

    for (const [time, classes] of timeBlocks.entries()) {
      if (classes.length > 1) {
        console.log(`    ⚠️  OVERLAP at ${time}: ${classes.join(", ")}`);
      } else {
        console.log(`    ✅ ${time}: ${classes[0]}`);
      }
    }
  }

  console.log("\n✨ Test complete!");
}

// Run the test if this file is executed directly
if (require.main === module) {
  runScheduleTest();
}

export { runScheduleTest };
