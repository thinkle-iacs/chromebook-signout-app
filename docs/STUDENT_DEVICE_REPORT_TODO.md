# Student Device Report TODO

## Research Notes

- Existing Google Admin access is already wrapped by `src/functions/googleAdmin.ts`.
  - `mode=google&user=email` returns ChromeOS devices associated with a user.
  - `mode=google&serial=serial` returns one ChromeOS device by serial.
- Current reports already fetch inventory/student-loan rows from Airtable and can enrich assets with Google Admin data.
- Student lookup is currently name-search oriented and capped at 100 records, so this feature needs a report-oriented student query that can return all students for a YOG/status or uploaded email list.
- Inventory can already fetch all Chromebooks with current student/staff ownership fields, which is enough to classify each Google-last-used machine as normal, signed out to someone else, checked in, or missing from inventory.

## Implementation Slices

1. Add report-mode student query.
   - Filter by YOG.
   - Filter by `Active`, `Inactive`, or all.
   - Filter by uploaded email list.
   - Return enough fields to render students with zero machine history.

2. Add data aggregation layer.
   - Fetch selected students.
   - Fetch all Chromebook inventory once and index by serial.
   - Fetch Google Admin devices for each selected student with capped concurrency.
   - Build per-student rows with current loans, last-used machines, counts, and status classification.

3. Add UI under Reports.
   - New tab: Student Device Report.
   - Input mode for class year or pasted/uploaded email list.
   - Student status selector.
   - Progress while Google lookups run.
   - Sort by current loans, last-used machines, and problem count.
   - Show status icons/colors for normal, signed out to someone else, checked in, and unknown inventory.

4. Export.
   - Add CSV export for flattened machine rows.
   - Include zero-machine students in export.

5. Follow-up questions.
   - Should uploaded lists be treated as an exact email allow-list plus status filter, or should status be ignored for explicit lists?
   - Should old Google Admin activity be considered stale/problematic at a specific threshold, or only informational?
   - Should staff-signed-out machines be a separate warning category from student-signed-out-to-other?
