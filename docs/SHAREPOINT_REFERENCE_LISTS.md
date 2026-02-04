# SharePoint Reference Lists Setup

This document provides instructions for creating the **TeamMembers** and **Clients** SharePoint lists for the LP Demo Scheduler application.

---

## 1. TeamMembers List

### Create the List
1. Go to SharePoint site: `https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler`
2. Click **New** → **List**
3. Name: `TeamMembers`
4. Description: `Internal team members including Account Managers, Developers, and Demo Specialists`

### Add Columns

| Column Name | Type | Required | Settings |
|-------------|------|----------|----------|
| **Title** | Single line of text | Yes | Rename to "Full Name" (display name) |
| **Email** | Single line of text | Yes | |
| **Phone** | Single line of text | No | |
| **Role** | Choice | Yes | Choices: `Account Manager`, `Developer`, `Demo Specialist` |
| **Department** | Single line of text | No | |
| **IsActive** | Yes/No | Yes | Default: Yes |

### Column Details

#### Title (Full Name)
- **Type:** Single line of text
- **Required:** Yes
- **Description:** The team member's full name
- **Example:** `John Smith`

#### Email
- **Type:** Single line of text
- **Required:** Yes
- **Description:** Work email address
- **Example:** `john.smith@firsttech.digital`

#### Phone
- **Type:** Single line of text
- **Required:** No
- **Description:** Contact phone number
- **Example:** `+1 (555) 123-4567`

#### Role
- **Type:** Choice
- **Required:** Yes
- **Choices:**
  - Account Manager
  - Developer
  - Demo Specialist
- **Default value:** Account Manager
- **Allow fill-in choices:** No

#### Department
- **Type:** Single line of text
- **Required:** No
- **Description:** Team or department name
- **Example:** `Sales`, `Engineering`, `Product`

#### IsActive
- **Type:** Yes/No
- **Required:** Yes
- **Default value:** Yes
- **Description:** Whether the team member is currently active

### Column Formatting (Optional)

#### Role Column
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "children": [
    {
      "elmType": "span",
      "style": {
        "padding": "4px 10px",
        "border-radius": "12px",
        "font-size": "12px",
        "font-weight": "600",
        "background-color": "=if(@currentField == 'Account Manager', '#0078d4', if(@currentField == 'Developer', '#107c10', '#8764b8'))",
        "color": "#ffffff"
      },
      "txtContent": "@currentField"
    }
  ]
}
```

#### IsActive Column
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "children": [
    {
      "elmType": "span",
      "style": {
        "padding": "4px 10px",
        "border-radius": "12px",
        "font-size": "12px",
        "font-weight": "600",
        "background-color": "=if(@currentField == true, '#107c10', '#d13438')",
        "color": "#ffffff"
      },
      "txtContent": "=if(@currentField == true, 'Active', 'Inactive')"
    }
  ]
}
```

---

## 2. Clients List

### Create the List
1. Go to SharePoint site: `https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler`
2. Click **New** → **List**
3. Name: `Clients`
4. Description: `Client organizations and their primary contacts`

### Add Columns

| Column Name | Type | Required | Settings |
|-------------|------|----------|----------|
| **Title** | Single line of text | Yes | Rename to "Company Name" (display name) |
| **PrimaryContactName** | Single line of text | Yes | |
| **PrimaryContactEmail** | Single line of text | Yes | |
| **Phone** | Single line of text | No | |
| **Industry** | Choice | No | See choices below |
| **IsPremium** | Yes/No | Yes | Default: No |
| **AccountManagerEmail** | Single line of text | No | Links to TeamMembers |
| **AccountManagerName** | Single line of text | No | Denormalized for display |
| **ContractStatus** | Choice | Yes | Choices: `Prospect`, `Active`, `Churned` |
| **Notes** | Multiple lines of text | No | |

### Column Details

#### Title (Company Name)
- **Type:** Single line of text
- **Required:** Yes
- **Description:** The client organization's name
- **Example:** `Contoso Ltd`

#### PrimaryContactName
- **Type:** Single line of text
- **Required:** Yes
- **Description:** Name of the primary contact person
- **Example:** `Jane Doe`

#### PrimaryContactEmail
- **Type:** Single line of text
- **Required:** Yes
- **Description:** Email of the primary contact
- **Example:** `jane.doe@contoso.com`

#### Phone
- **Type:** Single line of text
- **Required:** No
- **Description:** Company or contact phone number
- **Example:** `+1 (555) 987-6543`

#### Industry
- **Type:** Choice
- **Required:** No
- **Choices:**
  - Technology
  - Finance
  - Healthcare
  - Manufacturing
  - Retail
  - Government
  - Education
  - Other
- **Allow fill-in choices:** No

#### IsPremium
- **Type:** Yes/No
- **Required:** Yes
- **Default value:** No
- **Description:** Whether this is a premium/priority client

#### AccountManagerEmail
- **Type:** Single line of text
- **Required:** No
- **Description:** Email of the assigned Account Manager (links to TeamMembers list)
- **Example:** `gary@firsttech.digital`

#### AccountManagerName
- **Type:** Single line of text
- **Required:** No
- **Description:** Name of the assigned Account Manager (denormalized for easy display)
- **Example:** `Gary Finberg`

#### ContractStatus
- **Type:** Choice
- **Required:** Yes
- **Choices:**
  - Prospect
  - Active
  - Churned
- **Default value:** Prospect
- **Allow fill-in choices:** No

#### Notes
- **Type:** Multiple lines of text
- **Required:** No
- **Rich text:** No (Plain text)
- **Description:** Additional notes about the client

### Column Formatting (Optional)

#### IsPremium Column
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

#### ContractStatus Column
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "children": [
    {
      "elmType": "span",
      "style": {
        "padding": "4px 10px",
        "border-radius": "12px",
        "font-size": "12px",
        "font-weight": "600",
        "background-color": "=if(@currentField == 'Active', '#107c10', if(@currentField == 'Prospect', '#ffaa44', '#d13438'))",
        "color": "=if(@currentField == 'Prospect', '#323130', '#ffffff')"
      },
      "txtContent": "@currentField"
    }
  ]
}
```

#### Industry Column
```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/sp/v2/column-formatting.schema.json",
  "elmType": "div",
  "children": [
    {
      "elmType": "span",
      "style": {
        "padding": "4px 8px",
        "border-radius": "4px",
        "font-size": "12px",
        "background-color": "#f3f2f1",
        "border": "1px solid #edebe9"
      },
      "txtContent": "@currentField"
    }
  ]
}
```

---

## 3. Recommended Views

### TeamMembers Views

#### All Team Members (Default)
- **Columns:** Title, Email, Role, Department, IsActive
- **Sort:** Title (A-Z)
- **Filter:** None

#### Active Account Managers
- **Columns:** Title, Email, Phone, Department
- **Sort:** Title (A-Z)
- **Filter:** `Role equals "Account Manager" AND IsActive equals "Yes"`

#### By Role (Grouped)
- **Columns:** Title, Email, Phone, Department, IsActive
- **Sort:** Title (A-Z)
- **Group By:** Role

### Clients Views

#### All Clients (Default)
- **Columns:** Title, PrimaryContactName, Industry, AccountManagerName, ContractStatus, IsPremium
- **Sort:** Title (A-Z)
- **Filter:** None

#### Active Clients
- **Columns:** Title, PrimaryContactName, PrimaryContactEmail, AccountManagerName, IsPremium
- **Sort:** Title (A-Z)
- **Filter:** `ContractStatus equals "Active"`

#### Premium Clients
- **Columns:** Title, PrimaryContactName, AccountManagerName, ContractStatus
- **Sort:** Title (A-Z)
- **Filter:** `IsPremium equals "Yes"`

#### By Account Manager (Grouped)
- **Columns:** Title, PrimaryContactName, ContractStatus, IsPremium
- **Sort:** Title (A-Z)
- **Group By:** AccountManagerName

#### By Industry (Grouped)
- **Columns:** Title, PrimaryContactName, AccountManagerName, ContractStatus
- **Sort:** Title (A-Z)
- **Group By:** Industry

---

## 4. Sample Data

### TeamMembers Sample Data
| Title | Email | Role | Department | IsActive |
|-------|-------|------|------------|----------|
| Gary Finberg | gary@firsttech.digital | Account Manager | Sales | Yes |
| Sarah Johnson | sarah@firsttech.digital | Account Manager | Sales | Yes |
| Mike Chen | mike@firsttech.digital | Developer | Engineering | Yes |
| Emily Davis | emily@firsttech.digital | Demo Specialist | Product | Yes |

### Clients Sample Data
| Title | PrimaryContactName | PrimaryContactEmail | Industry | IsPremium | AccountManagerEmail | ContractStatus |
|-------|-------------------|---------------------|----------|-----------|---------------------|----------------|
| Contoso Ltd | Jane Doe | jane@contoso.com | Technology | Yes | gary@firsttech.digital | Active |
| Fabrikam Inc | John Smith | john@fabrikam.com | Manufacturing | No | sarah@firsttech.digital | Active |
| Adventure Works | Bob Wilson | bob@adventure.com | Retail | No | gary@firsttech.digital | Prospect |

---

## 5. App Integration

The application uses these lists in the following ways:

1. **Booking Form:** Client dropdown populated from `Clients` list (Active status only)
2. **Admin Page:** Full CRUD operations for both lists
3. **Client Selection:** Auto-sets "Premium Client" checkbox based on client's IsPremium status
4. **Dashboard Filters:** Account Manager filter populated from `TeamMembers` list

### SharePoint API Endpoints

```
TeamMembers: /_api/web/lists/getbytitle('TeamMembers')/items
Clients: /_api/web/lists/getbytitle('Clients')/items
```

### Required Permissions
- Site Members: Read/Write to both lists
- Site Visitors: Read-only access
