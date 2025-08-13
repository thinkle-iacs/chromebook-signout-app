// COMPLETE BELL SCHEDULE SELECTION ALGORITHM
// This is the production-ready logic for determining which bell schedule variant to use
// Based on project class analysis from the updated sample data

/**
 * Main function to determine bell schedule variant for a student on a specific day
 * @param {Object} scheduleData - Student schedule data from SIS API
 * @param {string} day - Day of week ('Mon', 'Tues', 'Wed', 'Thur', 'Fri')
 * @returns {string} - Bell schedule variant name (e.g., "Gr 5 Proj A", "Gr 5/6 Wednesday")
 */
function getBellScheduleVariant(scheduleData, day) {
  const grade = scheduleData.student.grades[0];

  // Special case: Wednesday always uses the special Wednesday schedule
  if (day === 'Wed') {
    return grade === '05' || grade === '06' ? 'Gr 5/6 Wednesday' : 'Gr 7/8 Wednesday';
  }

  // Find project classes (Science and Social Studies)
  const projectClasses = scheduleData.schedule.classes.filter(cls =>
    cls.title.includes('Project') &&
    (cls.subjects.includes('Science') || cls.subjects.includes('Social Studies'))
  );

  if (projectClasses.length === 0) {
    console.warn(`No project classes found for student in grade ${grade}`);
    return `Gr ${grade} Default`;
  }

  // Parse project assignments for the specific day
  const dayAssignments = [];
  for (const projectClass of projectClasses) {
    const assignments = parseProjectClassDay(projectClass, day);
    dayAssignments.push(...assignments);
  }

  if (dayAssignments.length === 0) {
    console.warn(`No project assignments found for ${day} in grade ${grade}`);
    return `Gr ${grade} Default`;
  }

  // Handle conflicts: if multiple projects assign different blocks, use first one
  const blocks = [...new Set(dayAssignments.map(a => a.block))];
  const primaryBlock = blocks[0];

  if (blocks.length > 1) {
    const subjects = dayAssignments.map(a => a.subject);
    console.warn(`Schedule conflict on ${day}: ${subjects.join(' & ')} assign different blocks: ${blocks.join(' vs ')}. Using ${primaryBlock}.`);
  }

  // Convert block name to schedule variant
  const blockLetter = primaryBlock.split(' ')[1]; // Extract 'A' from 'BLOCK A'
  return `Gr ${grade} Proj ${blockLetter}`;
}

/**
 * Parse a project class to find block assignments for a specific day
 * @param {Object} projectClass - Class object with periods array
 * @param {string} targetDay - Day to find assignments for
 * @returns {Array} - Array of assignments for that day
 */
function parseProjectClassDay(projectClass, targetDay) {
  const assignments = [];

  for (const periodString of projectClass.periods) {
    // Handle multiple blocks in one period string: "BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)"
    const blockParts = periodString.split(/(?=BLOCK [A-E])/);

    for (const part of blockParts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      // Extract block name
      const blockMatch = trimmedPart.match(/^(BLOCK [A-E])/);
      if (!blockMatch) continue;

      const blockName = blockMatch[1];
      const days = extractDaysFromPeriod(trimmedPart);

      if (days.includes(targetDay)) {
        assignments.push({
          block: blockName,
          subject: projectClass.subjects[0],
          title: projectClass.title
        });
      }
    }
  }

  return assignments;
}

/**
 * Extract days from a period string like "BLOCK A(Mon-Tues)" or "BLOCK B(Wed)"
 * @param {string} periodString - Period string from SIS
 * @returns {Array<string>} - Array of day names
 */
function extractDaysFromPeriod(periodString) {
  const match = periodString.match(/\(([^)]+)\)/);
  if (!match) return [];

  const daysPart = match[1];

  // Handle day ranges like "Mon-Tues" or "Thur-Fri"
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

/**
 * Get complete weekly bell schedule mapping for a student
 * @param {Object} scheduleData - Student schedule data from SIS API
 * @returns {Object} - Object mapping days to bell schedule variants
 */
function getWeeklyBellScheduleMapping(scheduleData) {
  const weekdays = ['Mon', 'Tues', 'Wed', 'Thur', 'Fri'];
  const mapping = {};

  for (const day of weekdays) {
    mapping[day] = getBellScheduleVariant(scheduleData, day);
  }

  return mapping;
}

// TEST THE IMPLEMENTATION
// Using the sample data from scheduleSampleData.ts

const test78schedule = {
  success: true,
  student: { grades: ["08"] },
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
  student: { grades: ["05"] },
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

console.log('🔔 BELL SCHEDULE SELECTION ALGORITHM - PRODUCTION TEST');
console.log('=' * 60);

console.log('\n📊 Grade 8 Student Weekly Bell Schedule:');
const gr8Mapping = getWeeklyBellScheduleMapping(test78schedule);
for (const [day, schedule] of Object.entries(gr8Mapping)) {
  console.log(`   ${day}: ${schedule}`);
}

console.log('\n📊 Grade 5 Student Weekly Bell Schedule:');
const gr5Mapping = getWeeklyBellScheduleMapping(test56schedule);
for (const [day, schedule] of Object.entries(gr5Mapping)) {
  console.log(`   ${day}: ${schedule}`);
}

console.log('\n✅ ALGORITHM COMPLETE');
console.log('This logic can now be integrated into the main schedule transformation system.');
console.log('Each bell schedule variant maps to different period timing from rawScheduleData.md');

// Export functions for use in main application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getBellScheduleVariant,
    getWeeklyBellScheduleMapping,
    parseProjectClassDay,
    extractDaysFromPeriod
  };
}
