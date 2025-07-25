// Basic period parsing logic to test independently

// Function to extract days from period string
function extractDaysFromPeriod(periodString) {
  console.log('Parsing period:', periodString);

  // Extract the part in parentheses
  const match = periodString.match(/\(([^)]+)\)/);
  if (!match) {
    console.log('  No parentheses found');
    return [];
  }

  const daysPart = match[1];
  console.log('  Days part:', daysPart);

  // Handle ranges like "Mon-Fri"
  if (daysPart.includes('-')) {
    const [start, end] = daysPart.split('-');
    console.log(`  Range detected: ${start} to ${end}`);

    // Expand the range
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const startIndex = dayOrder.indexOf(start);
    const endIndex = dayOrder.indexOf(end);

    if (startIndex === -1 || endIndex === -1) {
      console.log(`  Warning: Invalid day range ${start}-${end}`);
      return [daysPart];
    }

    const rangeDays = [];
    for (let i = startIndex; i <= endIndex; i++) {
      rangeDays.push(dayOrder[i]);
    }
    console.log('  Expanded range to:', rangeDays);
    return rangeDays;
  }

  // Handle comma-separated days like "Mon,Wed,Fri"
  if (daysPart.includes(',')) {
    const days = daysPart.split(',').map(d => d.trim());
    console.log('  Comma-separated days:', days);
    return days;
  }

  // Single day
  console.log('  Single day:', daysPart);
  return [daysPart];
}

// Test cases based on the actual SIS data we've seen
const testPeriods = [
  'Block 1(Mon-Fri)',
  'Block 2(Tue,Thu)',
  'Block 3(Mon,Wed,Fri)',
  'Advisory(Mon-Fri)',
  'Block 4(Mon-Fri)',
  // These might be the problematic ones causing "4 different block 4 classes Monday"
  'Block 4 Block 4 Block 4 Block 4(Mon-Fri)',
  'Weird Period Name(Multiple,Days,Listed)'
];

console.log('=== Period Parsing Analysis ===');
testPeriods.forEach(period => {
  const days = extractDaysFromPeriod(period);
  console.log(`Result for "${period}":`, days);
  console.log('---');
});

// Test the weekday conversion
function convertDayNameToWeekday(dayName) {
  const dayMap = {
    'Mon': 1, 'Monday': 1,
    'Tue': 2, 'Tuesday': 2,
    'Wed': 3, 'Wednesday': 3,
    'Thu': 4, 'Thursday': 4,
    'Fri': 5, 'Friday': 5,
    'Sat': 6, 'Saturday': 6,
    'Sun': 7, 'Sunday': 7
  };

  return dayMap[dayName] || null;
}

console.log('=== Day Name Conversion ===');
['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Monday', 'Tuesday', 'Unknown'].forEach(day => {
  console.log(`${day} -> weekday ${convertDayNameToWeekday(day)}`);
});
