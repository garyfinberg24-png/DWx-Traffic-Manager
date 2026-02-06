# DWx Traffic Manager - SharePoint Setup Script
# This script helps configure the SharePoint list for the DWx Traffic Manager

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("Connect", "CreateList", "VerifyList", "AddSampleData")]
    [string]$Action = "Connect"
)

# Configuration - Update these values as needed
$clientId = "617ebc47-16a0-457c-94ad-919b2e6827d9"
$tenantId = "ac8e7aa0-66a4-48cb-9769-f638ba74eb3e"
$siteUrl = "https://hallofd.sharepoint.com/sites/DWxTrafficManager"
$listName = "DWxServiceRequests"

function Connect-ToSharePoint {
    Write-Host "Connecting to SharePoint..." -ForegroundColor Cyan
    try {
        Connect-PnPOnline -Url $siteUrl -DeviceLogin -ClientId $clientId -Tenant $tenantId
        Write-Host "Connected successfully to: $siteUrl" -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to connect: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

function Test-ListExists {
    try {
        $list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue
        return $null -ne $list
    }
    catch {
        return $false
    }
}

function New-BookingList {
    Write-Host "Creating SharePoint list: $listName" -ForegroundColor Cyan

    if (Test-ListExists) {
        Write-Host "List '$listName' already exists." -ForegroundColor Yellow
        return
    }

    # Create the list
    New-PnPList -Title $listName -Template GenericList
    Write-Host "List created successfully." -ForegroundColor Green

    # Add columns
    Write-Host "Adding columns..." -ForegroundColor Cyan

    # Text columns
    Add-PnPField -List $listName -DisplayName "AccountManagerName" -InternalName "AccountManagerName" -Type Text -AddToDefaultView
    Add-PnPField -List $listName -DisplayName "AccountManagerEmail" -InternalName "AccountManagerEmail" -Type Text -AddToDefaultView
    Add-PnPField -List $listName -DisplayName "ClientName" -InternalName "ClientName" -Type Text -AddToDefaultView

    # Choice column for BookingType
    Add-PnPField -List $listName -DisplayName "BookingType" -InternalName "BookingType" -Type Choice -Choices "Demo","Deployment" -AddToDefaultView

    # Number column
    Add-PnPField -List $listName -DisplayName "LicenseCount" -InternalName "LicenseCount" -Type Number -AddToDefaultView

    # DateTime columns
    Add-PnPField -List $listName -DisplayName "ProposedSlot1" -InternalName "ProposedSlot1" -Type DateTime -AddToDefaultView
    Add-PnPField -List $listName -DisplayName "ProposedSlot2" -InternalName "ProposedSlot2" -Type DateTime -AddToDefaultView
    Add-PnPField -List $listName -DisplayName "ProposedSlot3" -InternalName "ProposedSlot3" -Type DateTime -AddToDefaultView
    Add-PnPField -List $listName -DisplayName "ConfirmedDateTime" -InternalName "ConfirmedDateTime" -Type DateTime

    # Multi-line text columns
    Add-PnPField -List $listName -DisplayName "Comments" -InternalName "Comments" -Type Note
    Add-PnPField -List $listName -DisplayName "NextSteps" -InternalName "NextSteps" -Type Note

    # Boolean column
    Add-PnPField -List $listName -DisplayName "IsPremiumClient" -InternalName "IsPremiumClient" -Type Boolean

    # Choice column for Status
    $statusChoices = "Pending Review","Awaiting Approval","Confirmed","Cancelled","Rescheduling Required"
    Add-PnPField -List $listName -DisplayName "Status" -InternalName "Status" -Type Choice -Choices $statusChoices -AddToDefaultView

    # Additional text columns
    Add-PnPField -List $listName -DisplayName "Outcome" -InternalName "Outcome" -Type Text
    Add-PnPField -List $listName -DisplayName "CalendarEventId" -InternalName "CalendarEventId" -Type Text

    Write-Host "All columns added successfully." -ForegroundColor Green
}

function Get-ListInfo {
    Write-Host "Verifying SharePoint list: $listName" -ForegroundColor Cyan

    if (-not (Test-ListExists)) {
        Write-Host "List '$listName' does not exist." -ForegroundColor Red
        return
    }

    $list = Get-PnPList -Identity $listName
    Write-Host "List found: $($list.Title)" -ForegroundColor Green
    Write-Host "Item count: $($list.ItemCount)" -ForegroundColor Green

    Write-Host "`nList columns:" -ForegroundColor Cyan
    $fields = Get-PnPField -List $listName | Where-Object { -not $_.Hidden -and $_.InternalName -notin @("ContentType", "Attachments", "_UIVersionString") }
    foreach ($field in $fields) {
        Write-Host "  - $($field.InternalName) ($($field.TypeAsString))" -ForegroundColor Gray
    }
}

function Add-SampleData {
    Write-Host "Adding sample booking data..." -ForegroundColor Cyan

    if (-not (Test-ListExists)) {
        Write-Host "List '$listName' does not exist. Please create it first." -ForegroundColor Red
        return
    }

    $sampleBookings = @(
        @{
            Title = "Contoso Ltd"
            AccountManagerName = "John Smith"
            AccountManagerEmail = "john.smith@company.com"
            ClientName = "Contoso Ltd"
            BookingType = "Demo"
            LicenseCount = 500
            ProposedSlot1 = (Get-Date).AddDays(3).ToString("yyyy-MM-ddTHH:mm:ss")
            ProposedSlot2 = (Get-Date).AddDays(4).ToString("yyyy-MM-ddTHH:mm:ss")
            ProposedSlot3 = (Get-Date).AddDays(5).ToString("yyyy-MM-ddTHH:mm:ss")
            Comments = "Interested in E5 licenses"
            IsPremiumClient = $true
            Status = "Pending Review"
        },
        @{
            Title = "Fabrikam Inc"
            AccountManagerName = "Jane Doe"
            AccountManagerEmail = "jane.doe@company.com"
            ClientName = "Fabrikam Inc"
            BookingType = "Deployment"
            LicenseCount = 1000
            ProposedSlot1 = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
            ProposedSlot2 = (Get-Date).AddDays(8).ToString("yyyy-MM-ddTHH:mm:ss")
            ProposedSlot3 = (Get-Date).AddDays(9).ToString("yyyy-MM-ddTHH:mm:ss")
            Comments = "Ready for deployment, need technical walkthrough"
            IsPremiumClient = $false
            Status = "Awaiting Approval"
        }
    )

    foreach ($booking in $sampleBookings) {
        Add-PnPListItem -List $listName -Values $booking
        Write-Host "Added: $($booking.ClientName)" -ForegroundColor Green
    }

    Write-Host "Sample data added successfully." -ForegroundColor Green
}

# Main execution
switch ($Action) {
    "Connect" {
        Connect-ToSharePoint
    }
    "CreateList" {
        Connect-ToSharePoint
        New-BookingList
    }
    "VerifyList" {
        Connect-ToSharePoint
        Get-ListInfo
    }
    "AddSampleData" {
        Connect-ToSharePoint
        Add-SampleData
    }
    default {
        Write-Host "Usage: .\sharepoint-setup.ps1 -Action [Connect|CreateList|VerifyList|AddSampleData]"
    }
}
