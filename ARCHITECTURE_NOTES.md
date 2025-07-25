# Architecture Notes

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
