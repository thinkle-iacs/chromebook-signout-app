// Complete Project Class Bell Schedule Mapping System
// This demonstrates the full logic for determining bell schedule variants

// Key insight: When both Science and Social Studies projects assign different blocks 
// on the same day (like Wednesday), we have conflicts that need resolution

const WEEKDAYS = ['Mon', 'Tues', 'Wed', 'Thur', 'Fri'];

// Enhanced analysis showing conflict resolution
function analyzeProjectConflicts(scheduleData) {
  const grade = scheduleData.student.grades[0];
  const studentName = `${scheduleData.student.givenName} ${scheduleData.student.familyName}`;

  console.log(`\n🔍 CONFLICT ANALYSIS: ${studentName} (Grade ${grade})`);
  console.log('='.repeat(50));

  const projectClasses = getProjectClasses(scheduleData.schedule);

  // Parse all project schedules separately to see conflicts
  const projectSchedules = {};
  for (const projectClass of projectClasses) {
    const subject = projectClass.subjects[0];
    projectSchedules[subject] = parseProjectSchedule(projectClass);
  }

  console.log('\n📋 Individual Project Schedules:');
  for (const [subject, schedule] of Object.entries(projectSchedules)) {
    console.log(`\n   ${subject} Project:`);
    for (const day of WEEKDAYS) {
      const assignments = schedule[day] || [];
      if (assignments.length > 0) {
        const blocks = assignments.map(a => a.block).join(', ');
        console.log(`     ${day}: ${blocks}`);
      }
    }
  }

  console.log('\n⚠️  Schedule Conflicts:');
  for (const day of WEEKDAYS) {
    const dayAssignments = [];
    for (const [subject, schedule] of Object.entries(projectSchedules)) {
      const assignments = schedule[day] || [];
      dayAssignments.push(...assignments);
    }

    if (dayAssignments.length > 1) {
      const subjects = dayAssignments.map(a => a.subject);
      const blocks = dayAssignments.map(a => a.block);
      const uniqueBlocks = [...new Set(blocks)];

      if (uniqueBlocks.length > 1) {
        console.log(`     ${day}: CONFLICT! ${subjects.join(' & ')} assign different blocks: ${blocks.join(' vs ')}`);
        console.log(`           → Solution: Use ${uniqueBlocks[0]} schedule (priority rule)`);
      } else {
        console.log(`     ${day}: Both subjects assign same block: ${uniqueBlocks[0]} ✓`);
      }
    } else if (dayAssignments.length === 1) {
      console.log(`     ${day}: Only ${dayAssignments[0].subject} assigns ${dayAssignments[0].block} ✓`);
    } else {
      console.log(`     ${day}: No project assignments`);
    }
  }
}

// Import the analysis functions from the previous script
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

  if (daysPart.includes(',')) {
    return daysPart.split(',').map(d => d.trim());
  }

  return [daysPart];
}

function getProjectClasses(schedule) {
  return schedule.classes.filter(cls =>
    cls.title.includes('Project') &&
    (cls.subjects.includes('Science') || cls.subjects.includes('Social Studies'))
  );
}

function parseProjectSchedule(projectClass) {
  const result = {};

  for (const periodString of projectClass.periods) {
    const parts = periodString.split(/(?=BLOCK [A-E])/);

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

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

// Sample data
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
      }
    ]
  }
};

// Run conflict analysis
console.log('🚨 PROJECT CLASS CONFLICT ANALYSIS');
console.log('=' * 40);
console.log('This shows how to handle cases where Science and Social Studies');
console.log('projects assign different blocks on the same day.\n');

analyzeProjectConflicts(test78schedule);
analyzeProjectConflicts(test56schedule);

console.log('\n🎯 FINAL RESOLUTION STRATEGY:');
console.log('1. Wednesday always uses "Gr X/6 Wednesday" schedule regardless of conflicts');
console.log('2. For other days with conflicts, use first project\'s block assignment');
console.log('3. Each block assignment maps to a bell schedule variant:');
console.log('   • BLOCK A → "Gr X Proj A" schedule');
console.log('   • BLOCK B → "Gr X Proj B" schedule');
console.log('   • BLOCK C → "Gr X Proj C" schedule');
console.log('   • BLOCK D → "Gr X Proj D" schedule');
console.log('   • BLOCK E → "Gr X Proj E" schedule');
console.log('4. Different grades have different bell schedule timing even for same block letter');
