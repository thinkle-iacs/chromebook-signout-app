# Ticket & Billing System Implementation

**Goal:** Implement a comprehensive ticket and billing system to replace the current Google spreadsheet workflow and enable better tracking of repairs, loans, and invoicing.

## 📚 Project Documentation

This project has been broken down into manageable, focused documents:

- **[📋 Project Overview](./docs/ticket-system/README.md)** - High-level goals, problems, and development phases
- **[👥 User Stories](./docs/ticket-system/STORIES.md)** - Detailed workflows for all user personas (Students, Librarians, Techs, IT Director)
- **[🗄️ Database Schema](./docs/ticket-system/SCHEMA.md)** - Complete AirTable table designs, fields, relationships, and automations
- **[✅ Implementation TODO](./docs/ticket-system/TODO.md)** - Phase-by-phase development tasks with priorities

## 🚀 Quick Start

1. **Start Here**: Read the [Project Overview](./docs/ticket-system/README.md) for context
2. **Understand Workflows**: Review [User Stories](./docs/ticket-system/STORIES.md) to see complete user journeys
3. **Set Up Data**: Follow [Database Schema](./docs/ticket-system/SCHEMA.md) to configure AirTable
4. **Begin Development**: Use [Implementation TODO](./docs/ticket-system/TODO.md) for step-by-step tasks

## ⚡ Immediate Priority

**Phase 0: Google Form Integration**

- Update Google Form backend to route submissions to AirTable instead of Google Sheets
- Keep existing GChat notifications working
- Add ticket edit links for immediate triaging

See [TODO.md Phase 0](./docs/ticket-system/TODO.md#phase-0-google-form-integration-immediate-priority) for specific tasks.

## 🎯 Key Problems Being Solved

1. **Inventory/Ticket Disconnect** - Current google sheet with student tickets is separate from Chromebook app inventory data
2. **Billing Disconnect** - No integration between inventory/tickets and invoicing families + difficulty following up on invoices
3. **Unclear Repair Status** - Ambiguous how to mark machines in for repair and temporary loaner machines out to students
4. **Manual Billing Process** - Difficulty generating and following up on invoices (currently falls on librarian, should be handled by business office)

---

_This document previously contained all implementation details in a single large file. The content has been reorganized into focused, manageable documents linked above for better development workflow._
