// Test the dual middle school schedule system

// Define the two different bell schedule variants
const msBellSchedules = {
  "project_schedule": {
    name: "middle_school_project",
    grades: ["05"],
    description: "For students with project-based classes (longer blocks)",
    schedules: [
      {
        days: [1, 2, 3, 4, 5], // Mon-Fri
        periods: [
          { id: 'block_a_project', name: 'Block A', startTime: '08:00', endTime: '10:00' }, // 2 hours
          { id: 'block_b_project', name: 'Block B', startTime: '10:15', endTime: '12:15' }, // 2 hours  
          { id: 'lunch', name: 'Lunch', startTime: '12:15', endTime: '13:00' },
          { id: 'block_c_project', name: 'Block C', startTime: '13:00', endTime: '15:00' }, // 2 hours
          { id: 'advisory', name: 'Advisory', startTime: '15:00', endTime: '15:30' }
        ]
      }
    ]
  },

  "regular_schedule": {
    name: "middle_school_regular",
    grades: ["05"],
    description: "For students with regular classes (shorter blocks)",
    schedules: [
      {
        days: [1, 2, 3, 4, 5], // Mon-Fri
        periods: [
          { id: 'block_a_regular', name: 'Block A', startTime: '08:00', endTime: '09:20' }, // 80 min
          { id: 'block_b_regular', name: 'Block B', startTime: '09:30', endTime: '10:50' }, // 80 min
          { id: 'block_c_regular', name: 'Block C', startTime: '11:00', endTime: '12:20' }, // 80 min
          { id: 'lunch', name: 'Lunch', startTime: '12:20', endTime: '13:00' },
          { id: 'block_d_regular', name: 'Block D', startTime: '13:00', endTime: '14:20' }, // 80 min
          { id: 'block_e_regular', name: 'Block E', startTime: '14:30', endTime: '15:50' }  // 80 min
        ]
      }
    ]
  }
};

// Function to determine schedule type from class list
function inferScheduleType(classes) {
  const projectKeywords = ['project', 'iacs'];
  const projectClassCount = classes.filter(cls =>
    projectKeywords.some(keyword =>
      cls.title.toLowerCase().includes(keyword)
    )
  ).length;

  // If student has any project classes, they're on the project schedule
  return projectClassCount > 0 ? 'project_schedule' : 'regular_schedule';
}

// Test with sample middle school data
const testStudent = {
  grades: ['05'],
  classes: [
    {
      title: "Social Studies Project Gr 5",
      periods: ["BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)"],
      location: "516"
    },
    {
      title: "Science Project Gr 5",
      periods: ["BLOCK A(Tues) BLOCK D(Fri) BLOCK E(Wed)"],
      location: "519"
    },
    {
      title: "Math Gr 5",
      periods: ["BLOCK A(Wed) BLOCK B(Thur-Fri) BLOCK D(Mon-Tues)"],
      location: "511"
    }
  ]
};

// Test the inference
const scheduleType = inferScheduleType(testStudent.classes);
const bellSchedule = msBellSchedules[scheduleType];

console.log('=== Schedule Type Inference Test ===');
console.log(`Student classes:`)
testStudent.classes.forEach(cls => {
  console.log(`  - ${cls.title}`);
});

console.log(`\nInferred schedule type: ${scheduleType}`);
console.log(`Bell schedule: ${bellSchedule.name}`);
console.log(`Description: ${bellSchedule.description}`);

console.log(`\nBell schedule periods:`);
bellSchedule.schedules[0].periods.forEach(period => {
  console.log(`  ${period.name}: ${period.startTime}-${period.endTime}`);
});

// Test the complex period parsing for this student  
console.log('\n=== Complex Period Parsing ===');

function parseComplexPeriod(periodString) {
  // Handle multi-block periods like "BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)"
  const results = [];
  const blockPattern = /BLOCK ([A-E])\(([^)]+)\)/g;
  let match;

  while ((match = blockPattern.exec(periodString)) !== null) {
    const blockName = match[1];
    const daysString = match[2];

    // Parse days
    let days = [];
    if (daysString.includes('-')) {
      // Range like "Mon-Fri" 
      const [start, end] = daysString.split('-');
      const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const startIdx = dayOrder.indexOf(start);
      const endIdx = dayOrder.indexOf(end);
      days = dayOrder.slice(startIdx, endIdx + 1);
    } else if (daysString.includes(',')) {
      // List like "Mon,Wed,Fri"
      days = daysString.split(',').map(d => d.trim());
    } else {
      // Single day
      days = [daysString];
    }

    results.push({
      block: `Block ${blockName}`,
      days: days
    });
  }

  return results;
}

testStudent.classes.forEach(cls => {
  console.log(`\n${cls.title}:`);
  cls.periods.forEach(periodString => {
    const parsed = parseComplexPeriod(periodString);
    console.log(`  Original: ${periodString}`);
    parsed.forEach(p => {
      console.log(`    ${p.block} on ${p.days.join(', ')}`);
    });
  });
});

// The key challenge: mapping "Block A" to the correct bell schedule period
// based on which schedule type the student is on
console.log('\n=== Mapping Challenge ===');
console.log('Challenge: "Block A" means different things:');
console.log('  - Project schedule: Block A = 8:00-10:00 (2 hours)');
console.log('  - Regular schedule: Block A = 8:00-9:20 (80 minutes)');
console.log('');
console.log('Solution: Infer schedule type first, then map periods correctly');
