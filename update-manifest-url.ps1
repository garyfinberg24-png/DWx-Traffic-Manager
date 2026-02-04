# Update Teams Manifest with Azure Static Web Apps URL
# Run this after deploying to Azure Static Web Apps

param(
    [Parameter(Mandatory=$true)]
    [string]$AzureUrl
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Update Teams Manifest URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Validate URL format
if (-not $AzureUrl.StartsWith("https://")) {
    Write-Host "Error: URL must start with https://" -ForegroundColor Red
    exit 1
}

# Remove trailing slash if present
$AzureUrl = $AzureUrl.TrimEnd('/')

Write-Host "New URL: $AzureUrl" -ForegroundColor Yellow
Write-Host ""

# Read current manifest
$manifestPath = Join-Path $PSScriptRoot "appPackage\manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

# Extract hostname for validDomains
$uri = [System.Uri]$AzureUrl
$hostname = $uri.Host

Write-Host "Updating manifest..." -ForegroundColor Yellow

# Update staticTabs URLs
$tabs = @(
    @{ entityId = "booking"; path = "" },
    @{ entityId = "mybookings"; path = "#/mybookings" },
    @{ entityId = "dashboard"; path = "#/dashboard" },
    @{ entityId = "checklist"; path = "#/checklist" },
    @{ entityId = "admin"; path = "#/admin" }
)

for ($i = 0; $i -lt $manifest.staticTabs.Count; $i++) {
    $tab = $tabs[$i]
    $fullUrl = "$AzureUrl/index.html"
    if ($tab.path) {
        $fullUrl = "$AzureUrl/index.html$($tab.path)"
    }
    $manifest.staticTabs[$i].contentUrl = $fullUrl
    $manifest.staticTabs[$i].websiteUrl = $fullUrl
    Write-Host "  Updated tab: $($manifest.staticTabs[$i].name)" -ForegroundColor Gray
}

# Update validDomains
$manifest.validDomains = @(
    $hostname,
    "hallofd.sharepoint.com",
    "*.sharepoint.com",
    "*.microsoftonline.com",
    "login.microsoftonline.com"
)
Write-Host "  Updated validDomains" -ForegroundColor Gray

# Update webApplicationInfo resource
$manifest.webApplicationInfo.resource = "api://$hostname/$($manifest.id)"
Write-Host "  Updated webApplicationInfo.resource" -ForegroundColor Gray

# Save manifest
$manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath -Encoding UTF8
Write-Host ""
Write-Host "Manifest updated!" -ForegroundColor Green

# Recreate ZIP package
Write-Host ""
Write-Host "Creating new Teams package..." -ForegroundColor Yellow
$zipPath = Join-Path $PSScriptRoot "LPBookingApp.zip"
$appPackagePath = Join-Path $PSScriptRoot "appPackage"

# Remove old ZIP if exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Create new ZIP
Compress-Archive -Path (Join-Path $appPackagePath "manifest.json"), (Join-Path $appPackagePath "color.png"), (Join-Path $appPackagePath "outline.png") -DestinationPath $zipPath -Force

Write-Host "Created: LPBookingApp.zip" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add redirect URI to Azure AD:" -ForegroundColor White
Write-Host "   $AzureUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Upload LPBookingApp.zip to Teams Admin Center:" -ForegroundColor White
Write-Host "   https://admin.teams.microsoft.com/" -ForegroundColor Yellow
Write-Host ""
