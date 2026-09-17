// Middle School bell schedules, 2026-2027.
//
// Ported from the IACS start page extension (svelte/src/Schedule/ms_schedule.ts),
// which is the source of truth staff and students see day to day.
//
// Structure of the year:
//   - Mon/Tue/Thu/Fri share the same times for all MS grades, except for the
//     WIN/Lunch/Recess stretch in the middle of the day, which is per-grade.
//   - Six class slots per day. Aspen numbers the slots 1-6; the school calls
//     them by letter, and the letters rotate: Mon/Tue run A-F, Thu/Fri run
//     D,E,F,A,B,C. So "BLOCK 3(Mon-Tues) BLOCK 6(Thur-Fri)" is Block C twice.
//   - Wednesday is a shorter, entirely grade-specific day with five slots,
//     numbered 1-5 with no letters, and a Brunch instead of lunch/recess.
//
// Period ids match what Aspen sends us ("block_1".."block_6", plus the named
// periods "adv", "win", "lunch", "recess", "brunch") so parsed classes map onto
// bell periods by id alone.
import type { BellPeriod, BellSchedule, DaySchedule } from "./types";

export type MSGrade = "05" | "06" | "07" | "08";

export const MS_GRADES: MSGrade[] = ["05", "06", "07", "08"];

export function isMiddleSchoolGrade(grade: string): grade is MSGrade {
  return (MS_GRADES as string[]).includes(grade);
}

function minutesBetween(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function period(
  id: string,
  displayName: string,
  startTime: string,
  endTime: string
): BellPeriod {
  return {
    id,
    name: displayName,
    displayName,
    startTime,
    endTime,
    durationMinutes: minutesBetween(startTime, endTime),
  };
}

// Block letters by slot number (1-6), for the two day rotations.
const MON_TUE_LETTERS = "ABCDEF";
const THU_FRI_LETTERS = "DEFABC";

// The WIN/Lunch/Recess stretch (11:03-12:18) on Mon/Tue/Thu/Fri, by grade.
function middleOfDay(grade: MSGrade): BellPeriod[] {
  switch (grade) {
    case "05":
      return [
        period("lunch", "Lunch", "11:03", "11:23"),
        period("recess", "Recess", "11:23", "11:40"),
        period("win", "WIN", "11:41", "12:18"),
      ];
    case "06":
      return [
        period("recess", "Recess", "11:03", "11:20"),
        period("lunch", "Lunch", "11:20", "11:40"),
        period("win", "WIN", "11:41", "12:18"),
      ];
    case "07":
      return [
        period("win", "WIN", "11:03", "11:40"),
        period("lunch", "Lunch", "11:41", "12:01"),
        period("recess", "Recess", "12:01", "12:18"),
      ];
    case "08":
      return [
        period("win", "WIN", "11:03", "11:40"),
        period("recess", "Recess", "11:41", "11:58"),
        period("lunch", "Lunch", "11:58", "12:18"),
      ];
  }
}

// Mon/Tue/Thu/Fri: advisory, three slots, the WIN/Lunch/Recess stretch, three slots.
function standardDay(grade: MSGrade, letters: string): BellPeriod[] {
  const slot = (n: number, startTime: string, endTime: string) =>
    period(`block_${n}`, `Block ${letters[n - 1]}`, startTime, endTime);

  return [
    period("adv", "Advisory", "08:05", "08:35"),
    slot(1, "08:36", "09:24"),
    slot(2, "09:25", "10:13"),
    slot(3, "10:14", "11:02"),
    ...middleOfDay(grade),
    slot(4, "12:19", "13:07"),
    slot(5, "13:08", "13:56"),
    slot(6, "13:57", "14:45"),
  ];
}

// Wednesday, by grade. Grades 5-6 take Enrichment in slot 4, grades 7-8 in slot 1,
// and Brunch lands in a different place for each grade.
function wednesday(grade: MSGrade): BellPeriod[] {
  switch (grade) {
    case "05":
      return [
        period("block_1", "Block 1", "08:05", "08:53"),
        period("block_2", "Block 2", "08:55", "09:43"),
        period("brunch", "Brunch", "09:45", "10:05"),
        period("block_3", "Block 3", "10:05", "10:52"),
        period("block_4", "Block 4", "10:53", "11:58"),
        period("block_5", "Block 5", "12:02", "12:45"),
      ];
    case "06":
      return [
        period("block_1", "Block 1", "08:05", "08:53"),
        period("block_2", "Block 2", "08:55", "09:43"),
        period("block_3", "Block 3", "09:45", "10:32"),
        period("brunch", "Brunch", "10:32", "10:52"),
        period("block_4", "Block 4", "10:53", "11:58"),
        period("block_5", "Block 5", "12:02", "12:45"),
      ];
    case "07":
      return [
        period("block_1", "Block 1", "08:05", "09:10"),
        period("block_2", "Block 2", "09:12", "10:00"),
        period("block_3", "Block 3", "10:02", "10:51"),
        period("brunch", "Brunch", "10:53", "11:13"),
        period("block_4", "Block 4", "11:13", "12:00"),
        period("block_5", "Block 5", "12:02", "12:45"),
      ];
    case "08":
      return [
        period("block_1", "Block 1", "08:05", "09:10"),
        period("block_2", "Block 2", "09:12", "10:00"),
        period("block_3", "Block 3", "10:02", "10:51"),
        period("block_4", "Block 4", "10:53", "11:40"),
        period("brunch", "Brunch", "11:40", "12:00"),
        period("block_5", "Block 5", "12:02", "12:45"),
      ];
  }
}

export function makeMSBellSchedule(grade: MSGrade): BellSchedule {
  const schedules: DaySchedule[] = [
    { days: [1, 2], periods: standardDay(grade, MON_TUE_LETTERS) },
    { days: [3], periods: wednesday(grade) },
    { days: [4, 5], periods: standardDay(grade, THU_FRI_LETTERS) },
  ];

  return {
    name: `ms_grade_${grade}`,
    description: `Middle School Bell Schedule 2026-2027 (Grade ${grade})`,
    grades: [grade],
    schedules,
  };
}

export const MS_SCHEDULES_BY_GRADE: Record<MSGrade, BellSchedule> = {
  "05": makeMSBellSchedule("05"),
  "06": makeMSBellSchedule("06"),
  "07": makeMSBellSchedule("07"),
  "08": makeMSBellSchedule("08"),
};

export function getMSBellSchedule(grade: string): BellSchedule | null {
  return isMiddleSchoolGrade(grade) ? MS_SCHEDULES_BY_GRADE[grade] : null;
}

// Periods that are part of the day's structure rather than a scheduled class.
export const STRUCTURAL_PERIOD_IDS = ["adv", "win", "lunch", "recess", "brunch"];
