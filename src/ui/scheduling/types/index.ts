// Core scheduling types and interfaces

export interface BellPeriod {
  id: string;
  name: string;
  displayName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DaySchedule {
  days: number[]; // [1, 2, 3, 4, 5] for Mon-Fri
  periods: BellPeriod[];
}

export interface BellSchedule {
  name: string;
  description: string;
  grades: string[];
  schedules: DaySchedule[];
}

export interface ScheduleBlock {
  start: string; // "8:20"
  end: string; // "9:40"
  class: string; // "Underwater Basketweaving"
  room: string; // "206"
  isFree: boolean; // false
  blockName?: string; // "Block 1" (optional)
  subject?: string; // "Art" (optional)
  teachers?: {
    givenName?: string;
    familyName?: string;
    email?: string;
  }[];
}

export interface StructuredDaySchedule {
  weekday: number; // 1 = Monday, 2 = Tuesday, etc.
  blocks: ScheduleBlock[];
}

export interface StructuredSchedule {
  student: any;
  schedule: StructuredDaySchedule[];
  bellScheduleName?: string;
  lastUpdated: string;
}

// SIS (Student Information System) data types
export interface SISClass {
  title: string;
  periods: string[]; // ["BLOCK A(Mon-Tues) BLOCK C(Thur-Fri)"]
  location?: string;
  subjects?: string[];
}

export interface SISSchedule {
  classes: SISClass[];
}

// Project class identification
export interface ProjectClass extends SISClass {
  subjects: string[]; // Must include "Science" or "Social Studies"
}
