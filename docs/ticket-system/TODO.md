# Implementation TODO

## Phase 0: Google Form Integration (Immediate Priority)

### 0.0 External Project Coordination

**Google Apps Script Project Location:** `/Users/thinkle/BackedUpProjects/gas/chromebook-ticket-system/form-processor`

- [ ] **Coordinate with Google Apps Script project**
  - [ ] Review current form processor implementation
  - [ ] Identify current Google Sheets integration points
  - [ ] Plan AirTable integration approach
  - [ ] Update form processor to route to AirTable instead of Sheets
  - [ ] Test integration between GAS project and this Chromebook app
  - [ ] Ensure GChat notifications continue working
  - [ ] Document any environment variables/configuration needed

**Note:** The Google Apps Script project manages the Google Form backend separately. Changes there will need to be coordinated with this project for the AirTable integration.

### 0.1 Prepare AirTable

- [ x ] **Prepare AirTable**
  - [ x ] Create Airtable "Tickets" table that mirrors current spreadsheet (possibly import data?)
  - [ x ] Refine/Improve schema for Tickets table (add lookup fields for asset, student, temp device, etc)
  - [ x ] Create automations in AirTable as needed / lookup fields back (so we can see e.g. tickets from asset table)
  - [ x ] Create airtable connectors here for new "Tickets" table.

### 0.2 Modify Existing Google Form Backend

- [ ] **Update Google Form submission handler**
  - [ ] Change destination from Google Sheets to AirTable Tickets table
  - [ ] Keep existing GChat API notification (don't break current workflow)
  - [ ] Map form fields to Ticket table fields
  - [ ] Add error handling for AirTable API calls
  - [ ] Test with existing form to ensure no student-facing changes

### 0.3 Form Field Mapping

- [ ] **Map Google Form responses to Ticket fields**
  - [ ] Student info → Link to Students table
  - [ ] Asset tag → Link to Inventory table
  - [ ] Issue description → Issue Description field
  - [ ] Priority/urgency → Priority field
  - [ ] Photos/attachments → Photos field
  - [ ] Set default Status to "New"
  - [ ] Auto-populate Date Created

### 0.4 Transition Strategy

- [ ] **Phase out Google Sheets dependency**
  - [ ] Run dual system temporarily (both Sheets and Tickets)
  - [ ] Verify data consistency between old and new systems
  - [ ] Migrate any pending tickets from Sheets to AirTable
  - [ ] Remove Sheets integration once confident in new system

---

## Phase 1: AirTable Schema Setup

### 1.1 Create Tickets Table

- [ x ] **Create new table called "Tickets" in AirTable**
- [ x ] **Add all core fields** (see [SCHEMA.md](./SCHEMA.md) for complete field list)
- [ ] **Create Ticket Editor UI**
  - [ x ] Basic field editing
  - [ x ] Linked field editing (student, asset)
  - [ ] Device status update (on device table)
  - [ ] Workflows for common actions like...
    - [ ] Sign-out temp device that's needed
    - [ ] Check in device for repair
    - [ ] Return repaired device & collect temp device
- [ ] **Create views for different ticket statuses**
  - [ ] Untriaged - New tickets needing staff review
  - [ ] Active - All open tickets
  - [ ] In Repair - Currently with tech
  - [ ] Ready for Pickup - Completed repairs
- [ ] **Add automation rules for status transitions**

### 1.2 Create Billing Notifications Table

- [ ] **Create new table called "Billing Notifications"**
- [ ] **Add all billing fields** (see [SCHEMA.md](./SCHEMA.md))
- [ ] **Create automation: When record created → Email business office**

### 1.3 Update Existing Tables

- [ ] **Inventory Table Updates:**
  - [ ] Add "Repair Status" field
  - [ ] Add "Original Owner" field
  - [ ] Add "Temporary Assignment" field
  - [ ] Add "Related Tickets" field
- [ ] **Students Table Updates:**
  - [ ] Add "Active Tickets" field
  - [ ] Add "Billing Notifications" field
- [ ] **Staff Table Updates:**
  - [ ] Add "Assigned Tickets" field

### 1.4 Configure Relationships & Automations

- [ ] **Set up all table relationships** (see [SCHEMA.md](./SCHEMA.md))
- [ ] **Configure AirTable automations** for status changes
- [ ] **Set up student communication automations**
- [ ] **Test API access and create TypeScript interfaces**

---

## Phase 1 MVP: Ticket Triaging & Billing

### 1.0 Optional Enhancement: SIS API Integration

#### Student Schedule Lookup (`src/functions/sisApi.ts`)

- [ ] **Secure SIS API endpoint**

  - [ ] Implement authentication header validation (session token)
  - [ ] Verify user email domain and staff status
  - [ ] Rate limiting to prevent abuse
  - [ ] Input validation and sanitization
  - [ ] Audit logging for all SIS access attempts

- [ ] **OpenRoster API Integration**

  - [ ] Set up SIS_CLIENT_IDENTIFIER in Netlify environment variables
  - [ ] Set up SIS_SECRET in Netlify environment variables
  - [ ] Set up SIS_URL in Netlify environment variables
  - [ ] Implement SIS authentication endpoint to get Bearer token
  - [ ] Create function to lookup student by email (first API call)
  - [ ] Create function to lookup student schedule by student ID (second API call)
  - [ ] Filter schedule data to show only relevant course info
  - [ ] Extract advisory period times for optimal student contact
  - [ ] Error handling for API failures and missing students

- [ ] **Frontend Integration**
  - [ ] Add "Show Student Schedule" button to student lookup results
  - [ ] Display advisory times and current courses in ticket context
  - [ ] Show "best time to contact" recommendations
  - [ ] Graceful fallback when SIS data unavailable

**Security Note:** SIS endpoint must validate staff authentication before returning any student data. Never expose student schedule information to unauthenticated users.

### 1.1 Backend API Development

#### Ticket Management (`src/functions/tickets.ts`)

- [ ] **Create Ticket function**

  - [ ] Validate ticket data (Asset ID, Student ID, Issue Description)
  - [ ] Create ticket record in AirTable with linked records
  - [ ] Send confirmation notifications to student/staff
  - [ ] Return created ticket with all linked data

- [ ] **Update Ticket Status function**

  - [ ] Handle status transitions via AirTable API
  - [ ] Fetch updated linked records after status change
  - [ ] Trigger notifications for status changes

- [ ] **Ticket Search & Retrieval**
  - [ ] Get tickets by student (using AirTable filtering)
  - [ ] Get tickets by asset (using linked record queries)
  - [ ] Get open tickets (filter by Status field)
  - [ ] Universal search: Accept asset tags, student names, or ticket numbers

#### Billing Functions (`src/functions/billing.ts`)

- [ ] **Create Billing Notification function**
  - [ ] Extract student/asset info from ticket
  - [ ] Create billing notification record in AirTable
  - [ ] Trigger AirTable automation to email business office

### 1.2 Frontend UI Components

#### Ticket Triage Interface (`src/TicketTriage.svelte`)

- [ ] **View untriaged tickets from Google Form submissions**
- [ ] **Edit asset tags with dropdown corrections** (A0333 vs ao333)
- [ ] **Fix student mappings with lookup and autocomplete**
- [ ] **Clean up issue descriptions**
- [ ] **Mark tickets as triaged when corrections complete**

#### Basic Ticket Views

- [ ] **Ticket Dashboard** (`src/TicketDashboard.svelte`)

  - [ ] View all open tickets
  - [ ] Filter by status, priority, student, asset
  - [ ] Quick status update actions
  - [ ] Search functionality

- [ ] **Ticket Detail View** (`src/TicketDetail.svelte`)
  - [ ] Full ticket information display
  - [ ] Status update interface
  - [ ] Repair notes and cost tracking
  - [ ] Related loaner information

#### Quick Billing Interface

- [ ] **Simple Cost Entry** - Add final cost to ticket
- [ ] **One-Click Billing Notification** - Send billing details to business office

---

## Phase 2: Full Workflow Support

### 2.1 Student Communication System (`src/functions/notifications.ts`)

- [ ] **Automated Email Notifications**
  - [ ] Ticket confirmation email when new ticket created
  - [ ] Temp device ready notification
  - [ ] Completion email with pickup information
  - [ ] Email template system with dynamic content
  - [ ] CC advisors (grades 5-9) and parents (all grades) on all emails

### 2.2 Tech Repair Workflow

#### Tech Repair Interface (`src/TechRepairWorkflow.svelte`)

- [ ] **Asset tag scan/lookup interface for repair queue**
- [ ] **Display complete repair context:**
  - [ ] Student info, ticket details, loaner status, repair history
- [ ] **Quick repair completion workflow with cost entry**
- [ ] **"Mark Complete & Alert Librarian" action**
- [ ] **Show clear next steps and handoff information**

### 2.3 Librarian Interfaces

#### Student Status Lookup (`src/StudentStatusLookup.svelte`)

- [ ] **Universal search interface** (student names, asset tags, ticket numbers)
- [ ] **Student repair history view with current status**
- [ ] **Clear status display:** "Waiting for Parts," "In Progress," "Ready for Pickup"
- [ ] **Timeline information and estimated completion dates**
- [ ] **Loaner device information and contact details**

#### Temp Device Management (`src/TempDeviceManagement.svelte`)

- [ ] **Monitor 30-device temp pool health**
- [ ] **Alert for temp devices needing repair**
- [ ] **Track students with extended temp assignments (>2 weeks)**
- [ ] **Flag unfixable devices for replacement workflow**

### 2.4 Enhanced Checkout Process

- [ ] **Update Checkout.svelte**
  - [ ] Add repair status awareness
  - [ ] Handle loaner assignments
  - [ ] Prevent checkout of devices in repair
  - [ ] Show loaner status in UI

---

## Phase 3: Full System

### 3.1 Management Dashboard (`src/ManagementDashboard.svelte`)

- [ ] **Current repair queue overview**
- [ ] **Loaner utilization statistics and availability**
- [ ] **Repair trend analysis** (costs, frequency, common issues)
- [ ] **Problem device identification** (high repair frequency)
- [ ] **Export capabilities** for budget planning and reports

### 3.2 Advanced Features

- [ ] **Reporting & Analytics** (`src/reports/TicketReports.svelte`)

  - [ ] Open tickets by status
  - [ ] Average repair time
  - [ ] Most common issues
  - [ ] Cost analysis

- [ ] **Enhanced Automations**
  - [ ] Email students/parents when repairs complete
  - [ ] Alert for overdue repairs
  - [ ] Low loaner inventory alerts
  - [ ] Device retirement workflows

---

## URL Structure & Routing

### Individual Ticket Views

- [ ] `cb.innovationcharter.org/ticket/1234` - Individual ticket detail

### Ticket Views by Status

- [ ] `cb.innovationcharter.org/tickets/status/untriaged` - New tickets needing staff review
- [ ] `cb.innovationcharter.org/tickets/status/active` - All open tickets
- [ ] `cb.innovationcharter.org/tickets/status/waiting-device` - Student needs to bring device
- [ ] `cb.innovationcharter.org/tickets/status/waiting-temp` - Temp device needs prep
- [ ] `cb.innovationcharter.org/tickets/status/in-repair` - With tech for repair
- [ ] `cb.innovationcharter.org/tickets/status/ready-pickup` - Ready for student pickup

### Lookup Views

- [ ] `cb.innovationcharter.org/student/jane.smith` - All tickets for student
- [ ] `cb.innovationcharter.org/asset/A1234` - All tickets for device

### Management Views

- [ ] `cb.innovationcharter.org/ticket/create` - Manual ticket creation
- [ ] `cb.innovationcharter.org/temp-devices` - Temp device management dashboard

---

## Testing & Deployment

### Testing Requirements

- [ ] Unit tests for all new functions
- [ ] Integration tests for AirTable operations
- [ ] End-to-end workflow testing
- [ ] User acceptance testing with librarian and tech team

### Data Migration

- [ ] Import existing ticket data from Google Sheets
- [ ] Validate data integrity
- [ ] Test with real data

### Training & Documentation

- [ ] Create user documentation
- [ ] Train staff on new workflows
- [ ] Document admin processes

---

## Dependencies & Prerequisites

### Technical Requirements

- [ ] AirTable API access and schema updates
- [ ] Updated TypeScript types for new data structures
- [ ] Enhanced error handling and validation
- [ ] Updated navigation and routing for new components

### Before School Year Starts

- [ ] AirTable Tickets table setup
- [ ] Google Form → AirTable integration
- [ ] Basic ticket triaging interface
- [ ] Business office billing integration

### Early School Year

- [ ] Student/staff training on new system
- [ ] Sunset old Google Sheets workflow
- [ ] Monitor and refine automation rules

---

## Quick Reference

### Phase 0 Priority

Focus on Google Form integration to stop using Google Sheets immediately.

### Phase 1 MVP Priority

Focus on [Story C](./STORIES.md#story-c-quick-fix--billing) - Quick billing workflow to address Problems #2 & #4.

### Phase 2 Priority

Add [Stories A, B, & D](./STORIES.md) - Full workflow support addressing Problems #1, #3, & #4.

### Phase 3 Priority

Complete system with [Stories F, G, & H](./STORIES.md) - Management features and advanced automation.
