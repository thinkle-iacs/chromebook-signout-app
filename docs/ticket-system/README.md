# Ticket & Billing System - Project Overview

**Goal:** Implement a comprehensive ticket and billing system to replace the current Google spreadsheet workflow and enable better tracking of repairs, loans, and invoicing.

## Key Problems Being Solved

1. **Inventory/Ticket Disconnect** - Current google sheet with student tickets is separate from Chromebook app with inventory data
2. **Billing Disconnect** - No integration between inventory/tickets and invoicing families + difficulty following up on invoices
3. **Unclear Repair Status** - Ambiguous how to mark machines in for repair and temporary loaner machines out to students
4. **Manual Billing Process** - Difficulty generating and following up on invoices (currently falls on librarian, should be handled by business office)

## Project Documents

- **[User Stories](./STORIES.md)** - Detailed user scenarios and workflows for all personas
- **[Database Schema](./SCHEMA.md)** - AirTable table designs, fields, and relationships
- **[Implementation TODO](./TODO.md)** - Phase-by-phase development tasks and priorities

## Quick Reference

### Primary User Personas

- **CB Tech**: Repairs devices, manages loaner assignments, handles quick fixes
- **Librarian**: Intake/checkout interface, manages student interactions
- **Student/Staff**: End users who need repairs or have issues

### Systems Being Replaced

- "Chromebook Repairs & Fees" (Google Sheet)
- "Chromebook Ticket (Responses)" (Google Form responses sheet)
- Library's separate temp tracking system

### New Unified System

- AirTable Tickets table (replaces all of the above)
- Integrated temp device tracking in main CB app
- Business office handles invoicing (they already have software for this)

## Development Phases

**Phase 0** - Google Form Integration (Immediate Priority)

- Update Google Form backend to route to AirTable instead of Sheets
- Keep existing GChat notifications
- Add ticket edit links for immediate triaging

**Phase 1 MVP** - Quick billing workflow

- Basic ticket lookup and triaging interface
- Simple cost entry and one-click billing notification

**Phase 2 Expansion** - Full workflow support

- Separate device/temp status tracking
- Automated student communications
- Tech repair workflow with complete context

**Phase 3** - Full System

- Management dashboard and analytics
- Advanced temp device management
- Enhanced notifications and alerts

## Critical Requirements

### Must-Have Workflow Changes

1. **Google Form Workflow (KEEP)** - Students fill out form from classroom first
2. **Scheduled Drop-off (NEW)** - Students cannot just show up unannounced
3. **Librarian-Controlled Pickup (NEW)** - Tech completes → alerts librarian → librarian prepares → triggers student email
4. **Communication CCs (NEW)** - Always CC advisors (grades 5-9) and parents (all grades)
5. **Temp Device Management (CRITICAL)** - Start with 30 temp devices in good condition

### Data Quality Issues (from Tech Team Feedback)

- Students make predictable errors in form submissions
- Asset tags: "ao333" instead of "A0333"
- Descriptions: "it wasn't my fault just feel" instead of actual issues
- **Solution**: Ticket triaging workflow to fix student errors immediately

### Flexible Workflows (from Tech Team Feedback)

- Support multiple repair paths: Student→Amy→Temp→Nick vs Student→Nick→QuickFix
- Separate device status and temp status tracking
- Allow temp assignment without knowing original asset tag

## Next Steps

1. Review [User Stories](./STORIES.md) to understand complete workflows
2. Examine [Database Schema](./SCHEMA.md) for AirTable setup requirements
3. Start with [Implementation TODO](./TODO.md) Phase 0 tasks
