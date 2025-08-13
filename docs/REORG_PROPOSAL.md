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
[ ] Bundle all notification/messaging related ui code in a subdirectory ui/notifications
[ ] Make an alias for it so we can reference ui/components without digging through ../ ../../ layers
[ ] Search through code to understand components and move items, updating imports so they work.
[ ] Test that we have not broken anything.

## Phase Four: Keep on going...

- Identify next feature that should be bundled...
- Create subdirectory after confirming name is good
- Move/Update
- Rinse Repeat until ui/ directory is free of clutter.

More things to move to generic components...

- [ ] ListInput

- [ ] assets
  - [ ] ChromebookInfoDisplay
  - [ ] AssetDisplay
  - [ ] LookupAsset
- [ ] people
  - [ ] components
    - [ ] NameDropdown
  - [ ] students
    - [ ] LookupStudent
    - [ ] StudentInfo
    - [ ] StudentNote
    - [ ] StudentTag
  - [ ] staff
    - [ ] LookupStaff
  - [ ] contacts
    - [ ] Contacts.svelte
- [ ] googleAdmin
  - [ ] StudentGoogleAdminHistory
- [ ] contracts
  - [ ] StudentContractStatus
  - [ ] Contracts
- [ ] history
  - [ ] SignoutHistoryTable
  - [ ] History
- [ ] auth
  - [ ] LogIn.svelte
- [ ] util
  - [ ] util
  - [ ] validator
- [ ] tickets
  - [ ] invoices
    - [ ] Invoices
- [ ] Checkout
- [ ] App
- [ ] Test
