# DWx Traffic Manager - Azure OpenAI Deployment Script
# Provisions Azure OpenAI resources using Bicep

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "dwx-traffic-manager-rg",

    [Parameter(Mandatory=$false)]
    [string]$Location = "swedencentral",  # Azure OpenAI availability varies by region

    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",

    [Parameter(Mandatory=$false)]
    [string]$NamePrefix = "dwx",

    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "DWx Traffic Manager - Azure OpenAI Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $ResourceGroupName"
Write-Host "  Location: $Location"
Write-Host "  Environment: $Environment"
Write-Host "  Name Prefix: $NamePrefix"
Write-Host ""

# Check if logged in to Azure
Write-Host "Checking Azure CLI login status..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}
Write-Host "  Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "  Subscription: $($account.name)" -ForegroundColor Green
Write-Host ""

# Check if resource group exists, create if not
Write-Host "Checking resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "  Creating resource group '$ResourceGroupName' in '$Location'..." -ForegroundColor Yellow
    if (-not $WhatIf) {
        az group create --name $ResourceGroupName --location $Location
    }
    Write-Host "  Resource group created." -ForegroundColor Green
} else {
    Write-Host "  Resource group '$ResourceGroupName' already exists." -ForegroundColor Green
}
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bicepFile = Join-Path $scriptDir "azure-openai.bicep"

if (-not (Test-Path $bicepFile)) {
    Write-Host "Bicep file not found: $bicepFile" -ForegroundColor Red
    exit 1
}

# Deploy the Bicep template
Write-Host "Deploying Azure OpenAI resources..." -ForegroundColor Yellow
$deploymentName = "dwx-openai-$(Get-Date -Format 'yyyyMMddHHmmss')"

$deployParams = @(
    "deployment", "group", "create",
    "--resource-group", $ResourceGroupName,
    "--name", $deploymentName,
    "--template-file", $bicepFile,
    "--parameters", "location=$Location",
    "--parameters", "environment=$Environment",
    "--parameters", "namePrefix=$NamePrefix"
)

if ($WhatIf) {
    $deployParams += "--what-if"
}

$result = az @deployParams | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

if (-not $WhatIf) {
    # Get the outputs
    $outputs = az deployment group show `
        --resource-group $ResourceGroupName `
        --name $deploymentName `
        --query "properties.outputs" | ConvertFrom-Json

    $endpoint = $outputs.openAiEndpoint.value
    $accountName = $outputs.openAiAccountName.value
    $deploymentName = $outputs.openAiDeploymentName.value

    Write-Host "Azure OpenAI Configuration:" -ForegroundColor Yellow
    Write-Host "  Endpoint: $endpoint"
    Write-Host "  Account Name: $accountName"
    Write-Host "  Deployment Name: $deploymentName"
    Write-Host ""

    # Get the API key
    Write-Host "Retrieving API key..." -ForegroundColor Yellow
    $keys = az cognitiveservices account keys list `
        --name $accountName `
        --resource-group $ResourceGroupName | ConvertFrom-Json

    $apiKey = $keys.key1

    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Environment Variables for .env.local:" -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "VITE_AZURE_OPENAI_ENDPOINT=$endpoint"
    Write-Host "VITE_AZURE_OPENAI_API_KEY=$apiKey"
    Write-Host "VITE_AZURE_OPENAI_DEPLOYMENT=$deploymentName"
    Write-Host "VITE_AZURE_OPENAI_API_VERSION=2024-02-15-preview"
    Write-Host ""
    Write-Host "IMPORTANT: Add these to your .env.local file (never commit API keys!)" -ForegroundColor Red
    Write-Host ""

    # Optionally write to a secure file
    $envFile = Join-Path $scriptDir ".openai-config"
    @"
# Azure OpenAI Configuration - Generated $(Get-Date)
# DO NOT COMMIT THIS FILE!
VITE_AZURE_OPENAI_ENDPOINT=$endpoint
VITE_AZURE_OPENAI_API_KEY=$apiKey
VITE_AZURE_OPENAI_DEPLOYMENT=$deploymentName
VITE_AZURE_OPENAI_API_VERSION=2024-02-15-preview
"@ | Out-File -FilePath $envFile -Encoding utf8

    Write-Host "Configuration saved to: $envFile" -ForegroundColor Green
    Write-Host "(Add this file to .gitignore!)" -ForegroundColor Yellow
}
