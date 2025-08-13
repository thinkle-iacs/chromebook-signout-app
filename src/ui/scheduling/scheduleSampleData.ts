// Sample schedule data for testing scheduling logic
// This file provides test data for both Middle School and High School scheduling systems

export const test78schedule = {
  student: {
    grades: ["08"],
    givenName: "Beatrice",
    familyName: "Johnson",
  },
  schedule: {
    classes: [
      {
        title: "Social Studies Project Gr 8",
        subjects: ["Social Studies"],
        periods: ["BLOCK B(Thur) BLOCK C(Wed) BLOCK E(Mon)"],
      },
      {
        title: "Science Project Gr 8",
        subjects: ["Science"],
        periods: ["BLOCK A(Wed) BLOCK B(Fri) BLOCK E(Tues)"],
      },
      {
        title: "Pre-algebra Gr 8",
        subjects: ["Math"],
        periods: ["BLOCK A(Mon-Tues) BLOCK C(Thur-Fri) BLOCK E(Wed)"],
      },
      {
        title: "ELA Gr 8",
        subjects: ["English"],
        periods: ["BLOCK A(Thur-Fri) BLOCK D(Mon-Wed)"],
      },
    ],
  },
};

export const test56schedule = {
  student: {
    grades: ["05"],
    givenName: "Alex",
    familyName: "Smith",
  },
  schedule: {
    classes: [
      {
        title: "Social Studies Project Gr 5",
        subjects: ["Social Studies"],
        periods: ["BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)"],
      },
      {
        title: "Science Project Gr 5",
        subjects: ["Science"],
        periods: ["BLOCK A(Tues) BLOCK D(Fri) BLOCK E(Wed)"],
      },
      {
        title: "Math Gr 5",
        subjects: ["Math"],
        periods: ["BLOCK A(Wed) BLOCK B(Thur-Fri) BLOCK D(Mon-Tues)"],
      },
      {
        title: "ELA Gr 5",
        subjects: ["English"],
        periods: ["BLOCK B(Mon-Tues) BLOCK C(Wed) BLOCK E(Thur-Fri)"],
      },
    ],
  },
};

export const testHSschedule = {
  student: {
    grades: ["09"],
    givenName: "Arav",
    familyName: "Patel",
  },
  schedule: {
    classes: [
      {
        title: "American Studies A",
        subjects: ["Social Studies"],
        periods: ["Block 1(D2) Block 2(D1,D4)"],
      },
      {
        title: "Engineering A",
        subjects: ["Science"],
        periods: ["Block 1(D1) Block 3(D3) Block 4(D4)"],
      },
      {
        title: "Integrated Math I A",
        subjects: ["Math"],
        periods: ["Block 1(D5) Block 2(D3) Block 4(D2)"],
      },
      {
        title: "Advisory/Lunch",
        subjects: ["Advisory"],
        periods: ["Adv/L 1(D1-D2,D4-D5)"],
      },
    ],
  },
};
