# Architecture Notes

## Middle School Schedule Structure Change (September 2026)

Aspen's Middle School period strings changed shape for the 2026-2027 year, which
broke the student schedule view (every academic block rendered as "Free Period").

### What changed in the data
- Blocks are numbered, not lettered: `BLOCK 3(Mon-Tues) BLOCK 6(Thur-Fri)`.
  The number is the slot's position in that day's bell schedule.
- The school still calls blocks by letter, and the letters rotate: Mon/Tue run
  A-F, Thu/Fri run D,E,F,A,B,C. So the example above is Block C on both days.
- Lunch and Recess are separate classes (`LUNCH(Mon-Fri)`, `RECESS(...)`) rather
  than one combined `L/R(...)` period.
- Project-based scheduling is gone. There are no more Project A/B/D/E variants.
- Wednesday is grade-specific for all four grades (5, 6, 7 and 8), with five
  numbered slots and a Brunch. Enrichment is slot 4 for grades 5-6, slot 1 for 7-8.
- WIN/Lunch/Recess times in the middle of the day differ per grade.

### What we do now
- `src/ui/scheduling/msSchedules.ts` holds a per-grade bell schedule, ported from
  the IACS start page extension (`svelte/src/Schedule/ms_schedule.ts`), which is
  the source of truth staff and students see. Keep the two in sync.
- Bell period ids use Aspen's own vocabulary (`block_1`..`block_6`, `adv`, `win`,
  `lunch`, `recess`, `brunch`), so parsed classes map onto periods by id alone.
- A block can hold several classes across the year (Art/Challenge/Health rotate
  through the same slot by term). We show all of them, joined with " / ", since
  we don't currently fetch term dates from Aspen.

High School parsing (`Block n(D1,D3)` cycle days) is unchanged.

## Schedule Parsing Architecture Change (July 2025)

### Previous Architecture
- Backend AWS Lambda function `studentSchedule.ts` handled SIS schedule parsing
- Frontend called backend API endpoint for schedule transformation
- Mixed approach with both frontend and backend parsing capabilities

### Current Architecture  
- **Frontend-only schedule parsing** using enhanced functions in `src/scheduling/`
- `parseProjectScheduleFromSIS()` handles complex Middle School and High School format parsing
- `buildStructuredSchedule()` creates final schedule output with proper bell schedule mapping
- `ScheduleTester.svelte` provides comprehensive 4-step debugging UI with beautiful visual display

### Benefits of Frontend Approach
- **Better debugging capabilities**: Step-by-step visualization of parsing process
- **Improved responsiveness**: No network latency for schedule processing
- **Easier testing**: Direct access to intermediate parsing steps
- **Better maintainability**: Single codebase for schedule logic
- **Enhanced user experience**: Immediate feedback and visual schedule display

### Removed Components
- `src/functions/studentSchedule.ts` - AWS Lambda function (redundant)
- `testScheduleAnalysis()` function in `src/data/sisData.ts` (used backend API)
- Backend schedule parsing test in `SISTest.svelte` (replaced with note directing to new tester)

### Current Testing
- Use `ScheduleTester.svelte` for comprehensive schedule testing
- 4-step debugging process shows: SIS parsing → schedule mapping → bell schedule selection → visual display
- Supports both Middle School project-based scheduling and High School cycle day scheduling
- Beautiful flex-based visual schedule display with time formatting and project class highlighting
