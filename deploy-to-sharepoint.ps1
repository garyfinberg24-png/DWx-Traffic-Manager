# LP Booking App - SharePoint Deployment Script
# This script uploads the built app files to a SharePoint document library

param(
    [string]$SiteUrl = "https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler",
    [string]$LibraryName = "LPBookingApp",
    [string]$BuildFolder = ".\build"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "LP Booking App - SharePoint Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if PnP.PowerShell module is installed
if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
    Write-Host "PnP.PowerShell module not found. Installing..." -ForegroundColor Yellow
    Install-Module -Name "PnP.PowerShell" -Scope CurrentUser -Force
}

# Import the module
Import-Module PnP.PowerShell

# Connect to SharePoint using Device Login (works with any app type)
Write-Host "Connecting to SharePoint..." -ForegroundColor Yellow
Write-Host "A device code will be displayed - follow the instructions to authenticate..." -ForegroundColor Gray
try {
    Connect-PnPOnline -Url $SiteUrl -DeviceLogin
    Write-Host "Connected successfully!" -ForegroundColor Green
} catch {
    Write-Host "Failed to connect to SharePoint: $_" -ForegroundColor Red
    exit 1
}

# Check if the document library exists, create if not
Write-Host "Checking for document library '$LibraryName'..." -ForegroundColor Yellow
$library = Get-PnPList -Identity $LibraryName -ErrorAction SilentlyContinue

if (-not $library) {
    Write-Host "Creating document library '$LibraryName'..." -ForegroundColor Yellow
    New-PnPList -Title $LibraryName -Template DocumentLibrary
    Write-Host "Document library created!" -ForegroundColor Green
} else {
    Write-Host "Document library exists." -ForegroundColor Green
}

# Upload build files
Write-Host ""
Write-Host "Uploading build files..." -ForegroundColor Yellow

# Upload index.html
if (Test-Path "$BuildFolder\index.html") {
    Add-PnPFile -Path "$BuildFolder\index.html" -Folder $LibraryName -ErrorAction Stop
    Write-Host "  Uploaded: index.html" -ForegroundColor Green
}

# Upload vite.svg if exists
if (Test-Path "$BuildFolder\vite.svg") {
    Add-PnPFile -Path "$BuildFolder\vite.svg" -Folder $LibraryName -ErrorAction Stop
    Write-Host "  Uploaded: vite.svg" -ForegroundColor Green
}

# Upload assets folder
$assetsFolder = "$BuildFolder\assets"
if (Test-Path $assetsFolder) {
    # Ensure assets folder exists in SharePoint
    $assetsFolderSP = Get-PnPFolder -Url "$LibraryName/assets" -ErrorAction SilentlyContinue
    if (-not $assetsFolderSP) {
        Add-PnPFolder -Name "assets" -Folder $LibraryName
        Write-Host "  Created: assets folder" -ForegroundColor Green
    }

    # Upload all files in assets folder
    Get-ChildItem -Path $assetsFolder -File | ForEach-Object {
        Add-PnPFile -Path $_.FullName -Folder "$LibraryName/assets" -ErrorAction Stop
        Write-Host "  Uploaded: assets/$($_.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "App URL: $SiteUrl/$LibraryName/index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Azure AD app redirect URI to include:" -ForegroundColor White
Write-Host "   https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler/LPBookingApp/index.html" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Create the Teams app package and upload to Teams Admin Center" -ForegroundColor White
Write-Host ""

# Disconnect
Disconnect-PnPOnline
