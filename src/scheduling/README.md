# Scheduling System

This directory contains all the scheduling logic for the chromebook signout app.

## Directory Structure

```
src/scheduling/
├── README.md                 # This file
├── types/                    # TypeScript type definitions
│   └── index.ts             # Core scheduling interfaces
├── bellSchedules.ts         # Bell schedule definitions and logic
├── structuredSchedule.ts    # Schedule transformation logic
└── tests/                   # All test files
    ├── debug-ms-schedule.js
    ├── test-class-frequency.js
    ├── test-class-frequency-unit.js
    ├── test-dual-schedule.js
    ├── test-integration-mapping.js
    ├── test-period-parsing.js
    └── test-schedule-transform.js
```

## Core Files

### `types/index.ts`

- Contains all TypeScript interfaces and types
- `BellSchedule`, `ScheduleBlock`, `SISClass`, etc.

### `bellSchedules.ts`

- Bell schedule definitions (regular + project-based variants)
- Schedule variant selection logic
- Period mapping functions

### `structuredSchedule.ts`

- Main schedule transformation logic
- Converts SIS data to frontend-friendly format
- Handles day-specific schedule selection

## Current Issues

The system has a complex bug where:

1. Regular classes (like Math) should appear once per day
2. But they're appearing multiple times due to mapping issues
3. The project-based schedule system uses different period IDs than the regular schedule
4. The mapping function isn't properly handling the different ID schemes

## Key Functions

- `getBellScheduleVariantForDay()` - Determines which bell schedule variant to use for a specific day
- `mapSISPeriodToBellPeriod()` - Maps SIS period strings to bell schedule periods
- `buildStructuredSchedule()` - Main transformation function

## Testing

All test files are in the `tests/` directory. Run them individually with Node.js to debug specific issues.

## Next Steps

1. Debug the period mapping issue
2. Ensure each class appears only once per day
3. Clean up the bell schedule variant selection logic
4. Add proper error handling and logging
