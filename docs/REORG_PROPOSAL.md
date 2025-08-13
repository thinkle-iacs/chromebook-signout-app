# Source Reorganization Proposal (Shallow Feature Folders)

You asked to avoid an extra `features/` layer. Proposal keeps top-level feature domains directly under `src/`.

## Goals

- Group related UI + data modules together (co-location)
- Reduce root clutter (current many loose `.svelte` + `data/*.ts` files)
- Make domain ownership obvious (tickets, assets, students, etc.)
- Keep shallowish paths (`src/tickets/...`) for ergonomics
- Isolate shared/generic pieces clearly

## Phase One:

[x] Make an alias for importing data code so we don't have to keep track of ../ ../../ etc.
[x] Update all data/ imports in project to use alias (@data).
[x] Test and make sure that didn't break anything.

**✅ COMPLETED** - @data alias working, build passes, dev server running.

## Phase 1.5

[x] Make an alias components/ to @components
[x] Change all references to ../components/ to be @components/
[x] Move @components to ui/components

**✅ COMPLETED** - @components alias working, global components moved to ui/components/, build passes. Note: ticket-specific components remain in tickets/components/ as feature-local components.

## Phase Two:

- [x ] Migrate other UI code into ui/ directory
  - [ x] Move sub-directories with feature branches into ui, updating any imports of them to @ui/subdir/
    - [x ] tickets
    - [x ] reports
    - [x ] scheduling
- [x ] Move remaining root dir .svelte files (src/\*.svelte) into ui/

- [x ] If we keep App.svelte in the main directory, then we will have to update it's imports, otherwise, update our build command to point to ui/App.svelte

## Phase Three: Move a Feature

\*\* Note: use git mv to move files so we keep history, and first move files, then update imports rather than risking creating dups.
[x] Bundle all notification/messaging related ui code in a subdirectory ui/notifications
[x] Make an alias for it so we can reference ui/components without digging through ../ ../../ layers
[x] Search through code to understand components and move items, updating imports so they work.
[x] Test that we have not broken anything.

**✅ COMPLETED** - @notifications alias working, all notification/messaging components moved to ui/notifications/ with internal components in components/ subdirectory, build passes, dev server running.

## Phase Four: Keep on going...

- Identify next feature that should be bundled...
- Create subdirectory after confirming name is good
- Move/Update
- Rinse Repeat until ui/ directory is free of clutter.

More things to move to generic components...

- [x] [x] ListInput (moved to @components)

- [x] [x] assets
  - [x] [x] ChromebookInfoDisplay
  - [x] [x] AssetDisplay
  - [x] [x] LookupAsset
  - [x] [x] Checkout
- [x] [x] people
  - [x] [x] components
    - [x] [x] NameDropdown
  - [x] [x] students
    - [x] [x] LookupStudent
    - [x] [x] StudentInfo
    - [x] [x] StudentNote
    - [x] [x] StudentTag
  - [x] [x] staff
    - [x] [x] LookupStaff
  - [x] [x] contacts
    - [x] [x] Contacts.svelte
- [x] [x] googleAdmin
  - [x] [x] StudentGoogleAdminHistory
- [x] [x] contracts
  - [x] [x] StudentContractStatus
  - [x] [x] Contracts
  - [x] [x] Invoices
- [x] [x] history
  - [x] [x] SignoutHistoryTable
  - [x] [x] History
- [x] [x] auth
  - [x] [x] LogIn.svelte
- [x] [x] utils
  - [x] [x] util.ts
  - [x] [x] validators.ts

**Remaining at top level:** App.svelte, TestMenu.svelte

**✅ PHASE COMPLETE!** All components moved and imports updated. Build passes successfully!
