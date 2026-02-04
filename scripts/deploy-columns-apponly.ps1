# DWx Traffic Manager - Deploy SharePoint List and Columns (App-Only Auth)
# This script uses app-only authentication with client secret to bypass device compliance checks

param(
    [Parameter(Mandatory=$false)]
    [string]$ListName = "LPDemoScheduler"
)

# Configuration - IMPORTANT: Set these via environment variables or replace with your values
# DO NOT commit secrets to source control
$clientId = $env:DWX_CLIENT_ID ?? "<your-client-id>"
$clientSecret = $env:DWX_CLIENT_SECRET ?? "<your-client-secret>"
$siteUrl = $env:DWX_SHAREPOINT_URL ?? "https://digitalworkplace.sharepoint.com/sites/DWxTrafficManager"
$tenant = $env:DWX_TENANT ?? "digitalworkplace.onmicrosoft.com"

# Helper function to check if a field exists
function Test-FieldExists {
    param([string]$FieldName)
    try {
        $field = Get-PnPField -List $ListName -Identity $FieldName -ErrorAction SilentlyContinue
        return $null -ne $field
    }
    catch {
        return $false
    }
}

# Helper function to add a field if it doesn't exist
function Add-FieldIfNotExists {
    param(
        [string]$DisplayName,
        [string]$InternalName,
        [string]$Type,
        [string[]]$Choices = @(),
        [switch]$AddToDefaultView
    )

    if (Test-FieldExists -FieldName $InternalName) {
        Write-Host "  [SKIP] $InternalName already exists" -ForegroundColor Yellow
        return $false
    }

    try {
        if ($Choices.Count -gt 0) {
            Add-PnPField -List $ListName -DisplayName $DisplayName -InternalName $InternalName -Type $Type -Choices $Choices -AddToDefaultView:$AddToDefaultView -ErrorAction Stop
        } else {
            Add-PnPField -List $ListName -DisplayName $DisplayName -InternalName $InternalName -Type $Type -AddToDefaultView:$AddToDefaultView -ErrorAction Stop
        }
        Write-Host "  [OK] $InternalName created" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  [ERROR] $InternalName - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n=== LP Demo Scheduler - List & Column Deployment ===" -ForegroundColor Cyan
Write-Host "Using App-Only Authentication" -ForegroundColor Gray
Write-Host "Target list: $ListName`n" -ForegroundColor White

# Connect using client secret (app-only)
Write-Host "Connecting to SharePoint..." -ForegroundColor Cyan
try {
    # For PnP.PowerShell module, use -ClientId and -ClientSecret with -Tenant
    Connect-PnPOnline -Url $siteUrl -ClientId $clientId -ClientSecret $clientSecret -Tenant $tenant -ErrorAction Stop
    Write-Host "Connected successfully!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Failed to connect - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTrying alternative connection method..." -ForegroundColor Yellow
    try {
        # Alternative: Without tenant parameter
        Connect-PnPOnline -Url $siteUrl -ClientId $clientId -ClientSecret $clientSecret -ErrorAction Stop
        Write-Host "Connected successfully (alternative method)!" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR: Both connection methods failed - $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`nNote: App-only auth requires 'Sites.FullControl.All' application permission in Azure AD." -ForegroundColor Yellow
        Write-Host "Also ensure the client secret is valid and not expired." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# Check if list exists, create if not
$list = Get-PnPList -Identity $ListName -ErrorAction SilentlyContinue
if ($null -eq $list) {
    Write-Host "List not found. Creating '$ListName'..." -ForegroundColor Yellow
    try {
        New-PnPList -Title $ListName -Template GenericList -ErrorAction Stop
        Write-Host "List created successfully!" -ForegroundColor Green
        $list = Get-PnPList -Identity $ListName
    }
    catch {
        Write-Host "ERROR: Failed to create list - $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "List found: $($list.Title)" -ForegroundColor Green
    Write-Host "Current item count: $($list.ItemCount)" -ForegroundColor Gray
}

Write-Host ""

# Define all required columns
Write-Host "Adding columns..." -ForegroundColor Cyan

# Text columns
Add-FieldIfNotExists -DisplayName "AccountManagerName" -InternalName "AccountManagerName" -Type "Text" -AddToDefaultView
Add-FieldIfNotExists -DisplayName "AccountManagerEmail" -InternalName "AccountManagerEmail" -Type "Text" -AddToDefaultView
Add-FieldIfNotExists -DisplayName "ClientName" -InternalName "ClientName" -Type "Text" -AddToDefaultView

# Choice column for BookingType
Add-FieldIfNotExists -DisplayName "BookingType" -InternalName "BookingType" -Type "Choice" -Choices @("Demo", "Deployment") -AddToDefaultView

# Number column
Add-FieldIfNotExists -DisplayName "LicenseCount" -InternalName "LicenseCount" -Type "Number" -AddToDefaultView

# DateTime columns
Add-FieldIfNotExists -DisplayName "ProposedSlot1" -InternalName "ProposedSlot1" -Type "DateTime" -AddToDefaultView
Add-FieldIfNotExists -DisplayName "ProposedSlot2" -InternalName "ProposedSlot2" -Type "DateTime" -AddToDefaultView
Add-FieldIfNotExists -DisplayName "ProposedSlot3" -InternalName "ProposedSlot3" -Type "DateTime" -AddToDefaultView
Add-FieldIfNotExists -DisplayName "ConfirmedDateTime" -InternalName "ConfirmedDateTime" -Type "DateTime"

# Multi-line text columns (Note)
Add-FieldIfNotExists -DisplayName "Comments" -InternalName "Comments" -Type "Note"
Add-FieldIfNotExists -DisplayName "NextSteps" -InternalName "NextSteps" -Type "Note"

# Boolean column
Add-FieldIfNotExists -DisplayName "IsPremiumClient" -InternalName "IsPremiumClient" -Type "Boolean"

# Choice column for Status
Add-FieldIfNotExists -DisplayName "Status" -InternalName "Status" -Type "Choice" -Choices @("Pending Review", "Awaiting Approval", "Confirmed", "Cancelled", "Rescheduling Required") -AddToDefaultView

# Additional text columns
Add-FieldIfNotExists -DisplayName "Outcome" -InternalName "Outcome" -Type "Text"
Add-FieldIfNotExists -DisplayName "CalendarEventId" -InternalName "CalendarEventId" -Type "Text"

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan

# Show final column list
Write-Host "`nCurrent columns in list:" -ForegroundColor White
$fields = Get-PnPField -List $ListName | Where-Object {
    -not $_.Hidden -and
    $_.InternalName -notin @("ContentType", "Attachments", "_UIVersionString", "Edit", "LinkTitleNoMenu", "LinkTitle", "DocIcon", "ItemChildCount", "FolderChildCount", "_ComplianceFlags", "_ComplianceTag", "_ComplianceTagWrittenTime", "_ComplianceTagUserId")
}
foreach ($field in $fields) {
    Write-Host "  - $($field.InternalName) ($($field.TypeAsString))" -ForegroundColor Gray
}

# Disconnect
Disconnect-PnPOnline

Write-Host "`nDone!" -ForegroundColor Green
