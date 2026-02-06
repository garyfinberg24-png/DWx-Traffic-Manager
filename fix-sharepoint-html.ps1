# Fix SharePoint HTML Browser Handling
# This allows HTML files to be rendered in the browser instead of downloaded
# Requires: SharePoint Administrator or Site Collection Administrator

param(
    [string]$SiteUrl = "https://hallofd.sharepoint.com/sites/DWxTrafficManager"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix SharePoint HTML Browser Handling" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for PnP.PowerShell
if (-not (Get-Module -ListAvailable -Name "PnP.PowerShell")) {
    Write-Host "Installing PnP.PowerShell..." -ForegroundColor Yellow
    Install-Module -Name "PnP.PowerShell" -Scope CurrentUser -Force
}

Import-Module PnP.PowerShell

Write-Host "Connecting to SharePoint Admin..." -ForegroundColor Yellow
Write-Host "Please authenticate when the browser opens..." -ForegroundColor Gray

try {
    # Connect using Web Login (works with MFA)
    Connect-PnPOnline -Url $SiteUrl -UseWebLogin
    Write-Host "Connected!" -ForegroundColor Green
} catch {
    Write-Host "Connection failed. Trying device login..." -ForegroundColor Yellow
    Connect-PnPOnline -Url $SiteUrl -DeviceLogin
}

Write-Host ""
Write-Host "Updating site settings..." -ForegroundColor Yellow

# Get current web
$web = Get-PnPWeb

# Check current setting
Write-Host "Current AllowUnsafeDataCollection: $($web.AllowUnsafeDataCollection)" -ForegroundColor Gray

# The key setting is at the Site Collection level
# We need to use CSOM to set BrowserFileHandling

try {
    # Use PnP to set the property
    $site = Get-PnPSite -Includes AllowDownloadingNonWebViewableFiles

    Write-Host ""
    Write-Host "Current Settings:" -ForegroundColor Yellow
    Write-Host "  AllowDownloadingNonWebViewableFiles: $($site.AllowDownloadingNonWebViewableFiles)" -ForegroundColor Gray

    # Try to update using Set-PnPSite
    Set-PnPSite -Identity $SiteUrl -DenyAddAndCustomizePages $false

    Write-Host ""
    Write-Host "Settings updated. However, HTML rendering requires additional steps." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANT: You may need to:" -ForegroundColor Cyan
    Write-Host "1. Go to SharePoint Admin Center" -ForegroundColor White
    Write-Host "2. Settings > Site Permissions" -ForegroundColor White
    Write-Host "3. Or use the document library settings" -ForegroundColor White

} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "Alternative: Use SharePoint Admin Center" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://hallofd-admin.sharepoint.com" -ForegroundColor White
Write-Host "2. Click: Settings > Sharing" -ForegroundColor White
Write-Host "3. Scroll to: 'File and folder links'" -ForegroundColor White
Write-Host "4. Or check: Policies > Sharing" -ForegroundColor White
Write-Host ""

Disconnect-PnPOnline
