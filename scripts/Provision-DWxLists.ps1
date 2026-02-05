<#
.SYNOPSIS
    Provisions SharePoint lists for DWx Traffic Manager application.

.DESCRIPTION
    Creates the following SharePoint lists:
    - DWxServices (Service catalog)
    - DWxServiceRequests (Sales funnel)
    - DWxProductRequests (Product demo/deployment requests)
    - DWxClients (Client master data)
    - DWxSpecialists (Pre-sales team)
    - DWxAuditLog (Audit trail)
    - DWxSupportingDocuments (Document library)

.PARAMETER SiteUrl
    The SharePoint site URL where lists will be created.

.EXAMPLE
    .\Provision-DWxLists.ps1 -SiteUrl "https://yourcompany.sharepoint.com/sites/DWxTrafficManager"

.NOTES
    Requires: PnP.PowerShell module
    Install with: Install-Module -Name PnP.PowerShell -Scope CurrentUser
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl
)

# Check if PnP.PowerShell is installed
if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
    Write-Error "PnP.PowerShell module is required. Install with: Install-Module -Name PnP.PowerShell -Scope CurrentUser"
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DWx Traffic Manager - SharePoint Provisioning" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Connect to SharePoint
Write-Host "Connecting to SharePoint site: $SiteUrl" -ForegroundColor Yellow
try {
    Connect-PnPOnline -Url $SiteUrl -Interactive
    Write-Host "Connected successfully!" -ForegroundColor Green
} catch {
    Write-Error "Failed to connect to SharePoint: $_"
    exit 1
}

# Function to create a list if it doesn't exist
function New-DWxList {
    param(
        [string]$ListName,
        [string]$Description,
        [hashtable[]]$Fields
    )

    Write-Host ""
    Write-Host "Processing list: $ListName" -ForegroundColor Yellow

    # Check if list exists
    $existingList = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
    if ($existingList) {
        Write-Host "  List already exists - skipping creation" -ForegroundColor Gray
    } else {
        Write-Host "  Creating list..." -ForegroundColor Cyan
        New-PnPList -Title $ListName -Template GenericList -Url "Lists/$ListName"
        Write-Host "  List created!" -ForegroundColor Green
    }

    # Add fields
    foreach ($field in $Fields) {
        $fieldName = $field.InternalName
        $existingField = Get-PnPField -List $ListName -Identity $fieldName -ErrorAction SilentlyContinue

        if ($existingField) {
            Write-Host "    Field '$fieldName' already exists - skipping" -ForegroundColor Gray
        } else {
            Write-Host "    Adding field: $fieldName ($($field.Type))" -ForegroundColor Cyan

            switch ($field.Type) {
                "Text" {
                    Add-PnPField -List $ListName -DisplayName $field.DisplayName -InternalName $fieldName -Type Text -AddToDefaultView
                }
                "Note" {
                    Add-PnPField -List $ListName -DisplayName $field.DisplayName -InternalName $fieldName -Type Note -AddToDefaultView
                }
                "Number" {
                    Add-PnPField -List $ListName -DisplayName $field.DisplayName -InternalName $fieldName -Type Number -AddToDefaultView
                }
                "Currency" {
                    Add-PnPField -List $ListName -DisplayName $field.DisplayName -InternalName $fieldName -Type Currency -AddToDefaultView
                }
                "DateTime" {
                    Add-PnPField -List $ListName -DisplayName $field.DisplayName -InternalName $fieldName -Type DateTime -AddToDefaultView
                }
                "Boolean" {
                    Add-PnPField -List $ListName -DisplayName $field.DisplayName -InternalName $fieldName -Type Boolean -AddToDefaultView
                }
                "Choice" {
                    Add-PnPField -List $ListName -DisplayName $field.DisplayName -InternalName $fieldName -Type Choice -Choices $field.Choices -AddToDefaultView
                }
            }
        }
    }
}

# Function to create document library if it doesn't exist
function New-DWxDocumentLibrary {
    param(
        [string]$LibraryName,
        [string]$Description
    )

    Write-Host ""
    Write-Host "Processing document library: $LibraryName" -ForegroundColor Yellow

    $existingLib = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue
    if ($existingLib) {
        Write-Host "  Document library already exists - skipping" -ForegroundColor Gray
    } else {
        Write-Host "  Creating document library..." -ForegroundColor Cyan
        New-PnPList -Title $LibraryName -Template DocumentLibrary -Url $LibraryName
        Write-Host "  Document library created!" -ForegroundColor Green
    }
}

# ============================================
# DWxServices - Service Catalog
# ============================================
$servicesFields = @(
    @{ InternalName = "Description"; DisplayName = "Description"; Type = "Note" },
    @{ InternalName = "ShortDescription"; DisplayName = "Short Description"; Type = "Text" },
    @{ InternalName = "Category"; DisplayName = "Category"; Type = "Choice"; Choices = @("Power Platform", "SPFx Development", "SharePoint Migration", "M365 Assessment", "Copilot Agents", "MS Viva") },
    @{ InternalName = "TypicalDuration"; DisplayName = "Typical Duration"; Type = "Choice"; Choices = @("30min", "1hr", "2hr", "Half-day", "Full-day", "Multi-day") },
    @{ InternalName = "ComplexityLevel"; DisplayName = "Complexity Level"; Type = "Choice"; Choices = @("Low", "Medium", "High", "Enterprise") },
    @{ InternalName = "PricingModel"; DisplayName = "Pricing Model"; Type = "Choice"; Choices = @("Fixed", "Hourly", "Project-based", "TBD") },
    @{ InternalName = "BasePrice"; DisplayName = "Base Price (ZAR)"; Type = "Currency" },
    @{ InternalName = "RequiredRoles"; DisplayName = "Required Roles"; Type = "Note" },
    @{ InternalName = "Prerequisites"; DisplayName = "Prerequisites"; Type = "Note" },
    @{ InternalName = "IsActive"; DisplayName = "Is Active"; Type = "Boolean" },
    @{ InternalName = "SortOrder"; DisplayName = "Sort Order"; Type = "Number" },
    @{ InternalName = "IconName"; DisplayName = "Icon Name"; Type = "Text" }
)
New-DWxList -ListName "DWxServices" -Description "DWx Service Catalog" -Fields $servicesFields

# ============================================
# DWxServiceRequests - Sales Funnel
# ============================================
$serviceRequestsFields = @(
    # Service Info
    @{ InternalName = "ServiceId"; DisplayName = "Service ID"; Type = "Number" },
    @{ InternalName = "ServiceName"; DisplayName = "Service Name"; Type = "Text" },
    # Request Context
    @{ InternalName = "RequestTitle"; DisplayName = "Request Title"; Type = "Text" },
    @{ InternalName = "RequestDetails"; DisplayName = "Request Details"; Type = "Note" },
    # Account Manager Info
    @{ InternalName = "AccountManagerName"; DisplayName = "Account Manager Name"; Type = "Text" },
    @{ InternalName = "AccountManagerEmail"; DisplayName = "Account Manager Email"; Type = "Text" },
    @{ InternalName = "AccountManagerTenant"; DisplayName = "Account Manager Tenant"; Type = "Text" },
    # Client Info
    @{ InternalName = "ClientName"; DisplayName = "Client Name"; Type = "Text" },
    @{ InternalName = "ClientId"; DisplayName = "Client ID"; Type = "Number" },
    @{ InternalName = "ContactName"; DisplayName = "Contact Name"; Type = "Text" },
    @{ InternalName = "ContactEmail"; DisplayName = "Contact Email"; Type = "Text" },
    @{ InternalName = "ContactPhone"; DisplayName = "Contact Phone"; Type = "Text" },
    @{ InternalName = "Industry"; DisplayName = "Industry"; Type = "Choice"; Choices = @("Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Government", "Education", "Legal", "Non-Profit", "Other") },
    @{ InternalName = "CompanySize"; DisplayName = "Company Size"; Type = "Choice"; Choices = @("SMB", "Medium", "Large", "Enterprise") },
    # Funnel Stage
    @{ InternalName = "FunnelStage"; DisplayName = "Funnel Stage"; Type = "Choice"; Choices = @("Lead", "Qualified", "Discovery", "Proposal", "Negotiation", "Won", "Lost") },
    @{ InternalName = "InterestLevel"; DisplayName = "Interest Level"; Type = "Choice"; Choices = @("Hot", "Warm", "Cold") },
    # Deal Info
    @{ InternalName = "DealValue"; DisplayName = "Deal Value (ZAR)"; Type = "Currency" },
    @{ InternalName = "DealProbability"; DisplayName = "Deal Probability (%)"; Type = "Number" },
    @{ InternalName = "ExpectedCloseDate"; DisplayName = "Expected Close Date"; Type = "DateTime" },
    @{ InternalName = "Budget"; DisplayName = "Budget"; Type = "Text" },
    @{ InternalName = "Timeline"; DisplayName = "Timeline"; Type = "Text" },
    # Discovery Scheduling
    @{ InternalName = "ProposedSlot1"; DisplayName = "Proposed Slot 1"; Type = "DateTime" },
    @{ InternalName = "ProposedSlot2"; DisplayName = "Proposed Slot 2"; Type = "DateTime" },
    @{ InternalName = "ProposedSlot3"; DisplayName = "Proposed Slot 3"; Type = "DateTime" },
    @{ InternalName = "ConfirmedDateTime"; DisplayName = "Confirmed DateTime"; Type = "DateTime" },
    @{ InternalName = "CalendarEventId"; DisplayName = "Calendar Event ID"; Type = "Text" },
    # Specialist Assignment
    @{ InternalName = "AssignedSpecialistName"; DisplayName = "Assigned Specialist Name"; Type = "Text" },
    @{ InternalName = "AssignedSpecialistEmail"; DisplayName = "Assigned Specialist Email"; Type = "Text" },
    @{ InternalName = "AssignedSpecialistRole"; DisplayName = "Assigned Specialist Role"; Type = "Choice"; Choices = @("Solution Architect", "Technical Specialist", "Consultant", "Senior Consultant") },
    # Requirements & Notes
    @{ InternalName = "Requirements"; DisplayName = "Requirements"; Type = "Note" },
    @{ InternalName = "ServiceHistory"; DisplayName = "Service History"; Type = "Note" },
    @{ InternalName = "WinLossReason"; DisplayName = "Win/Loss Reason"; Type = "Text" },
    @{ InternalName = "NextSteps"; DisplayName = "Next Steps"; Type = "Note" },
    @{ InternalName = "Comments"; DisplayName = "Comments"; Type = "Note" }
)
New-DWxList -ListName "DWxServiceRequests" -Description "DWx Service Requests - Sales Funnel" -Fields $serviceRequestsFields

# ============================================
# DWxProductRequests - Product Demo/Deployment Requests
# ============================================
$productRequestsFields = @(
    # Product Info
    @{ InternalName = "ProductId"; DisplayName = "Product ID"; Type = "Text" },
    @{ InternalName = "ProductName"; DisplayName = "Product Name"; Type = "Text" },
    @{ InternalName = "ProductType"; DisplayName = "Product Type"; Type = "Choice"; Choices = @("App", "Web Part", "Adaptive Card", "Agent") },
    @{ InternalName = "ProductCategory"; DisplayName = "Product Category"; Type = "Text" },
    # Request Type
    @{ InternalName = "RequestType"; DisplayName = "Request Type"; Type = "Choice"; Choices = @("Demo", "Trial Deployment") },
    # Account Manager Info
    @{ InternalName = "AccountManagerName"; DisplayName = "Account Manager Name"; Type = "Text" },
    @{ InternalName = "AccountManagerEmail"; DisplayName = "Account Manager Email"; Type = "Text" },
    @{ InternalName = "AccountManagerTenant"; DisplayName = "Account Manager Tenant"; Type = "Text" },
    # Client Info
    @{ InternalName = "ClientName"; DisplayName = "Client Name"; Type = "Text" },
    @{ InternalName = "ContactName"; DisplayName = "Contact Name"; Type = "Text" },
    @{ InternalName = "ContactEmail"; DisplayName = "Contact Email"; Type = "Text" },
    @{ InternalName = "ContactPhone"; DisplayName = "Contact Phone"; Type = "Text" },
    @{ InternalName = "Industry"; DisplayName = "Industry"; Type = "Choice"; Choices = @("Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Government", "Education", "Legal", "Non-Profit", "Other") },
    @{ InternalName = "CompanySize"; DisplayName = "Company Size"; Type = "Choice"; Choices = @("SMB", "Medium", "Large", "Enterprise") },
    @{ InternalName = "IsPremiumClient"; DisplayName = "Is Premium Client"; Type = "Boolean" },
    # Status
    @{ InternalName = "Status"; DisplayName = "Status"; Type = "Choice"; Choices = @("Pending Review", "Awaiting Approval", "Confirmed", "Completed", "Cancelled") },
    # Deal Info
    @{ InternalName = "LicenseCount"; DisplayName = "License Count"; Type = "Number" },
    @{ InternalName = "EstimatedValue"; DisplayName = "Estimated Value (ZAR)"; Type = "Currency" },
    # Scheduling
    @{ InternalName = "ProposedSlot1"; DisplayName = "Proposed Slot 1"; Type = "DateTime" },
    @{ InternalName = "ProposedSlot2"; DisplayName = "Proposed Slot 2"; Type = "DateTime" },
    @{ InternalName = "ProposedSlot3"; DisplayName = "Proposed Slot 3"; Type = "DateTime" },
    @{ InternalName = "ConfirmedDateTime"; DisplayName = "Confirmed DateTime"; Type = "DateTime" },
    @{ InternalName = "CalendarEventId"; DisplayName = "Calendar Event ID"; Type = "Text" },
    # Specialist Assignment
    @{ InternalName = "AssignedSpecialistName"; DisplayName = "Assigned Specialist Name"; Type = "Text" },
    @{ InternalName = "AssignedSpecialistEmail"; DisplayName = "Assigned Specialist Email"; Type = "Text" },
    @{ InternalName = "AssignedSpecialistRole"; DisplayName = "Assigned Specialist Role"; Type = "Choice"; Choices = @("Demo Specialist", "Solution Architect", "Technical Specialist", "Consultant") },
    # Product-Specific Requirements
    @{ InternalName = "ProductRequirements"; DisplayName = "Product Requirements (JSON)"; Type = "Note" },
    # Notes
    @{ InternalName = "Comments"; DisplayName = "Comments"; Type = "Note" },
    @{ InternalName = "Outcome"; DisplayName = "Outcome"; Type = "Text" },
    @{ InternalName = "NextSteps"; DisplayName = "Next Steps"; Type = "Note" }
)
New-DWxList -ListName "DWxProductRequests" -Description "DWx Product Requests - Demo and Deployment Requests" -Fields $productRequestsFields

# ============================================
# DWxClients - Client Master Data
# ============================================
$clientsFields = @(
    @{ InternalName = "PrimaryContactName"; DisplayName = "Primary Contact Name"; Type = "Text" },
    @{ InternalName = "PrimaryContactEmail"; DisplayName = "Primary Contact Email"; Type = "Text" },
    @{ InternalName = "DecisionMakerName"; DisplayName = "Decision Maker Name"; Type = "Text" },
    @{ InternalName = "DecisionMakerEmail"; DisplayName = "Decision Maker Email"; Type = "Text" },
    @{ InternalName = "Industry"; DisplayName = "Industry"; Type = "Choice"; Choices = @("Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Government", "Education", "Legal", "Non-Profit", "Other") },
    @{ InternalName = "CompanySize"; DisplayName = "Company Size"; Type = "Choice"; Choices = @("SMB", "Medium", "Large", "Enterprise") },
    @{ InternalName = "IsPremium"; DisplayName = "Is Premium"; Type = "Boolean" },
    @{ InternalName = "AccountManagerEmail"; DisplayName = "Account Manager Email"; Type = "Text" },
    @{ InternalName = "EngagementCount"; DisplayName = "Engagement Count"; Type = "Number" },
    @{ InternalName = "TotalRevenue"; DisplayName = "Total Revenue (ZAR)"; Type = "Currency" },
    @{ InternalName = "LastEngagementDate"; DisplayName = "Last Engagement Date"; Type = "DateTime" },
    @{ InternalName = "ContractStatus"; DisplayName = "Contract Status"; Type = "Choice"; Choices = @("Prospect", "Active", "Churned") },
    @{ InternalName = "Notes"; DisplayName = "Notes"; Type = "Note" }
)
New-DWxList -ListName "DWxClients" -Description "DWx Clients - Client Master Data" -Fields $clientsFields

# ============================================
# DWxSpecialists - Pre-Sales Team
# ============================================
$specialistsFields = @(
    @{ InternalName = "Email"; DisplayName = "Email"; Type = "Text" },
    @{ InternalName = "Role"; DisplayName = "Role"; Type = "Choice"; Choices = @("Solution Architect", "Technical Specialist", "Consultant", "Senior Consultant", "Demo Specialist") },
    @{ InternalName = "Specializations"; DisplayName = "Specializations (JSON)"; Type = "Note" },
    @{ InternalName = "MaxConcurrentDeals"; DisplayName = "Max Concurrent Deals"; Type = "Number" },
    @{ InternalName = "CurrentDealCount"; DisplayName = "Current Deal Count"; Type = "Number" },
    @{ InternalName = "IsActive"; DisplayName = "Is Active"; Type = "Boolean" },
    @{ InternalName = "CalendarEmail"; DisplayName = "Calendar Email"; Type = "Text" },
    @{ InternalName = "Phone"; DisplayName = "Phone"; Type = "Text" }
)
New-DWxList -ListName "DWxSpecialists" -Description "DWx Specialists - Pre-Sales Team" -Fields $specialistsFields

# ============================================
# DWxAuditLog - Audit Trail
# ============================================
$auditLogFields = @(
    @{ InternalName = "Action"; DisplayName = "Action"; Type = "Choice"; Choices = @("CREATE", "UPDATE", "DELETE", "STAGE_CHANGE", "ASSIGN", "APPROVE", "REJECT", "CONFIRM", "LOGIN") },
    @{ InternalName = "EntityType"; DisplayName = "Entity Type"; Type = "Choice"; Choices = @("ServiceRequest", "ProductRequest", "Client", "Specialist", "Service", "User") },
    @{ InternalName = "EntityId"; DisplayName = "Entity ID"; Type = "Text" },
    @{ InternalName = "EntityName"; DisplayName = "Entity Name"; Type = "Text" },
    @{ InternalName = "PerformedBy"; DisplayName = "Performed By"; Type = "Text" },
    @{ InternalName = "PerformedByEmail"; DisplayName = "Performed By Email"; Type = "Text" },
    @{ InternalName = "Timestamp"; DisplayName = "Timestamp"; Type = "DateTime" },
    @{ InternalName = "Details"; DisplayName = "Details"; Type = "Note" },
    @{ InternalName = "OldValues"; DisplayName = "Old Values (JSON)"; Type = "Note" },
    @{ InternalName = "NewValues"; DisplayName = "New Values (JSON)"; Type = "Note" }
)
New-DWxList -ListName "DWxAuditLog" -Description "DWx Audit Log - Audit Trail" -Fields $auditLogFields

# ============================================
# DWxSupportingDocuments - Document Library
# ============================================
New-DWxDocumentLibrary -LibraryName "DWxSupportingDocuments" -Description "Supporting documents for DWx service requests"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Provisioning Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lists created:" -ForegroundColor Yellow
Write-Host "  - DWxServices (Service catalog)"
Write-Host "  - DWxServiceRequests (Sales funnel)"
Write-Host "  - DWxProductRequests (Product requests)"
Write-Host "  - DWxClients (Client master data)"
Write-Host "  - DWxSpecialists (Pre-sales team)"
Write-Host "  - DWxAuditLog (Audit trail)"
Write-Host "  - DWxSupportingDocuments (Document library)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Go to SharePoint site and verify the lists"
Write-Host "  2. Run the seed script to populate DWxServices with default services"
Write-Host "  3. Add specialists to DWxSpecialists list"
Write-Host ""

# Disconnect
Disconnect-PnPOnline
