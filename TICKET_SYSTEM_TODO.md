# Ticket & Billing System Implementation TODO

**Goal:** Implement a comprehensive ticket and billing system to replace the current Google spreadsheet workflow and enable better tracking of repairs, loans, and invoicing.

**Key Problems Being Solved:**

1. Disconnect between current google sheet with student tickets AND current Chromebook app with inventory data.
2. Disconnect between inventory/tickets and invoicing families + difficulty of following up on invoices.
3. Unclear how to mark machines in for repair and temporary loaner machines out to students while a machine is being repaired (i.e. does the machine stay "checked out" to a student while being repaired to indicate it is still "assigned" to the student or does it get marked "in for repairs" to indicate it is no longer the student's responsibility since the machine is in our hands).
4. Difficulty of generating and following up on invoices (this is currently falling on the librarian but can be handled by the business office which has software designed for handling invoices).

## User Stories & Workflows

### Primary User Personas

- **CB Tech**: Repairs devices, manages loaner assignments, handles quick fixes
- **Librarian**: Intake/checkout interface, manages student interactions
- **Student/Staff**: End users who need repairs or have issues

### Core User Stories

#### Story A: Student Ticket Journey & Automated Communication (Addresses Problems #2 & #4)

**As a** student  
**I want to** be kept informed throughout my repair process with clear communication  
**So that** I know what's happening and what's expected of me at each step

**Example Scenario**: Student submits repair request and follows through completion

1. **Initial Submission**

   - **Student fills out Google form from classroom**: "Screen cracked on my laptop CB-12345"
   - **System automatically sends Google Chat notification** to tech team (keeps existing workflow)
   - **System automatically sends confirmation email** to student (+ CC advisors/parents via existing contact lookups): "Repair request received for CB-12345."

2. **Librarian Temp Preparation**

   - **Librarian clicks link in Google Chat notification** to view ticket
   - **Sees ticket details**: "Jane Smith - CB-12345 - Broken keyboard"
   - **Librarian prepares temp device** and **clicks "Temp Ready"** in ticket interface
   - **System automatically emails student**: "A temporary device is ready for you. Please bring CB-12345 to the library to exchange it."

3. **Device Drop-off & Loaner Assignment**

   - Student brings device to librarian
   - Librarian scans temp device and assigns it
   - System updates ticket status and emails: "Your device CB-12345 is now in for repair. You've been assigned temporary device CB-LOAN-018."

4. **Repair Complete & Pickup**

   - Tech completes repair and marks ticket complete
   - Librarian gets notification, prepares device (charges, etc.)
   - Librarian clicks "Ready for Pickup"
   - System emails student: "Your device CB-12345 is ready for pickup! Bring CB-LOAN-018 to exchange."

5. **Billing Notification**d
   - Business office receives billing details automatically
   - **Family receives invoice** through business office's system
   - **Student/family knows exactly what the charge is for** (linked to specific repair)

#### Story B: Librarian-Assisted Intake (Addresses Problem #1)

**As a** librarian  
**I want to** have integrated ticket and inventory data when students need help  
**So that** I can efficiently manage repairs with full context of device and student history

**Key Insight**: Students fill out the online form from their classrooms first (this part is working great!)

- **Student inquiry**: "I submitted a repair request last week - any updates?"
- **Librarian workflow**: Search student name or ask for asset tag
- **When scanning asset tag**: System immediately shows machine history, current status, and any existing open tickets
- **When looking up student**: System shows any devices assigned to them and related ticket history
- **Result**: Quick, accurate status updates with full context

**Integration Benefits**:

- **Machine-to-ticket integration**: When looking up device CB-12345, librarian sees all related tickets and repair history
- **Ticket-to-machine integration**: When viewing a ticket, librarian sees complete device details, assignment history, and current status

**Note**: Physical intake and damage assessment remains complex and cannot be rushed - the system provides context but doesn't replace technical expertise

#### Story C: Quick Fix & Billing (Addresses Problems #2 & #4)

**As a** CB tech  
**I want to** handle simple repairs and easily generate billing notifications  
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

#### Story D: Tech Repair Workflow (Addresses Problems #1 & #3)

**As a** CB tech  
**I want to** efficiently process my repair queue with complete context  
**So that** I can fix devices quickly and handle all necessary updates

**Example Scenario**: Tech's daily repair workflow

- Tech comes into shop and sees stack of broken machines from librarian
- Picks up first device and scans asset tag CB-12345
- **System immediately displays complete repair context:**
  - **Student Info**: "Jane Smith, Grade 10, jane.smith@school.edu"
  - **Issue**: "Sticky keyboard keys, reported 3 days ago"
  - **Loaner Status**: "Student has temporary device CB-LOAN-018"
  - **Repair History**: "Previous screen repair 6 months ago ($45)"
  - **Billing**: "Repair should be billed to family"
- Tech diagnoses issue, completes keyboard replacement
- Updates ticket: "Replaced keyboard, tested all keys" + "Final Cost: $30"
- Marks ticket complete → System automatically:
  - Updates device status to "Ready for Pickup"
  - Alerts librarian: "CB-12345 ready - Student: Jane Smith - Collect loaner: CB-LOAN-018"
  - Creates billing notification for business office
- Tech brings repaired device to library desk with full context provided to librarian

#### Story E: Student Follow-up & Status Inquiries (Addresses Problem #1)

**As a** librarian  
**I want to** quickly answer student questions about repair status  
**So that** I can provide accurate information and manage student expectations

**Example Scenario**: Student inquiry about repair submitted a week ago

- Student walks up: "Hi, I submitted a repair request for my laptop last week. Any updates?"
- Librarian searches "John Doe" or asks for asset tag
- **System displays student's repair history:**
  - **Current Open Ticket**: "CB-23456 - Battery not holding charge"
  - **Status**: "Waiting for Parts - Battery ordered 2 days ago"
  - **Estimated Timeline**: "Parts expected Friday, repair completion soon after"
  - **Loaner**: "Student has CB-LOAN-007"
  - **Contact**: "Email sent to parents when parts arrive"
- Librarian provides immediate, accurate status update
- Student knows exactly what to expect

#### Story F: Temp Machine Management & Alerts (Addresses Problem #3)

**As a** librarian  
**I want to** manage a healthy pool of temporary devices and get alerts about problems  
**So that** I can maintain 30 good temp machines and avoid shortages

**Key Requirements**:

- **Start with 30 temp machines in good condition** (not 25 running low)
- **Track temp machine health**: Alert when temp devices also break down
- **Alert for unfixable devices**: "CB-12345 cannot be repaired → Issue new device to student + return temp CB-LOAN-018 to pool"
- **Monitor temp machine circulation**: Track which students have had temp devices for extended periods

**Critical Scenarios**:

1. **Unfixable Device**: Student gets permanent replacement, temp device returns to circulation
2. **Temp Device Breakdown**: Remove from circulation, repair or retire
3. **Extended Temp Use**: Flag students who've had temp devices >2 weeks for follow-up

#### Story G: Prevent Lost Temp Devices (Addresses Problem #3)

**As a** librarian  
**I want to** track and prevent students from keeping temp devices permanently  
**So that** temp devices stay in circulation for other students

**Scenario**: Student forgets they have a temp device

- **System tracks**: "Student Jane has had CB-LOAN-018 for 3 weeks"
- **Alert generated**: "Jane's original device CB-23456 was repaired 2 weeks ago - pickup overdue"
- **Automated reminder**: Email to student/parents/advisor about returning temp device
- **Escalation**: After 4 weeks, involve administration for device return

**Integration needed**: Clear connection between original ticket, temp assignment, and pickup requirements

#### Story H: Management Reporting & Inventory Planning (Addresses Problem #1)

**As an** IT Director  
**I want to** get overview reports on repair volume and inventory health  
**So that** I can make informed purchasing and resource decisions

**Example Scenario**: Monthly inventory planning meeting

- IT Director opens repair analytics dashboard
- **Views current system health:**
  - **Active Repairs**: "12 devices currently in repair queue"
  - **Loaner Utilization**: "8 of 15 loaner devices assigned"
  - **Repair Trends**: "Screen replacements up 30% this month"
  - **Cost Analysis**: "$450 in repair costs this month vs $320 last month"
  - **Problem Devices**: "3 devices with multiple repairs - retirement candidates"
- **Uses data for decisions:**
  - Order additional loaner devices based on utilization trends
  - Budget for increased screen replacement costs
  - Flag high-repair-frequency devices for replacement
  - Plan staff time allocation based on repair volume
- Export reports for budget meetings and purchasing decisions

---

## Critical Requirements from Librarian Feedback

### ⚠️ Must-Have Workflow Changes

1. **Google Form Workflow (KEEP)**: Students fill out form from classroom first - this is working great!
2. **Scheduled Drop-off (NEW)**: Students cannot just show up - librarian needs advance notice to manage workflow
3. **Librarian-Controlled Pickup (NEW)**:
   - Tech marks repair complete → alerts librarian (not student)
   - Librarian ensures device is charged and ready → triggers student pickup email
4. **Communication CCs (NEW)**: Always CC advisors (grades 5-9) and parents (all grades) on all emails
5. **Temp Device Management (CRITICAL)**:
   - Start year with 30 temp devices in good condition (not 25 running low)
   - Alert system for devices that can't be fixed (student gets new device, temp returns to pool)
   - Track students who keep temp devices too long

### 🔍 Integration Requirements

- **Machine-to-ticket lookup**: Scan device → see all repair history and current status
- **Student-to-ticket lookup**: Search student → see all their repair requests and current temp assignments
- **Status inquiries are complex**: Provide context but don't rush physical assessment

## Critical Tech Team Feedback

### ⚠️ Data Quality & Ticket Editing (from Nick)

**Problem**: "Students have shown they are fairly incapable of doing it [form submission] reliably"

**Common Issues**:

- Asset tags: "ao333" instead of "A0333"
- Descriptions: "it wasn't my fault just feel" instead of actual issue description
- Wrong student/device mappings

**Solution**: Ticket editing/triaging workflow

- Google Chat notification includes link: `cb.innovationcharter.org/ticket/123`
- Untriaged tickets view: `cb.innovationcharter.org/tickets/status/untriaged`
- Staff can immediately edit ticket to fix asset tags, descriptions, student mappings

### 🔧 Flexible Temp Assignment (from Nick)

**Scenario**: "If they come straight to me but end up needing a temp, can I mark as getting temp without knowing the asset tag?"

**Solution**: Separate device status and temp status tracking

- **Device Status**: "Waiting on Device", "In Repair", "Ready for Pickup"
- **Temp Status**: "Needs Temp", "Temp Ready", "Has Temp A0912"

**Multiple Workflows Supported**:

1. **Student → Amy → Temp → Nick → Amy → Swap**
2. **Student → Nick → Quick Fix**
3. **Student → Nick → "You need temp" → Amy → Nick → Amy → Swap**

### 📋 Ticket Workflow States

**New Workflow Statuses**:

- **New** - Just submitted, needs triaging
- **Triaged** - Staff has reviewed and corrected any issues
- **Waiting on Device** - Student needs to bring device in
- **Waiting on Temp** - Student needs temp device prepared
- **In Repair** - Device with tech for repair
- **Ready for Pickup** - Repair complete, ready for student

## 🗂️ Systems Being Replaced

**Current Systems to Sunset**:

- "Chromebook Repairs & Fees" (Google Sheet)
- "Chromebook Ticket (Responses)" (Google Form responses sheet)
- Library's separate temp tracking system

**New Unified System**:

- AirTable Tickets table (replaces all of the above)
- Integrated temp device tracking in main CB app
- Business office handles invoicing (they already have software for this)

## Updated Schema Requirements

### Tickets Table (New in AirTable)

**Core Fields:**

- [ ] Ticket ID (Auto Number - Primary Field)
- [ ] **Student** (Link to Students table - existing)
- [ ] **Asset** (Link to Inventory table - existing)
- [ ] **Issue Description** (Long text - cleaned up from form data)
- [ ] **Device Status** (Single select: New, Triaged, Waiting on Device, In Repair, Ready for Pickup)
- [ ] **Temp Status** (Single select: No Temp Needed, Needs Temp, Temp Ready, Has Temp)
- [ ] **Final Cost** (Currency)
- [ ] **Repair Notes** (Long text)

**Form Data (Raw - may need editing):**

- [ ] **Form Asset Tag** (Single line text - as entered by student, may have errors like "ao333")
- [ ] **Form Student Email** (Email - as entered, may be wrong)
- [ ] **Form Description** (Long text - raw description, may need cleanup)

**Workflow Fields:**

- [ ] **Temp Device Assigned** (Link to Inventory table - specific temp device)
- [ ] **Chat Notification Sent** (Checkbox - track Google Chat sent)
- [ ] **Needs Triaging** (Checkbox - auto-set for new tickets, cleared when staff reviews)

**Lookup Fields (from existing tables):**

- [ ] **Student Email** (Lookup from Student - correct email after mapping)
- [ ] **Student Grade** (Lookup from Student)
- [ ] **Advisor Email** (Lookup from Student → Advisor - for CC)
- [ ] **Parent Contacts** (Lookup from Student → existing contact fields)
- [ ] **Asset Tag** (Lookup from Asset - correct tag after triaging)

### Key UI Components Needed

**URL Structure:**

- [ ] **Individual Ticket** - `cb.innovationcharter.org/ticket/1234`
- [ ] **Ticket Views by Status:**
  - [ ] `cb.innovationcharter.org/tickets/status/untriaged` - New tickets needing staff review
  - [ ] `cb.innovationcharter.org/tickets/status/active` - All open tickets
  - [ ] `cb.innovationcharter.org/tickets/status/waiting-device` - Student needs to bring device
  - [ ] `cb.innovationcharter.org/tickets/status/waiting-temp` - Temp device needs prep
  - [ ] `cb.innovationcharter.org/tickets/status/in-repair` - With tech for repair
  - [ ] `cb.innovationcharter.org/tickets/status/ready-pickup` - Ready for student pickup
- [ ] **Lookup Views:**
  - [ ] `cb.innovationcharter.org/student/jane.smith` - All tickets for student
  - [ ] `cb.innovationcharter.org/asset/A1234` - All tickets for device
- [ ] **Actions:**
  - [ ] `cb.innovationcharter.org/ticket/create` - Manual ticket creation
  - [ ] `cb.innovationcharter.org/temp-devices` - Temp device management dashboard

**Core Interfaces:**

- [ ] **Ticket Triage Interface** - Fix asset tags, descriptions, student mappings
- [ ] **Asset Tag Correction** - Easy dropdown to fix student errors
- [ ] **Student Mapping** - Lookup and correct student assignment
- [ ] **Status Management** - Separate device and temp status controls

### Simple Automations

- [ ] **New ticket → Google Chat notification with edit link**
- [ ] **New ticket → Email confirmation** (student + CC advisor/parents via lookups)
- [ ] **Temp Status "Temp Ready" → Email student** "Temp device ready, bring your device to library"
- [ ] **Device Status "Ready for Pickup" → Email student** "Device ready for pickup"

## Quick Wins (MVP Features)

**Phase 0** - Google Form Integration (Immediate Priority)

1. **Update Google Form backend** - Route submissions to Tickets table instead of Sheets
2. **Keep existing GChat notifications** - Don't break current tech team workflow
3. **Add ticket edit links** - Include URL in Google Chat for immediate triaging

**Phase 1 MVP** - Focus on Story C (Quick billing workflow - addresses Problems #2 & #4)

1. **Basic Ticket Lookup** - Find tickets created from Google Form
2. **Ticket Triaging Interface** - Fix student errors in asset tags and descriptions
3. **Simple Cost Entry** - Add final cost to ticket
4. **One-Click Billing Notification** - Send billing details to business office

**Phase 2 Expansion** - Add Stories A, B, & D (addresses Problems #1, #3, & #4)

1. **Separate Device/Temp Status Tracking** - Support Nick's flexible workflows
2. **Automated Student Communications** - Email notifications throughout repair journey
3. **Librarian Status Interface** - Quick student/device lookup for inquiries
4. **Tech Repair Workflow** - Asset scan → complete repair context → completion workflow

**Phase 3** - Full System

1. **Management Dashboard** - Repair analytics and inventory planning
2. **Advanced Temp Device Management** - 30-device pool tracking and alerts
3. **Enhanced Automated Notifications** - Status updates, overdue alerts, reminders

## Implementation Priority

**Before School Year Starts**:

- [ ] AirTable Tickets table setup
- [ ] Google Form → AirTable integration
- [ ] Basic ticket triaging interface
- [ ] Business office billing integration

**Early School Year**:

- [ ] Student/staff training on new system
- [ ] Sunset old Google Sheets workflow
- [ ] Monitor and refine automation rules

## Dependencies

- AirTable API access and schema updates
- Updated TypeScript types for new data structures
- Enhanced error handling and validation
- Updated navigation and routing for new components

---

## Technical Integration Requirements

### Google Form → Ticket Integration (Addresses Problem #1)

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
  - [ ] Set default Status to "New"
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
    - [ ] Device Status (Single select: New, Triaged, Waiting on Device, In Repair, Ready for Pickup)
    - [ ] Temp Status (Single select: No Temp Needed, Needs Temp, Temp Ready, Has Temp)
    - [ ] Priority (Single select: Low, Medium, High, Urgent)
    - [ ] Date Created (Date)
    - [ ] Date Resolved (Date)
    - [ ] Repair Notes (Long text)
    - [ ] Cost Estimate (Currency)
    - [ ] Final Cost (Currency)
    - [ ] Photos (Attachments)
    - [ ] Form Asset Tag (Single line text - raw from form)
    - [ ] Form Student Email (Email - raw from form)
    - [ ] Form Description (Long text - raw from form)
    - [ ] Temp Device Assigned (Link to Inventory table)
    - [ ] Chat Notification Sent (Checkbox)
    - [ ] Needs Triaging (Checkbox)
  - [ ] Create views for different ticket statuses (New, Triaged, In Repair, etc.)
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

  - [ ] When Ticket Device Status changes to "In Repair" → Update linked Asset Repair Status to "In Repair"
  - [ ] When Ticket Device Status changes to "Ready for Pickup" → Update linked Asset Repair Status to "In Service"
  - [ ] When Ticket is marked for billing → Create new Billing Notification record with linked Ticket
  - [ ] When Billing Notification Status changes to "Paid" → Send confirmation email
  - [ ] When Asset Repair Status changes → Send notification to assigned Staff Member
  - [ ] **Student Communication Automations (KEY for Story A):**
    - [ ] When new Ticket created → Send confirmation email to student: "Repair request received"
    - [ ] When Temp Status changes to "Temp Ready" → Send email: "Temp device ready, bring your device to library"
    - [ ] When Device Status changes to "Ready for Pickup" → Send email: "Device ready for pickup"

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

- [ ] **Asset Repair Context Lookup** (KEY for Stories C & D - Tech Workflow & Status Inquiries)
  - [ ] Scan/enter asset tag → return comprehensive repair context with device details, ticket info, student data, loaner status
  - [ ] Display student info, current loaner assignment, repair notes, device history for tech workflow
  - [ ] Show "what's next" actions for tech with full context
  - [ ] Support student lookup for librarian status inquiries
  - [ ] Alert librarian when repair marked complete with integrated details
  - [ ] **Universal search**: Accept asset tags, student names, or ticket numbers from single search interface

### 2.2 Reporting & Analytics Functions (KEY for Story H - Management Dashboard)

- [ ] **Inventory Health Reports**
  - [ ] Get count of devices currently in repair
  - [ ] Calculate loaner utilization percentages
  - [ ] Generate repair trend analysis (cost, frequency, types)
  - [ ] Identify high-maintenance devices for retirement planning
  - [ ] Export data for budget meetings and purchasing decisions

### 2.3 Loaner Management Functions

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

### 2.4 Billing Notification Functions

- [ ] **Create Billing Notification** (`src/functions/billing.ts`)

  - [ ] Extract student/asset info from ticket
  - [ ] Create billing notification record in AirTable
  - [ ] Trigger AirTable automation to email business office
  - [ ] Business office handles invoice generation in their system

- [ ] **Billing Status Tracking**
  - [ ] Track notification status (Pending, Sent, Acknowledged)
  - [ ] Handle confirmation from business office
  - [ ] Simple audit trail for billing communications

### 2.5 Student Communication Functions (KEY for Story A)

- [ ] **Automated Email Notifications** (`src/functions/notifications.ts`)

  - [ ] Ticket confirmation email when new ticket created
  - [ ] Temp device ready notification when librarian prepares temp
  - [ ] Progress update email when repair begins
  - [ ] Completion email with pickup and billing information
  - [ ] Email template system with dynamic content (student name, asset ID, costs, etc.)
  - [ ] CC advisors (grades 5-9) and parents (all grades) on all emails

- [ ] **Communication Tracking**
  - [ ] Log all sent emails with timestamps
  - [ ] Track email delivery status
  - [ ] Handle bounce/failure notifications
  - [ ] Provide communication history for support inquiries

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

- [ ] **Ticket Triage Interface** (`src/TicketTriage.svelte`) - **KEY COMPONENT for Data Quality**

  - [ ] View untriaged tickets from Google Form submissions
  - [ ] Edit asset tags with dropdown corrections (A0333 vs ao333)
  - [ ] Fix student mappings with lookup and autocomplete
  - [ ] Clean up issue descriptions
  - [ ] Mark tickets as triaged when corrections complete

- [ ] **Tech Repair Workflow View** (`src/TechRepairWorkflow.svelte`) - **KEY COMPONENT for Story D**

  - [ ] Asset tag scan/lookup interface for repair queue
  - [ ] Display complete repair context: student info, ticket details, loaner status, repair history
  - [ ] Quick repair completion workflow with cost entry
  - [ ] "Mark Complete & Alert Librarian" action with integrated notification
  - [ ] Show clear next steps and handoff information

- [ ] **Student Status Lookup** (`src/StudentStatusLookup.svelte`) - **KEY COMPONENT for Story E**

  - [ ] Universal search interface (student names, asset tags, ticket numbers)
  - [ ] Student repair history view with current status
  - [ ] Clear status display: "Waiting for Parts," "In Progress," "Ready for Pickup"
  - [ ] Timeline information and estimated completion dates
  - [ ] Loaner device information and contact details

- [ ] **Management Dashboard** (`src/ManagementDashboard.svelte`) - **KEY COMPONENT for Story H**
  - [ ] Current repair queue overview (devices in repair, waiting for parts, etc.)
  - [ ] Loaner utilization statistics and availability
  - [ ] Repair trend analysis (costs, frequency, common issues)
  - [ ] Problem device identification (high repair frequency)
  - [ ] Export capabilities for budget planning and reports

### 3.2 Loaner Management Interface

- [ ] **Loaner Assignment** (`src/LoanerAssignment.svelte`)

  - [ ] Available loaner device selection
  - [ ] Temporary assignment process
  - [ ] Integration with ticket system

- [ ] **Loaner Return Process** (`src/LoanerReturn.svelte`)

  - [ ] Scan/select returning loaner
  - [ ] Process device swap
  - [ ] Update all related records

- [ ] **Temp Device Management Dashboard** (`src/TempDeviceManagement.svelte`) - **KEY for Story F & G**
  - [ ] Monitor 30-device temp pool health
  - [ ] Alert for temp devices needing repair
  - [ ] Track students with extended temp assignments (>2 weeks)
  - [ ] Flag unfixable devices for replacement workflow

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
