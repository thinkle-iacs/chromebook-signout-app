// Debug Project Class Analysis for Bell Schedule Selection
// Key insight: Science and Social Studies are the PROJECT classes that determine bell schedules

// Sample data extracted from the updated scheduleSampleData.ts
const test78schedule = {
  success: true,
  message: "Schedule lookup successful",
  student: {
    grades: ["08"],
    givenName: "Beatrice",
    familyName: "Ann"
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
      // Non-project classes for context
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
};

const test56schedule = {
  success: true,
  message: "Schedule lookup successful",
  student: {
    grades: ["05"],
    givenName: "Alex",
    familyName: "Smith"
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
      // Non-project classes for context
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
};

// Extract days from period string (e.g., "Mon-Tues" -> ["Mon", "Tues"])
function extractDaysFromPeriod(periodString) {
  const match = periodString.match(/\(([^)]+)\)/);
  if (!match) return [];

  const daysPart = match[1];

  // Handle ranges like "Mon-Tues" or "Thur-Fri"
  if (daysPart.includes('-')) {
    const [start, end] = daysPart.split('-');
    const days = ['Mon', 'Tues', 'Wed', 'Thur', 'Fri'];
    const startIdx = days.indexOf(start);
    const endIdx = days.indexOf(end);
    if (startIdx !== -1 && endIdx !== -1) {
      return days.slice(startIdx, endIdx + 1);
    }
  }

  // Handle comma-separated days
  if (daysPart.includes(',')) {
    return daysPart.split(',').map(d => d.trim());
  }

  return [daysPart];
}

// Extract project classes (Science and Social Studies)
function getProjectClasses(schedule) {
  return schedule.classes.filter(cls =>
    cls.title.includes('Project') &&
    (cls.subjects.includes('Science') || cls.subjects.includes('Social Studies'))
  );
}

// Parse project schedule to understand block assignments per day
function parseProjectSchedule(projectClass) {
  const result = {};

  for (const periodString of projectClass.periods) {
    // Split by spaces to handle multiple block assignments in one string
    // e.g., "BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)"
    const parts = periodString.split(/(?=BLOCK [A-E])/);

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      // Extract block name (e.g., "BLOCK A")
      const blockMatch = trimmedPart.match(/^(BLOCK [A-E])/);
      if (!blockMatch) continue;

      const blockName = blockMatch[1];
      const days = extractDaysFromPeriod(trimmedPart);

      for (const day of days) {
        if (!result[day]) result[day] = [];
        result[day].push({
          block: blockName,
          subject: projectClass.subjects[0],
          title: projectClass.title
        });
      }
    }
  }

  return result;
}

// Determine bell schedule variant based on project assignments
function getBellScheduleVariant(grade, projectAssignments, day) {
  // Wednesday special handling - always uses specific Wednesday schedule
  if (day === 'Wed') {
    return `Gr ${grade}/6 Wednesday`; // Special Wednesday schedule for 5/6
  }

  // Find which project block is assigned for this day
  const assignmentsForDay = projectAssignments[day] || [];

  if (assignmentsForDay.length === 0) {
    console.log(`⚠️  No project assignments found for ${day}`);
    return `Gr ${grade} Default`;
  }

  // If multiple projects assign different blocks on same day, there's a conflict
  const blocks = [...new Set(assignmentsForDay.map(a => a.block))];
  if (blocks.length > 1) {
    console.log(`⚠️  Schedule conflict on ${day}: Multiple blocks assigned (${blocks.join(', ')})`);
    // Use the first project's block
    return `Gr ${grade} Proj ${blocks[0].split(' ')[1]}`;
  }

  // Use the assigned block to determine bell schedule variant
  const block = blocks[0].split(' ')[1]; // Extract letter from "BLOCK A"
  return `Gr ${grade} Proj ${block}`;
}

// Analyze complete weekly schedule for a student
function analyzeWeeklySchedule(scheduleData) {
  const grade = scheduleData.student.grades[0];
  const studentName = `${scheduleData.student.givenName} ${scheduleData.student.familyName}`;

  console.log(`\n📊 Weekly Schedule Analysis for ${studentName} (Grade ${grade})`);
  console.log('='.repeat(60));

  const projectClasses = getProjectClasses(scheduleData.schedule);
  console.log(`\n🎯 Found ${projectClasses.length} project classes:`);
  for (const proj of projectClasses) {
    console.log(`   • ${proj.title}: ${proj.periods[0]}`);
  }

  // Parse all project schedules and merge
  const allProjectAssignments = {};
  for (const projectClass of projectClasses) {
    const assignments = parseProjectSchedule(projectClass);
    for (const [day, dayAssignments] of Object.entries(assignments)) {
      if (!allProjectAssignments[day]) allProjectAssignments[day] = [];
      allProjectAssignments[day].push(...dayAssignments);
    }
  }

  console.log('\n📅 Daily Project Block Assignments:');
  const weekdays = ['Mon', 'Tues', 'Wed', 'Thur', 'Fri'];
  for (const day of weekdays) {
    const assignments = allProjectAssignments[day] || [];
    if (assignments.length > 0) {
      const assignmentDetails = assignments.map(a => `${a.block} (${a.subject})`).join(', ');
      console.log(`   ${day}: ${assignmentDetails}`);
    } else {
      console.log(`   ${day}: No project assignments`);
    }
  }

  console.log('\n🔔 Required Bell Schedule Variants:');
  for (const day of weekdays) {
    const bellSchedule = getBellScheduleVariant(grade, allProjectAssignments, day);
    console.log(`   ${day}: ${bellSchedule}`);
  }

  return {
    projectClasses,
    projectAssignments: allProjectAssignments,
    bellScheduleVariants: weekdays.map(day => ({
      day,
      schedule: getBellScheduleVariant(grade, allProjectAssignments, day)
    }))
  };
}

// Test both grade levels
console.log('🚀 TESTING PROJECT CLASS ANALYSIS');
console.log('='.repeat(70));

const gr8Analysis = analyzeWeeklySchedule(test78schedule);
const gr5Analysis = analyzeWeeklySchedule(test56schedule);

console.log('\n🎯 KEY INSIGHTS:');
console.log('• Science and Social Studies are the PROJECT classes');
console.log('• Project class block assignments determine which bell schedule variant to use');
console.log('• Wednesday always uses special "Gr X/6 Wednesday" schedule');
console.log('• Same block letters (A,B,C,D,E) have different durations in different variants');
console.log('• Grade 8 has different project patterns than Grade 5');
