// Bell schedule definitions for different grade levels
// These are updated annually but can be hard-coded since they don't change frequently

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

// Example bell schedule based on your data
export const MIDDLE_SCHOOL_SCHEDULE: BellSchedule = {
  name: "middle_school",
  description: "Middle School Bell Schedule (Grades 5-8)",
  grades: ["05", "06", "07", "08"],
  schedules: [
    {
      days: [1, 2, 3, 4, 5], // Monday through Friday - same schedule every day for now
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
          id: "adv_lunch_1",
          name: "Adv/L 1",
          displayName: "Advisory/Lunch 1",
          startTime: "12:30",
          endTime: "12:54",
          durationMinutes: 24,
        },
        {
          id: "adv_lunch_2",
          name: "Adv/L 2",
          displayName: "Advisory/Lunch 2",
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

// Project-based schedule variants - different blocks for different days
export const MS_PROJECT_SCHEDULE_A: BellSchedule = {
  name: "ms_project_a",
  description: "Grade 7 Project Schedule - Block A Focus",
  grades: ["07"],
  schedules: [
    {
      days: [1, 2, 3, 4, 5],
      periods: [
        {
          id: "adv",
          name: "Adv",
          displayName: "Advisory",
          startTime: "08:05",
          endTime: "08:35",
          durationMinutes: 30,
        },
        {
          id: "block_a",
          name: "BLOCK A",
          displayName: "Block A",
          startTime: "08:36",
          endTime: "10:03",
          durationMinutes: 87,
        },
        {
          id: "block_b",
          name: "BLOCK B",
          displayName: "Block B",
          startTime: "10:04",
          endTime: "11:02",
          durationMinutes: 58,
        },
        {
          id: "win",
          name: "WIN",
          displayName: "WIN",
          startTime: "11:03",
          endTime: "11:40",
          durationMinutes: 37,
        },
        {
          id: "l_r",
          name: "L/R",
          displayName: "Lunch/Recess",
          startTime: "11:41",
          endTime: "12:18",
          durationMinutes: 37,
        },
        {
          id: "block_c",
          name: "BLOCK C",
          displayName: "Block C",
          startTime: "12:19",
          endTime: "13:07",
          durationMinutes: 48,
        },
        {
          id: "block_d",
          name: "BLOCK D",
          displayName: "Block D",
          startTime: "13:08",
          endTime: "13:56",
          durationMinutes: 48,
        },
        {
          id: "block_e",
          name: "BLOCK E",
          displayName: "Block E",
          startTime: "13:57",
          endTime: "14:45",
          durationMinutes: 48,
        },
      ],
    },
  ],
};

// Wednesday special schedules (grade-specific overrides)
export const MS_WEDNESDAY_GR56: BellSchedule = {
  name: "ms_wednesday_gr56",
  description: "Wednesday Schedule for Grades 5-6",
  grades: ["05", "06"],
  schedules: [
    {
      days: [3], // Wednesday only
      periods: [
        {
          id: "adv",
          name: "Adv",
          displayName: "Advisory",
          startTime: "08:05",
          endTime: "08:35",
          durationMinutes: 30,
        },
        {
          id: "block_a",
          name: "BLOCK A",
          displayName: "Block A",
          startTime: "08:36",
          endTime: "09:24",
          durationMinutes: 48,
        },
        {
          id: "block_b",
          name: "BLOCK B",
          displayName: "Block B",
          startTime: "09:25",
          endTime: "10:13",
          durationMinutes: 48,
        },
        {
          id: "block_c",
          name: "BLOCK C",
          displayName: "Block C",
          startTime: "10:14",
          endTime: "11:02",
          durationMinutes: 48,
        },
        {
          id: "l_r",
          name: "L/R",
          displayName: "Lunch/Recess",
          startTime: "11:03",
          endTime: "11:40",
          durationMinutes: 37,
        },
        {
          id: "win",
          name: "WIN",
          displayName: "WIN",
          startTime: "11:41",
          endTime: "12:18",
          durationMinutes: 37,
        },
        {
          id: "block_d",
          name: "BLOCK D",
          displayName: "Block D",
          startTime: "12:19",
          endTime: "13:07",
          durationMinutes: 48,
        },
        {
          id: "block_e",
          name: "BLOCK E",
          displayName: "Block E",
          startTime: "13:08",
          endTime: "14:45",
          durationMinutes: 97,
        },
      ],
    },
  ],
};

export const MS_WEDNESDAY_GR78: BellSchedule = {
  name: "ms_wednesday_gr78",
  description: "Wednesday Schedule for Grades 7-8",
  grades: ["07", "08"],
  schedules: [
    {
      days: [3], // Wednesday only
      periods: [
        {
          id: "adv",
          name: "Adv",
          displayName: "Advisory",
          startTime: "08:05",
          endTime: "08:35",
          durationMinutes: 30,
        },
        {
          id: "block_a",
          name: "BLOCK A",
          displayName: "Block A",
          startTime: "08:36",
          endTime: "09:24",
          durationMinutes: 48,
        },
        {
          id: "block_b",
          name: "BLOCK B",
          displayName: "Block B",
          startTime: "09:25",
          endTime: "10:13",
          durationMinutes: 48,
        },
        {
          id: "block_c",
          name: "BLOCK C",
          displayName: "Block C",
          startTime: "10:14",
          endTime: "11:02",
          durationMinutes: 48,
        },
        {
          id: "win",
          name: "WIN",
          displayName: "WIN",
          startTime: "11:03",
          endTime: "11:40",
          durationMinutes: 37,
        },
        {
          id: "l_r",
          name: "L/R",
          displayName: "Lunch/Recess",
          startTime: "11:41",
          endTime: "12:18",
          durationMinutes: 37,
        },
        {
          id: "block_d",
          name: "BLOCK D",
          displayName: "Block D",
          startTime: "12:19",
          endTime: "13:07",
          durationMinutes: 48,
        },
        {
          id: "block_e",
          name: "BLOCK E",
          displayName: "Block E",
          startTime: "13:08",
          endTime: "14:45",
          durationMinutes: 97,
        },
      ],
    },
  ],
};

export const MS_PROJECT_SCHEDULE_B: BellSchedule = {
  name: "ms_project_b",
  description: "Grade 8 Project Schedule - Block B Focus",
  grades: ["08"],
  schedules: [
    {
      days: [1, 2, 3, 4, 5],
      periods: [
        {
          id: "adv",
          name: "Adv",
          displayName: "Advisory",
          startTime: "08:05",
          endTime: "08:35",
          durationMinutes: 30,
        },
        {
          id: "block_a",
          name: "BLOCK A",
          displayName: "Block A",
          startTime: "08:36",
          endTime: "09:34",
          durationMinutes: 58,
        },
        {
          id: "block_b",
          name: "BLOCK B",
          displayName: "Block B",
          startTime: "09:35",
          endTime: "11:02",
          durationMinutes: 87,
        },
        {
          id: "win",
          name: "WIN",
          displayName: "WIN",
          startTime: "11:03",
          endTime: "11:40",
          durationMinutes: 37,
        },
        {
          id: "l_r",
          name: "L/R",
          displayName: "Lunch/Recess",
          startTime: "11:41",
          endTime: "12:18",
          durationMinutes: 37,
        },
        {
          id: "block_c",
          name: "BLOCK C",
          displayName: "Block C",
          startTime: "12:19",
          endTime: "13:07",
          durationMinutes: 48,
        },
        {
          id: "block_d",
          name: "BLOCK D",
          displayName: "Block D",
          startTime: "13:08",
          endTime: "13:56",
          durationMinutes: 48,
        },
        {
          id: "block_e",
          name: "BLOCK E",
          displayName: "Block E",
          startTime: "13:57",
          endTime: "14:45",
          durationMinutes: 48,
        },
      ],
    },
  ],
};

export const MS_PROJECT_SCHEDULE_C: BellSchedule = {
  name: "ms_project_c",
  description: "Middle School Project Schedule - Block C Focus",
  grades: ["05", "06", "07", "08"],
  schedules: [
    {
      days: [1, 2, 3, 4, 5],
      periods: [
        {
          id: "block_a",
          name: "Block A",
          displayName: "Block A",
          startTime: "08:05",
          endTime: "09:35",
          durationMinutes: 90,
        },
        {
          id: "block_b",
          name: "Block B",
          displayName: "Block B",
          startTime: "09:45",
          endTime: "11:15",
          durationMinutes: 90,
        },
        {
          id: "lunch",
          name: "Lunch",
          displayName: "Lunch",
          startTime: "11:15",
          endTime: "12:00",
          durationMinutes: 45,
        },
        {
          id: "block_c",
          name: "Block C",
          displayName: "Block C",
          startTime: "12:00",
          endTime: "14:00",
          durationMinutes: 120,
        },
        {
          id: "advisory",
          name: "Advisory",
          displayName: "Advisory",
          startTime: "14:00",
          endTime: "14:45",
          durationMinutes: 45,
        },
      ],
    },
  ],
};

export const MS_PROJECT_SCHEDULE_D: BellSchedule = {
  name: "ms_project_d",
  description: "Grade 7 Project Schedule - Block D Focus",
  grades: ["07"],
  schedules: [
    {
      days: [1, 2, 3, 4, 5],
      periods: [
        {
          id: "adv",
          name: "Adv",
          displayName: "Advisory",
          startTime: "08:05",
          endTime: "08:35",
          durationMinutes: 30,
        },
        {
          id: "block_a",
          name: "BLOCK A",
          displayName: "Block A",
          startTime: "08:36",
          endTime: "09:24",
          durationMinutes: 48,
        },
        {
          id: "block_b",
          name: "BLOCK B",
          displayName: "Block B",
          startTime: "09:25",
          endTime: "10:13",
          durationMinutes: 48,
        },
        {
          id: "block_c",
          name: "BLOCK C",
          displayName: "Block C",
          startTime: "10:14",
          endTime: "11:02",
          durationMinutes: 48,
        },
        {
          id: "win",
          name: "WIN",
          displayName: "WIN",
          startTime: "11:03",
          endTime: "11:40",
          durationMinutes: 37,
        },
        {
          id: "l_r",
          name: "L/R",
          displayName: "Lunch/Recess",
          startTime: "11:41",
          endTime: "12:18",
          durationMinutes: 37,
        },
        {
          id: "block_d",
          name: "BLOCK D",
          displayName: "Block D",
          startTime: "12:19",
          endTime: "13:46",
          durationMinutes: 87,
        },
        {
          id: "block_e",
          name: "BLOCK E",
          displayName: "Block E",
          startTime: "13:47",
          endTime: "14:45",
          durationMinutes: 58,
        },
      ],
    },
  ],
};

export const MS_PROJECT_SCHEDULE_E: BellSchedule = {
  name: "ms_project_e",
  description: "Grade 8 Project Schedule - Block E Focus",
  grades: ["08"],
  schedules: [
    {
      days: [1, 2, 3, 4, 5],
      periods: [
        {
          id: "adv",
          name: "Adv",
          displayName: "Advisory",
          startTime: "08:05",
          endTime: "08:35",
          durationMinutes: 30,
        },
        {
          id: "block_a",
          name: "BLOCK A",
          displayName: "Block A",
          startTime: "08:36",
          endTime: "09:24",
          durationMinutes: 48,
        },
        {
          id: "block_b",
          name: "BLOCK B",
          displayName: "Block B",
          startTime: "09:25",
          endTime: "10:13",
          durationMinutes: 48,
        },
        {
          id: "block_c",
          name: "BLOCK C",
          displayName: "Block C",
          startTime: "10:14",
          endTime: "11:02",
          durationMinutes: 48,
        },
        {
          id: "win",
          name: "WIN",
          displayName: "WIN",
          startTime: "11:03",
          endTime: "11:40",
          durationMinutes: 37,
        },
        {
          id: "l_r",
          name: "L/R",
          displayName: "Lunch/Recess",
          startTime: "11:41",
          endTime: "12:18",
          durationMinutes: 37,
        },
        {
          id: "block_d",
          name: "BLOCK D",
          displayName: "Block D",
          startTime: "12:19",
          endTime: "13:17",
          durationMinutes: 58,
        },
        {
          id: "block_e",
          name: "BLOCK E",
          displayName: "Block E",
          startTime: "13:18",
          endTime: "14:45",
          durationMinutes: 87,
        },
      ],
    },
  ],
};

// High School bell schedule
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
  MIDDLE_SCHOOL_SCHEDULE,
  // Project-based schedules (Monday/Tuesday/Thursday/Friday)
  MS_PROJECT_SCHEDULE_A,
  MS_PROJECT_SCHEDULE_B,
  MS_PROJECT_SCHEDULE_D,
  MS_PROJECT_SCHEDULE_E,
  // Wednesday special schedules
  MS_WEDNESDAY_GR56,
  MS_WEDNESDAY_GR78,
  // Generic/fallback schedules
  MS_PROJECT_SCHEDULE_C,
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
 * STEP 1: Parse Aspen's weird project blocks into readable schedule JSON
 * Takes raw SIS data and returns a clean day-by-day schedule map
 *
 * Example output:
 * {
 *   monday: { block_a: "Science Project", block_b: "Math", ... },
 *   tuesday: { block_a: "Science Project", block_d: "ELA", ... },
 *   ...
 * }
 */
export function parseProjectScheduleFromSIS(
  sisSchedule: any
): Record<string, Record<string, string>> {
  const weekSchedule: Record<string, Record<string, string>> = {
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

  // Process each class
  for (const cls of sisSchedule.classes) {
    if (!cls.periods || cls.periods.length === 0) continue;

    for (const periodString of cls.periods) {
      // Always attempt to match all relevant patterns that may coexist within the string

      // 1) Middle School BLOCK letters, e.g., "BLOCK A(Mon) BLOCK D(Thu)"
      const msBlockMatches =
        periodString.match(/BLOCK ([A-E])\(([^)]+)\)/g) || [];
      for (const blockMatch of msBlockMatches) {
        const match = blockMatch.match(/BLOCK ([A-E])\(([^)]+)\)/);
        if (!match) continue;
        const block = match[1].toLowerCase(); // A -> a
        const daysString = match[2];
        const days = expandDays(daysString);
        for (const fullDay of days) {
          weekSchedule[fullDay][`block_${block}`] =
            cls.title || cls.courseName || "Unknown Class";
        }
      }

      // 2) Plain WIN, Adv, and L/R with weekday lists/ranges (Middle School)
      const winMatches = periodString.match(/\bWIN\(([^)]+)\)/g) || [];
      for (const m of winMatches) {
        const mm = m.match(/\bWIN\(([^)]+)\)/);
        if (!mm) continue;
        const days = expandDays(mm[1]);
        for (const fullDay of days) {
          weekSchedule[fullDay]["win"] =
            cls.title || cls.courseName || "Unknown Class";
        }
      }

      const advPlainMatches = periodString.match(/\bAdv\(([^)]+)\)/g) || [];
      for (const m of advPlainMatches) {
        const mm = m.match(/\bAdv\(([^)]+)\)/);
        if (!mm) continue;
        const days = expandDays(mm[1]);
        for (const fullDay of days) {
          weekSchedule[fullDay]["adv"] =
            cls.title || cls.courseName || "Unknown Class";
        }
      }

      const lrMatches = periodString.match(/L\/R\(([^)]+)\)/g) || [];
      for (const m of lrMatches) {
        const mm = m.match(/L\/R\(([^)]+)\)/);
        if (!mm) continue;
        const days = expandDays(mm[1]);
        for (const fullDay of days) {
          weekSchedule[fullDay]["l_r"] =
            cls.title || cls.courseName || "Unknown Class";
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
              weekSchedule[weekDay][`block_${blockNum}`] =
                cls.title || cls.courseName || "Unknown Class";
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
                weekSchedule[weekDay][periodName] =
                  cls.title || cls.courseName || "Unknown Class";
              }
            }
          } else {
            const weekDay = cycleToDay[part.trim()];
            if (weekDay) {
              weekSchedule[weekDay][periodName] =
                cls.title || cls.courseName || "Unknown Class";
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
  scheduleMap: Record<string, Record<string, string>>
): BellSchedule | null {
  if (!student?.grades || student.grades.length === 0) {
    return null;
  }

  const grade = student.grades[0];
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[dayOfWeek];

  // High school uses standard scheduling
  if (["09", "10", "11", "12"].includes(grade)) {
    return HIGH_SCHOOL_SCHEDULE;
  }

  // MIDDLE SCHOOL LOGIC
  // Wednesday is special - use grade-specific schedules
  if (dayOfWeek === 3) {
    // Wednesday
    return ["05", "06"].includes(grade) ? MS_WEDNESDAY_GR56 : MS_WEDNESDAY_GR78;
  }

  // For Mon/Tue/Thu/Fri: Find the project class and determine which block it uses
  const daySchedule = scheduleMap[dayName];
  if (!daySchedule) {
    return MIDDLE_SCHOOL_SCHEDULE; // Fallback
  }

  // Find which block has the project class (87-minute block)
  // Project classes typically contain "Project" and are Science/Social Studies
  for (const [blockId, className] of Object.entries(daySchedule)) {
    if (className.toLowerCase().includes("project")) {
      const blockLetter = blockId.replace("block_", "").toUpperCase();

      // Map to the correct project schedule
      switch (blockLetter) {
        case "A":
          return MS_PROJECT_SCHEDULE_A;
        case "B":
          return MS_PROJECT_SCHEDULE_B;
        case "D":
          return MS_PROJECT_SCHEDULE_D;
        case "E":
          return MS_PROJECT_SCHEDULE_E;
        default:
          return MIDDLE_SCHOOL_SCHEDULE;
      }
    }
  }

  // No project class found - use fallback
  return MIDDLE_SCHOOL_SCHEDULE;
}

/**
 * Get bell schedule for a specific variant name (legacy function for compatibility)
 */
export function getBellScheduleForVariant(
  variantName: string
): BellSchedule | null {
  if (variantName.includes("HS")) {
    return HIGH_SCHOOL_SCHEDULE;
  } else if (variantName.includes("Proj A")) {
    return MS_PROJECT_SCHEDULE_A;
  } else if (variantName.includes("Proj B")) {
    return MS_PROJECT_SCHEDULE_B;
  } else if (variantName.includes("Proj D")) {
    return MS_PROJECT_SCHEDULE_D;
  } else if (variantName.includes("Proj E")) {
    return MS_PROJECT_SCHEDULE_E;
  } else if (variantName.includes("Wednesday")) {
    return variantName.includes("5/6") ? MS_WEDNESDAY_GR56 : MS_WEDNESDAY_GR78;
  } else {
    return MIDDLE_SCHOOL_SCHEDULE;
  }
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

/**
 * Map SIS period strings to bell schedule periods
 * This handles the mapping between SIS periods like "BLOCK A(Mon-Tues)" and actual bell periods
 */
export function mapSISPeriodToBellPeriod(
  sisPeriodString: string,
  schedule: BellSchedule
): BellPeriod[] {
  const matchedPeriods: BellPeriod[] = [];

  // Get all periods from all day schedules (we'll filter by day later if needed)
  const allPeriods: BellPeriod[] = [];
  for (const daySchedule of schedule.schedules) {
    allPeriods.push(...daySchedule.periods);
  }

  // Extract block identifiers from strings like "BLOCK A(Mon-Tues) BLOCK C(Thur-Fri)"
  const blockMatches = sisPeriodString.match(/BLOCK [A-Z]/g) || [];

  for (const blockMatch of blockMatches) {
    const blockLetter = blockMatch.split(" ")[1]; // "A", "B", "C", etc.

    // Map SIS block letters to actual bell schedule periods
    // Check if this is a project-based schedule or regular schedule
    let bellPeriodId: string;

    // First check for project-based schedule period IDs (lowercase)
    const projectPeriodId = `block_${blockLetter.toLowerCase()}`;
    const projectPeriod = allPeriods.find((p) => p.id === projectPeriodId);

    if (projectPeriod) {
      // This is a project-based schedule, use lowercase IDs
      bellPeriodId = projectPeriodId;
    } else {
      // Fall back to regular schedule mapping (uppercase numbers)
      switch (blockLetter) {
        case "A":
          bellPeriodId = "block_1";
          break;
        case "B":
          bellPeriodId = "block_2";
          break;
        case "C":
          bellPeriodId = "block_3";
          break;
        case "D":
          bellPeriodId = "block_4";
          break;
        case "E":
          bellPeriodId = "block_2"; // Fallback for regular schedule
          break;
        default:
          continue; // Skip unknown blocks
      }
    }

    const bellPeriod = allPeriods.find((p) => p.id === bellPeriodId);
    if (bellPeriod) {
      matchedPeriods.push(bellPeriod);
    }
  }

  // Handle special cases like lunch, advisory, etc.
  if (sisPeriodString.includes("L/R")) {
    const lunchPeriod = allPeriods.find((p) => p.id.includes("lunch"));
    if (lunchPeriod) {
      matchedPeriods.push(lunchPeriod);
    }
  }

  if (sisPeriodString.includes("Adv")) {
    const advPeriod = allPeriods.find((p) => p.id.includes("adv"));
    if (advPeriod) {
      matchedPeriods.push(advPeriod);
    }
  }

  if (sisPeriodString.includes("WIN")) {
    const winPeriod = allPeriods.find((p) => p.id.includes("win"));
    if (winPeriod) {
      matchedPeriods.push(winPeriod);
    }
  }

  return matchedPeriods;
}
