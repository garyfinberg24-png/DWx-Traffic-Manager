# DWxServiceRequests List - Manual Column Setup

Since the app-only authentication has limited permissions, please add these columns manually through the SharePoint UI.

## Go to your list
<https://hallofd.sharepoint.com/sites/DWxTrafficManager/Lists/DWxServiceRequests/AllItems.aspx>

## Add Columns

Click **+ Add column** for each of the following:

### Text Columns (Single line of text)
| Column Name | Type |
|-------------|------|
| AccountManagerName | Single line of text |
| AccountManagerEmail | Single line of text |
| ClientName | Single line of text |
| Outcome | Single line of text |
| CalendarEventId | Single line of text |

### Choice Columns
| Column Name | Type | Choices |
|-------------|------|---------|
| BookingType | Choice | `Demo`, `Deployment` |
| Status | Choice | `Pending Review`, `Awaiting Approval`, `Confirmed`, `Cancelled`, `Rescheduling Required` |

### Number Column
| Column Name | Type |
|-------------|------|
| LicenseCount | Number |

### Date and Time Columns
| Column Name | Type | Include Time |
|-------------|------|--------------|
| ProposedSlot1 | Date and time | Yes |
| ProposedSlot2 | Date and time | Yes |
| ProposedSlot3 | Date and time | Yes |
| ConfirmedDateTime | Date and time | Yes |

### Multi-line Text Columns
| Column Name | Type |
|-------------|------|
| Comments | Multiple lines of text |
| NextSteps | Multiple lines of text |

### Yes/No Column
| Column Name | Type | Default |
|-------------|------|---------|
| IsPremiumClient | Yes/No | No |

---

## Quick Steps for Each Column Type

### Single line of text
1. Click **+ Add column** > **Single line of text**
2. Enter the column name
3. Click **Save**

### Choice
1. Click **+ Add column** > **Choice**
2. Enter the column name
3. Enter each choice on a new line
4. Click **Save**

### Number
1. Click **+ Add column** > **Number**
2. Enter the column name
3. Click **Save**

### Date and time
1. Click **+ Add column** > **Date and time**
2. Enter the column name
3. Set **Include time** to **Yes**
4. Click **Save**

### Multiple lines of text
1. Click **+ Add column** > **Multiple lines of text**
2. Enter the column name
3. Click **Save**

### Yes/No
1. Click **+ Add column** > **Yes/No**
2. Enter the column name
3. Set default to **No**
4. Click **Save**

---

## Total: 14 columns to add

1. AccountManagerName (Text)
2. AccountManagerEmail (Text)
3. ClientName (Text)
4. BookingType (Choice: Demo, Deployment)
5. LicenseCount (Number)
6. ProposedSlot1 (DateTime)
7. ProposedSlot2 (DateTime)
8. ProposedSlot3 (DateTime)
9. ConfirmedDateTime (DateTime)
10. Comments (Multi-line text)
11. NextSteps (Multi-line text)
12. IsPremiumClient (Yes/No)
13. Status (Choice: Pending Review, Awaiting Approval, Confirmed, Cancelled, Rescheduling Required)
14. Outcome (Text)
15. CalendarEventId (Text)

Note: The list already has a **Title** column by default - this will be used for the booking title/reference.
