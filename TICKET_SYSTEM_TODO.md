# Ticket & Billing System Implementation TODO

**Goal:** Implement a comprehensive ticket and billing system to replace the current Google spreadsheet workflow and enable better tracking of repairs, loans, and invoicing.

**Key Problem Being Solved:** Currently, librarians manually handle billing (families pay via web form, librarian searches emails for payment confirmation), which is disconnected from the repair system. The new system will let tech/librarian generate billing notifications that automatically go to the business office, who then handles ALL invoicing, payment collection, and follow-up - eliminating manual billing work for library staff.

## User Stories & Workflows

### Primary User Personas

- **CB Tech**: Repairs devices, manages loaner assignments, handles quick fixes
- **Librarian**: Intake/checkout interface, manages student interactions
- **Student/Staff**: End users who need repairs or have issues

### Core User Stories

#### Story A: Existing Google Form → Ticket Integration

**As a** student or staff member  
**I want to** continue using the existing Google form  
**So that** my repair requests automatically create tickets instead of spreadsheet entries

**Current Workflow (needs updating):**

- Student fills out existing Google form
- Form hits GChat API (notify tech team) - **KEEP THIS**
- Form populates Google spreadsheet - **REPLACE WITH TICKET CREATION**
- Spreadsheet manually managed by tech team - **REPLACE WITH TICKET SYSTEM**

**New Workflow:**

- Student fills out same Google form (no change for students)
- Form hits GChat API (keep existing notification)
- Form creates Ticket record in AirTable instead of spreadsheet row
- Ticket automatically linked to Asset and Student records
- Tech team manages through ticket system instead of spreadsheet

#### Story B: Librarian-Assisted Intake

**As a** librarian  
**I want to** quickly create tickets when students bring broken devices  
**So that** I can efficiently process repairs during busy periods

- Student brings device to checkout desk
- Librarian scans asset tag or looks up student
- Quick damage assessment and ticket creation
- Immediate loaner assignment if needed
- Print receipt/reference for student

#### Story C: Tech Repair Completion

**As a** CB tech  
**I want to** efficiently close completed repairs and handle billing  
**So that** devices get back to students and invoices are generated

- Tech completes repair work
- Updates ticket with repair notes and costs
- Marks ticket complete (triggers automated processes)
- System handles device status updates and notifications

#### Story D: Quick Fix & Invoice (KEY WORKFLOW)

**As a** CB tech  
**I want to** handle simple repairs and easily generate invoices  
**So that** students get devices back quickly and business office gets accurate billing

**CURRENT BILLING PAIN POINT:**

- Librarian manually bills families using separate process
- Family goes to web form to pay
- Librarian searches through emails to confirm payment
- Disconnected from repair tracking
- No integration between repair system and billing
- Easy to miss billing or lose track of payments

**Example Scenario**: Student walks into tech cave with broken screen

- Tech looks up ticket (from existing form submission) OR creates new ticket for walk-in
- Completes repair (screen replacement)
- Updates ticket: "Repair Notes: Replaced screen" + "Final Cost: $40"
- Clicks "Send to Business Office" button
- System creates Billing Notification record (Student Name, Contact, Asset ID, Cost, Description)
- AirTable automation emails business office with billing details
- **Business office handles ALL invoicing, payment collection, and follow-up**
- **Librarian/tech never have to think about billing again**

**KEY BILLING IMPROVEMENT:**

- **BEFORE**: Librarian manually bills → Family pays via web form → Librarian searches emails for payment confirmation
- **AFTER**: Tech/Librarian clicks "Send to Business Office" → Business office handles everything → Library staff freed from billing work

#### Story E: Complex Repair with Loaner (ADDRESSES EXISTING PAIN POINT)

**As a** CB tech  
**I want to** see ticket context when I complete repairs  
**So that** I know what to do next and don't lose track of student assignments

**Current Pain Point**: Tech gets stack of broken machines from librarian, fixes them, but then doesn't know:

- Which student it belongs to
- If student has a loaner that needs to be returned
- What the original issue was
- Whether repair should be billed

**Example Scenario**: Keyboard replacement needed

- Student reports sticky keys via Google form
- Librarian assigns loaner device when student drops off broken machine
- Tech receives broken machine (currently no context about ticket/loaner)
- **NEW WORKFLOW**: Tech scans asset tag → System shows:
  - Related ticket with issue description
  - Student name and contact info
  - "Student currently has loaner device: CB-LOAN-015"
  - Repair notes and any special instructions
- Tech completes keyboard replacement
- Tech marks ticket complete and brings device to librarian
- **System alerts librarian**: "Repaired device CB-12345 ready for pickup - Student has loaner CB-LOAN-015"
- Librarian handles the device swap with full context

#### Story F: Repair Status Tracking

**As a** librarian or CB tech  
**I want to** easily see repair status and history  
**So that** I can answer student questions and manage workflow

- Quick lookup by student or asset
- View all open tickets and repair status
- See repair history and recurring issues
- Identify devices that should be retired

### Edge Cases & Special Scenarios

#### Lost/Stolen Device Processing

- Student reports device lost/stolen
- Create ticket for tracking purposes
- Mark device as "Lost" in inventory
- Generate invoice for replacement cost
- Handle insurance claims if applicable

#### Device Retirement/Replacement

- Multiple repair history indicates replacement needed
- Mark device as "Retired"
- Create replacement device assignment
- Handle disposal/recycling process

#### Emergency Loaner Assignment

- Student has urgent need (presentation, test, etc.)
- Quick loaner checkout process
- Temporary assignment with return date
- Integration with existing checkout system

#### Batch Processing for Common Issues

- Multiple devices with same issue (software update, recall)
- Bulk ticket creation
- Mass status updates
- Efficient workflow for tech team

## UI/UX Design Considerations

### Quick Actions Interface

Based on the user stories, we need several "quick action" interfaces:

- **Quick Ticket + Immediate Completion** (Story D)

  - Single form that creates ticket and marks it complete
  - Ideal for screen replacements, simple fixes
  - Instant billing notification to business office

- **Quick Intake + Loaner Assignment** (Story B)

  - Scan asset → assess damage → assign loaner
  - Streamlined for librarian use during busy periods
  - Print receipt for student

- **Tech Repair Completion with Context** (Story E - KEY PAIN POINT)

  - Scan repaired asset → see full ticket context
  - Show student info, loaner assignment, original issue
  - Mark complete → alert librarian for device swap
  - Seamless handoff between tech and librarian

- **Repair Dashboard** (Story C & F)
  - Tech-focused view of open tickets
  - Quick status updates and completion actions
  - Batch operations for common fixes

### Mobile-First Design

- Tech team often works away from desks
- Barcode scanning capabilities
- Touch-friendly interfaces for quick updates

### Integration Points

- Must work seamlessly with existing checkout system
- Asset lookup should be consistent across all interfaces
- Student/staff lookup matches current patterns

---

## Phase 0: Google Form Integration Update

### 0.1 Modify Existing Google Form Backend

- [ ] **Update Google Form submission handler**
  - [ ] Change destination from Google Sheets to AirTable Tickets table
  - [ ] Keep existing GChat API notification (don't break current workflow)
  - [ ] Map form fields to Ticket table fields
  - [ ] Add error handling for AirTable API calls
  - [ ] Test with existing form to ensure no student-facing changes

### 0.2 Form Field Mapping

- [ ] **Map Google Form responses to Ticket fields**
  - [ ] Student info → Link to Students table
  - [ ] Asset tag → Link to Inventory table
  - [ ] Issue description → Issue Description field
  - [ ] Priority/urgency → Priority field
  - [ ] Photos/attachments → Photos field
  - [ ] Set default Status to "Open"
  - [ ] Auto-populate Date Created

### 0.3 Transition Strategy

- [ ] **Phase out Google Sheets dependency**
  - [ ] Run dual system temporarily (both Sheets and Tickets)
  - [ ] Verify data consistency between old and new systems
  - [ ] Migrate any pending tickets from Sheets to AirTable
  - [ ] Remove Sheets integration once confident in new system

---

## Phase 1: AirTable Schema Design & Setup

### 1.1 New AirTable Tables

- [ ] **Tickets Table** (Create in AirTable interface)

  - [ ] Create new table called "Tickets"
  - [ ] Add fields:
    - [ ] Ticket ID (Auto Number - Primary Field)
    - [ ] Asset (Link to Inventory table)
    - [ ] Student (Link to Students table)
    - [ ] Staff Member (Link to Staff table)
    - [ ] Issue Description (Long text)
    - [ ] Status (Single select: Open, In Progress, Waiting for Parts, Completed, Cancelled)
    - [ ] Priority (Single select: Low, Medium, High, Urgent)
    - [ ] Date Created (Date)
    - [ ] Date Resolved (Date)
    - [ ] Repair Notes (Long text)
    - [ ] Cost Estimate (Currency)
    - [ ] Final Cost (Currency)
    - [ ] Photos (Attachments)
  - [ ] Create views for different ticket statuses (Open, In Progress, Waiting for Parts, Completed, etc.)
  - [ ] Add automation rules for status transitions

- [ ] **Billing Notifications Table** (Create in AirTable interface)

  - [ ] Create new table called "Billing Notifications"
  - [ ] Add fields:
    - [ ] Notification ID (Auto Number - Primary Field)
    - [ ] Ticket Reference (Link to Tickets table - Single record)
    - [ ] Student Name (Lookup from Ticket → Student)
    - [ ] Student Contact (Lookup from Ticket → Student → Contact Info)
    - [ ] Asset ID (Lookup from Ticket → Asset → Asset Tag)
    - [ ] Cost (Currency)
    - [ ] Description (Long text - repair details)
    - [ ] Date Sent (Date)
    - [ ] Status (Single select: Pending, Sent, Acknowledged)
  - [ ] Create automation: When record created → Email business office with billing details
  - [ ] Business office handles their own invoice generation/processing

- [ ] **Update Existing Tables**
  - [ ] **Inventory Table Updates:**
    - [ ] Add "Repair Status" field (Single select: In Service, In Repair, Loaner, Retired, Lost)
    - [ ] Add "Original Owner" field (Link to Students table - for tracking during repairs)
    - [ ] Add "Temporary Assignment" field (Checkbox - flags loaner devices)
    - [ ] Add "Related Tickets" field (Link to Tickets table - Allow multiple)
  - [ ] **Students Table Updates:**
    - [ ] Add "Active Tickets" field (Link to Tickets table - Allow multiple)
    - [ ] Add "Billing Notifications" field (Link to Billing Notifications table - Allow multiple)
  - [ ] **Staff Table Updates:**
    - [ ] Add "Assigned Tickets" field (Link to Tickets table - Allow multiple)

### 1.2 AirTable Relationships & Automations

- [ ] **Set up Table Relationships** (Configure in AirTable interface)

  - [ ] Link Tickets to Inventory (Asset field)
  - [ ] Link Tickets to Students (Student field)
  - [ ] Link Tickets to Staff (Staff Member field)
  - [ ] Link Billing Notifications to Tickets (Ticket Reference field)
  - [ ] Link Billing Notifications to Students (via Ticket lookup)
  - [ ] Verify bidirectional relationships are working correctly

- [ ] **AirTable Automations** (Configure in AirTable interface)

  - [ ] When Ticket Status changes to "In Progress" → Update linked Asset Repair Status to "In Repair"
  - [ ] When Ticket Status changes to "Completed" → Update linked Asset Repair Status to "In Service"
  - [ ] When Ticket is marked for billing → Create new Billing Notification record with linked Ticket
  - [ ] When Billing Notification Status changes to "Paid" → Send confirmation email
  - [ ] When Asset Repair Status changes → Send notification to assigned Staff Member

- [ ] **AirTable API Setup**
  - [ ] Set up AirTable API access tokens for the application
  - [ ] Test read/write operations for new tables
  - [ ] Configure web hooks for real-time updates (if needed)
  - [ ] Create TypeScript interfaces matching AirTable field structures

## Phase 2: Backend API Development

### 2.1 Ticket Management Functions

- [ ] **Create Ticket** (`src/functions/tickets.ts`)

  - [ ] Validate ticket data (Asset ID, Student ID, Issue Description)
  - [ ] Create ticket record in AirTable with linked records
  - [ ] Update linked Asset's Repair Status to "In Repair"
  - [ ] Set Original Owner on Asset if not already set
  - [ ] Send confirmation notifications to student/staff
  - [ ] Return created ticket with all linked data

- [ ] **Update Ticket Status**

  - [ ] Handle status transitions via AirTable API
  - [ ] Let AirTable automations handle Asset status updates
  - [ ] Fetch updated linked records after status change
  - [ ] Trigger notifications for status changes (or rely on AirTable automation)

- [ ] **Close/Complete Ticket**

  - [ ] Mark ticket as resolved in AirTable
  - [ ] Let AirTable automation handle Asset status update
  - [ ] Trigger invoice generation if applicable (via AirTable automation or manual)
  - [ ] Clear temporary assignments and restore original owner

- [ ] **Ticket Search & Retrieval**

  - [ ] Get tickets by student (using AirTable filtering)
  - [ ] Get tickets by asset (using linked record queries)
  - [ ] Get open tickets (filter by Status field)
  - [ ] Get ticket history with full linked record data

- [ ] **Asset Repair Context Lookup** (KEY for Story E)
  - [ ] Scan/enter asset tag → return full ticket context
  - [ ] Show student info, current loaner assignment, repair notes
  - [ ] Display "what's next" actions for tech
  - [ ] Alert librarian when repair marked complete

### 2.2 Loaner Management Functions

- [ ] **Assign Loaner Device**

  - [ ] Find available loaner devices
  - [ ] Create temporary assignment record
  - [ ] Update inventory status
  - [ ] Link to original ticket

- [ ] **Return Loaner Device**
  - [ ] Process loaner return
  - [ ] Reassign repaired device to student
  - [ ] Update inventory records
  - [ ] Close loaner assignment

### 2.3 Billing Notification Functions

- [ ] **Create Billing Notification** (`src/functions/billing.ts`)

  - [ ] Extract student/asset info from ticket
  - [ ] Create billing notification record in AirTable
  - [ ] Trigger AirTable automation to email business office
  - [ ] Business office handles invoice generation in their system

- [ ] **Billing Status Tracking**
  - [ ] Track notification status (Pending, Sent, Acknowledged)
  - [ ] Handle confirmation from business office
  - [ ] Simple audit trail for billing communications

## Phase 3: Frontend UI Development

### 3.1 Ticket Management Interface

- [ ] **Create Ticket Component** (`src/CreateTicket.svelte`)

  - [ ] Form for creating new repair tickets
  - [ ] Asset lookup and validation
  - [ ] Student lookup and validation
  - [ ] Issue description and priority selection
  - [ ] Photo upload for damage documentation

- [ ] **Ticket Dashboard** (`src/TicketDashboard.svelte`)

  - [ ] View all open tickets
  - [ ] Filter by status, priority, student, asset
  - [ ] Quick status update actions
  - [ ] Search functionality

- [ ] **Ticket Detail View** (`src/TicketDetail.svelte`)

  - [ ] Full ticket information display
  - [ ] Status update interface
  - [ ] Repair notes and history
  - [ ] Cost tracking
  - [ ] Related loaner information

- [ ] **Tech Repair Context View** (`src/TechRepairContext.svelte`) - **KEY COMPONENT**
  - [ ] Asset tag scan/lookup interface
  - [ ] Display ticket context: student, loaner, issue description
  - [ ] Quick repair completion workflow
  - [ ] "Mark Complete & Alert Librarian" action
  - [ ] Show next steps clearly

### 3.2 Loaner Management Interface

- [ ] **Loaner Assignment** (`src/LoanerAssignment.svelte`)

  - [ ] Available loaner device selection
  - [ ] Temporary assignment process
  - [ ] Integration with ticket system

- [ ] **Loaner Return Process** (`src/LoanerReturn.svelte`)
  - [ ] Scan/select returning loaner
  - [ ] Process device swap
  - [ ] Update all related records

### 3.3 Enhanced Checkout Process

- [ ] **Update Checkout.svelte**
  - [ ] Add repair status awareness
  - [ ] Handle loaner assignments
  - [ ] Prevent checkout of devices in repair
  - [ ] Show loaner status in UI

### 3.4 Repair Workflow Interface

- [ ] **Repair Intake** (`src/RepairIntake.svelte`)

  - [ ] Quick ticket creation from checkout scan
  - [ ] Damage assessment form
  - [ ] Automatic loaner assignment option

- [ ] **Repair Completion** (`src/RepairCompletion.svelte`)
  - [ ] Mark repairs complete
  - [ ] Handle device return to student
  - [ ] Process loaner returns
  - [ ] Send billing notifications to business office

## Phase 4: Reporting & Analytics

### 4.1 Ticket Reports

- [ ] **Ticket Summary Report** (`src/reports/TicketReports.svelte`)

  - [ ] Open tickets by status
  - [ ] Average repair time
  - [ ] Most common issues
  - [ ] Cost analysis

- [ ] **Asset Health Dashboard**
  - [ ] Devices with multiple repair tickets
  - [ ] Replacement recommendations
  - [ ] Warranty status tracking

### 4.2 Billing Reports

- [ ] **Billing Summary**
  - [ ] Pending billing notifications
  - [ ] Sent notifications awaiting acknowledgment
  - [ ] Monthly billing totals

## Phase 5: Process Automation & Integrations

### 5.1 Automated Workflows

- [ ] **Status Change Notifications**

  - [ ] Email students/parents when repairs complete
  - [ ] Notify tech team of high-priority tickets
  - [ ] Alert for overdue repairs

- [ ] **Inventory Management**
  - [ ] Automatic status updates
  - [ ] Low loaner inventory alerts
  - [ ] Device retirement workflows

### 5.2 Business Office Integration

- [ ] **Billing Notification Email**
  - [ ] Format billing details for business office
  - [ ] Automated email delivery via AirTable
  - [ ] Simple acknowledgment tracking

## Phase 6: Testing & Deployment

### 6.1 Testing

- [ ] Unit tests for all new functions
- [ ] Integration tests for AirTable operations
- [ ] End-to-end workflow testing
- [ ] User acceptance testing

### 6.2 Data Migration

- [ ] Import existing ticket data from Google Sheets
- [ ] Validate data integrity
- [ ] Test with real data

### 6.3 Training & Documentation

- [ ] Create user documentation
- [ ] Train staff on new workflows
- [ ] Document admin processes

## Additional Considerations

### Security & Permissions

- [ ] Role-based access for ticket management
- [ ] Audit logging for sensitive operations
- [ ] Data privacy compliance

### Performance & Scalability

- [ ] Optimize AirTable queries
- [ ] Implement caching where appropriate
- [ ] Monitor system performance

### Future Enhancements

- [ ] Mobile app for technicians
- [ ] Barcode scanning for faster processing
- [ ] Integration with vendor repair systems
- [ ] Predictive maintenance alerts

---

## Quick Wins (MVP Features)

**Phase 0** - Google Form Integration (Immediate Priority)

1. **Update Google Form backend** - Route submissions to Tickets table instead of Sheets
2. **Keep existing GChat notifications** - Don't break current tech team workflow

**Phase 1 MVP** - Focus on Story D (Quick invoice workflow)

1. **Basic Ticket Lookup** - Find tickets created from Google Form
2. **Simple Cost Entry** - Add final cost to ticket
3. **One-Click Billing Notification** - Send billing details to business office
4. **AirTable Email Automation** - Automated notification with student/cost/asset details

**Phase 2 Expansion** - Add Stories B & C  
5. **Librarian Intake Interface** - Create tickets for walk-ins 6. **Simple Loaner Assignment** - Temporary device checkout process 7. **Tech Repair Dashboard** - View and manage all open tickets

**Phase 3** - Full System 8. **Advanced Reporting** - Cost tracking, repair history, asset health 9. **Complex Loaner Workflows** - Full repair-to-return process 10. **Automated Notifications** - Status updates, overdue alerts

## Dependencies

- AirTable API access and schema updates
- Updated TypeScript types for new data structures
- Enhanced error handling and validation
- Updated navigation and routing for new components
