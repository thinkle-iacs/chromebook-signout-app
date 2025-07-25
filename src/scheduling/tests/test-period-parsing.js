// Simple test to identify the class duplication issue
// Testing the period parsing logic directly

console.log('=== Class Frequency Debug Test ===\n');

// Mock the period parsing function based on what we see in the codebase
function parseComplexPeriod(periodString, targetDay) {
  // Parse a period string like "BLOCK A(Mon-Tues) BLOCK C(Thur-Fri) BLOCK E(Wed)"
  // and return the blocks for the target day
  
  const dayAbbreviations = {
    1: 'Mon',
    2: 'Tues', 
    3: 'Wed',
    4: 'Thur',
    5: 'Fri'
  };
  
  const targetDayAbbrev = dayAbbreviations[targetDay];
  const blocks = [];
  
  // Split by "BLOCK" and process each part
  const parts = periodString.split('BLOCK').filter(part => part.trim());
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Extract block letter and days
    const blockMatch = trimmed.match(/^([A-E])\((.*?)\)/);
    if (blockMatch) {
      const blockLetter = blockMatch[1];
      const daysString = blockMatch[2];
      
      // Check if target day is in this block's days
      if (daysString.includes(targetDayAbbrev)) {
        blocks.push(blockLetter);
      }
    }
  }
  
  return blocks;
}

// Test data from the user's example
const testClass = {
  title: "Math Gr 5",
  periods: ["BLOCK A(Mon-Tues) BLOCK C(Thur-Fri) BLOCK E(Wed)"],
  location: "511"
};

console.log('Testing class:', testClass.title);
console.log('Period string:', testClass.periods[0]);
console.log();

// Test each day
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

days.forEach((dayName, index) => {
  const dayNum = index + 1;
  const blocks = parseComplexPeriod(testClass.periods[0], dayNum);
  
  console.log(`${dayName} (${dayNum}): Blocks [${blocks.join(', ')}]`);
  
  if (blocks.length === 0) {
    console.log('  ✅ No class scheduled');
  } else if (blocks.length === 1) {
    console.log('  ✅ One block scheduled - CORRECT');
  } else {
    console.log(`  ❌ Multiple blocks scheduled - PROBLEM! (${blocks.length} blocks)`);
  }
});

console.log('\n--- Expected vs Actual ---');
console.log('Expected:');
console.log('  Monday: Block A (from "Mon-Tues")');
console.log('  Tuesday: Block A (from "Mon-Tues")'); 
console.log('  Wednesday: Block E (from "Wed")');
console.log('  Thursday: Block C (from "Thur-Fri")');
console.log('  Friday: Block C (from "Thur-Fri")');

console.log('\nThe issue might be in how we\'re building the schedule.');
console.log('If Math shows up 3 times on Wednesday, it suggests:');
console.log('1. The period parsing is working correctly (Block E only)');
console.log('2. But something in buildStructuredSchedule is creating duplicates');
console.log('3. Possibly the bell schedule mapping is causing the issue');

// Let's also test a project class
const projectClass = {
  title: "Science Project Gr 5",
  periods: ["BLOCK A(Tues) BLOCK D(Fri) BLOCK E(Wed)"],
  location: "519"
};

console.log('\n=== Testing Project Class ===');
console.log('Testing class:', projectClass.title);
console.log('Period string:', projectClass.periods[0]);

days.forEach((dayName, index) => {
  const dayNum = index + 1;
  const blocks = parseComplexPeriod(projectClass.periods[0], dayNum);
  console.log(`${dayName}: Blocks [${blocks.join(', ')}] - ${blocks.length === 1 ? '✅' : blocks.length === 0 ? 'No class' : '❌ Multiple!'}`);
});

console.log('\nProject classes should appear exactly 3 times per week:');
console.log('  Tuesday: Block A');
console.log('  Wednesday: Block E'); 
console.log('  Friday: Block D');
console.log('Total: 3 times per week ✅');
