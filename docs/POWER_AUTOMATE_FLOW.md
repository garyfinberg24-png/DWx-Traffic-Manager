# LP Demo Scheduler - Power Automate Flow Setup

This guide provides step-by-step instructions to create the Power Automate approval workflow for the LP Booking App.

## Flow Overview

The flow will:
1. Receive booking requests from the app via HTTP trigger
2. Create a SharePoint list item
3. Send an approval request to the designated approver
4. Update the booking status based on approval decision
5. Send confirmation/rejection email to the account manager
6. Create a calendar event for approved bookings

---

## Step 1: Create a New Flow

1. Go to [Power Automate](https://make.powerautomate.com)
2. Click **+ Create** in the left menu
3. Select **Instant cloud flow**
4. Name it: `LP Demo Scheduler - Booking Approval`
5. Select trigger: **When an HTTP request is received**
6. Click **Create**

---

## Step 2: Configure the HTTP Trigger

1. Click on the **When an HTTP request is received** trigger
2. Set **Who can trigger the flow** to: `Anyone`
3. In **Request Body JSON Schema**, paste:

```json
{
    "type": "object",
    "properties": {
        "clientName": {
            "type": "string"
        },
        "bookingType": {
            "type": "string"
        },
        "licenseCount": {
            "type": "integer"
        },
        "proposedSlot1": {
            "type": "string"
        },
        "proposedSlot2": {
            "type": "string"
        },
        "proposedSlot3": {
            "type": "string"
        },
        "comments": {
            "type": "string"
        },
        "isPremiumClient": {
            "type": "boolean"
        },
        "accountManagerName": {
            "type": "string"
        },
        "accountManagerEmail": {
            "type": "string"
        }
    },
    "required": [
        "clientName",
        "bookingType",
        "licenseCount",
        "proposedSlot1",
        "proposedSlot2",
        "proposedSlot3",
        "accountManagerName",
        "accountManagerEmail"
    ]
}
```

---

## Step 3: Initialize Variables

Add these actions after the trigger:

### 3.1 Initialize Variable - BookingId
1. Click **+ New step** → Search for **Initialize variable**
2. Configure:
   - **Name**: `BookingId`
   - **Type**: `Integer`
   - **Value**: `0`

### 3.2 Initialize Variable - SelectedSlot
1. Add another **Initialize variable**
2. Configure:
   - **Name**: `SelectedSlot`
   - **Type**: `String`
   - **Value**: (leave empty)

### 3.3 Initialize Variable - ApprovalStatus
1. Add another **Initialize variable**
2. Configure:
   - **Name**: `ApprovalStatus`
   - **Type**: `String`
   - **Value**: `Pending Review`

---

## Step 4: Create SharePoint List Item

1. Click **+ New step** → Search for **SharePoint**
2. Select **Create item**
3. Configure:
   - **Site Address**: `https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler`
   - **List Name**: `LPDemoScheduler`
   - **Title**: `@{triggerBody()?['clientName']}`
   - **AccountManagerName**: `@{triggerBody()?['accountManagerName']}`
   - **AccountManagerEmail**: `@{triggerBody()?['accountManagerEmail']}`
   - **ClientName**: `@{triggerBody()?['clientName']}`
   - **BookingType**: `@{triggerBody()?['bookingType']}`
   - **LicenseCount**: `@{triggerBody()?['licenseCount']}`
   - **ProposedSlot1**: `@{triggerBody()?['proposedSlot1']}`
   - **ProposedSlot2**: `@{triggerBody()?['proposedSlot2']}`
   - **ProposedSlot3**: `@{triggerBody()?['proposedSlot3']}`
   - **Comments**: `@{triggerBody()?['comments']}`
   - **IsPremiumClient**: `@{triggerBody()?['isPremiumClient']}`
   - **Status**: `Pending Review`

### 4.1 Set BookingId Variable
1. Add **Set variable** action
2. Configure:
   - **Name**: `BookingId`
   - **Value**: `@{outputs('Create_item')?['body/ID']}`

---

## Step 5: Send HTTP Response (Immediate)

Add a **Response** action to respond immediately to the app:

1. Click **+ New step** → Search for **Response**
2. Configure:
   - **Status Code**: `200`
   - **Headers**:
     ```
     Content-Type: application/json
     ```
   - **Body**:
     ```json
     {
       "success": true,
       "message": "Booking request submitted successfully",
       "bookingId": @{variables('BookingId')}
     }
     ```

---

## Step 6: Start Approval Process

### 6.1 Start and Wait for Approval

1. Click **+ New step** → Search for **Approvals**
2. Select **Start and wait for an approval**
3. Configure:
   - **Approval type**: `Approve/Reject - First to respond`
   - **Title**: `LP @{triggerBody()?['bookingType']} Request: @{triggerBody()?['clientName']}`
   - **Assigned to**: `gary@firsttech.digital` (or your approver email)
   - **Details**:
     ```
     A new License Pulse @{triggerBody()?['bookingType']} request has been submitted.

     **Client:** @{triggerBody()?['clientName']}
     **Account Manager:** @{triggerBody()?['accountManagerName']}
     **License Count:** @{triggerBody()?['licenseCount']}
     **Premium Client:** @{if(triggerBody()?['isPremiumClient'], 'Yes', 'No')}

     **Proposed Time Slots:**
     1. @{triggerBody()?['proposedSlot1']}
     2. @{triggerBody()?['proposedSlot2']}
     3. @{triggerBody()?['proposedSlot3']}

     **Comments:** @{triggerBody()?['comments']}

     Please select one of the proposed time slots when approving.
     ```
   - **Item link**: `https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler/Lists/LPDemoScheduler/DispForm.aspx?ID=@{variables('BookingId')}`
   - **Item link description**: `View Booking Details`

---

## Step 7: Process Approval Response

### 7.1 Add Condition for Approval

1. Click **+ New step** → Search for **Condition**
2. Configure the condition:
   - **Left value**: `@{outputs('Start_and_wait_for_an_approval')?['body/outcome']}`
   - **Operator**: `is equal to`
   - **Right value**: `Approve`

---

## Step 8: If Approved (Yes Branch)

In the **If yes** branch, add these actions:

### 8.1 Set SelectedSlot Variable
1. Add **Set variable**
2. Configure:
   - **Name**: `SelectedSlot`
   - **Value**: `@{triggerBody()?['proposedSlot1']}` (default to first slot)

### 8.2 Update SharePoint Item - Confirmed
1. Add **SharePoint - Update item**
2. Configure:
   - **Site Address**: `https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler`
   - **List Name**: `LPDemoScheduler`
   - **Id**: `@{variables('BookingId')}`
   - **Status**: `Confirmed`
   - **ConfirmedDateTime**: `@{variables('SelectedSlot')}`
   - **NextSteps**: `Booking confirmed by @{outputs('Start_and_wait_for_an_approval')?['body/responses'][0]['responder']['displayName']} on @{utcNow()}`

### 8.3 Create Calendar Event
1. Add **Office 365 Outlook - Create event (V4)**
2. Configure:
   - **Calendar id**: `Calendar` (or select your demo calendar)
   - **Subject**: `LP @{triggerBody()?['bookingType']}: @{triggerBody()?['clientName']}`
   - **Start time**: `@{variables('SelectedSlot')}`
   - **End time**: `@{addHours(variables('SelectedSlot'), 1)}`
   - **Time zone**: `(UTC+02:00) Harare, Pretoria` (or your timezone)
   - **Body**:
     ```html
     <h2>License Pulse @{triggerBody()?['bookingType']}</h2>
     <p><strong>Client:</strong> @{triggerBody()?['clientName']}</p>
     <p><strong>Account Manager:</strong> @{triggerBody()?['accountManagerName']}</p>
     <p><strong>License Count:</strong> @{triggerBody()?['licenseCount']}</p>
     <p><strong>Premium Client:</strong> @{if(triggerBody()?['isPremiumClient'], 'Yes', 'No')}</p>
     <p><strong>Comments:</strong> @{triggerBody()?['comments']}</p>
     ```
   - **Required attendees**: `@{triggerBody()?['accountManagerEmail']}`
   - **Location**: `Microsoft Teams`
   - **Is online meeting**: `Yes`

### 8.4 Update SharePoint with Calendar Event ID
1. Add **SharePoint - Update item**
2. Configure:
   - **Site Address**: `https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler`
   - **List Name**: `LPDemoScheduler`
   - **Id**: `@{variables('BookingId')}`
   - **CalendarEventId**: `@{outputs('Create_event_(V4)')?['body/id']}`

### 8.5 Send Confirmation Email
1. Add **Office 365 Outlook - Send an email (V2)**
2. Configure:
   - **To**: `@{triggerBody()?['accountManagerEmail']}`
   - **Subject**: `✅ Booking Confirmed: @{triggerBody()?['clientName']} - LP @{triggerBody()?['bookingType']}`
   - **Body**:
     ```html
     <h2>Your booking has been approved!</h2>

     <p>Good news! Your License Pulse @{triggerBody()?['bookingType']} request for <strong>@{triggerBody()?['clientName']}</strong> has been approved.</p>

     <h3>Confirmed Details:</h3>
     <ul>
       <li><strong>Date/Time:</strong> @{variables('SelectedSlot')}</li>
       <li><strong>Client:</strong> @{triggerBody()?['clientName']}</li>
       <li><strong>Type:</strong> @{triggerBody()?['bookingType']}</li>
       <li><strong>License Count:</strong> @{triggerBody()?['licenseCount']}</li>
     </ul>

     <p>A calendar invitation has been sent to your inbox.</p>

     <p><a href="https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler/Lists/LPDemoScheduler/DispForm.aspx?ID=@{variables('BookingId')}">View Booking Details</a></p>

     <p>Thank you,<br>LP Demo Scheduler</p>
     ```

---

## Step 9: If Rejected (No Branch)

In the **If no** branch, add these actions:

### 9.1 Update SharePoint Item - Cancelled
1. Add **SharePoint - Update item**
2. Configure:
   - **Site Address**: `https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler`
   - **List Name**: `LPDemoScheduler`
   - **Id**: `@{variables('BookingId')}`
   - **Status**: `Cancelled`
   - **Outcome**: `Rejected by @{outputs('Start_and_wait_for_an_approval')?['body/responses'][0]['responder']['displayName']}`
   - **NextSteps**: `@{outputs('Start_and_wait_for_an_approval')?['body/responses'][0]['comments']}`

### 9.2 Send Rejection Email
1. Add **Office 365 Outlook - Send an email (V2)**
2. Configure:
   - **To**: `@{triggerBody()?['accountManagerEmail']}`
   - **Subject**: `❌ Booking Not Approved: @{triggerBody()?['clientName']} - LP @{triggerBody()?['bookingType']}`
   - **Body**:
     ```html
     <h2>Booking Request Update</h2>

     <p>Your License Pulse @{triggerBody()?['bookingType']} request for <strong>@{triggerBody()?['clientName']}</strong> was not approved at this time.</p>

     <h3>Request Details:</h3>
     <ul>
       <li><strong>Client:</strong> @{triggerBody()?['clientName']}</li>
       <li><strong>Type:</strong> @{triggerBody()?['bookingType']}</li>
       <li><strong>License Count:</strong> @{triggerBody()?['licenseCount']}</li>
     </ul>

     <h3>Reviewer Comments:</h3>
     <p>@{outputs('Start_and_wait_for_an_approval')?['body/responses'][0]['comments']}</p>

     <p>Please contact the reviewer for more details or submit a new request with different time slots.</p>

     <p><a href="https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler/Lists/LPDemoScheduler/DispForm.aspx?ID=@{variables('BookingId')}">View Booking Details</a></p>

     <p>Thank you,<br>LP Demo Scheduler</p>
     ```

---

## Step 10: Save and Get the URL

1. Click **Save** at the top of the flow designer
2. Go back to the **When an HTTP request is received** trigger
3. Copy the **HTTP POST URL** - it will look like:
   ```
   https://prod-XX.westus.logic.azure.com:443/workflows/XXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXX
   ```

---

## Step 11: Configure the App

1. Open `LP_Booking_App/.env.local`
2. Add the Power Automate URL:
   ```
   VITE_POWER_AUTOMATE_URL=https://prod-XX.westus.logic.azure.com:443/workflows/XXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXX
   ```
3. Restart the development server

---

## Complete Flow Diagram

```
┌─────────────────────────────────────┐
│  When an HTTP request is received   │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│     Initialize Variables            │
│  - BookingId                        │
│  - SelectedSlot                     │
│  - ApprovalStatus                   │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   Create SharePoint List Item       │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│      Set BookingId Variable         │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   Response (200 OK to App)          │
└──────────────────┬──────────────────┘
                   │
┌──────────────────▼──────────────────┐
│   Start and Wait for Approval       │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐         ┌────▼────┐
    │ Approved│         │ Rejected│
    └────┬────┘         └────┬────┘
         │                   │
┌────────▼────────┐   ┌──────▼──────┐
│ Update SP:      │   │ Update SP:  │
│ Status=Confirmed│   │ Status=     │
└────────┬────────┘   │ Cancelled   │
         │            └──────┬──────┘
┌────────▼────────┐          │
│ Create Calendar │   ┌──────▼──────┐
│ Event           │   │ Send        │
└────────┬────────┘   │ Rejection   │
         │            │ Email       │
┌────────▼────────┐   └─────────────┘
│ Update SP:      │
│ CalendarEventId │
└────────┬────────┘
         │
┌────────▼────────┐
│ Send            │
│ Confirmation    │
│ Email           │
└─────────────────┘
```

---

## Testing the Flow

1. Run the app at `http://localhost:53000`
2. Create a new booking
3. Check:
   - SharePoint list for the new item
   - Your email (or Teams) for the approval request
   - Approve or reject the request
   - Verify email notifications are sent
   - Verify calendar event is created (if approved)

---

## Troubleshooting

### Flow not triggering
- Check the HTTP POST URL is correct in `.env.local`
- Ensure the flow is turned **On**
- Check flow run history for errors

### Approval not received
- Verify the approver email is correct
- Check spam/junk folder
- Ensure Approvals app is enabled in Teams

### Calendar event not created
- Verify the calendar connection is authorized
- Check the date format is correct
- Ensure the time zone is set correctly

### SharePoint errors
- Verify site URL and list name are correct
- Check column names match exactly
- Ensure the connection has write permissions
