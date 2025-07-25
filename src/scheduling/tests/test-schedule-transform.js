// Simple schedule transformation test without TypeScript

// Mock bell schedule
const simpleBellSchedule = {
  name: 'test_schedule',
  grades: ['05'],
  schedules: [
    {
      days: [1, 2, 3, 4, 5], // Mon-Fri
      periods: [
        { id: 'block_1', name: 'Block 1', startTime: '08:00', endTime: '09:30' },
        { id: 'block_2', name: 'Block 2', startTime: '09:35', endTime: '11:05' },
        { id: 'advisory', name: 'Advisory', startTime: '11:10', endTime: '11:40' },
        { id: 'block_3', name: 'Block 3', startTime: '12:20', endTime: '13:50' },
        { id: 'block_4', name: 'Block 4', startTime: '13:55', endTime: '15:25' }
      ]
    }
  ]
};

// Mock SIS schedule data
const mockSISSchedule = {
  classes: [
    {
      title: 'Math Class',
      location: 'Room 101',
      periods: ['Block 1(Mon-Fri)'],
      subjects: ['Math']
    },
    {
      title: 'Science Class',
      location: 'Room 201',
      periods: ['Block 2(Tue,Thu)'],
      subjects: ['Science']
    },
    {
      title: 'English Class',
      location: 'Room 301',
      periods: ['Block 3(Mon,Wed,Fri)'],
      subjects: ['English']
    },
    {
      title: 'History Class',
      location: 'Room 401',
      periods: ['Block 4(Mon-Fri)'],
      subjects: ['History']
    }
  ]
};

// Get periods for a specific day
function getPeriodsForDay(bellSchedule, weekday) {
  for (const schedule of bellSchedule.schedules) {
    if (schedule.days.includes(weekday)) {
      return schedule.periods;
    }
  }
  return [];
}

// Extract days from period string
function extractDaysFromPeriod(periodString) {
  const match = periodString.match(/\(([^)]+)\)/);
  if (!match) return [];

  const daysPart = match[1];

  if (daysPart.includes('-')) {
    const [start, end] = daysPart.split('-');
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startIndex = dayOrder.indexOf(start);
    const endIndex = dayOrder.indexOf(end);

    if (startIndex === -1 || endIndex === -1) return [daysPart];

    const rangeDays = [];
    for (let i = startIndex; i <= endIndex; i++) {
      rangeDays.push(dayOrder[i]);
    }
    return rangeDays;
  }

  if (daysPart.includes(',')) {
    return daysPart.split(',').map(d => d.trim());
  }

  return [daysPart];
}

// Convert day name to weekday number
function dayNameToWeekday(dayName) {
  const dayMap = {
    'Mon': 1, 'Monday': 1,
    'Tue': 2, 'Tuesday': 2,
    'Wed': 3, 'Wednesday': 3,
    'Thu': 4, 'Thursday': 4,
    'Fri': 5, 'Friday': 5
  };
  return dayMap[dayName] || null;
}

// Build structured schedule
function buildStructuredSchedule(bellSchedule, sisSchedule) {
  const weekSchedule = [];

  // For each weekday (Mon-Fri)
  for (let weekday = 1; weekday <= 5; weekday++) {
    const dayName = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][weekday];
    const blocks = [];

    // Get periods for this day
    const periodsForThisDay = getPeriodsForDay(bellSchedule, weekday);

    // For each bell schedule period, find matching classes
    for (const bellPeriod of periodsForThisDay) {
      const classesInThisPeriod = [];

      // Check each SIS class
      for (const classInfo of sisSchedule.classes) {
        for (const periodString of classInfo.periods) {
          const daysForThisPeriod = extractDaysFromPeriod(periodString);

          // Check if this period applies to the current day
          const appliesToThisDay = daysForThisPeriod.some(day =>
            dayNameToWeekday(day) === weekday
          ); if (appliesToThisDay) {
            // Extract period name/id from the period string
            const periodName = periodString.split('(')[0].trim();

            // Check if this matches the bell period - normalize both by removing spaces
            const normalizedBellPeriod = bellPeriod.name.toLowerCase().replace(/\s/g, '');
            const normalizedSISPeriod = periodName.toLowerCase().replace(/\s/g, '');

            if (normalizedSISPeriod.includes(normalizedBellPeriod) || normalizedBellPeriod.includes(normalizedSISPeriod)) {
              classesInThisPeriod.push({
                title: classInfo.title,
                location: classInfo.location,
                subjects: classInfo.subjects || []
              });
            }
          }
        }
      }

      // Add block to day
      if (classesInThisPeriod.length > 0) {
        blocks.push({
          periodId: bellPeriod.id,
          periodName: bellPeriod.name,
          startTime: bellPeriod.startTime,
          endTime: bellPeriod.endTime,
          classes: classesInThisPeriod
        });
      }
    }

    weekSchedule.push({
      weekday: weekday,
      blocks: blocks
    });
  }

  return weekSchedule;
}

// Test the transformation
console.log('=== Bell Schedule Periods ===');
for (let weekday = 1; weekday <= 5; weekday++) {
  const dayName = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][weekday];
  const periods = getPeriodsForDay(simpleBellSchedule, weekday);
  console.log(`${dayName}:`, periods.map(p => p.name));
}

console.log('\n=== SIS Class Analysis ===');
mockSISSchedule.classes.forEach((cls, index) => {
  console.log(`Class ${index + 1}: ${cls.title}`);
  cls.periods.forEach(period => {
    const days = extractDaysFromPeriod(period);
    console.log(`  Period: ${period}`);
    console.log(`  Days: ${days.join(', ')}`);
    console.log(`  Weekdays: ${days.map(d => dayNameToWeekday(d)).filter(w => w).join(', ')}`);
  });
});

console.log('\n=== Structured Schedule Result ===');
const result = buildStructuredSchedule(simpleBellSchedule, mockSISSchedule);
result.forEach((day, index) => {
  const dayName = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][day.weekday];
  console.log(`\n${dayName} (weekday ${day.weekday}):`);
  if (day.blocks.length === 0) {
    console.log('  No classes');
  } else {
    day.blocks.forEach(block => {
      console.log(`  ${block.periodName} (${block.startTime}-${block.endTime}):`);
      block.classes.forEach(cls => {
        console.log(`    - ${cls.title} in ${cls.location}`);
      });
    });
  }
});

console.log('\n=== Summary ===');
result.forEach((day, index) => {
  const dayName = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][day.weekday];
  const classCount = day.blocks.reduce((sum, block) => sum + block.classes.length, 0);
  console.log(`${dayName}: ${day.blocks.length} periods, ${classCount} classes`);
});
