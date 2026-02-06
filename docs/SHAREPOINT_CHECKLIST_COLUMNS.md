# SharePoint List Columns for Deployment Checklist

Add the following columns to your `DWxServiceRequests` SharePoint list to support the Deployment Readiness Checklist feature.

## Required New Columns

### 1. ChecklistData
- **Type:** Multiple lines of text
- **Description:** Stores the checklist items as JSON
- **Required:** No
- **Default:** Empty

### 2. ChecklistComplete
- **Type:** Yes/No
- **Description:** Indicates if all checklist items are completed
- **Required:** No
- **Default:** No

### 3. ChecklistDueDate
- **Type:** Date and Time
- **Description:** The due date for the checklist (automatically calculated as 3 days before deployment)
- **Required:** No
- **Default:** Empty

---

## Steps to Add Columns in SharePoint

1. Go to your SharePoint site: `https://hallofd.sharepoint.com/sites/DWxTrafficManager`
2. Navigate to the `DWxServiceRequests` list
3. Click the **+** icon to add a column

### Adding ChecklistData Column:
1. Click **+ Add column** → **Multiple lines of text**
2. Name: `ChecklistData`
3. Type: Plain text
4. Click **Save**

### Adding ChecklistComplete Column:
1. Click **+ Add column** → **Yes/No**
2. Name: `ChecklistComplete`
3. Default value: No
4. Click **Save**

### Adding ChecklistDueDate Column:
1. Click **+ Add column** → **Date and Time**
2. Name: `ChecklistDueDate`
3. Include time: No (optional)
4. Click **Save**

---

## Checklist JSON Structure

The `ChecklistData` column stores a JSON array with the following structure:

```json
[
  {
    "id": "bom",
    "label": "Bill of Materials Available",
    "description": "The Bill of Materials (BOM) document has been prepared and is available for the deployment team.",
    "isCompleted": true,
    "completedBy": "Gary Finberg",
    "completedAt": "2026-01-15T10:30:00.000Z"
  },
  {
    "id": "licenses",
    "label": "Licenses Provisioned",
    "description": "All required licenses have been provisioned for the client environment.",
    "isCompleted": false
  }
  // ... more items
]
```

---

## Default Checklist Items

When a Deployment booking is confirmed, the following checklist items are created:

| ID | Label | Description |
|----|-------|-------------|
| `bom` | Bill of Materials Available | The Bill of Materials (BOM) document has been prepared and is available for the deployment team. |
| `licenses` | Licenses Provisioned | All required licenses have been provisioned for the client environment. |
| `service_account` | Service Account Provisioned | The service account has been created and configured with appropriate permissions. |
| `environment` | Environment Created | The deployment environment (dev/test/prod) has been set up and configured. |
| `powerbi_workspace` | Power BI Workspace Created | The Power BI workspace has been created and access has been granted to relevant users. |

---

## Business Rules

1. **Checklist Due Date:** Automatically calculated as **3 days before** the confirmed deployment date
2. **Overdue Status:** If the current date is past the due date and checklist is incomplete, booking may need to be rescheduled
3. **Rescheduling:** If checklist is not complete 3 days before deployment, the booking status should be changed to "Rescheduling Required"

---

## Power Automate Integration (Optional)

You can add a scheduled Power Automate flow to check for overdue checklists:

1. **Trigger:** Recurrence (daily at 9 AM)
2. **Action:** Get items from SharePoint list where:
   - `BookingType eq 'Deployment'`
   - `ChecklistComplete eq false`
   - `Status eq 'Confirmed'`
   - `ChecklistDueDate le [today]`
3. **For each** overdue item:
   - Update item: Status = "Rescheduling Required"
   - Send email notification to Account Manager
