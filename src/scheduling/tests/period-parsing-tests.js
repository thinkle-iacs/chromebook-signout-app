// COMPREHENSIVE PERIOD PARSING TEST SUITE
// Tests the progression from basic day mapping to complex project-based schedule inference

// Test data representing different period string complexities
const testCases = {
  // 1. BASIC SINGLE DAY MAPPING
  basicMS: {
    description: "MS: Basic single day block assignment",
    input: "BLOCK A(Mon)",
    expected: {
      Mon: [{ block: "BLOCK A", days: ["Mon"] }]
    }
  },

  basicHS: {
    description: "HS: Basic single day block assignment",
    input: "Block 1(D1)",
    expected: {
      D1: [{ block: "Block 1", days: ["D1"] }]
    }
  },

  // 2. DAY RANGE PARSING
  rangeMS: {
    description: "MS: Day range parsing with hyphen",
    input: "BLOCK A(Thur-Fri)",
    expected: {
      Thur: [{ block: "BLOCK A", days: ["Thur", "Fri"] }],
      Fri: [{ block: "BLOCK A", days: ["Thur", "Fri"] }]
    }
  },

  rangeHS: {
    description: "HS: Day range parsing with hyphen",
    input: "Block 2(D1-D3)",
    expected: {
      D1: [{ block: "Block 2", days: ["D1", "D2", "D3"] }],
      D2: [{ block: "Block 2", days: ["D1", "D2", "D3"] }],
      D3: [{ block: "Block 2", days: ["D1", "D2", "D3"] }]
    }
  },

  complexRangeMS: {
    description: "MS: Complex range with gaps",
    input: "BLOCK C(Mon-Tues)",
    expected: {
      Mon: [{ block: "BLOCK C", days: ["Mon", "Tues"] }],
      Tues: [{ block: "BLOCK C", days: ["Mon", "Tues"] }]
    }
  },

  // 3. COMMA-SEPARATED DAYS
  commaMS: {
    description: "MS: Comma-separated days",
    input: "WIN(Mon-Tues,Thur-Fri)",
    expected: {
      Mon: [{ block: "WIN", days: ["Mon", "Tues"] }],
      Tues: [{ block: "WIN", days: ["Mon", "Tues"] }],
      Thur: [{ block: "WIN", days: ["Thur", "Fri"] }],
      Fri: [{ block: "WIN", days: ["Thur", "Fri"] }]
    }
  },

  commaHS: {
    description: "HS: Comma-separated days",
    input: "Block 3(D2,D4)",
    expected: {
      D2: [{ block: "Block 3", days: ["D2"] }],
      D4: [{ block: "Block 3", days: ["D4"] }]
    }
  },

  // 4. MULTI-BLOCK PATTERNS (Complex)
  multiBlockMS: {
    description: "MS: Multiple blocks in one period string",
    input: "BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)",
    expected: {
      Mon: [{ block: "BLOCK A", days: ["Mon"] }],
      Wed: [{ block: "BLOCK B", days: ["Wed"] }],
      Thur: [{ block: "BLOCK D", days: ["Thur"] }]
    }
  },

  multiBlockHS: {
    description: "HS: Multiple blocks with ranges",
    input: "Block 1(D2) Block 2(D1,D4)",
    expected: {
      D1: [{ block: "Block 2", days: ["D1"] }],
      D2: [{ block: "Block 1", days: ["D2"] }],
      D4: [{ block: "Block 2", days: ["D4"] }]
    }
  },

  // 5. ADVANCED PROJECT CASES (MS Only)
  projectSocialStudiesGr5: {
    description: "MS: Social Studies Project Gr 5 pattern",
    input: "BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)",
    expected: {
      Mon: [{ block: "BLOCK A", days: ["Mon"], subject: "Social Studies" }],
      Wed: [{ block: "BLOCK B", days: ["Wed"], subject: "Social Studies" }],
      Thur: [{ block: "BLOCK D", days: ["Thur"], subject: "Social Studies" }]
    },
    projectInfo: {
      isProject: true,
      subject: "Social Studies",
      grade: "05"
    }
  },

  projectScienceGr5: {
    description: "MS: Science Project Gr 5 pattern",
    input: "BLOCK A(Tues) BLOCK D(Fri) BLOCK E(Wed)",
    expected: {
      Tues: [{ block: "BLOCK A", days: ["Tues"], subject: "Science" }],
      Wed: [{ block: "BLOCK E", days: ["Wed"], subject: "Science" }],
      Fri: [{ block: "BLOCK D", days: ["Fri"], subject: "Science" }]
    },
    projectInfo: {
      isProject: true,
      subject: "Science",
      grade: "05"
    }
  }
};

// Day name mappings for different school levels
const dayMappings = {
  MS: {
    // Middle School uses standard day names
    dayNames: ['Mon', 'Tues', 'Wed', 'Thur', 'Fri'],
    // Maps to actual calendar days
    dayToWeekday: {
      'Mon': 'Monday',
      'Tues': 'Tuesday',
      'Wed': 'Wednesday',
      'Thur': 'Thursday',
      'Fri': 'Friday'
    }
  },
  HS: {
    // High School uses D1-D5 day rotation
    dayNames: ['D1', 'D2', 'D3', 'D4', 'D5'],
    // Maps to actual calendar days (rotation schedule)
    dayToWeekday: {
      'D1': 'Monday',
      'D2': 'Tuesday',
      'D3': 'Wednesday',
      'D4': 'Thursday',
      'D5': 'Friday'
    }
  }
};

// Generic period parsing function that handles both MS and HS formats
function parsePeriodString(periodString, schoolLevel = 'MS', subjectInfo = null) {
  const mapping = dayMappings[schoolLevel];
  const result = {};

  // Handle multiple blocks in one string: "BLOCK A(Mon) BLOCK B(Wed)"
  const blockParts = periodString.split(/(?=(?:BLOCK [A-E]|Block \d+|WIN|Adv|L\/R))/);

  for (const part of blockParts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) continue;

    // Extract block name and day specification
    const blockMatch = trimmedPart.match(/^([^(]+)/);
    const dayMatch = trimmedPart.match(/\(([^)]+)\)/);

    if (!blockMatch || !dayMatch) continue;

    const blockName = blockMatch[1].trim();
    const daySpec = dayMatch[1];

    // Parse day specification: handles ranges (D1-D3) and comma-separated (D1,D3)
    const dayGroups = parseDaySpecification(daySpec, mapping.dayNames);

    // For each day group, create separate entries
    for (const dayGroup of dayGroups) {
      for (const day of dayGroup) {
        if (!result[day]) result[day] = [];

        const entry = {
          block: blockName,
          days: dayGroup
        };

        // Add subject info if provided (for project classes)
        if (subjectInfo) {
          entry.subject = subjectInfo;
        }

        result[day].push(entry);
      }
    }
  }

  return result;
}

// Parse day specifications like "Mon-Wed", "D1,D3", "Mon-Tues,Thur-Fri"
function parseDaySpecification(daySpec, validDays) {
  const dayGroups = [];

  // Split by comma first: "Mon-Tues,Thur-Fri" -> ["Mon-Tues", "Thur-Fri"]
  const parts = daySpec.split(',').map(p => p.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      // Handle range: "Mon-Wed" or "D1-D3"
      const [start, end] = part.split('-').map(d => d.trim());
      const startIdx = validDays.indexOf(start);
      const endIdx = validDays.indexOf(end);

      if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
        dayGroups.push(validDays.slice(startIdx, endIdx + 1));
      }
    } else {
      // Single day
      if (validDays.includes(part)) {
        dayGroups.push([part]);
      }
    }
  }

  return dayGroups;
}

// Deep equality check for objects (order-independent)
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return false;

  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 === 'object') {
    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();

    if (keys1.length !== keys2.length) return false;

    for (let i = 0; i < keys1.length; i++) {
      if (keys1[i] !== keys2[i]) return false;
      if (!deepEqual(obj1[keys1[i]], obj2[keys2[i]])) return false;
    }

    return true;
  }

  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2) || obj1.length !== obj2.length) return false;

    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }

    return true;
  }

  return obj1 === obj2;
}

// Test runner
function runTests() {
  console.log('🧪 PERIOD PARSING TEST SUITE');
  console.log('=' * 50);

  let passed = 0;
  let total = 0;

  for (const [testName, testCase] of Object.entries(testCases)) {
    total++;
    console.log(`\n🔍 ${testCase.description}`);
    console.log(`   Input: "${testCase.input}"`);

    // Determine school level from test name
    const schoolLevel = testName.includes('HS') ? 'HS' : 'MS';

    try {
      const subjectInfo = testCase.projectInfo ? testCase.projectInfo.subject : null;
      const result = parsePeriodString(testCase.input, schoolLevel, subjectInfo);

      // Compare result with expected (order-independent)
      const testPassed = deepEqual(result, testCase.expected);

      if (testPassed) {
        console.log(`   ✅ PASS`);
        passed++;
      } else {
        console.log(`   ❌ FAIL`);
        console.log(`   Expected: ${JSON.stringify(testCase.expected, null, 2)}`);
        console.log(`   Got: ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
  }

  console.log(`\n📊 RESULTS: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All tests passed! Ready for project schedule inference.');
  } else {
    console.log('🔧 Some tests failed. Need to fix parsing logic.');
  }
}

// Run the test suite
runTests();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parsePeriodString,
    parseDaySpecification,
    dayMappings,
    testCases
  };
}
