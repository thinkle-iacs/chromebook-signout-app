# Database Schema & Models

## AirTable Tables Overview

### Tickets Table (NEW)

**Primary table replacing Google Sheets workflow**

### Billing Notifications Table (NEW)

**Handles business office invoicing workflow**

### Inventory Table (UPDATED)

**Existing table with repair status enhancements**

### Students Table (UPDATED)

**Existing table with ticket relationship fields**

### Staff Table (UPDATED)

**Existing table with ticket assignment fields**

---

## Tickets Table Schema

### Core Fields

- **Ticket ID** (Auto Number - Primary Field)
- **Student** (Link to Students table - existing)
- **Asset** (Link to Inventory table - existing)
- **Issue Description** (Long text - cleaned up from form data)
- **Device Status** (Single select: New, Triaged, Waiting on Device, In Repair, Ready for Pickup)
- **Temp Status** (Single select: No Temp Needed, Needs Temp, Temp Ready, Has Temp)
- **Final Cost** (Currency)
- **Repair Notes** (Long text)

### Form Data Fields (Raw - may need editing)

- **Form Asset Tag** (Single line text - as entered by student, may have errors like "ao333")
- **Form Entered Email** (Email of affected user - as entered, may be wrong)
- **Form User Email** (Email - as recorded by Google -- tells us which account filled out form, which could be different from affected user)
- **Form Description** (Long text - raw description, may need cleanup)

### Workflow Fields

- **Temp Device Assigned** (Link to Inventory table - specific temp device)
- **Chat Notification Sent** (Checkbox - track Google Chat sent)
- **Needs Triaging** (Checkbox - auto-set for new tickets, cleared when staff reviews)
- **Priority** (Single select: Low, Medium, High, Urgent)
- **Date Created** (Date)
- **Date Resolved** (Date)
- **Photos** (Attachments)
- **Staff Member** (Link to Staff table)

### Lookup Fields (from existing tables)

- **Student Email** (Lookup from Student - correct email after mapping)
- **Student Grade** (Lookup from Student)
- **Advisor Email** (Lookup from Student → Advisor - for CC)
- **Parent Contacts** (Lookup from Student → existing contact fields)
- **Asset Tag** (Lookup from Asset - correct tag after triaging)

---

## Billing Notifications Table Schema

### Core Fields

- **Notification ID** (Auto Number - Primary Field)
- **Ticket Reference** (Link to Tickets table - Single record)
- **Student Name** (Lookup from Ticket → Student)
- **Student Contact** (Lookup from Ticket → Student → Contact Info)
- **Asset ID** (Lookup from Ticket → Asset → Asset Tag)
- **Cost** (Currency)
- **Description** (Long text - repair details)
- **Date Sent** (Date)
- **Status** (Single select: Pending, Sent, Acknowledged)

---

## Updated Existing Tables

### Inventory Table Updates

**Add these fields to existing Inventory table:**

- **Repair Status** (Single select: In Service, In Repair, Loaner, Retired, Lost)
- **Original Owner** (Link to Students table - for tracking during repairs)
- **Temporary Assignment** (Checkbox - flags loaner devices)
- **Related Tickets** (Link to Tickets table - Allow multiple)

### Students Table Updates

**Add these fields to existing Students table:**

- **Active Tickets** (Link to Tickets table - Allow multiple)
- **Billing Notifications** (Link to Billing Notifications table - Allow multiple)

### Staff Table Updates

**Add these fields to existing Staff table:**

- **Assigned Tickets** (Link to Tickets table - Allow multiple)

---

## Table Relationships

### Primary Relationships

- **Tickets ↔ Inventory** (Asset field)
- **Tickets ↔ Students** (Student field)
- **Tickets ↔ Staff** (Staff Member field)
- **Billing Notifications ↔ Tickets** (Ticket Reference field)
- **Billing Notifications ↔ Students** (via Ticket lookup)

### Bidirectional Links

All relationships should be configured as bidirectional in AirTable to enable:

- Looking up tickets from student records
- Viewing student info from ticket records
- Seeing device history from asset records
- Tracking staff workload from staff records

---

## AirTable Automations

### Status Change Automations

- **When Ticket Device Status → "In Repair"** → Update linked Asset Repair Status to "In Repair"
- **When Ticket Device Status → "Ready for Pickup"** → Update linked Asset Repair Status to "In Service"
- **When Asset Repair Status changes** → Send notification to assigned Staff Member

### Billing Automations

- **When Ticket marked for billing** → Create new Billing Notification record with linked Ticket
- **When Billing Notification created** → Email business office with billing details
- **When Billing Notification Status → "Paid"** → Send confirmation email

### Student Communication Automations

- **When new Ticket created** → Send confirmation email to student: "Repair request received"
- **When Temp Status → "Temp Ready"** → Send email: "Temp device ready, bring your device to library"
- **When Device Status → "Ready for Pickup"** → Send email: "Device ready for pickup"

---

## Ticket Workflow States

### Device Status Flow

1. **New** - Just submitted, needs triaging
2. **Triaged** - Staff has reviewed and corrected any issues
3. **Waiting on Device** - Student needs to bring device in
4. **In Repair** - Device with tech for repair
5. **Ready for Pickup** - Repair complete, ready for student

### Temp Status Flow

1. **No Temp Needed** - Quick fix or student keeps device
2. **Needs Temp** - Student will need temporary device
3. **Temp Ready** - Librarian has prepared temp device
4. **Has Temp [Asset]** - Student has been assigned specific temp device

### Status Combinations

The separate device and temp statuses support flexible workflows:

- Device: "Waiting on Device" + Temp: "Temp Ready" = Student needs to bring device to swap
- Device: "In Repair" + Temp: "Has Temp A0912" = Student has temp while device is being fixed
- Device: "Ready for Pickup" + Temp: "Has Temp A0912" = Student needs to return temp and get original

---

## Data Quality Considerations

### Student Form Submission Issues

Students commonly submit incorrect data that needs triaging:

- Asset tags with wrong case: "ao333" instead of "A0333"
- Incomplete descriptions: "it wasn't my fault just feel"
- Wrong email addresses or student mappings

### Triaging Workflow

- **Needs Triaging** checkbox auto-set to true for new tickets from Google Form
- Staff can edit Form Asset Tag → Asset lookup to correct mapping
- Staff can edit Form Student Email → Student lookup to correct mapping
- Staff can clean up Form Description → Issue Description
- Once corrected, clear **Needs Triaging** checkbox

### Data Validation

- Asset lookups should be fuzzy/forgiving (A0333 matches ao333)
- Student lookups should support email OR name search
- Issue descriptions should have templates/suggestions for common problems

---

## TypeScript Interfaces

### Core Types

```typescript
interface Ticket {
  id: string;
  studentId: string;
  assetId: string;
  issueDescription: string;
  deviceStatus:
    | "New"
    | "Triaged"
    | "Waiting on Device"
    | "In Repair"
    | "Ready for Pickup";
  tempStatus: "No Temp Needed" | "Needs Temp" | "Temp Ready" | "Has Temp";
  finalCost?: number;
  repairNotes?: string;
  formAssetTag: string;
  formStudentEmail: string;
  formDescription: string;
  tempDeviceAssigned?: string;
  chatNotificationSent: boolean;
  needsTriaging: boolean;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dateCreated: Date;
  dateResolved?: Date;
  staffMemberId?: string;
}

interface BillingNotification {
  id: string;
  ticketId: string;
  cost: number;
  description: string;
  dateSent?: Date;
  status: "Pending" | "Sent" | "Acknowledged";
}
```

### Extended Types with Lookups

```typescript
interface TicketWithDetails extends Ticket {
  student: {
    name: string;
    email: string;
    grade: number;
    advisorEmail?: string;
    parentContacts: string[];
  };
  asset: {
    assetTag: string;
    model: string;
    repairStatus: string;
    originalOwner?: string;
  };
  tempDevice?: {
    assetTag: string;
    model: string;
  };
}
```
