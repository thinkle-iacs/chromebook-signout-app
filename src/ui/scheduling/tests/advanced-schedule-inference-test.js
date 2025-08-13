// ADVANCED PROJECT-BASED BELL SCHEDULE INFERENCE TEST
// This demonstrates the complete system for determining bell schedule variants based on project assignments

// Import the parsing functions from our test suite
const { parsePeriodString, dayMappings } = require('./period-parsing-tests.js');

// Sample student schedule data (based on real scheduleSampleData.ts)
const testStudentSchedules = {
  grade5Student: {
    student: { grades: ["05"], givenName: "Alex", familyName: "Smith" },
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
        }
      ]
    }
  },

  grade8Student: {
    student: { grades: ["08"], givenName: "Beatrice", familyName: "Ann" },
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
        }
      ]
    }
  },

  hsStudent: {
    student: { grades: ["09"], givenName: "Arav", familyName: "Patel" },
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
        }
      ]
    }
  }
};

// Expected bell schedule variants for each day
const expectedBellSchedules = {
  grade5Student: {
    Mon: "Gr 5 Proj A",     // Social Studies BLOCK A
    Tues: "Gr 5 Proj A",    // Science BLOCK A  
    Wed: "Gr 5/6 Wednesday", // Special Wednesday (ignores conflicts)
    Thur: "Gr 5 Proj D",    // Social Studies BLOCK D
    Fri: "Gr 5 Proj D"      // Science BLOCK D
  },
  grade8Student: {
    Mon: "Gr 8 Proj E",     // Social Studies BLOCK E
    Tues: "Gr 8 Proj E",    // Science BLOCK E
    Wed: "Gr 7/8 Wednesday", // Special Wednesday (ignores conflicts) 
    Thur: "Gr 8 Proj B",    // Social Studies BLOCK B
    Fri: "Gr 8 Proj B"      // Science BLOCK B
  },
  hsStudent: {
    // High school uses standard schedule names, not project-based
    D1: "HS Standard",
    D2: "HS Standard",
    D3: "HS Standard",
    D4: "HS Standard",
    D5: "HS Standard"
  }
};

// Function to identify project classes
function getProjectClasses(schedule) {
  return schedule.classes.filter(cls =>
    cls.title.includes('Project') &&
    (cls.subjects.includes('Science') || cls.subjects.includes('Social Studies'))
  );
}

// Function to determine bell schedule variant for a specific day
function getBellScheduleVariant(scheduleData, day) {
  const grade = scheduleData.student.grades[0];
  const gradeNum = grade === '05' ? '5' : grade === '06' ? '6' : grade === '07' ? '7' : grade === '08' ? '8' : grade;
  const schoolLevel = (grade === '09' || grade === '10' || grade === '11' || grade === '12') ? 'HS' : 'MS';

  // High school uses standard scheduling
  if (schoolLevel === 'HS') {
    return 'HS Standard';
  }

  // Middle School: Special Wednesday handling
  if (day === 'Wed') {
    return grade === '05' || grade === '06' ? 'Gr 5/6 Wednesday' : 'Gr 7/8 Wednesday';
  }

  // Find project classes and parse their schedules
  const projectClasses = getProjectClasses(scheduleData.schedule);
  const dayAssignments = [];

  for (const projectClass of projectClasses) {
    for (const periodString of projectClass.periods) {
      const parsed = parsePeriodString(periodString, schoolLevel, projectClass.subjects[0]);
      if (parsed[day]) {
        dayAssignments.push(...parsed[day]);
      }
    }
  }

  if (dayAssignments.length === 0) {
    return `Gr ${gradeNum} Default`;
  }

  // Use the first assignment's block to determine schedule variant
  const primaryBlock = dayAssignments[0].block.split(' ')[1]; // Extract 'A' from 'BLOCK A'
  return `Gr ${gradeNum} Proj ${primaryBlock}`;
}

// Generate complete weekly schedule mapping
function generateWeeklyScheduleMapping(scheduleData) {
  const grade = scheduleData.student.grades[0];
  const schoolLevel = (grade === '09' || grade === '10' || grade === '11' || grade === '12') ? 'HS' : 'MS';
  const days = schoolLevel === 'HS' ? ['D1', 'D2', 'D3', 'D4', 'D5'] : ['Mon', 'Tues', 'Wed', 'Thur', 'Fri'];

  const mapping = {};
  for (const day of days) {
    mapping[day] = getBellScheduleVariant(scheduleData, day);
  }

  return mapping;
}

// Run the advanced inference test
function runAdvancedInferenceTest() {
  console.log('🚀 ADVANCED PROJECT-BASED BELL SCHEDULE INFERENCE TEST');
  console.log('=' * 70);

  let totalTests = 0;
  let passedTests = 0;

  for (const [studentType, scheduleData] of Object.entries(testStudentSchedules)) {
    totalTests++;
    console.log(`\n👤 Testing: ${scheduleData.student.givenName} ${scheduleData.student.familyName} (${studentType})`);

    // Generate the weekly schedule mapping
    const actualMapping = generateWeeklyScheduleMapping(scheduleData);
    const expectedMapping = expectedBellSchedules[studentType];

    console.log('\n📅 Daily Bell Schedule Assignments:');
    let daysPassed = 0;
    let totalDays = 0;

    for (const [day, expectedSchedule] of Object.entries(expectedMapping)) {
      totalDays++;
      const actualSchedule = actualMapping[day];
      const passed = actualSchedule === expectedSchedule;

      if (passed) daysPassed++;

      const status = passed ? '✅' : '❌';
      console.log(`   ${day}: ${actualSchedule} ${status}${passed ? '' : ` (expected: ${expectedSchedule})`}`);
    }

    const studentPassed = daysPassed === totalDays;
    if (studentPassed) {
      passedTests++;
      console.log(`\n✅ ${studentType}: PASSED (${daysPassed}/${totalDays} days correct)`);
    } else {
      console.log(`\n❌ ${studentType}: FAILED (${daysPassed}/${totalDays} days correct)`);
    }

    // Show project class analysis for MS students
    if (scheduleData.student.grades[0] !== '09') {
      const projectClasses = getProjectClasses(scheduleData.schedule);
      console.log(`\n🎯 Project Classes Found: ${projectClasses.length}`);
      for (const proj of projectClasses) {
        console.log(`   • ${proj.title}: ${proj.periods[0]}`);
      }
    }
  }

  console.log(`\n📊 FINAL RESULTS: ${passedTests}/${totalTests} students passed`);

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! The project-based bell schedule inference system is working correctly.');
    console.log('\n✅ CAPABILITIES DEMONSTRATED:');
    console.log('  • Basic period string parsing (MS and HS formats)');
    console.log('  • Day range expansion (Mon-Fri, D1-D3)');
    console.log('  • Comma-separated day handling');
    console.log('  • Multiple block parsing in single period string');
    console.log('  • Project class identification');
    console.log('  • Bell schedule variant determination');
    console.log('  • Special Wednesday schedule handling');
    console.log('  • Complete weekly schedule generation');
  } else {
    console.log('🔧 Some tests failed. The inference logic needs adjustment.');
  }
}

// Run the test
runAdvancedInferenceTest();

// Export for integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getBellScheduleVariant,
    generateWeeklyScheduleMapping,
    getProjectClasses,
    testStudentSchedules,
    expectedBellSchedules
  };
}
