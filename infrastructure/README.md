# DWx Traffic Manager - Infrastructure

This directory contains Infrastructure as Code (IaC) templates for provisioning Azure resources.

## Azure OpenAI Deployment

The `azure-openai.bicep` template provisions Azure OpenAI resources for AI-powered session preparation features.

### Prerequisites

1. Azure CLI installed and configured
2. Azure subscription with permissions to create Cognitive Services resources
3. Azure OpenAI access approved for your subscription

### Deployment

#### Using PowerShell Script (Recommended)

```powershell
# Navigate to infrastructure directory
cd infrastructure

# Deploy to dev environment (default)
.\deploy-openai.ps1

# Deploy to production
.\deploy-openai.ps1 -Environment prod

# Preview changes without deploying
.\deploy-openai.ps1 -WhatIf

# Custom resource group and location
.\deploy-openai.ps1 -ResourceGroupName "my-rg" -Location "eastus2"
```

#### Using Azure CLI Directly

```bash
# Create resource group
az group create --name dwx-traffic-manager-rg --location swedencentral

# Deploy Bicep template
az deployment group create \
  --resource-group dwx-traffic-manager-rg \
  --template-file azure-openai.bicep \
  --parameters environment=dev namePrefix=dwx

# Get the API key
az cognitiveservices account keys list \
  --name <account-name-from-output> \
  --resource-group dwx-traffic-manager-rg
```

### Configuration

After deployment, add the following to your `.env.local` file:

```env
VITE_AZURE_OPENAI_ENDPOINT=https://<your-account>.openai.azure.com/
VITE_AZURE_OPENAI_API_KEY=<your-api-key>
VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4o
VITE_AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### Resources Created

| Resource | Description |
|----------|-------------|
| Azure OpenAI Account | Cognitive Services account for OpenAI models |
| GPT-4o Deployment | Model deployment for chat completions |

### Region Availability

Azure OpenAI is not available in all regions. The script defaults to `swedencentral` which has good model availability. Check [Azure OpenAI Service availability](https://learn.microsoft.com/en-us/azure/ai-services/openai/concepts/models#model-summary-table-and-region-availability) for current region support.

### Costs

Azure OpenAI pricing is based on tokens processed:
- GPT-4o: ~$5 per 1M input tokens, ~$15 per 1M output tokens

For session preparation features, typical usage per session prep:
- Client profile: ~500-1000 tokens
- Talking points: ~800-1200 tokens
- Meeting agenda: ~400-600 tokens
- Suggested resources: ~300-500 tokens

Estimated cost per session preparation: ~$0.05-0.10

### Security

- API keys should **never** be committed to source control
- Add `.openai-config` to `.gitignore`
- Consider using Azure Key Vault for production deployments
- Use Managed Identity when possible
