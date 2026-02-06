# SharePoint List View Formatting

This document contains JSON formatting for the DWxServiceRequests SharePoint list columns and views.

## Column Formatting

### Status Column

Apply this formatting to the **Status** column to show colored badges:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "flex",
    "align-items": "center",
    "justify-content": "flex-start"
  },
  "children": [
    {
      "elmType": "span",
      "style": {
        "padding": "4px 12px",
        "border-radius": "16px",
        "font-size": "12px",
        "font-weight": "600",
        "white-space": "nowrap",
        "background-color": "=if(@currentField == 'Confirmed', '#107c10', if(@currentField == 'Pending Review', '#ffaa44', if(@currentField == 'Awaiting Approval', '#0078d4', if(@currentField == 'Cancelled', '#d13438', if(@currentField == 'Rescheduling Required', '#8764b8', '#605e5c')))))",
        "color": "=if(@currentField == 'Pending Review', '#323130', '#ffffff')"
      },
      "txtContent": "@currentField",
      "attributes": {
        "class": "=if(@currentField == 'Confirmed', 'sp-css-backgroundColor-successBackground16', '')"
      }
    }
  ]
}
```

### BookingType Column

Apply this formatting to the **BookingType** column:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "flex",
    "align-items": "center",
    "gap": "8px"
  },
  "children": [
    {
      "elmType": "span",
      "style": {
        "width": "24px",
        "height": "24px",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "border-radius": "4px",
        "background-color": "=if(@currentField == 'Demo', '#0078d4', '#107c10')",
        "color": "#ffffff",
        "font-size": "12px",
        "font-weight": "700"
      },
      "txtContent": "=if(@currentField == 'Demo', 'D', 'T')"
    },
    {
      "elmType": "span",
      "style": {
        "font-weight": "500"
      },
      "txtContent": "=if(@currentField == 'Demo', 'Demo', 'Trial Deployment')"
    }
  ]
}
```

### IsPremiumClient Column

Apply this formatting to the **IsPremiumClient** column to show a star icon:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "flex",
    "align-items": "center",
    "justify-content": "center"
  },
  "children": [
    {
      "elmType": "span",
      "style": {
        "display": "=if(@currentField == true, 'flex', 'none')",
        "align-items": "center",
        "gap": "4px",
        "padding": "2px 8px",
        "border-radius": "12px",
        "background-color": "#fff4ce",
        "color": "#797673"
      },
      "children": [
        {
          "elmType": "span",
          "style": {
            "color": "#ffaa44",
            "font-size": "16px"
          },
          "txtContent": "★"
        },
        {
          "elmType": "span",
          "style": {
            "font-size": "12px",
            "font-weight": "600"
          },
          "txtContent": "Premium"
        }
      ]
    },
    {
      "elmType": "span",
      "style": {
        "display": "=if(@currentField != true, 'block', 'none')",
        "color": "#a19f9d",
        "font-size": "12px"
      },
      "txtContent": "Standard"
    }
  ]
}
```

### LicenseCount Column

Apply this formatting to the **LicenseCount** column to show a visual indicator:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "flex",
    "align-items": "center",
    "gap": "8px"
  },
  "children": [
    {
      "elmType": "div",
      "style": {
        "width": "40px",
        "height": "8px",
        "background-color": "#edebe9",
        "border-radius": "4px",
        "overflow": "hidden"
      },
      "children": [
        {
          "elmType": "div",
          "style": {
            "height": "100%",
            "width": "=if(@currentField >= 100, '100%', if(@currentField >= 50, '75%', if(@currentField >= 20, '50%', '25%')))",
            "background-color": "=if(@currentField >= 100, '#107c10', if(@currentField >= 50, '#0078d4', if(@currentField >= 20, '#ffaa44', '#d13438')))",
            "border-radius": "4px"
          }
        }
      ]
    },
    {
      "elmType": "span",
      "style": {
        "font-weight": "600",
        "color": "=if(@currentField >= 100, '#107c10', if(@currentField >= 50, '#0078d4', if(@currentField >= 20, '#ffaa44', '#605e5c')))"
      },
      "txtContent": "=@currentField + ' licenses'"
    }
  ]
}
```

### ConfirmedDateTime Column

Apply this formatting to show confirmed dates with a calendar icon:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "=if(@currentField == '', 'none', 'flex')",
    "align-items": "center",
    "gap": "6px",
    "padding": "4px 8px",
    "background-color": "#dff6dd",
    "border-radius": "4px",
    "border": "1px solid #107c10"
  },
  "children": [
    {
      "elmType": "span",
      "style": {
        "color": "#107c10",
        "font-size": "14px"
      },
      "txtContent": "📅"
    },
    {
      "elmType": "span",
      "style": {
        "font-weight": "500",
        "color": "#107c10",
        "font-size": "13px"
      },
      "txtContent": "@currentField"
    }
  ]
}
```

### ChecklistComplete Column

Apply this formatting to the **ChecklistComplete** column:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "flex",
    "align-items": "center",
    "justify-content": "center"
  },
  "children": [
    {
      "elmType": "span",
      "style": {
        "padding": "4px 10px",
        "border-radius": "12px",
        "font-size": "12px",
        "font-weight": "600",
        "background-color": "=if(@currentField == true, '#dff6dd', '#fff4ce')",
        "color": "=if(@currentField == true, '#107c10', '#797673')",
        "border": "=if(@currentField == true, '1px solid #107c10', '1px solid #ffaa44')"
      },
      "children": [
        {
          "elmType": "span",
          "style": {
            "margin-right": "4px"
          },
          "txtContent": "=if(@currentField == true, '✓', '○')"
        },
        {
          "elmType": "span",
          "txtContent": "=if(@currentField == true, 'Ready', 'Pending')"
        }
      ]
    }
  ]
}
```

### AccountManagerName Column

Apply this formatting to show account manager with initials avatar:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "flex",
    "align-items": "center",
    "gap": "8px"
  },
  "children": [
    {
      "elmType": "div",
      "style": {
        "width": "28px",
        "height": "28px",
        "border-radius": "50%",
        "background-color": "#0078d4",
        "color": "#ffffff",
        "display": "flex",
        "align-items": "center",
        "justify-content": "center",
        "font-size": "11px",
        "font-weight": "600"
      },
      "txtContent": "=toUpperCase(substring(@currentField, 0, 1) + if(indexOf(@currentField, ' ') > 0, substring(@currentField, indexOf(@currentField, ' ') + 1, 1), ''))"
    },
    {
      "elmType": "span",
      "style": {
        "font-weight": "500"
      },
      "txtContent": "@currentField"
    }
  ]
}
```

### ClientName Column with Premium Indicator

Apply this formatting to show client name with premium badge if applicable:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "style": {
    "display": "flex",
    "align-items": "center",
    "gap": "8px"
  },
  "children": [
    {
      "elmType": "span",
      "style": {
        "font-weight": "600",
        "color": "#323130"
      },
      "txtContent": "@currentField"
    },
    {
      "elmType": "span",
      "style": {
        "display": "=if([$IsPremiumClient] == true, 'inline-flex', 'none')",
        "color": "#ffaa44",
        "font-size": "14px"
      },
      "txtContent": "★"
    }
  ]
}
```

---

## Row Formatting (Gallery View)

Apply this to create a card-style gallery view:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/row-formatting.schema.json",
  "hideSelection": false,
  "hideColumnHeader": false,
  "rowFormatter": {
    "elmType": "div",
    "style": {
      "display": "flex",
      "flex-direction": "column",
      "padding": "16px",
      "margin": "8px",
      "border-radius": "8px",
      "box-shadow": "0 2px 4px rgba(0,0,0,0.1)",
      "background-color": "#ffffff",
      "border-left": "=if([$Status] == 'Confirmed', '4px solid #107c10', if([$Status] == 'Pending Review', '4px solid #ffaa44', if([$Status] == 'Awaiting Approval', '4px solid #0078d4', if([$Status] == 'Cancelled', '4px solid #d13438', '4px solid #8764b8'))))",
      "min-width": "300px"
    },
    "children": [
      {
        "elmType": "div",
        "style": {
          "display": "flex",
          "justify-content": "space-between",
          "align-items": "flex-start",
          "margin-bottom": "12px"
        },
        "children": [
          {
            "elmType": "div",
            "children": [
              {
                "elmType": "div",
                "style": {
                  "display": "flex",
                  "align-items": "center",
                  "gap": "8px",
                  "margin-bottom": "4px"
                },
                "children": [
                  {
                    "elmType": "span",
                    "style": {
                      "font-size": "16px",
                      "font-weight": "600",
                      "color": "#323130"
                    },
                    "txtContent": "[$ClientName]"
                  },
                  {
                    "elmType": "span",
                    "style": {
                      "display": "=if([$IsPremiumClient] == true, 'inline', 'none')",
                      "color": "#ffaa44",
                      "font-size": "16px"
                    },
                    "txtContent": "★"
                  }
                ]
              },
              {
                "elmType": "span",
                "style": {
                  "font-size": "13px",
                  "color": "#605e5c"
                },
                "txtContent": "=[$AccountManagerName]"
              }
            ]
          },
          {
            "elmType": "span",
            "style": {
              "padding": "4px 10px",
              "border-radius": "12px",
              "font-size": "11px",
              "font-weight": "600",
              "background-color": "=if([$Status] == 'Confirmed', '#107c10', if([$Status] == 'Pending Review', '#ffaa44', if([$Status] == 'Awaiting Approval', '#0078d4', if([$Status] == 'Cancelled', '#d13438', '#8764b8'))))",
              "color": "=if([$Status] == 'Pending Review', '#323130', '#ffffff')"
            },
            "txtContent": "[$Status]"
          }
        ]
      },
      {
        "elmType": "div",
        "style": {
          "display": "flex",
          "gap": "16px",
          "margin-bottom": "12px",
          "padding": "8px 0",
          "border-top": "1px solid #edebe9",
          "border-bottom": "1px solid #edebe9"
        },
        "children": [
          {
            "elmType": "div",
            "style": {
              "display": "flex",
              "align-items": "center",
              "gap": "4px"
            },
            "children": [
              {
                "elmType": "span",
                "style": {
                  "padding": "2px 8px",
                  "border-radius": "4px",
                  "font-size": "11px",
                  "font-weight": "600",
                  "background-color": "=if([$BookingType] == 'Demo', '#deecf9', '#dff6dd')",
                  "color": "=if([$BookingType] == 'Demo', '#0078d4', '#107c10')"
                },
                "txtContent": "[$BookingType]"
              }
            ]
          },
          {
            "elmType": "div",
            "style": {
              "display": "flex",
              "align-items": "center",
              "gap": "4px"
            },
            "children": [
              {
                "elmType": "span",
                "style": {
                  "font-size": "12px",
                  "color": "#605e5c"
                },
                "txtContent": "Licenses:"
              },
              {
                "elmType": "span",
                "style": {
                  "font-size": "12px",
                  "font-weight": "600",
                  "color": "#323130"
                },
                "txtContent": "[$LicenseCount]"
              }
            ]
          }
        ]
      },
      {
        "elmType": "div",
        "style": {
          "display": "=if([$ConfirmedDateTime] == '', 'none', 'flex')",
          "align-items": "center",
          "gap": "6px",
          "padding": "6px 10px",
          "background-color": "#dff6dd",
          "border-radius": "4px",
          "margin-bottom": "8px"
        },
        "children": [
          {
            "elmType": "span",
            "txtContent": "📅"
          },
          {
            "elmType": "span",
            "style": {
              "font-size": "12px",
              "font-weight": "500",
              "color": "#107c10"
            },
            "txtContent": "='Confirmed: ' + [$ConfirmedDateTime]"
          }
        ]
      },
      {
        "elmType": "div",
        "style": {
          "display": "flex",
          "justify-content": "space-between",
          "align-items": "center",
          "font-size": "11px",
          "color": "#a19f9d"
        },
        "children": [
          {
            "elmType": "span",
            "txtContent": "='Created: ' + [$Created]"
          },
          {
            "elmType": "span",
            "txtContent": "='ID: ' + [$ID]"
          }
        ]
      }
    ]
  }
}
```

---

## Recommended Views

### 1. All Bookings (Default View)

**View Name:** All Bookings
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- BookingType
- LicenseCount
- Status
- IsPremiumClient
- Created
- ConfirmedDateTime

**Sort:** Created (Descending)

**Filter:** None

---

### 2. Pending Approvals

**View Name:** Pending Approvals
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- BookingType
- LicenseCount
- ProposedSlot1
- ProposedSlot2
- ProposedSlot3
- IsPremiumClient
- Created

**Sort:** Created (Ascending) - oldest first

**Filter:**
```
Status equals "Pending Review" OR Status equals "Awaiting Approval"
```

---

### 3. Confirmed Bookings

**View Name:** Confirmed Bookings
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- BookingType
- LicenseCount
- ConfirmedDateTime
- IsPremiumClient
- Outcome
- NextSteps

**Sort:** ConfirmedDateTime (Ascending)

**Filter:**
```
Status equals "Confirmed"
```

---

### 4. Deployment Readiness

**View Name:** Deployment Readiness
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- LicenseCount
- ConfirmedDateTime
- ChecklistComplete
- ChecklistDueDate
- ChecklistData

**Sort:** ChecklistDueDate (Ascending)

**Filter:**
```
BookingType equals "Deployment" AND Status equals "Confirmed"
```

---

### 5. Premium Clients

**View Name:** Premium Clients
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- BookingType
- LicenseCount
- Status
- ConfirmedDateTime
- Created

**Sort:** Created (Descending)

**Filter:**
```
IsPremiumClient equals "Yes"
```

---

### 6. By Account Manager (Grouped)

**View Name:** By Account Manager
**Columns to Show:**
- ID
- ClientName
- BookingType
- LicenseCount
- Status
- IsPremiumClient
- Created

**Sort:** Created (Descending)

**Group By:** AccountManagerName (Ascending)

**Filter:** None

---

### 7. Cancelled/Rescheduling Required

**View Name:** Needs Attention
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- BookingType
- Status
- Comments
- Created

**Sort:** Created (Descending)

**Filter:**
```
Status equals "Cancelled" OR Status equals "Rescheduling Required"
```

---

### 8. This Month's Bookings

**View Name:** This Month
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- BookingType
- LicenseCount
- Status
- IsPremiumClient
- Created

**Sort:** Created (Descending)

**Filter:**
```
Created is greater than or equal to [Today]-30
```

---

### 9. Overdue Checklists

**View Name:** Overdue Checklists
**Columns to Show:**
- ID
- ClientName
- AccountManagerName
- LicenseCount
- ConfirmedDateTime
- ChecklistComplete
- ChecklistDueDate

**Sort:** ChecklistDueDate (Ascending)

**Filter:**
```
BookingType equals "Deployment"
AND ChecklistComplete equals "No"
AND ChecklistDueDate is less than [Today]
```

---

### 10. Calendar View

**View Name:** Calendar
**View Type:** Calendar

**Start Date Column:** ConfirmedDateTime
**Title Column:** ClientName

**Filter:**
```
Status equals "Confirmed" AND ConfirmedDateTime is not empty
```

---

## How to Apply Formatting

### Column Formatting:
1. Go to your SharePoint list
2. Click on the column header dropdown
3. Select **Column settings** → **Format this column**
4. Choose **Advanced mode**
5. Paste the JSON and click **Save**

### Row/View Formatting:
1. Go to your SharePoint list
2. Click on the view dropdown (e.g., "All Items")
3. Select **Format current view**
4. Choose **Advanced mode**
5. Paste the JSON and click **Save**

### Creating Views:
1. Go to your SharePoint list
2. Click on the view dropdown
3. Select **Create new view**
4. Configure columns, sorting, filtering, and grouping as specified above
5. Save the view

---

## Color Reference

| Status | Color | Hex |
|--------|-------|-----|
| Confirmed | Green | #107c10 |
| Pending Review | Orange | #ffaa44 |
| Awaiting Approval | Blue | #0078d4 |
| Cancelled | Red | #d13438 |
| Rescheduling Required | Purple | #8764b8 |
| Demo | Blue | #0078d4 |
| Deployment | Green | #107c10 |
| Premium | Gold | #ffaa44 |

