# DWx Traffic Manager - SharePoint List Provisioning Script
# Prerequisites: Already connected to SharePoint site via Connect-PnPOnline
# Usage: Run this script after connecting to the DWx Traffic Manager SharePoint site

Write-Host "=== DWx Traffic Manager - SharePoint List Provisioning ===" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. DWxServices - Service Catalog
# ============================================================================
Write-Host "Creating DWxServices list..." -ForegroundColor Yellow

$listExists = Get-PnPList -Identity "DWxServices" -ErrorAction SilentlyContinue
if ($listExists) {
    Write-Host "  DWxServices list already exists, skipping creation" -ForegroundColor Gray
} else {
    New-PnPList -Title "DWxServices" -Template GenericList -EnableVersioning
    Write-Host "  Created DWxServices list" -ForegroundColor Green
}

# Add columns to DWxServices
$serviceColumns = @(
    @{ Name = "Description"; Type = "Note"; Required = $false },
    @{ Name = "ShortDescription"; Type = "Text"; Required = $false },
    @{ Name = "Category"; Type = "Choice"; Choices = @("Power Platform", "SPFx Development", "SharePoint Migration", "M365 Assessment", "Copilot Agents", "MS Viva"); Required = $true },
    @{ Name = "TypicalDuration"; Type = "Choice"; Choices = @("30min", "1hr", "2hr", "Half-day", "Full-day", "Multi-day"); Required = $false },
    @{ Name = "ComplexityLevel"; Type = "Choice"; Choices = @("Low", "Medium", "High", "Enterprise"); Required = $false },
    @{ Name = "PricingModel"; Type = "Choice"; Choices = @("Fixed", "Hourly", "Project-based", "TBD"); Required = $false },
    @{ Name = "BasePrice"; Type = "Number"; Required = $false },
    @{ Name = "RequiredRoles"; Type = "Note"; Required = $false },
    @{ Name = "Prerequisites"; Type = "Note"; Required = $false },
    @{ Name = "IsActive"; Type = "Boolean"; Required = $false },
    @{ Name = "SortOrder"; Type = "Number"; Required = $false },
    @{ Name = "IconName"; Type = "Text"; Required = $false }
)

foreach ($col in $serviceColumns) {
    $existingField = Get-PnPField -List "DWxServices" -Identity $col.Name -ErrorAction SilentlyContinue
    if (-not $existingField) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "DWxServices" -DisplayName $col.Name -InternalName $col.Name -Type Choice -Choices $col.Choices -AddToDefaultView
        } elseif ($col.Type -eq "Note") {
            Add-PnPField -List "DWxServices" -DisplayName $col.Name -InternalName $col.Name -Type Note -AddToDefaultView
        } elseif ($col.Type -eq "Number") {
            Add-PnPField -List "DWxServices" -DisplayName $col.Name -InternalName $col.Name -Type Number -AddToDefaultView
        } elseif ($col.Type -eq "Boolean") {
            Add-PnPField -List "DWxServices" -DisplayName $col.Name -InternalName $col.Name -Type Boolean -AddToDefaultView
        } else {
            Add-PnPField -List "DWxServices" -DisplayName $col.Name -InternalName $col.Name -Type Text -AddToDefaultView
        }
        Write-Host "    Added column: $($col.Name)" -ForegroundColor Gray
    }
}
Write-Host "  DWxServices columns configured" -ForegroundColor Green

# ============================================================================
# 2. DWxServiceRequests - Main Service Requests List
# ============================================================================
Write-Host ""
Write-Host "Creating DWxServiceRequests list..." -ForegroundColor Yellow

$listExists = Get-PnPList -Identity "DWxServiceRequests" -ErrorAction SilentlyContinue
if ($listExists) {
    Write-Host "  DWxServiceRequests list already exists, skipping creation" -ForegroundColor Gray
} else {
    New-PnPList -Title "DWxServiceRequests" -Template GenericList -EnableVersioning
    Write-Host "  Created DWxServiceRequests list" -ForegroundColor Green
}

# Add columns to DWxServiceRequests
$requestColumns = @(
    # Service Reference
    @{ Name = "ServiceId"; Type = "Number"; Required = $false },
    @{ Name = "ServiceName"; Type = "Text"; Required = $true },

    # Account Manager
    @{ Name = "AccountManagerName"; Type = "Text"; Required = $true },
    @{ Name = "AccountManagerEmail"; Type = "Text"; Required = $true },
    @{ Name = "AccountManagerTenant"; Type = "Choice"; Choices = @("Internal", "External"); Required = $false },

    # Client Information
    @{ Name = "ClientName"; Type = "Text"; Required = $true },
    @{ Name = "ClientId"; Type = "Number"; Required = $false },
    @{ Name = "ContactName"; Type = "Text"; Required = $true },
    @{ Name = "ContactEmail"; Type = "Text"; Required = $true },
    @{ Name = "ContactPhone"; Type = "Text"; Required = $false },
    @{ Name = "Industry"; Type = "Choice"; Choices = @("Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Government", "Education", "Legal", "Non-Profit", "Other"); Required = $false },
    @{ Name = "CompanySize"; Type = "Choice"; Choices = @("SMB", "Medium", "Large", "Enterprise"); Required = $false },

    # Funnel State
    @{ Name = "FunnelStage"; Type = "Choice"; Choices = @("Lead", "Qualified", "Discovery", "Proposal", "Negotiation", "Won", "Lost"); Required = $true },
    @{ Name = "InterestLevel"; Type = "Choice"; Choices = @("Hot", "Warm", "Cold"); Required = $false },

    # Deal Information
    @{ Name = "DealValue"; Type = "Number"; Required = $false },
    @{ Name = "DealProbability"; Type = "Number"; Required = $false },
    @{ Name = "WeightedPipeline"; Type = "Number"; Required = $false },
    @{ Name = "ExpectedCloseDate"; Type = "DateTime"; Required = $false },
    @{ Name = "Budget"; Type = "Text"; Required = $false },
    @{ Name = "Timeline"; Type = "Text"; Required = $false },

    # Scheduling
    @{ Name = "ProposedSlot1"; Type = "DateTime"; Required = $false },
    @{ Name = "ProposedSlot2"; Type = "DateTime"; Required = $false },
    @{ Name = "ProposedSlot3"; Type = "DateTime"; Required = $false },
    @{ Name = "ConfirmedDateTime"; Type = "DateTime"; Required = $false },
    @{ Name = "CalendarEventId"; Type = "Text"; Required = $false },

    # Assignment
    @{ Name = "AssignedSpecialistName"; Type = "Text"; Required = $false },
    @{ Name = "AssignedSpecialistEmail"; Type = "Text"; Required = $false },
    @{ Name = "AssignedSpecialistRole"; Type = "Choice"; Choices = @("Solution Architect", "Technical Specialist", "Consultant"); Required = $false },

    # Additional Info
    @{ Name = "Requirements"; Type = "Note"; Required = $false },
    @{ Name = "ServiceHistory"; Type = "Note"; Required = $false },
    @{ Name = "WinLossReason"; Type = "Note"; Required = $false },
    @{ Name = "NextSteps"; Type = "Note"; Required = $false },
    @{ Name = "Comments"; Type = "Note"; Required = $false },

    # Document References
    @{ Name = "DocumentIds"; Type = "Note"; Required = $false }
)

foreach ($col in $requestColumns) {
    $existingField = Get-PnPField -List "DWxServiceRequests" -Identity $col.Name -ErrorAction SilentlyContinue
    if (-not $existingField) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "DWxServiceRequests" -DisplayName $col.Name -InternalName $col.Name -Type Choice -Choices $col.Choices -AddToDefaultView
        } elseif ($col.Type -eq "Note") {
            Add-PnPField -List "DWxServiceRequests" -DisplayName $col.Name -InternalName $col.Name -Type Note -AddToDefaultView
        } elseif ($col.Type -eq "Number") {
            Add-PnPField -List "DWxServiceRequests" -DisplayName $col.Name -InternalName $col.Name -Type Number -AddToDefaultView
        } elseif ($col.Type -eq "DateTime") {
            Add-PnPField -List "DWxServiceRequests" -DisplayName $col.Name -InternalName $col.Name -Type DateTime -AddToDefaultView
        } else {
            Add-PnPField -List "DWxServiceRequests" -DisplayName $col.Name -InternalName $col.Name -Type Text -AddToDefaultView
        }
        Write-Host "    Added column: $($col.Name)" -ForegroundColor Gray
    }
}
Write-Host "  DWxServiceRequests columns configured" -ForegroundColor Green

# ============================================================================
# 3. DWxClients - Client Database
# ============================================================================
Write-Host ""
Write-Host "Creating DWxClients list..." -ForegroundColor Yellow

$listExists = Get-PnPList -Identity "DWxClients" -ErrorAction SilentlyContinue
if ($listExists) {
    Write-Host "  DWxClients list already exists, skipping creation" -ForegroundColor Gray
} else {
    New-PnPList -Title "DWxClients" -Template GenericList -EnableVersioning
    Write-Host "  Created DWxClients list" -ForegroundColor Green
}

# Add columns to DWxClients
$clientColumns = @(
    @{ Name = "PrimaryContactName"; Type = "Text"; Required = $true },
    @{ Name = "PrimaryContactEmail"; Type = "Text"; Required = $true },
    @{ Name = "DecisionMakerName"; Type = "Text"; Required = $false },
    @{ Name = "DecisionMakerEmail"; Type = "Text"; Required = $false },
    @{ Name = "Phone"; Type = "Text"; Required = $false },
    @{ Name = "Industry"; Type = "Choice"; Choices = @("Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Government", "Education", "Legal", "Non-Profit", "Other"); Required = $false },
    @{ Name = "CompanySize"; Type = "Choice"; Choices = @("SMB", "Medium", "Large", "Enterprise"); Required = $false },
    @{ Name = "Address"; Type = "Note"; Required = $false },
    @{ Name = "Website"; Type = "Text"; Required = $false },
    @{ Name = "TenantId"; Type = "Text"; Required = $false },
    @{ Name = "IsPremium"; Type = "Boolean"; Required = $false },
    @{ Name = "AccountManagerEmail"; Type = "Text"; Required = $false },
    @{ Name = "EngagementCount"; Type = "Number"; Required = $false },
    @{ Name = "TotalRevenue"; Type = "Number"; Required = $false },
    @{ Name = "LastEngagementDate"; Type = "DateTime"; Required = $false },
    @{ Name = "ContractStatus"; Type = "Choice"; Choices = @("Prospect", "Active", "Churned"); Required = $false },
    @{ Name = "Notes"; Type = "Note"; Required = $false }
)

foreach ($col in $clientColumns) {
    $existingField = Get-PnPField -List "DWxClients" -Identity $col.Name -ErrorAction SilentlyContinue
    if (-not $existingField) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "DWxClients" -DisplayName $col.Name -InternalName $col.Name -Type Choice -Choices $col.Choices -AddToDefaultView
        } elseif ($col.Type -eq "Note") {
            Add-PnPField -List "DWxClients" -DisplayName $col.Name -InternalName $col.Name -Type Note -AddToDefaultView
        } elseif ($col.Type -eq "Number") {
            Add-PnPField -List "DWxClients" -DisplayName $col.Name -InternalName $col.Name -Type Number -AddToDefaultView
        } elseif ($col.Type -eq "DateTime") {
            Add-PnPField -List "DWxClients" -DisplayName $col.Name -InternalName $col.Name -Type DateTime -AddToDefaultView
        } elseif ($col.Type -eq "Boolean") {
            Add-PnPField -List "DWxClients" -DisplayName $col.Name -InternalName $col.Name -Type Boolean -AddToDefaultView
        } else {
            Add-PnPField -List "DWxClients" -DisplayName $col.Name -InternalName $col.Name -Type Text -AddToDefaultView
        }
        Write-Host "    Added column: $($col.Name)" -ForegroundColor Gray
    }
}
Write-Host "  DWxClients columns configured" -ForegroundColor Green

# ============================================================================
# 4. DWxSpecialists - Pre-Sales Specialists
# ============================================================================
Write-Host ""
Write-Host "Creating DWxSpecialists list..." -ForegroundColor Yellow

$listExists = Get-PnPList -Identity "DWxSpecialists" -ErrorAction SilentlyContinue
if ($listExists) {
    Write-Host "  DWxSpecialists list already exists, skipping creation" -ForegroundColor Gray
} else {
    New-PnPList -Title "DWxSpecialists" -Template GenericList -EnableVersioning
    Write-Host "  Created DWxSpecialists list" -ForegroundColor Green
}

# Add columns to DWxSpecialists
$specialistColumns = @(
    @{ Name = "Email"; Type = "Text"; Required = $true },
    @{ Name = "Role"; Type = "Choice"; Choices = @("Solution Architect", "Technical Specialist", "Consultant"); Required = $true },
    @{ Name = "Specializations"; Type = "Note"; Required = $false },
    @{ Name = "MaxConcurrentDeals"; Type = "Number"; Required = $false },
    @{ Name = "CurrentDealCount"; Type = "Number"; Required = $false },
    @{ Name = "IsActive"; Type = "Boolean"; Required = $false },
    @{ Name = "CalendarEmail"; Type = "Text"; Required = $false },
    @{ Name = "Phone"; Type = "Text"; Required = $false }
)

foreach ($col in $specialistColumns) {
    $existingField = Get-PnPField -List "DWxSpecialists" -Identity $col.Name -ErrorAction SilentlyContinue
    if (-not $existingField) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "DWxSpecialists" -DisplayName $col.Name -InternalName $col.Name -Type Choice -Choices $col.Choices -AddToDefaultView
        } elseif ($col.Type -eq "Note") {
            Add-PnPField -List "DWxSpecialists" -DisplayName $col.Name -InternalName $col.Name -Type Note -AddToDefaultView
        } elseif ($col.Type -eq "Number") {
            Add-PnPField -List "DWxSpecialists" -DisplayName $col.Name -InternalName $col.Name -Type Number -AddToDefaultView
        } elseif ($col.Type -eq "Boolean") {
            Add-PnPField -List "DWxSpecialists" -DisplayName $col.Name -InternalName $col.Name -Type Boolean -AddToDefaultView
        } else {
            Add-PnPField -List "DWxSpecialists" -DisplayName $col.Name -InternalName $col.Name -Type Text -AddToDefaultView
        }
        Write-Host "    Added column: $($col.Name)" -ForegroundColor Gray
    }
}
Write-Host "  DWxSpecialists columns configured" -ForegroundColor Green

# ============================================================================
# 5. DWxAuditLog - Audit Trail
# ============================================================================
Write-Host ""
Write-Host "Creating DWxAuditLog list..." -ForegroundColor Yellow

$listExists = Get-PnPList -Identity "DWxAuditLog" -ErrorAction SilentlyContinue
if ($listExists) {
    Write-Host "  DWxAuditLog list already exists, skipping creation" -ForegroundColor Gray
} else {
    New-PnPList -Title "DWxAuditLog" -Template GenericList -EnableVersioning
    Write-Host "  Created DWxAuditLog list" -ForegroundColor Green
}

# Add columns to DWxAuditLog
$auditColumns = @(
    @{ Name = "EntityType"; Type = "Text"; Required = $true },
    @{ Name = "EntityId"; Type = "Number"; Required = $true },
    @{ Name = "EntityName"; Type = "Text"; Required = $false },
    @{ Name = "Action"; Type = "Choice"; Choices = @("Create", "Update", "Delete", "StageChange", "Assignment"); Required = $true },
    @{ Name = "UserId"; Type = "Text"; Required = $false },
    @{ Name = "UserEmail"; Type = "Text"; Required = $true },
    @{ Name = "UserName"; Type = "Text"; Required = $false },
    @{ Name = "Changes"; Type = "Note"; Required = $false },
    @{ Name = "PreviousValues"; Type = "Note"; Required = $false },
    @{ Name = "NewValues"; Type = "Note"; Required = $false },
    @{ Name = "Timestamp"; Type = "DateTime"; Required = $false },
    @{ Name = "IPAddress"; Type = "Text"; Required = $false },
    @{ Name = "UserAgent"; Type = "Text"; Required = $false }
)

foreach ($col in $auditColumns) {
    $existingField = Get-PnPField -List "DWxAuditLog" -Identity $col.Name -ErrorAction SilentlyContinue
    if (-not $existingField) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "DWxAuditLog" -DisplayName $col.Name -InternalName $col.Name -Type Choice -Choices $col.Choices -AddToDefaultView
        } elseif ($col.Type -eq "Note") {
            Add-PnPField -List "DWxAuditLog" -DisplayName $col.Name -InternalName $col.Name -Type Note -AddToDefaultView
        } elseif ($col.Type -eq "Number") {
            Add-PnPField -List "DWxAuditLog" -DisplayName $col.Name -InternalName $col.Name -Type Number -AddToDefaultView
        } elseif ($col.Type -eq "DateTime") {
            Add-PnPField -List "DWxAuditLog" -DisplayName $col.Name -InternalName $col.Name -Type DateTime -AddToDefaultView
        } else {
            Add-PnPField -List "DWxAuditLog" -DisplayName $col.Name -InternalName $col.Name -Type Text -AddToDefaultView
        }
        Write-Host "    Added column: $($col.Name)" -ForegroundColor Gray
    }
}
Write-Host "  DWxAuditLog columns configured" -ForegroundColor Green

# ============================================================================
# 6. Create Document Library - DWxSupportingDocuments
# ============================================================================
Write-Host ""
Write-Host "Creating DWxSupportingDocuments document library..." -ForegroundColor Yellow

$libExists = Get-PnPList -Identity "DWxSupportingDocuments" -ErrorAction SilentlyContinue
if ($libExists) {
    Write-Host "  DWxSupportingDocuments library already exists, skipping creation" -ForegroundColor Gray
} else {
    New-PnPList -Title "DWxSupportingDocuments" -Template DocumentLibrary -EnableVersioning
    Write-Host "  Created DWxSupportingDocuments document library" -ForegroundColor Green
}

# Add metadata columns to document library
$docColumns = @(
    @{ Name = "RequestId"; Type = "Number"; Required = $false },
    @{ Name = "ClientName"; Type = "Text"; Required = $false },
    @{ Name = "DocumentType"; Type = "Choice"; Choices = @("RFP", "Proposal", "Requirements", "Contract", "Presentation", "Other"); Required = $false },
    @{ Name = "UploadedBy"; Type = "Text"; Required = $false }
)

foreach ($col in $docColumns) {
    $existingField = Get-PnPField -List "DWxSupportingDocuments" -Identity $col.Name -ErrorAction SilentlyContinue
    if (-not $existingField) {
        if ($col.Type -eq "Choice") {
            Add-PnPField -List "DWxSupportingDocuments" -DisplayName $col.Name -InternalName $col.Name -Type Choice -Choices $col.Choices -AddToDefaultView
        } elseif ($col.Type -eq "Number") {
            Add-PnPField -List "DWxSupportingDocuments" -DisplayName $col.Name -InternalName $col.Name -Type Number -AddToDefaultView
        } else {
            Add-PnPField -List "DWxSupportingDocuments" -DisplayName $col.Name -InternalName $col.Name -Type Text -AddToDefaultView
        }
        Write-Host "    Added column: $($col.Name)" -ForegroundColor Gray
    }
}
Write-Host "  DWxSupportingDocuments columns configured" -ForegroundColor Green

# ============================================================================
# 7. Seed Default Services
# ============================================================================
Write-Host ""
Write-Host "Seeding default services..." -ForegroundColor Yellow

$existingServices = Get-PnPListItem -List "DWxServices" -PageSize 100
if ($existingServices.Count -eq 0) {
    $defaultServices = @(
        @{
            Title = "Power Platform Development"
            Description = "Custom Power Apps, Power Automate flows, Power BI dashboards, and Power Pages solutions tailored to your business needs."
            ShortDescription = "Custom Power Apps & Automation"
            Category = "Power Platform"
            TypicalDuration = "2hr"
            ComplexityLevel = "Medium"
            PricingModel = "Project-based"
            RequiredRoles = '["Solution Architect", "Technical Specialist"]'
            Prerequisites = "M365 license with Power Platform access"
            IsActive = $true
            SortOrder = 1
            IconName = "LightningBolt"
        },
        @{
            Title = "SPFx Development"
            Description = "Custom SharePoint Framework solutions including web parts, extensions, adaptive cards, and Teams apps integrated with SharePoint."
            ShortDescription = "Custom SharePoint & Teams Apps"
            Category = "SPFx Development"
            TypicalDuration = "2hr"
            ComplexityLevel = "High"
            PricingModel = "Project-based"
            RequiredRoles = '["Technical Specialist"]'
            Prerequisites = "SharePoint Online tenant with App Catalog"
            IsActive = $true
            SortOrder = 2
            IconName = "Code"
        },
        @{
            Title = "SharePoint Migration"
            Description = "End-to-end migration services from on-premises SharePoint, file shares, or other platforms to SharePoint Online and OneDrive."
            ShortDescription = "Cloud Migration Services"
            Category = "SharePoint Migration"
            TypicalDuration = "Half-day"
            ComplexityLevel = "High"
            PricingModel = "Project-based"
            RequiredRoles = '["Solution Architect", "Technical Specialist"]'
            Prerequisites = "Source environment access, target M365 tenant"
            IsActive = $true
            SortOrder = 3
            IconName = "CloudArrowUp"
        },
        @{
            Title = "M365 Tenant Assessment"
            Description = "Comprehensive assessment of your Microsoft 365 environment including security, compliance, governance, and adoption recommendations."
            ShortDescription = "Environment Health Check"
            Category = "M365 Assessment"
            TypicalDuration = "Full-day"
            ComplexityLevel = "Medium"
            PricingModel = "Fixed"
            RequiredRoles = '["Solution Architect"]'
            Prerequisites = "Global Admin or Reports Reader access"
            IsActive = $true
            SortOrder = 4
            IconName = "ShieldCheckmark"
        },
        @{
            Title = "Enterprise Copilot Agents"
            Description = "Design and implementation of Microsoft Copilot agents for enterprise scenarios including custom plugins, knowledge bases, and workflow automation."
            ShortDescription = "AI-Powered Copilot Solutions"
            Category = "Copilot Agents"
            TypicalDuration = "2hr"
            ComplexityLevel = "Enterprise"
            PricingModel = "Project-based"
            RequiredRoles = '["Solution Architect", "Technical Specialist"]'
            Prerequisites = "Copilot license, Azure subscription for custom plugins"
            IsActive = $true
            SortOrder = 5
            IconName = "Bot"
        },
        @{
            Title = "Microsoft Viva Suite"
            Description = "Implementation of Microsoft Viva modules including Viva Connections, Viva Engage, Viva Learning, Viva Insights, and Viva Goals for employee experience."
            ShortDescription = "Employee Experience Platform"
            Category = "MS Viva"
            TypicalDuration = "Half-day"
            ComplexityLevel = "Medium"
            PricingModel = "Project-based"
            RequiredRoles = '["Solution Architect", "Consultant"]'
            Prerequisites = "Viva license, SharePoint home site configured"
            IsActive = $true
            SortOrder = 6
            IconName = "PeopleTeam"
        }
    )

    foreach ($service in $defaultServices) {
        Add-PnPListItem -List "DWxServices" -Values $service
        Write-Host "    Added service: $($service.Title)" -ForegroundColor Gray
    }
    Write-Host "  Default services seeded" -ForegroundColor Green
} else {
    Write-Host "  Services already exist, skipping seed" -ForegroundColor Gray
}

# ============================================================================
# Summary
# ============================================================================
Write-Host ""
Write-Host "=== Provisioning Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lists created:" -ForegroundColor White
Write-Host "  - DWxServices (Service Catalog)" -ForegroundColor Gray
Write-Host "  - DWxServiceRequests (Service Requests)" -ForegroundColor Gray
Write-Host "  - DWxClients (Client Database)" -ForegroundColor Gray
Write-Host "  - DWxSpecialists (Pre-Sales Team)" -ForegroundColor Gray
Write-Host "  - DWxAuditLog (Audit Trail)" -ForegroundColor Gray
Write-Host "  - DWxSupportingDocuments (Document Library)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Add specialists to DWxSpecialists list" -ForegroundColor Gray
Write-Host "  2. Configure list permissions as needed" -ForegroundColor Gray
Write-Host "  3. Create custom views for dashboard" -ForegroundColor Gray
