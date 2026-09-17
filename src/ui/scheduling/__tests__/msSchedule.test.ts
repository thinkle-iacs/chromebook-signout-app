// Regression tests for the 2026-2027 Middle School schedule structure.
// Fixtures are trimmed from real Aspen OneRoster responses.
import { parseScheduleFromSIS } from "../bellSchedules";
import { buildStructuredSchedule } from "../structuredSchedule";
import { getMSBellSchedule } from "../msSchedules";

const cls = (
  title: string,
  periods: string[],
  extra: Record<string, any> = {}
) => ({ title, periods, subjects: ["N/A"], ...extra });

const GRADE_7 = {
  classes: [
    cls("Art Gr 7", ["BLOCK 3(Mon-Tues) BLOCK 6(Thur-Fri)"], {
      subjects: ["Art"],
      location: "102",
    }),
    cls("Advisory Gr 7", ["Adv(Mon-Tues,Thur-Fri)"], { location: "401" }),
    cls("7/8 WIN Block", ["WIN(Mon-Tues,Thur-Fri)"]),
    cls("Recess Gr 7", ["RECESS(Mon-Tues,Thur-Fri)"], { location: "MS Lot" }),
    cls("Lunch Gr 7", ["LUNCH(Mon-Fri)"], { location: "Cafeteria" }),
    cls("ELA Honors Gr 7", ["BLOCK 1(Mon-Tues) BLOCK 2(Wed) BLOCK 4(Thur-Fri)"], {
      subjects: ["English"],
      location: "205",
    }),
    cls(
      "Social Studies Honors Gr 7",
      ["BLOCK 2(Mon-Tues) BLOCK 3(Wed) BLOCK 5(Thur-Fri)"],
      { subjects: ["Social Studies"], location: "401" }
    ),
    cls("Science Honors Gr 7", ["BLOCK 2(Thur-Fri) BLOCK 4(Wed) BLOCK 5(Mon-Tues)"], {
      subjects: ["Science"],
      location: "208",
    }),
    cls("Math Honors Gr 7", ["BLOCK 3(Thur-Fri) BLOCK 5(Wed) BLOCK 6(Mon-Tues)"], {
      subjects: ["Math"],
      location: "405",
    }),
    cls("Spanish Honors Gr 7", ["BLOCK 1(Thur-Fri) BLOCK 4(Mon-Tues)"], {
      subjects: ["World Languages"],
      location: "201",
    }),
    // Art, Challenge and Health rotate through the same block by term
    cls("Challenge Gr 7", ["BLOCK 3(Mon-Tues) BLOCK 6(Thur-Fri)"], {
      subjects: ["PE"],
      location: "Ath Fields",
    }),
    cls("Health Gr 7", ["BLOCK 3(Mon-Tues) BLOCK 6(Thur-Fri)"], {
      subjects: ["Health and Wellness"],
      location: "101",
    }),
    cls("Enrichment 7-8", ["BLOCK 1(Wed)"], { location: "Auditorium" }),
  ],
};

const GRADE_5 = {
  classes: [
    cls("Science Gr 5", ["BLOCK 1(Mon-Wed) BLOCK 4(Thur-Fri)"], {
      subjects: ["Science"],
      location: "519",
    }),
    cls("Math Gr 5", ["BLOCK 2(Mon-Wed) BLOCK 5(Thur-Fri)"], {
      subjects: ["Math"],
      location: "518",
    }),
    cls("Social Studies Gr 5", ["BLOCK 1(Thur-Fri) BLOCK 3(Wed) BLOCK 4(Mon-Tues)"], {
      subjects: ["Social Studies"],
      location: "515",
    }),
    cls("ELA Gr 5", ["BLOCK 3(Thur-Fri) BLOCK 5(Wed) BLOCK 6(Mon-Tues)"], {
      subjects: ["English"],
      location: "517",
    }),
    cls("Advisory Gr 5", ["Adv(Mon-Tues,Thur-Fri)"], { location: "517" }),
    cls("5/6 WIN Block", ["WIN(Mon-Tues,Thur-Fri)"]),
    cls("Recess Gr 5", ["RECESS(Mon-Tues,Thur-Fri)"], { location: "MS Lot" }),
    cls("Lunch Gr 5", ["LUNCH(Mon-Fri)"], { location: "Cafeteria" }),
    cls("Enrichment 5-6", ["BLOCK 4(Wed)"], { location: "519" }),
  ],
};

const student = (grade: string) => ({ grades: [grade] });

const blockFor = (
  schedule: ReturnType<typeof buildStructuredSchedule>,
  weekday: number,
  blockName: string
) => schedule.find((d) => d.weekday === weekday)?.blocks.find((b) => b.blockName === blockName);

describe("parseScheduleFromSIS", () => {
  it("maps numbered blocks to the day they meet", () => {
    const map = parseScheduleFromSIS(GRADE_7);
    expect(map.monday.block_3).toContain("Art Gr 7");
    expect(map.thursday.block_6).toContain("Art Gr 7");
    expect(map.wednesday.block_2).toEqual(["ELA Honors Gr 7"]);
  });

  it("expands day ranges that cross Wednesday", () => {
    const map = parseScheduleFromSIS(GRADE_5);
    // "BLOCK 1(Mon-Wed)" meets Monday, Tuesday AND Wednesday
    expect(map.monday.block_1).toEqual(["Science Gr 5"]);
    expect(map.tuesday.block_1).toEqual(["Science Gr 5"]);
    expect(map.wednesday.block_1).toEqual(["Science Gr 5"]);
  });

  it("maps the named periods", () => {
    const map = parseScheduleFromSIS(GRADE_7);
    expect(map.monday.adv).toEqual(["Advisory Gr 7"]);
    expect(map.monday.win).toEqual(["7/8 WIN Block"]);
    expect(map.monday.recess).toEqual(["Recess Gr 7"]);
    expect(map.monday.lunch).toEqual(["Lunch Gr 7"]);
    expect(map.wednesday.lunch).toEqual(["Lunch Gr 7"]);
  });

  it("still handles High School cycle-day periods", () => {
    const map = parseScheduleFromSIS({
      classes: [cls("AP CSP", ["Block 2(D1,D3)"])],
    });
    expect(map.monday.block_2).toEqual(["AP CSP"]);
    expect(map.wednesday.block_2).toEqual(["AP CSP"]);
  });
});

describe("buildStructuredSchedule for middle school", () => {
  it("puts a class in the same lettered block on both rotations", () => {
    const schedule = buildStructuredSchedule(student("07"), GRADE_7 as any);
    // Art is BLOCK 3 Mon/Tue and BLOCK 6 Thu/Fri -- Block C both times
    expect(blockFor(schedule, 1, "Block C")?.class).toContain("Art Gr 7");
    expect(blockFor(schedule, 4, "Block C")?.class).toContain("Art Gr 7");
    expect(blockFor(schedule, 1, "Block A")?.class).toBe("ELA Honors Gr 7");
    expect(blockFor(schedule, 4, "Block A")?.class).toBe("ELA Honors Gr 7");
  });

  it("leaves no unexpected free periods on a full schedule", () => {
    const schedule = buildStructuredSchedule(student("07"), GRADE_7 as any);
    const monday = schedule.find((d) => d.weekday === 1)!;
    expect(monday.blocks.filter((b) => b.class === "Free Period")).toHaveLength(0);
  });

  it("shows every class that rotates through a block", () => {
    const schedule = buildStructuredSchedule(student("07"), GRADE_7 as any);
    // Art, Challenge and Health share Block C across the three terms
    expect(blockFor(schedule, 1, "Block C")?.class).toBe(
      "Art Gr 7 / Challenge Gr 7 / Health Gr 7"
    );
  });

  it("uses grade-specific WIN/Lunch/Recess times", () => {
    const gr7 = buildStructuredSchedule(student("07"), GRADE_7 as any);
    const gr5 = buildStructuredSchedule(student("05"), GRADE_5 as any);
    // Grade 7 has WIN at 11:03 and lunch at 11:41; grade 5 eats first.
    expect(blockFor(gr7, 1, "WIN")?.start).toBe("11:03");
    expect(blockFor(gr7, 1, "Lunch")?.start).toBe("11:41");
    expect(blockFor(gr5, 1, "Lunch")?.start).toBe("11:03");
    expect(blockFor(gr5, 1, "WIN")?.start).toBe("11:41");
  });

  it("uses the grade's own Wednesday schedule", () => {
    const gr7 = buildStructuredSchedule(student("07"), GRADE_7 as any);
    const gr5 = buildStructuredSchedule(student("05"), GRADE_5 as any);
    // Enrichment is block 1 for grade 7, block 4 for grade 5
    expect(blockFor(gr7, 3, "Block 1")?.class).toBe("Enrichment 7-8");
    expect(blockFor(gr5, 3, "Block 4")?.class).toBe("Enrichment 5-6");
    // Wednesday has Brunch and no advisory
    expect(blockFor(gr5, 3, "Brunch")).toBeTruthy();
    expect(blockFor(gr5, 3, "Advisory")).toBeUndefined();
    // Wednesday dismissal
    expect(blockFor(gr7, 3, "Block 5")?.end).toBe("12:45");
  });

  it("carries room and teacher details through", () => {
    const schedule = buildStructuredSchedule(student("07"), GRADE_7 as any);
    const math = blockFor(schedule, 1, "Block F");
    expect(math?.class).toBe("Math Honors Gr 7");
    expect(math?.room).toBe("405");
    expect(math?.subject).toBe("Math");
  });

  it("builds all five weekdays for every MS grade", () => {
    for (const grade of ["05", "06", "07", "08"]) {
      expect(getMSBellSchedule(grade)).toBeTruthy();
      const schedule = buildStructuredSchedule(student(grade), GRADE_7 as any);
      expect(schedule).toHaveLength(5);
      for (const day of schedule) {
        expect(day.blocks.length).toBeGreaterThan(0);
      }
    }
  });
});
