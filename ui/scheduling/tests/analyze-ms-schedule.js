// Analyze the complex middle school scheduling pattern

const msScheduleData = {
  "projectClasses": [
    "Social Studies Project Gr 5",
    "Science Project Gr 5",
    "IACS 101"
  ],
  "regularClasses": [
    "Health Gr 5",
    "Art Gr 5",
    "Challenge Gr 5",
    "Math Gr 5",
    "Music Gr 5",
    "ELA Gr 5"
  ],
  "specialClasses": [
    "5/6 WIN Block",
    "Lunch 5/6",
    "Advisory Gr 5",
    "Enrichment 5-6"
  ]
};

// Extract class patterns from the sample data
const sampleClasses = [
  {
    title: "Social Studies Project Gr 5",
    periods: ["BLOCK A(Mon) BLOCK B(Wed) BLOCK D(Thur)"],
    type: "project"
  },
  {
    title: "Health Gr 5",
    periods: ["BLOCK A(Thur-Fri) BLOCK C(Mon-Tues)"],
    type: "regular"
  },
  {
    title: "Math Gr 5",
    periods: ["BLOCK A(Wed) BLOCK B(Thur-Fri) BLOCK D(Mon-Tues)"],
    type: "regular"
  },
  {
    title: "Science Project Gr 5",
    periods: ["BLOCK A(Tues) BLOCK D(Fri) BLOCK E(Wed)"],
    type: "project"
  },
  {
    title: "ELA Gr 5",
    periods: ["BLOCK B(Mon-Tues) BLOCK C(Wed) BLOCK E(Thur-Fri)"],
    type: "regular"
  },
  {
    title: "IACS 101",
    periods: ["BLOCK C(Thur-Fri) BLOCK E(Mon-Tues)"],
    type: "project"
  }
];

console.log('=== Middle School Schedule Pattern Analysis ===\n');

// Analyze which blocks appear for each type
const blockAnalysis = {
  project: new Set(),
  regular: new Set()
};

sampleClasses.forEach(cls => {
  cls.periods.forEach(periodString => {
    // Extract individual block assignments
    const blockMatches = periodString.match(/BLOCK [A-E]/g);
    if (blockMatches) {
      blockMatches.forEach(block => {
        blockAnalysis[cls.type].add(block);
      });
    }
  });
});

console.log('Blocks used by Project classes:', Array.from(blockAnalysis.project).sort());
console.log('Blocks used by Regular classes:', Array.from(blockAnalysis.regular).sort());

// Look for overlapping blocks (same block, different meanings)
const projectBlocks = blockAnalysis.project;
const regularBlocks = blockAnalysis.regular;
const overlappingBlocks = new Set([...projectBlocks].filter(block => regularBlocks.has(block)));

console.log('Overlapping blocks (same name, different meanings):', Array.from(overlappingBlocks).sort());

// Analyze day patterns for each block type
console.log('\n=== Day Pattern Analysis ===');

function extractDayPatterns(periodString) {
  // Extract patterns like "BLOCK A(Mon)" or "BLOCK C(Thur-Fri)"
  const patterns = [];
  const blockPattern = /BLOCK ([A-E])\(([^)]+)\)/g;
  let match;

  while ((match = blockPattern.exec(periodString)) !== null) {
    patterns.push({
      block: `BLOCK ${match[1]}`,
      days: match[2]
    });
  }

  return patterns;
}

sampleClasses.forEach(cls => {
  console.log(`\n${cls.title} (${cls.type}):`);
  cls.periods.forEach(periodString => {
    const patterns = extractDayPatterns(periodString);
    patterns.forEach(pattern => {
      console.log(`  ${pattern.block}: ${pattern.days}`);
    });
  });
});

// Try to infer the two different schedules
console.log('\n=== Schedule Inference ===');

// Group by class type and look for patterns
const projectBlockDays = new Map();
const regularBlockDays = new Map();

sampleClasses.forEach(cls => {
  const targetMap = cls.type === 'project' ? projectBlockDays : regularBlockDays;

  cls.periods.forEach(periodString => {
    const patterns = extractDayPatterns(periodString);
    patterns.forEach(pattern => {
      if (!targetMap.has(pattern.block)) {
        targetMap.set(pattern.block, new Set());
      }
      targetMap.get(pattern.block).add(pattern.days);
    });
  });
});

console.log('\nProject class block patterns:');
for (const [block, daysSet] of projectBlockDays) {
  console.log(`  ${block}: ${Array.from(daysSet).join(', ')}`);
}

console.log('\nRegular class block patterns:');
for (const [block, daysSet] of regularBlockDays) {
  console.log(`  ${block}: ${Array.from(daysSet).join(', ')}`);
}

// The key insight: we need to determine which schedule a student is on
// based on their class assignments, then apply the correct bell schedule
console.log('\n=== Key Insights ===');
console.log('1. Same block names (A, B, C, D, E) have different meanings depending on schedule type');
console.log('2. Project classes = longer blocks, fewer per day');
console.log('3. Regular classes = shorter blocks, more per day');
console.log('4. We need to infer schedule type from class assignments');
console.log('5. Then apply the appropriate bell schedule for that type');
