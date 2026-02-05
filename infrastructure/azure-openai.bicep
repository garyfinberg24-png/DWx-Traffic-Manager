// DWx Traffic Manager - Azure OpenAI Infrastructure
// Provisions Azure OpenAI resources for AI-powered session preparation

@description('Azure region for the resources')
param location string = resourceGroup().location

@description('Name prefix for all resources')
param namePrefix string = 'dwx'

@description('Environment (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('SKU for Azure OpenAI (S0 is the only option currently)')
param openAiSku string = 'S0'

@description('GPT-4o model deployment name')
param gpt4oDeploymentName string = 'gpt-4o'

@description('GPT-4o model version')
param gpt4oModelVersion string = '2024-05-13'

@description('Capacity for GPT-4o deployment (tokens per minute in thousands)')
param gpt4oCapacity int = 30

// Resource naming
var uniqueSuffix = uniqueString(resourceGroup().id)
var openAiAccountName = '${namePrefix}-openai-${environment}-${uniqueSuffix}'

// Azure OpenAI Account
resource openAiAccount 'Microsoft.CognitiveServices/accounts@2023-10-01-preview' = {
  name: openAiAccountName
  location: location
  kind: 'OpenAI'
  sku: {
    name: openAiSku
  }
  properties: {
    customSubDomainName: openAiAccountName
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      defaultAction: 'Allow'
    }
  }
}

// GPT-4o Deployment
resource gpt4oDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-10-01-preview' = {
  parent: openAiAccount
  name: gpt4oDeploymentName
  sku: {
    name: 'Standard'
    capacity: gpt4oCapacity
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: gpt4oModelVersion
    }
    raiPolicyName: 'Microsoft.Default'
  }
}

// Outputs for application configuration
output openAiEndpoint string = openAiAccount.properties.endpoint
output openAiAccountName string = openAiAccount.name
output openAiDeploymentName string = gpt4oDeployment.name
output openAiResourceId string = openAiAccount.id

// Note: The API key should be retrieved securely, not output directly
// Use: az cognitiveservices account keys list --name <account-name> --resource-group <rg-name>
