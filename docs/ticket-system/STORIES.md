# User Stories & Workflows

## Primary User Personas

- **CB Tech**: Repairs devices, manages loaner assignments, handles quick fixes
- **Librarian**: Intake/checkout interface, manages student interactions
- **Student/Staff**: End users who need repairs or have issues

---

## Story A: Student Ticket Journey & Automated Communication

**Addresses Problems #2 & #4**

**As a** student  
**I want to** be kept informed throughout my repair process with clear communication  
**So that** I know what's happening and what's expected of me at each step

### Example Scenario

1. **Initial Submission**

   - Student fills out Google form from classroom: "Screen cracked on my laptop CB-12345"
   - System automatically sends Google Chat notification to tech team
   - System automatically sends confirmation email to student (+ CC advisors/parents)

2. **Librarian Temp Preparation**

   - Librarian clicks link in Google Chat notification to view ticket
   - Sees ticket details: "Jane Smith - CB-12345 - Broken keyboard"
   - Librarian prepares temp device and clicks "Temp Ready"
   - System emails student: "A temporary device is ready for you"

3. **Device Drop-off & Loaner Assignment**

   - Student brings device to librarian
   - Librarian scans temp device and assigns it
   - System emails: "Your device CB-12345 is now in for repair"

4. **Repair Complete & Pickup**

   - Tech completes repair and marks ticket complete
   - Librarian gets notification, prepares device (charges, etc.)
   - Librarian clicks "Ready for Pickup"
   - System emails student: "Device ready for pickup!"

5. **Billing Notification**
   - Business office receives billing details automatically
   - Family receives invoice through business office's system

---

## Story B: Librarian-Assisted Intake

**Addresses Problem #1**

**As a** librarian  
**I want to** have integrated ticket and inventory data when students need help  
**So that** I can efficiently manage repairs with full context

### Key Insight

Students fill out the online form from their classrooms first (this part is working great!)

### Workflow

- Student inquiry: "I submitted a repair request last week - any updates?"
- Librarian workflow: Search student name or ask for asset tag
- **When scanning asset tag**: System shows machine history, current status, existing tickets
- **When looking up student**: System shows devices assigned and ticket history
- **Result**: Quick, accurate status updates with full context

### Integration Benefits

- **Machine-to-ticket integration**: Looking up CB-12345 shows all related tickets and repair history
- **Ticket-to-machine integration**: Viewing ticket shows complete device details and assignment history

---

## Story C: Quick Fix & Billing

**Addresses Problems #2 & #4**

**As a** CB tech  
**I want to** handle simple repairs and easily generate billing notifications  
**So that** students get devices back quickly and business office gets accurate billing

### Current Billing Pain Point

- Librarian manually bills families using separate process
- Family goes to web form to pay
- Librarian searches through emails to confirm payment
- Disconnected from repair tracking
- Easy to miss billing or lose track of payments

### New Workflow

- Tech looks up ticket (from form submission) OR creates new ticket for walk-in
- Completes repair (screen replacement)
- Updates ticket: "Repair Notes: Replaced screen" + "Final Cost: $40"
- Clicks "Send to Business Office" button
- **Business office handles ALL invoicing, payment collection, and follow-up**

### Key Improvement

- **BEFORE**: Librarian manually bills → Family pays via web form → Librarian searches emails
- **AFTER**: Tech clicks "Send to Business Office" → Business office handles everything

---

## Story D: Tech Repair Workflow

**Addresses Problems #1 & #3**

**As a** CB tech  
**I want to** efficiently process my repair queue with complete context  
**So that** I can fix devices quickly and handle all necessary updates

### Daily Workflow

- Tech sees stack of broken machines from librarian
- Picks up first device and scans asset tag CB-12345
- **System immediately displays complete repair context:**
  - Student Info: "Jane Smith, Grade 10, jane.smith@school.edu"
  - Issue: "Sticky keyboard keys, reported 3 days ago"
  - Loaner Status: "Student has temporary device CB-LOAN-018"
  - Repair History: "Previous screen repair 6 months ago ($45)"
  - Billing: "Repair should be billed to family"
- Tech completes repair and updates ticket
- System automatically alerts librarian with handoff information

---

## Story E: Student Follow-up & Status Inquiries

**Addresses Problem #1**

**As a** librarian  
**I want to** quickly answer student questions about repair status  
**So that** I can provide accurate information and manage student expectations

### Example Inquiry

- Student: "Hi, I submitted a repair request for my laptop last week. Any updates?"
- Librarian searches "John Doe" or asks for asset tag
- **System displays student's repair history:**
  - Current Open Ticket: "CB-23456 - Battery not holding charge"
  - Status: "Waiting for Parts - Battery ordered 2 days ago"
  - Estimated Timeline: "Parts expected Friday"
  - Loaner: "Student has CB-LOAN-007"

---

## Story F: Temp Machine Management & Alerts

**Addresses Problem #3**

**As a** librarian  
**I want to** manage a healthy pool of temporary devices and get alerts about problems  
**So that** I can maintain 30 good temp machines and avoid shortages

### Key Requirements

- Start with 30 temp machines in good condition (not 25 running low)
- Track temp machine health: Alert when temp devices break down
- Alert for unfixable devices: Student gets new device, temp returns to pool
- Monitor temp machine circulation: Track extended assignments

### Critical Scenarios

1. **Unfixable Device**: Student gets permanent replacement, temp returns to circulation
2. **Temp Device Breakdown**: Remove from circulation, repair or retire
3. **Extended Temp Use**: Flag students with temp devices >2 weeks

---

## Story G: Prevent Lost Temp Devices

**Addresses Problem #3**

**As a** librarian  
**I want to** track and prevent students from keeping temp devices permanently  
**So that** temp devices stay in circulation for other students

### Example Scenario

- System tracks: "Student Jane has had CB-LOAN-018 for 3 weeks"
- Alert generated: "Jane's original device was repaired 2 weeks ago - pickup overdue"
- Automated reminder: Email to student/parents/advisor about returning temp device
- Escalation: After 4 weeks, involve administration for device return

---

## Story H: Management Reporting & Inventory Planning

**Addresses Problem #1**

**As an** IT Director  
**I want to** get overview reports on repair volume and inventory health  
**So that** I can make informed purchasing and resource decisions

### Monthly Planning Workflow

- IT Director opens repair analytics dashboard
- **Views current system health:**
  - Active Repairs: "12 devices currently in repair queue"
  - Loaner Utilization: "8 of 15 loaner devices assigned"
  - Repair Trends: "Screen replacements up 30% this month"
  - Cost Analysis: "$450 in repair costs vs $320 last month"
  - Problem Devices: "3 devices with multiple repairs"
- **Uses data for decisions:**
  - Order additional loaner devices based on utilization
  - Budget for increased screen replacement costs
  - Flag high-repair devices for replacement
  - Plan staff time allocation

---

## Critical Requirements from Feedback

### Must-Have Workflow Changes

1. **Google Form Workflow (KEEP)** - Students fill out form from classroom first
2. **Scheduled Drop-off (NEW)** - Students cannot just show up unannounced
3. **Librarian-Controlled Pickup (NEW)** - Tech → alerts librarian → librarian prepares → triggers pickup email
4. **Communication CCs (NEW)** - Always CC advisors (grades 5-9) and parents (all grades)
5. **Temp Device Management (CRITICAL)** - Start with 30 temp devices in good condition

### Data Quality Issues (from Nick)

**Problem**: "Students have shown they are fairly incapable of doing it [form submission] reliably"

**Common Issues**:

- Asset tags: "ao333" instead of "A0333"
- Descriptions: "it wasn't my fault just feel" instead of actual issue
- Wrong student/device mappings

**Solution**: Ticket editing/triaging workflow

- Google Chat notification includes edit link
- Untriaged tickets view for immediate corrections
- Staff can fix asset tags, descriptions, student mappings

### Flexible Temp Assignment (from Nick)

**Scenario**: "If they come straight to me but end up needing a temp, can I mark as getting temp without knowing the asset tag?"

**Solution**: Separate device status and temp status tracking

- **Device Status**: "Waiting on Device", "In Repair", "Ready for Pickup"
- **Temp Status**: "Needs Temp", "Temp Ready", "Has Temp A0912"

**Multiple Workflows Supported**:

1. Student → Amy → Temp → Nick → Amy → Swap
2. Student → Nick → Quick Fix
3. Student → Nick → "You need temp" → Amy → Nick → Amy → Swap
