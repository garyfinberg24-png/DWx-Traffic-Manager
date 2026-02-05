<#
.SYNOPSIS
    Seeds the DWxServices list with default service catalog data.

.PARAMETER SiteUrl
    The SharePoint site URL.

.EXAMPLE
    .\Seed-DWxServices.ps1 -SiteUrl "https://yourcompany.sharepoint.com/sites/DWxTrafficManager"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$SiteUrl
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "DWx Traffic Manager - Seed Services Data" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Connect to SharePoint
Write-Host "Connecting to SharePoint site: $SiteUrl" -ForegroundColor Yellow
Connect-PnPOnline -Url $SiteUrl -Interactive

# Service catalog data
$services = @(
    @{
        Title = "Power Platform Development"
        Description = "Custom Power Apps, Power Automate flows, and Power BI dashboards. Our team delivers enterprise-grade solutions using Microsoft Power Platform, from simple departmental apps to complex cross-functional automation."
        ShortDescription = "Custom apps, flows, and dashboards"
        Category = "Power Platform"
        TypicalDuration = "Multi-day"
        ComplexityLevel = "High"
        PricingModel = "Project-based"
        BasePrice = 75000
        RequiredRoles = '["Power Platform Developer", "Solution Architect"]'
        Prerequisites = "Microsoft 365 license with Power Platform. Admin access for environment setup."
        IsActive = $true
        SortOrder = 1
        IconName = "LightningBolt"
    },
    @{
        Title = "SPFx Development"
        Description = "Custom SharePoint Framework web parts, extensions, and adaptive cards. We build performant, modern SharePoint experiences that integrate seamlessly with Microsoft 365."
        ShortDescription = "Custom web parts and extensions"
        Category = "SPFx Development"
        TypicalDuration = "Multi-day"
        ComplexityLevel = "High"
        PricingModel = "Project-based"
        BasePrice = 85000
        RequiredRoles = '["SPFx Developer", "SharePoint Architect"]'
        Prerequisites = "SharePoint Online. App Catalog for deployment."
        IsActive = $true
        SortOrder = 2
        IconName = "Code"
    },
    @{
        Title = "SharePoint Migration"
        Description = "Migrate from on-premises SharePoint, file shares, or other platforms to SharePoint Online. Includes content analysis, mapping, and post-migration validation."
        ShortDescription = "Migrate to SharePoint Online"
        Category = "SharePoint Migration"
        TypicalDuration = "Multi-day"
        ComplexityLevel = "Enterprise"
        PricingModel = "Project-based"
        BasePrice = 120000
        RequiredRoles = '["Migration Specialist", "SharePoint Architect"]'
        Prerequisites = "Source system access. SharePoint Online admin access."
        IsActive = $true
        SortOrder = 3
        IconName = "CloudArrowUp"
    },
    @{
        Title = "M365 Assessment"
        Description = "Comprehensive assessment of your Microsoft 365 environment. Security posture review, governance audit, adoption analysis, and optimization recommendations."
        ShortDescription = "Security and governance review"
        Category = "M365 Assessment"
        TypicalDuration = "Full-day"
        ComplexityLevel = "Medium"
        PricingModel = "Fixed"
        BasePrice = 35000
        RequiredRoles = '["M365 Consultant", "Security Specialist"]'
        Prerequisites = "Global Reader or Security Reader role in Azure AD."
        IsActive = $true
        SortOrder = 4
        IconName = "ShieldCheckmark"
    },
    @{
        Title = "Copilot Agents"
        Description = "Design and deploy custom Microsoft Copilot agents for your organization. From simple Q&A bots to complex workflow automation with enterprise data integration."
        ShortDescription = "Custom AI agents for your business"
        Category = "Copilot Agents"
        TypicalDuration = "Multi-day"
        ComplexityLevel = "High"
        PricingModel = "Project-based"
        BasePrice = 95000
        RequiredRoles = '["AI Developer", "Solution Architect"]'
        Prerequisites = "Microsoft 365 Copilot license. Azure OpenAI access for custom models."
        IsActive = $true
        SortOrder = 5
        IconName = "Bot"
    },
    @{
        Title = "MS Viva Implementation"
        Description = "Implement Microsoft Viva modules - Connections, Insights, Learning, and Topics. Create engaging employee experiences and foster organizational learning."
        ShortDescription = "Employee experience platform"
        Category = "MS Viva"
        TypicalDuration = "Multi-day"
        ComplexityLevel = "Medium"
        PricingModel = "Project-based"
        BasePrice = 65000
        RequiredRoles = '["Viva Specialist", "Change Management Consultant"]'
        Prerequisites = "Microsoft Viva licenses. SharePoint home site configured."
        IsActive = $true
        SortOrder = 6
        IconName = "PeopleTeam"
    }
)

Write-Host "Adding services to DWxServices list..." -ForegroundColor Yellow
Write-Host ""

foreach ($service in $services) {
    Write-Host "  Adding: $($service.Title)" -ForegroundColor Cyan

    # Check if service already exists
    $existing = Get-PnPListItem -List "DWxServices" -Query "<View><Query><Where><Eq><FieldRef Name='Title'/><Value Type='Text'>$($service.Title)</Value></Eq></Where></Query></View>"

    if ($existing) {
        Write-Host "    Already exists - skipping" -ForegroundColor Gray
    } else {
        Add-PnPListItem -List "DWxServices" -Values @{
            Title = $service.Title
            Description = $service.Description
            ShortDescription = $service.ShortDescription
            Category = $service.Category
            TypicalDuration = $service.TypicalDuration
            ComplexityLevel = $service.ComplexityLevel
            PricingModel = $service.PricingModel
            BasePrice = $service.BasePrice
            RequiredRoles = $service.RequiredRoles
            Prerequisites = $service.Prerequisites
            IsActive = $service.IsActive
            SortOrder = $service.SortOrder
            IconName = $service.IconName
        }
        Write-Host "    Added successfully!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Seeding Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services added:" -ForegroundColor Yellow
Write-Host "  1. Power Platform Development"
Write-Host "  2. SPFx Development"
Write-Host "  3. SharePoint Migration"
Write-Host "  4. M365 Assessment"
Write-Host "  5. Copilot Agents"
Write-Host "  6. MS Viva Implementation"
Write-Host ""

Disconnect-PnPOnline
