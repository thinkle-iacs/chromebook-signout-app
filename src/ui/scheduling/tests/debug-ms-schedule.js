// Debug Middle School Schedule Selection Logic

// Mock project class data from the sample
const projectClasses = [
  {
    title: "Social Studies Project Gr 5",
    periods: ["BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)"],
    subjects: ["Social Studies"]
  },
  {
    title: "Science Project Gr 5",
    periods: ["BLOCK A(Tues) BLOCK D(Fri) BLOCK E(Wed)"],
    subjects: ["Science"]
  }
];

// Extract days from period string
function extractDaysFromPeriod(periodString) {
  const match = periodString.match(/\(([^)]+)\)/);
  if (!match) return [];

  const daysPart = match[1];

  if (daysPart.includes(',')) {
    return daysPart.split(',').map(d => d.trim());
  }

  return [daysPart];
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
        result[day] = blockName;
      }
    }
  }

  return result;
}

// Determine bell schedule variant based on project block placement
function getBellScheduleVariant(grade, projectBlock) {
  // Map project block to schedule variant
  const blockToSchedule = {
    'BLOCK A': `Gr ${grade} Proj A`,
    'BLOCK B': `Gr ${grade} Proj B`,
    'BLOCK C': `Gr ${grade} Proj C`,
    'BLOCK D': `Gr ${grade} Proj D`,
    'BLOCK E': `Gr ${grade} Proj E`
  };

  return blockToSchedule[projectBlock] || null;
}

// Convert day name to weekday number
function dayNameToWeekday(dayName) {
  const dayMap = {
    'Mon': 1, 'Monday': 1,
    'Tue': 2, 'Tuesday': 2, 'Tues': 2,
    'Wed': 3, 'Wednesday': 3,
    'Thu': 4, 'Thursday': 4, 'Thur': 4,
    'Fri': 5, 'Friday': 5
  };
  return dayMap[dayName] || null;
}

// Main analysis
console.log('=== Middle School Schedule Analysis ===\n');

projectClasses.forEach((projectClass, index) => {
  console.log(`Project Class ${index + 1}: ${projectClass.title}`);
  console.log(`Periods: ${projectClass.periods.join(', ')}`);

  const schedule = parseProjectSchedule(projectClass);
  console.log('Project schedule by day:');

  Object.keys(schedule).forEach(day => {
    const weekday = dayNameToWeekday(day);
    const block = schedule[day];
    const bellSchedule = getBellScheduleVariant(5, block);

    console.log(`  ${day} (weekday ${weekday}): Project in ${block} → ${bellSchedule}`);
  });

  console.log('---\n');
});

// Show the full weekly schedule for the student
console.log('=== Complete Weekly Bell Schedule Selection ===');

// Combine all project classes to get complete picture
const combinedSchedule = {};
const scheduleConflicts = {};

projectClasses.forEach(projectClass => {
  const schedule = parseProjectSchedule(projectClass);
  Object.keys(schedule).forEach(day => {
    if (combinedSchedule[day] && combinedSchedule[day] !== schedule[day]) {
      scheduleConflicts[day] = scheduleConflicts[day] || [];
      scheduleConflicts[day].push({
        class: projectClass.title,
        block: schedule[day]
      });
    } else {
      combinedSchedule[day] = schedule[day];
    }
  });
});

// Show conflicts if any
if (Object.keys(scheduleConflicts).length > 0) {
  console.log('⚠️  Schedule Conflicts Detected:');
  Object.keys(scheduleConflicts).forEach(day => {
    console.log(`  ${day}: Multiple projects assigned`);
    scheduleConflicts[day].forEach(conflict => {
      console.log(`    - ${conflict.class} in ${conflict.block}`);
    });
  });
  console.log('');
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
weekDays.forEach(day => {
  const weekday = dayNameToWeekday(day);

  if (day === 'Wed') {
    console.log(`${day} (weekday ${weekday}): Use "Gr 5/6 Wednesday" schedule (special Wednesday)`);
  } else if (combinedSchedule[day]) {
    const block = combinedSchedule[day];
    const bellSchedule = getBellScheduleVariant(5, block);
    console.log(`${day} (weekday ${weekday}): Project in ${block} → ${bellSchedule}`);
  } else {
    console.log(`${day} (weekday ${weekday}): No project scheduled - need to infer from regular classes`);
  }
});

console.log('\n=== Bell Schedule Variant Summary ===');
const scheduleVariants = new Set();
weekDays.forEach(day => {
  if (day === 'Wed') {
    scheduleVariants.add('Gr 5/6 Wednesday');
  } else if (combinedSchedule[day]) {
    const block = combinedSchedule[day];
    const bellSchedule = getBellScheduleVariant(5, block);
    if (bellSchedule) scheduleVariants.add(bellSchedule);
  }
});

console.log('This student needs these bell schedule variants:');
Array.from(scheduleVariants).forEach(variant => {
  console.log(`  - ${variant}`);
});
