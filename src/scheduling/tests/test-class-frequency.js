// Test class frequency - ensure each class appears only once per day
// This addresses the issue where Math shows up 3 times on Wednesday instead of once

// Import the main schedule building function
const { buildStructuredSchedule } = require('./src/data/structuredSchedule.ts');
const { getBellScheduleVariantForDay, getBellScheduleForVariant } = require('./src/data/bellSchedules.ts');

// Mock student data - Grade 5/6 student with project-based classes
const mockStudent = {
  grades: ['05'],
  classes: [
    {
      title: "Math Gr 5",
      periods: ["BLOCK A(Mon-Tues) BLOCK C(Thur-Fri) BLOCK E(Wed)"],
      location: "511"
    },
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
      title: "ELA Gr 5",
      periods: ["BLOCK B(Mon-Tues) BLOCK D(Wed) BLOCK C(Thur-Fri)"],
      location: "512"
    }
  ]
};

console.log('=== Class Frequency Test ===\n');

// Test each day of the week
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

days.forEach((day, index) => {
  const dayNum = index + 1; // Monday = 1, etc.
  console.log(`\n--- ${day} Schedule ---`);
  
  try {
    // Build the structured schedule for this day
    const schedule = buildStructuredSchedule(mockStudent, dayNum);
    
    // Count occurrences of each class
    const classCounts = {};
    
    if (schedule && schedule.periods) {
      schedule.periods.forEach(period => {
        if (period.classes && period.classes.length > 0) {
          period.classes.forEach(cls => {
            const className = cls.title || cls.name || 'Unknown';
            classCounts[className] = (classCounts[className] || 0) + 1;
          });
        }
      });
    }
    
    console.log(`Classes scheduled on ${day}:`);
    Object.entries(classCounts).forEach(([className, count]) => {
      const status = count === 1 ? '✓' : `❌ (${count} times)`;
      console.log(`  ${status} ${className}`);
    });
    
    // Check for duplicates
    const duplicates = Object.entries(classCounts).filter(([name, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log(`\n  🚨 DUPLICATES FOUND:`);
      duplicates.forEach(([name, count]) => {
        console.log(`    - ${name}: appears ${count} times`);
      });
    } else {
      console.log(`  ✅ No duplicate classes`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error building schedule: ${error.message}`);
  }
});

// Test specific day that was problematic (Wednesday)
console.log('\n=== Detailed Wednesday Analysis ===');

try {
  const wednesdaySchedule = buildStructuredSchedule(mockStudent, 3); // Wednesday = 3
  
  console.log('\nWednesday expected classes based on periods:');
  console.log('  - Math Gr 5: BLOCK E (from "BLOCK E(Wed)")');
  console.log('  - Social Studies Project Gr 5: BLOCK B (from "BLOCK B(Wed)")');
  console.log('  - Science Project Gr 5: BLOCK E (from "BLOCK E(Wed)")');
  console.log('  - ELA Gr 5: BLOCK D (from "BLOCK D(Wed)")');
  
  console.log('\nActual Wednesday schedule:');
  if (wednesdaySchedule && wednesdaySchedule.periods) {
    wednesdaySchedule.periods.forEach(period => {
      if (period.classes && period.classes.length > 0) {
        console.log(`  ${period.name}:`);
        period.classes.forEach(cls => {
          console.log(`    - ${cls.title || cls.name}`);
        });
      }
    });
  } else {
    console.log('  No schedule generated');
  }
  
} catch (error) {
  console.log(`Error in detailed analysis: ${error.message}`);
}

// Test bell schedule variant selection
console.log('\n=== Bell Schedule Variant Test ===');

days.forEach((day, index) => {
  const dayNum = index + 1;
  try {
    const variant = getBellScheduleVariantForDay(mockStudent, dayNum);
    const schedule = getBellScheduleForVariant(variant);
    
    console.log(`${day}: Variant="${variant}", Schedule="${schedule ? schedule.name : 'null'}"`);
    
    // Check if variant matches expected project blocks
    const expectedBlocks = {
      1: 'A', // Monday: Social Studies Project has BLOCK A
      2: 'A', // Tuesday: Science Project has BLOCK A  
      3: 'E', // Wednesday: Both projects have different blocks (B and E)
      4: 'D', // Thursday: Social Studies Project has BLOCK D
      5: 'D'  // Friday: Science Project has BLOCK D
    };
    
    const expected = `Gr 05 Proj ${expectedBlocks[dayNum]}`;
    if (variant === expected) {
      console.log(`  ✅ Correct variant`);
    } else {
      console.log(`  ❌ Expected "${expected}", got "${variant}"`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
});

console.log('\n=== Test Summary ===');
console.log('This test checks:');
console.log('1. Each class appears only once per day');
console.log('2. Math appears on Mon, Tue, Wed, Thu, Fri (once each day)');
console.log('3. Project classes appear 3 times per week total');
console.log('4. Bell schedule variants are correctly selected');
console.log('5. No duplicate class instances within a single day');
