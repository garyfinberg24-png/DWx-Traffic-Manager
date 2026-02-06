/**
 * DWx Traffic Manager - Service Requirements Types
 * Unique discovery questions for each service category
 */

import { ServiceCategory } from './ServiceRequest';

// ============================================================================
// Question Types
// ============================================================================

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'scale'; // 1-5 or 1-10 rating

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface ServiceQuestion {
  id: string;
  question: string;
  description?: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  conditional?: {
    dependsOn: string;
    showWhen: string | string[];
  };
}

export interface ServiceRequirementsConfig {
  category: ServiceCategory;
  title: string;
  subtitle: string;
  sections: {
    title: string;
    description?: string;
    questions: ServiceQuestion[];
  }[];
}

// ============================================================================
// Power Platform Requirements
// ============================================================================

export const POWER_PLATFORM_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'Power Platform',
  title: 'Power Platform Requirements',
  subtitle: 'Help us understand your automation and app development needs',
  sections: [
    {
      title: 'Current State',
      description: 'Tell us about your existing processes',
      questions: [
        {
          id: 'pp_current_tools',
          question: 'What tools do you currently use for this process?',
          type: 'multiselect',
          options: [
            { value: 'excel', label: 'Excel/Spreadsheets' },
            { value: 'paper', label: 'Paper-based' },
            { value: 'email', label: 'Email workflows' },
            { value: 'sharepoint', label: 'SharePoint lists/libraries' },
            { value: 'legacy', label: 'Legacy application' },
            { value: 'other', label: 'Other' },
          ],
          required: true,
        },
        {
          id: 'pp_pain_points',
          question: 'What are the main pain points with your current process?',
          description: 'Check all that apply',
          type: 'multiselect',
          options: [
            { value: 'manual', label: 'Too much manual work' },
            { value: 'errors', label: 'Error-prone data entry' },
            { value: 'slow', label: 'Process is too slow' },
            { value: 'visibility', label: 'Lack of visibility/reporting' },
            { value: 'compliance', label: 'Compliance/audit issues' },
            { value: 'mobile', label: 'No mobile access' },
            { value: 'integration', label: 'Systems don\'t talk to each other' },
          ],
          required: true,
        },
        {
          id: 'pp_users',
          question: 'How many users will need to use this solution?',
          type: 'select',
          options: [
            { value: '1-10', label: '1-10 users' },
            { value: '11-50', label: '11-50 users' },
            { value: '51-100', label: '51-100 users' },
            { value: '101-500', label: '101-500 users' },
            { value: '500+', label: '500+ users' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Solution Requirements',
      description: 'What do you need the solution to do?',
      questions: [
        {
          id: 'pp_components',
          question: 'Which Power Platform components are you interested in?',
          type: 'multiselect',
          options: [
            { value: 'powerapps', label: 'Power Apps (Canvas or Model-driven)' },
            { value: 'automate', label: 'Power Automate (Workflow automation)' },
            { value: 'powerbi', label: 'Power BI (Reports & Dashboards)' },
            { value: 'pages', label: 'Power Pages (External-facing portal)' },
            { value: 'copilot', label: 'Copilot Studio (AI chatbot)' },
            { value: 'dataverse', label: 'Dataverse (Data platform)' },
          ],
          required: true,
        },
        {
          id: 'pp_integrations',
          question: 'What systems need to integrate with the solution?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint', label: 'SharePoint' },
            { value: 'teams', label: 'Microsoft Teams' },
            { value: 'd365', label: 'Dynamics 365' },
            { value: 'sap', label: 'SAP' },
            { value: 'salesforce', label: 'Salesforce' },
            { value: 'sql', label: 'SQL Server/Azure SQL' },
            { value: 'rest', label: 'REST APIs' },
            { value: 'other', label: 'Other (please specify in comments)' },
          ],
          required: false,
        },
        {
          id: 'pp_mobile',
          question: 'Do users need mobile access?',
          type: 'radio',
          options: [
            { value: 'required', label: 'Yes, mobile is essential' },
            { value: 'nice', label: 'Nice to have' },
            { value: 'no', label: 'No, desktop only' },
          ],
          required: true,
        },
        {
          id: 'pp_offline',
          question: 'Do users need offline capability?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, must work offline' },
            { value: 'no', label: 'No, always connected' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Data & Security',
      questions: [
        {
          id: 'pp_data_sensitivity',
          question: 'What is the sensitivity level of the data?',
          type: 'select',
          options: [
            { value: 'public', label: 'Public/Non-sensitive' },
            { value: 'internal', label: 'Internal use only' },
            { value: 'confidential', label: 'Confidential' },
            { value: 'pii', label: 'Contains PII (Personal data)' },
            { value: 'financial', label: 'Financial/Regulated data' },
          ],
          required: true,
        },
        {
          id: 'pp_approvals',
          question: 'Are approval workflows required?',
          type: 'radio',
          options: [
            { value: 'yes_simple', label: 'Yes, simple single-level approval' },
            { value: 'yes_multi', label: 'Yes, multi-level approval' },
            { value: 'no', label: 'No approvals needed' },
          ],
          required: true,
        },
      ],
    },
  ],
};

// ============================================================================
// SPFx Development Requirements
// ============================================================================

export const SPFX_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'SPFx Development',
  title: 'SPFx Development Requirements',
  subtitle: 'Help us understand your SharePoint/Teams customization needs',
  sections: [
    {
      title: 'Project Scope',
      questions: [
        {
          id: 'spfx_type',
          question: 'What type of SPFx solution do you need?',
          type: 'multiselect',
          options: [
            { value: 'webpart', label: 'Web Part (Intranet component)' },
            { value: 'extension', label: 'Application Customizer (Header/Footer)' },
            { value: 'command', label: 'Command Set (List/Library toolbar)' },
            { value: 'fieldcustomizer', label: 'Field Customizer (Column formatting)' },
            { value: 'adaptivecard', label: 'Adaptive Card Extension (Viva Connections)' },
            { value: 'teamsapp', label: 'Teams Tab/Personal App' },
          ],
          required: true,
        },
        {
          id: 'spfx_deployment',
          question: 'Where will this solution be deployed?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint', label: 'SharePoint pages' },
            { value: 'teams', label: 'Microsoft Teams' },
            { value: 'viva', label: 'Viva Connections dashboard' },
            { value: 'outlook', label: 'Outlook (Add-in)' },
          ],
          required: true,
        },
        {
          id: 'spfx_scope',
          question: 'What is the deployment scope?',
          type: 'radio',
          options: [
            { value: 'site', label: 'Single site collection' },
            { value: 'tenant', label: 'Tenant-wide (App Catalog)' },
            { value: 'both', label: 'Both - start with site, then tenant' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Functional Requirements',
      questions: [
        {
          id: 'spfx_data_source',
          question: 'What data sources will the solution use?',
          type: 'multiselect',
          options: [
            { value: 'splist', label: 'SharePoint Lists' },
            { value: 'splibrary', label: 'SharePoint Document Libraries' },
            { value: 'graph', label: 'Microsoft Graph API' },
            { value: 'external', label: 'External APIs' },
            { value: 'azure', label: 'Azure services (Functions, SQL, etc.)' },
            { value: 'dataverse', label: 'Dataverse' },
          ],
          required: true,
        },
        {
          id: 'spfx_features',
          question: 'What features are needed?',
          type: 'multiselect',
          options: [
            { value: 'crud', label: 'Create/Read/Update/Delete data' },
            { value: 'search', label: 'Search & filtering' },
            { value: 'upload', label: 'File upload' },
            { value: 'export', label: 'Export to Excel/PDF' },
            { value: 'permissions', label: 'Role-based access' },
            { value: 'notifications', label: 'Notifications/Alerts' },
            { value: 'offline', label: 'Offline support' },
            { value: 'multi_language', label: 'Multi-language support' },
          ],
          required: false,
        },
        {
          id: 'spfx_existing',
          question: 'Is this replacing an existing solution?',
          type: 'radio',
          options: [
            { value: 'new', label: 'No, this is a new solution' },
            { value: 'replace_classic', label: 'Yes, replacing classic SharePoint solution' },
            { value: 'replace_custom', label: 'Yes, replacing custom development' },
            { value: 'extend', label: 'Extending existing SPFx solution' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Technical Environment',
      questions: [
        {
          id: 'spfx_appcatalog',
          question: 'Do you have an App Catalog configured?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unsure', label: 'Not sure' },
          ],
          required: true,
        },
        {
          id: 'spfx_cdn',
          question: 'Is Office 365 CDN enabled?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unsure', label: 'Not sure' },
          ],
          required: true,
        },
      ],
    },
  ],
};

// ============================================================================
// SharePoint Migration Requirements
// ============================================================================

export const MIGRATION_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'SharePoint Migration',
  title: 'Migration Assessment',
  subtitle: 'Help us understand your migration needs',
  sections: [
    {
      title: 'Source Environment',
      questions: [
        {
          id: 'mig_source',
          question: 'What is your source environment?',
          type: 'select',
          options: [
            { value: 'sp2013', label: 'SharePoint 2013 On-Premises' },
            { value: 'sp2016', label: 'SharePoint 2016 On-Premises' },
            { value: 'sp2019', label: 'SharePoint 2019 On-Premises' },
            { value: 'spse', label: 'SharePoint Server Subscription Edition' },
            { value: 'fileshare', label: 'File Shares (Windows)' },
            { value: 'nas', label: 'NAS/SAN Storage' },
            { value: 'box', label: 'Box' },
            { value: 'dropbox', label: 'Dropbox' },
            { value: 'gdrive', label: 'Google Drive' },
            { value: 'other', label: 'Other' },
          ],
          required: true,
        },
        {
          id: 'mig_data_volume',
          question: 'What is the estimated data volume to migrate?',
          type: 'select',
          options: [
            { value: '<100gb', label: 'Less than 100 GB' },
            { value: '100gb-500gb', label: '100 GB - 500 GB' },
            { value: '500gb-1tb', label: '500 GB - 1 TB' },
            { value: '1tb-5tb', label: '1 TB - 5 TB' },
            { value: '5tb-10tb', label: '5 TB - 10 TB' },
            { value: '>10tb', label: 'More than 10 TB' },
          ],
          required: true,
        },
        {
          id: 'mig_sites',
          question: 'How many sites/site collections need to be migrated?',
          type: 'select',
          options: [
            { value: '1-5', label: '1-5 sites' },
            { value: '6-20', label: '6-20 sites' },
            { value: '21-50', label: '21-50 sites' },
            { value: '51-100', label: '51-100 sites' },
            { value: '>100', label: 'More than 100 sites' },
          ],
          required: true,
        },
        {
          id: 'mig_users',
          question: 'How many users will be affected?',
          type: 'select',
          options: [
            { value: '<50', label: 'Less than 50' },
            { value: '50-200', label: '50-200' },
            { value: '201-500', label: '201-500' },
            { value: '501-1000', label: '501-1000' },
            { value: '>1000', label: 'More than 1000' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Content Types',
      description: 'What types of content need to be migrated?',
      questions: [
        {
          id: 'mig_content_types',
          question: 'Select all content types to migrate:',
          type: 'multiselect',
          options: [
            { value: 'documents', label: 'Documents & Files' },
            { value: 'lists', label: 'Lists & List Items' },
            { value: 'pages', label: 'Pages & Publishing Content' },
            { value: 'workflows', label: 'Workflows (will need rebuild)' },
            { value: 'permissions', label: 'Permissions & Security' },
            { value: 'metadata', label: 'Metadata & Content Types' },
            { value: 'versions', label: 'Version History' },
            { value: 'customizations', label: 'Customizations (InfoPath, etc.)' },
          ],
          required: true,
        },
        {
          id: 'mig_customizations',
          question: 'Are there custom solutions that need attention?',
          type: 'multiselect',
          options: [
            { value: 'none', label: 'No customizations' },
            { value: 'infopath', label: 'InfoPath forms' },
            { value: 'designer', label: 'SharePoint Designer workflows' },
            { value: 'solutions', label: 'Farm solutions (WSP)' },
            { value: 'sandbox', label: 'Sandbox solutions' },
            { value: 'nintex', label: 'Nintex workflows' },
            { value: 'k2', label: 'K2 workflows' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Timeline & Approach',
      questions: [
        {
          id: 'mig_deadline',
          question: 'Do you have a migration deadline?',
          type: 'radio',
          options: [
            { value: 'urgent', label: 'Yes, urgent (< 3 months)' },
            { value: 'planned', label: 'Yes, planned (3-6 months)' },
            { value: 'flexible', label: 'Yes, flexible (6-12 months)' },
            { value: 'no', label: 'No specific deadline' },
          ],
          required: true,
        },
        {
          id: 'mig_approach',
          question: 'Preferred migration approach?',
          type: 'radio',
          options: [
            { value: 'big_bang', label: 'Big bang (all at once)' },
            { value: 'phased', label: 'Phased (department by department)' },
            { value: 'hybrid', label: 'Hybrid (keep some on-prem)' },
            { value: 'unsure', label: 'Need guidance' },
          ],
          required: true,
        },
        {
          id: 'mig_downtime',
          question: 'Acceptable downtime during migration?',
          type: 'radio',
          options: [
            { value: 'none', label: 'No downtime (cutover approach)' },
            { value: 'weekend', label: 'Weekend windows acceptable' },
            { value: 'night', label: 'Night/off-hours acceptable' },
            { value: 'flexible', label: 'Flexible - minimal impact preferred' },
          ],
          required: true,
        },
      ],
    },
  ],
};

// ============================================================================
// M365 Assessment Requirements
// ============================================================================

export const ASSESSMENT_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'M365 Assessment',
  title: 'M365 Assessment Scope',
  subtitle: 'Help us understand what areas you want us to assess',
  sections: [
    {
      title: 'Assessment Focus Areas',
      questions: [
        {
          id: 'assess_areas',
          question: 'Which areas would you like us to assess?',
          type: 'multiselect',
          options: [
            { value: 'security', label: 'Security & Identity' },
            { value: 'compliance', label: 'Compliance & Data Governance' },
            { value: 'collaboration', label: 'Collaboration (Teams, SharePoint)' },
            { value: 'adoption', label: 'User Adoption & Training' },
            { value: 'licensing', label: 'Licensing Optimization' },
            { value: 'governance', label: 'Governance & Policies' },
            { value: 'performance', label: 'Performance & Reliability' },
            { value: 'backup', label: 'Backup & Disaster Recovery' },
          ],
          required: true,
        },
        {
          id: 'assess_priority',
          question: 'What is your primary concern?',
          type: 'select',
          options: [
            { value: 'security', label: 'Security vulnerabilities' },
            { value: 'compliance', label: 'Compliance requirements' },
            { value: 'cost', label: 'Cost optimization' },
            { value: 'adoption', label: 'Low user adoption' },
            { value: 'performance', label: 'Performance issues' },
            { value: 'governance', label: 'Lack of governance' },
            { value: 'planning', label: 'Future planning/roadmap' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Current Environment',
      questions: [
        {
          id: 'assess_licenses',
          question: 'What M365 licenses do you have?',
          type: 'multiselect',
          options: [
            { value: 'e3', label: 'Microsoft 365 E3' },
            { value: 'e5', label: 'Microsoft 365 E5' },
            { value: 'f1', label: 'Microsoft 365 F1/F3' },
            { value: 'business', label: 'Microsoft 365 Business' },
            { value: 'standalone', label: 'Standalone (O365, EMS, etc.)' },
            { value: 'mixed', label: 'Mixed licensing' },
            { value: 'unsure', label: 'Not sure' },
          ],
          required: true,
        },
        {
          id: 'assess_users',
          question: 'How many users in your organization?',
          type: 'select',
          options: [
            { value: '<100', label: 'Less than 100' },
            { value: '100-500', label: '100-500' },
            { value: '501-1000', label: '501-1000' },
            { value: '1001-5000', label: '1001-5000' },
            { value: '>5000', label: 'More than 5000' },
          ],
          required: true,
        },
        {
          id: 'assess_hybrid',
          question: 'Do you have hybrid infrastructure?',
          type: 'radio',
          options: [
            { value: 'cloud_only', label: 'Cloud-only (no on-premises)' },
            { value: 'hybrid_ad', label: 'Hybrid Azure AD' },
            { value: 'hybrid_exchange', label: 'Hybrid Exchange' },
            { value: 'hybrid_full', label: 'Full hybrid (AD + Exchange + SharePoint)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Compliance Requirements',
      questions: [
        {
          id: 'assess_regulations',
          question: 'What regulations or standards apply to your organization?',
          type: 'multiselect',
          options: [
            { value: 'none', label: 'None/Not sure' },
            { value: 'popia', label: 'POPIA (South Africa)' },
            { value: 'gdpr', label: 'GDPR' },
            { value: 'hipaa', label: 'HIPAA' },
            { value: 'sox', label: 'SOX' },
            { value: 'pci', label: 'PCI-DSS' },
            { value: 'iso27001', label: 'ISO 27001' },
            { value: 'industry', label: 'Industry-specific regulations' },
          ],
          required: false,
        },
        {
          id: 'assess_audit',
          question: 'Have you had a security audit in the past year?',
          type: 'radio',
          options: [
            { value: 'yes_pass', label: 'Yes, passed with no issues' },
            { value: 'yes_findings', label: 'Yes, with findings to address' },
            { value: 'no', label: 'No' },
            { value: 'planned', label: 'One is planned' },
          ],
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Copilot Agents Requirements
// ============================================================================

export const COPILOT_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'Copilot Agents',
  title: 'Copilot Agent Requirements',
  subtitle: 'Help us understand your AI assistant needs',
  sections: [
    {
      title: 'Use Case',
      questions: [
        {
          id: 'copilot_use_case',
          question: 'What is the primary use case for the Copilot agent?',
          type: 'select',
          options: [
            { value: 'helpdesk', label: 'IT/HR Helpdesk Assistant' },
            { value: 'knowledge', label: 'Knowledge Base Q&A' },
            { value: 'onboarding', label: 'Employee Onboarding' },
            { value: 'sales', label: 'Sales/Customer Support' },
            { value: 'operations', label: 'Operations/Process Automation' },
            { value: 'research', label: 'Research & Analysis' },
            { value: 'custom', label: 'Custom use case' },
          ],
          required: true,
        },
        {
          id: 'copilot_audience',
          question: 'Who will use this Copilot agent?',
          type: 'multiselect',
          options: [
            { value: 'employees', label: 'Internal Employees' },
            { value: 'hr', label: 'HR Team' },
            { value: 'it', label: 'IT Support' },
            { value: 'sales', label: 'Sales Team' },
            { value: 'managers', label: 'Managers' },
            { value: 'external', label: 'External Users (Customers/Partners)' },
          ],
          required: true,
        },
        {
          id: 'copilot_volume',
          question: 'Expected interaction volume?',
          type: 'select',
          options: [
            { value: 'low', label: 'Low (<100 queries/day)' },
            { value: 'medium', label: 'Medium (100-500 queries/day)' },
            { value: 'high', label: 'High (500-2000 queries/day)' },
            { value: 'very_high', label: 'Very High (2000+ queries/day)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Knowledge Sources',
      questions: [
        {
          id: 'copilot_sources',
          question: 'What knowledge sources should the agent access?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint', label: 'SharePoint Sites/Documents' },
            { value: 'teams', label: 'Teams Channels' },
            { value: 'confluence', label: 'Confluence/Wiki' },
            { value: 'servicenow', label: 'ServiceNow' },
            { value: 'dynamics', label: 'Dynamics 365' },
            { value: 'custom_db', label: 'Custom Databases' },
            { value: 'external_api', label: 'External APIs' },
            { value: 'web', label: 'Public Websites' },
          ],
          required: true,
        },
        {
          id: 'copilot_data_sensitivity',
          question: 'Data sensitivity level?',
          type: 'select',
          options: [
            { value: 'public', label: 'Public information only' },
            { value: 'internal', label: 'Internal company data' },
            { value: 'confidential', label: 'Confidential data (with access controls)' },
            { value: 'mixed', label: 'Mix of sensitivity levels' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Integration & Actions',
      questions: [
        {
          id: 'copilot_actions',
          question: 'Should the agent be able to take actions?',
          type: 'multiselect',
          options: [
            { value: 'answer_only', label: 'Answer questions only (no actions)' },
            { value: 'create_ticket', label: 'Create support tickets' },
            { value: 'send_email', label: 'Send emails' },
            { value: 'update_data', label: 'Update records' },
            { value: 'book_meeting', label: 'Book meetings' },
            { value: 'approve', label: 'Trigger approvals' },
            { value: 'escalate', label: 'Escalate to human agent' },
          ],
          required: true,
        },
        {
          id: 'copilot_channel',
          question: 'Where should the agent be available?',
          type: 'multiselect',
          options: [
            { value: 'teams', label: 'Microsoft Teams' },
            { value: 'web', label: 'Web Chat (SharePoint/Intranet)' },
            { value: 'outlook', label: 'Outlook' },
            { value: 'mobile', label: 'Mobile App' },
            { value: 'external', label: 'External Website' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Current State',
      questions: [
        {
          id: 'copilot_existing',
          question: 'Do you have existing chatbots or virtual agents?',
          type: 'radio',
          options: [
            { value: 'none', label: 'No existing chatbots' },
            { value: 'pva', label: 'Power Virtual Agents/Copilot Studio' },
            { value: 'other', label: 'Other platform (please specify)' },
            { value: 'replacing', label: 'Yes, looking to replace/upgrade' },
          ],
          required: true,
        },
        {
          id: 'copilot_license',
          question: 'Do you have Copilot licenses?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, Microsoft 365 Copilot' },
            { value: 'studio', label: 'Yes, Copilot Studio only' },
            { value: 'no', label: 'No, need licensing guidance' },
            { value: 'planning', label: 'Planning to purchase' },
          ],
          required: true,
        },
      ],
    },
  ],
};

// ============================================================================
// Microsoft Viva Requirements
// ============================================================================

export const VIVA_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'MS Viva',
  title: 'Microsoft Viva Requirements',
  subtitle: 'Help us understand your employee experience needs',
  sections: [
    {
      title: 'Viva Modules',
      questions: [
        {
          id: 'viva_modules',
          question: 'Which Viva modules are you interested in?',
          type: 'multiselect',
          options: [
            { value: 'connections', label: 'Viva Connections (Intranet in Teams)' },
            { value: 'engage', label: 'Viva Engage (Community & Communication)' },
            { value: 'learning', label: 'Viva Learning (Training & Development)' },
            { value: 'insights', label: 'Viva Insights (Productivity & Wellbeing)' },
            { value: 'goals', label: 'Viva Goals (OKR Management)' },
            { value: 'pulse', label: 'Viva Pulse (Employee Feedback)' },
            { value: 'amplify', label: 'Viva Amplify (Communications)' },
            { value: 'glint', label: 'Viva Glint (Employee Surveys)' },
          ],
          required: true,
        },
        {
          id: 'viva_priority',
          question: 'What is your top priority?',
          type: 'select',
          options: [
            { value: 'engagement', label: 'Improve employee engagement' },
            { value: 'communication', label: 'Better internal communication' },
            { value: 'learning', label: 'Enable learning & development' },
            { value: 'wellbeing', label: 'Support employee wellbeing' },
            { value: 'alignment', label: 'Goal alignment (OKRs)' },
            { value: 'onboarding', label: 'Improve onboarding' },
            { value: 'culture', label: 'Build company culture' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Current State',
      questions: [
        {
          id: 'viva_intranet',
          question: 'Do you have an existing intranet?',
          type: 'radio',
          options: [
            { value: 'sp_modern', label: 'Yes, SharePoint Modern' },
            { value: 'sp_classic', label: 'Yes, SharePoint Classic' },
            { value: 'other', label: 'Yes, other platform' },
            { value: 'no', label: 'No intranet' },
          ],
          required: true,
        },
        {
          id: 'viva_homesite',
          question: 'Do you have a SharePoint home site configured?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unsure', label: 'Not sure' },
          ],
          required: true,
        },
        {
          id: 'viva_lms',
          question: 'Do you have an existing Learning Management System (LMS)?',
          type: 'radio',
          options: [
            { value: 'none', label: 'No LMS' },
            { value: 'linkedin', label: 'LinkedIn Learning' },
            { value: 'cornerstone', label: 'Cornerstone' },
            { value: 'saba', label: 'SAP SuccessFactors/Saba' },
            { value: 'other', label: 'Other LMS' },
          ],
          required: false,
          conditional: {
            dependsOn: 'viva_modules',
            showWhen: ['learning'],
          },
        },
      ],
    },
    {
      title: 'Organization Details',
      questions: [
        {
          id: 'viva_users',
          question: 'How many employees will use Viva?',
          type: 'select',
          options: [
            { value: '<500', label: 'Less than 500' },
            { value: '500-2000', label: '500-2000' },
            { value: '2001-5000', label: '2001-5000' },
            { value: '>5000', label: 'More than 5000' },
          ],
          required: true,
        },
        {
          id: 'viva_workforce',
          question: 'What is your workforce composition?',
          type: 'multiselect',
          options: [
            { value: 'office', label: 'Office-based knowledge workers' },
            { value: 'remote', label: 'Remote workers' },
            { value: 'frontline', label: 'Frontline/Deskless workers' },
            { value: 'hybrid', label: 'Hybrid (mix of all)' },
          ],
          required: true,
        },
        {
          id: 'viva_regions',
          question: 'Do you have multiple regions/languages?',
          type: 'radio',
          options: [
            { value: 'single', label: 'Single region/language' },
            { value: 'multi_region', label: 'Multiple regions, one language' },
            { value: 'multi_language', label: 'Multiple languages' },
            { value: 'global', label: 'Global (many regions & languages)' },
          ],
          required: true,
        },
      ],
    },
  ],
};

// ============================================================================
// Training Requirements (Zero to Hero Programs)
// ============================================================================

export const TRAINING_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'Training',
  title: 'Training Requirements',
  subtitle: 'Help us plan your training program effectively',
  sections: [
    {
      title: 'Training Audience',
      description: 'Tell us about your participants',
      questions: [
        {
          id: 'training_audience_size',
          question: 'How many participants do you expect?',
          description: 'Maximum 50 participants per cohort',
          type: 'select',
          options: [
            { value: '1-10', label: '1-10 participants' },
            { value: '11-25', label: '11-25 participants' },
            { value: '26-50', label: '26-50 participants' },
            { value: '50+', label: 'More than 50 (multiple cohorts)' },
          ],
          required: true,
        },
        {
          id: 'training_audience_roles',
          question: 'What roles will be attending?',
          type: 'multiselect',
          options: [
            { value: 'endusers', label: 'End Users' },
            { value: 'powerusers', label: 'Power Users / Champions' },
            { value: 'admins', label: 'IT Administrators' },
            { value: 'managers', label: 'Managers / Team Leads' },
            { value: 'executives', label: 'Executives / Leadership' },
          ],
          required: true,
        },
        {
          id: 'training_experience',
          question: 'What is the current experience level with Copilot/AI?',
          type: 'radio',
          options: [
            { value: 'none', label: 'No experience with AI tools' },
            { value: 'basic', label: 'Basic awareness, limited usage' },
            { value: 'some', label: 'Some experience with ChatGPT or similar' },
            { value: 'experienced', label: 'Regular users of AI tools' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Training Preferences',
      description: 'How would you like the training delivered?',
      questions: [
        {
          id: 'training_format',
          question: 'Preferred training format?',
          type: 'radio',
          options: [
            { value: 'virtual', label: 'Virtual (Teams meetings)' },
            { value: 'onsite', label: 'On-site at your location' },
            { value: 'hybrid', label: 'Hybrid (mix of both)' },
          ],
          required: true,
        },
        {
          id: 'training_timeline',
          question: 'When would you like to start the training?',
          type: 'select',
          options: [
            { value: 'asap', label: 'As soon as possible' },
            { value: '2weeks', label: 'Within 2 weeks' },
            { value: '1month', label: 'Within 1 month' },
            { value: '2-3months', label: '2-3 months out' },
            { value: 'flexible', label: 'Flexible / Planning phase' },
          ],
          required: true,
        },
        {
          id: 'training_managed_service',
          question: 'Are you interested in "The AI Guy" managed service follow-up?',
          description: '2 hours per month for 4 months of ongoing support',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, include managed service' },
            { value: 'maybe', label: 'Maybe, tell me more' },
            { value: 'no', label: 'Training only for now' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Business Goals',
      description: 'What do you want to achieve?',
      questions: [
        {
          id: 'training_goals',
          question: 'What are your primary goals for this training?',
          type: 'multiselect',
          options: [
            { value: 'productivity', label: 'Improve employee productivity' },
            { value: 'adoption', label: 'Increase Copilot adoption rates' },
            { value: 'roi', label: 'Demonstrate ROI on Copilot investment' },
            { value: 'champions', label: 'Build internal champion network' },
            { value: 'specific', label: 'Solve specific business challenges' },
          ],
          required: true,
        },
        {
          id: 'training_use_cases',
          question: 'Which Copilot use cases are most important?',
          type: 'multiselect',
          options: [
            { value: 'meetings', label: 'Meeting summaries & action items' },
            { value: 'email', label: 'Email drafting & responses' },
            { value: 'documents', label: 'Document creation & editing' },
            { value: 'data', label: 'Data analysis & insights' },
            { value: 'chat', label: 'General Copilot Chat assistance' },
            { value: 'custom', label: 'Custom agents/plugins' },
          ],
          required: false,
        },
        {
          id: 'training_notes',
          question: 'Any specific topics or challenges you want addressed?',
          type: 'textarea',
          placeholder: 'Tell us about any specific scenarios, departments, or challenges...',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Proposal Requirements
// ============================================================================

export const PROPOSAL_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'Proposal',
  title: 'Proposal Requirements',
  subtitle: 'Help us prepare a compelling proposal for your client',
  sections: [
    {
      title: 'Opportunity Details',
      description: 'Tell us about the client opportunity',
      questions: [
        {
          id: 'prop_type',
          question: 'What type of proposal is needed?',
          type: 'select',
          options: [
            { value: 'rfp_response', label: 'RFP/RFI Response' },
            { value: 'unsolicited', label: 'Unsolicited Proposal' },
            { value: 'renewal', label: 'Contract Renewal' },
            { value: 'upsell', label: 'Upsell/Expansion' },
            { value: 'competitive', label: 'Competitive Displacement' },
          ],
          required: true,
        },
        {
          id: 'prop_services',
          question: 'Which service areas does this proposal cover?',
          type: 'multiselect',
          options: [
            { value: 'power_platform', label: 'Power Platform Development' },
            { value: 'spfx', label: 'SPFx Development' },
            { value: 'migration', label: 'SharePoint Migration' },
            { value: 'assessment', label: 'M365 Assessment' },
            { value: 'copilot', label: 'Copilot Agents' },
            { value: 'viva', label: 'Microsoft Viva' },
            { value: 'training', label: 'Training Programs' },
            { value: 'multiple', label: 'Multi-service engagement' },
          ],
          required: true,
        },
        {
          id: 'prop_deadline',
          question: 'When is the proposal due?',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      title: 'Scope & Pricing',
      questions: [
        {
          id: 'prop_budget_known',
          question: 'Does the client have a stated budget?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, budget is known' },
            { value: 'range', label: 'Budget range given' },
            { value: 'no', label: 'No budget disclosed' },
          ],
          required: true,
        },
        {
          id: 'prop_competition',
          question: 'Is this a competitive bid?',
          type: 'radio',
          options: [
            { value: 'sole', label: 'Sole provider (no competition)' },
            { value: 'competitive', label: 'Yes, competitive bid' },
            { value: 'unknown', label: 'Not sure' },
          ],
          required: true,
        },
        {
          id: 'prop_format',
          question: 'Preferred proposal format?',
          type: 'radio',
          options: [
            { value: 'standard', label: 'Standard DWx proposal template' },
            { value: 'client', label: 'Client-provided template' },
            { value: 'presentation', label: 'Presentation/pitch deck' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Additional Context',
      questions: [
        {
          id: 'prop_relationship',
          question: 'What is the existing client relationship?',
          type: 'select',
          options: [
            { value: 'new', label: 'New client (no prior engagement)' },
            { value: 'existing', label: 'Existing client (active projects)' },
            { value: 'past', label: 'Past client (lapsed engagement)' },
            { value: 'referral', label: 'Referral from partner/client' },
          ],
          required: true,
        },
        {
          id: 'prop_notes',
          question: 'Any additional context or special requirements?',
          type: 'textarea',
          placeholder: 'Key decision makers, client preferences, competitive intelligence, etc.',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Tender Requirements
// ============================================================================

export const TENDER_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'Tender',
  title: 'Tender Response Requirements',
  subtitle: 'Provide the tender details so we can coordinate the technical response',
  sections: [
    {
      title: 'Tender Details',
      description: 'Core tender information for coordination',
      questions: [
        {
          id: 'tender_ref',
          question: 'Tender Reference Number',
          type: 'text',
          placeholder: 'e.g. RFT-2026-001',
          required: true,
        },
        {
          id: 'tender_briefing_date',
          question: 'Client Tender Briefing Session Date',
          description: 'Date of the mandatory or optional briefing session',
          type: 'date',
          required: true,
        },
        {
          id: 'tender_deadline',
          question: 'Submission Deadline',
          description: 'Final date and time for tender submission',
          type: 'date',
          required: true,
        },
        {
          id: 'tender_manager_name',
          question: 'Tender Manager Name',
          description: 'The person compiling the overall tender response',
          type: 'text',
          placeholder: 'Full name of the Tender Manager',
          required: true,
        },
        {
          id: 'tender_manager_email',
          question: 'Tender Manager Email',
          type: 'text',
          placeholder: 'Email address for coordination',
          required: true,
          validation: {
            pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
            message: 'Please enter a valid email address',
          },
        },
      ],
    },
    {
      title: 'Technical Response Scope',
      description: 'Define what is required from the DWx team',
      questions: [
        {
          id: 'tender_tech_only',
          question: 'Are we responding to the technical section only?',
          description: 'The Tender Manager typically compiles the overall response',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, technical section only' },
            { value: 'no', label: 'No, full response required' },
          ],
          required: true,
        },
        {
          id: 'tender_cv_required',
          question: 'Are CVs of assigned resources required?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, CVs required' },
            { value: 'no', label: 'No CVs needed' },
          ],
          required: true,
        },
        {
          id: 'tender_tech_areas',
          question: 'Which technical areas does this tender cover?',
          type: 'multiselect',
          options: [
            { value: 'power_platform', label: 'Power Platform' },
            { value: 'spfx', label: 'SPFx / SharePoint Development' },
            { value: 'migration', label: 'SharePoint Migration' },
            { value: 'copilot', label: 'Copilot / AI' },
            { value: 'viva', label: 'Microsoft Viva' },
            { value: 'security', label: 'Security & Compliance' },
            { value: 'governance', label: 'Governance & Architecture' },
            { value: 'training', label: 'Training & Change Management' },
          ],
          required: true,
        },
        {
          id: 'tender_lead_time',
          question: 'What is the available lead time for our response?',
          description: 'Time between now and the submission deadline',
          type: 'select',
          options: [
            { value: '<1week', label: 'Less than 1 week (urgent)' },
            { value: '1-2weeks', label: '1-2 weeks' },
            { value: '2-4weeks', label: '2-4 weeks' },
            { value: '1-2months', label: '1-2 months' },
            { value: '>2months', label: 'More than 2 months' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Tender Context',
      questions: [
        {
          id: 'tender_type',
          question: 'What type of tender is this?',
          type: 'select',
          options: [
            { value: 'government', label: 'Government / Public Sector' },
            { value: 'parastatal', label: 'Parastatal / SOE' },
            { value: 'corporate', label: 'Corporate / Private Sector' },
            { value: 'framework', label: 'Framework Agreement / Panel' },
            { value: 'other', label: 'Other' },
          ],
          required: true,
        },
        {
          id: 'tender_mandatory_briefing',
          question: 'Is the briefing session mandatory?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, mandatory attendance' },
            { value: 'no', label: 'No, optional' },
            { value: 'unsure', label: 'Not confirmed yet' },
          ],
          required: true,
        },
        {
          id: 'tender_notes',
          question: 'Any additional tender requirements or notes?',
          type: 'textarea',
          placeholder: 'Special formatting requirements, BEE level needs, joint venture details, etc.',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Ad-Hoc Support Requirements
// ============================================================================

export const ADHOC_SUPPORT_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'Ad-Hoc Support',
  title: 'Ad-Hoc Support Requirements',
  subtitle: 'Tell us what you need help with',
  sections: [
    {
      title: 'Issue Details',
      description: 'Describe the problem or request',
      questions: [
        {
          id: 'adhoc_type',
          question: 'What type of support do you need?',
          type: 'select',
          options: [
            { value: 'bug', label: 'Bug fix / Issue resolution' },
            { value: 'config', label: 'Configuration change' },
            { value: 'enhancement', label: 'Minor enhancement' },
            { value: 'guidance', label: 'Expert guidance / Consultation' },
            { value: 'troubleshooting', label: 'Troubleshooting' },
            { value: 'other', label: 'Other' },
          ],
          required: true,
        },
        {
          id: 'adhoc_urgency',
          question: 'How urgent is this request?',
          type: 'radio',
          options: [
            { value: 'critical', label: 'Critical (production down)' },
            { value: 'high', label: 'High (major impact on users)' },
            { value: 'medium', label: 'Medium (workaround available)' },
            { value: 'low', label: 'Low (no immediate impact)' },
          ],
          required: true,
        },
        {
          id: 'adhoc_platform',
          question: 'Which platform area is affected?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint', label: 'SharePoint Online' },
            { value: 'teams', label: 'Microsoft Teams' },
            { value: 'power_platform', label: 'Power Platform' },
            { value: 'azure', label: 'Azure Services' },
            { value: 'copilot', label: 'Copilot / AI' },
            { value: 'viva', label: 'Microsoft Viva' },
            { value: 'security', label: 'Security / Compliance' },
            { value: 'other', label: 'Other' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Environment',
      questions: [
        {
          id: 'adhoc_environment',
          question: 'Which environment is affected?',
          type: 'radio',
          options: [
            { value: 'production', label: 'Production' },
            { value: 'staging', label: 'Staging / Test' },
            { value: 'development', label: 'Development' },
          ],
          required: true,
        },
        {
          id: 'adhoc_users_affected',
          question: 'How many users are affected?',
          type: 'select',
          options: [
            { value: '1', label: 'Single user' },
            { value: '2-10', label: 'Small group (2-10)' },
            { value: '11-50', label: 'Department (11-50)' },
            { value: '50+', label: 'Organization-wide (50+)' },
          ],
          required: true,
        },
        {
          id: 'adhoc_description',
          question: 'Describe the issue or request in detail',
          type: 'textarea',
          placeholder: 'Steps to reproduce, expected vs actual behaviour, error messages, screenshots, etc.',
          required: true,
        },
      ],
    },
  ],
};

// ============================================================================
// SLA Requirements
// ============================================================================

export const SLA_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'SLA',
  title: 'SLA Requirements',
  subtitle: 'Help us design the right support agreement for your needs',
  sections: [
    {
      title: 'Support Scope',
      description: 'What do you need covered under the SLA?',
      questions: [
        {
          id: 'sla_solutions',
          question: 'Which solutions need SLA coverage?',
          type: 'multiselect',
          options: [
            { value: 'power_apps', label: 'Power Apps' },
            { value: 'power_automate', label: 'Power Automate flows' },
            { value: 'spfx', label: 'SPFx solutions' },
            { value: 'sharepoint', label: 'SharePoint sites/config' },
            { value: 'teams', label: 'Teams apps/integrations' },
            { value: 'copilot', label: 'Copilot agents' },
            { value: 'viva', label: 'Viva modules' },
            { value: 'custom', label: 'Custom integrations' },
          ],
          required: true,
        },
        {
          id: 'sla_tier',
          question: 'What level of support are you looking for?',
          type: 'radio',
          options: [
            { value: 'basic', label: 'Basic (business hours, 8hr response)' },
            { value: 'standard', label: 'Standard (business hours, 4hr response)' },
            { value: 'premium', label: 'Premium (extended hours, 2hr response)' },
            { value: 'enterprise', label: 'Enterprise (24/7, 1hr response)' },
          ],
          required: true,
        },
        {
          id: 'sla_hours_estimate',
          question: 'Estimated monthly support hours?',
          type: 'select',
          options: [
            { value: '5', label: 'Up to 5 hours/month' },
            { value: '10', label: 'Up to 10 hours/month' },
            { value: '20', label: 'Up to 20 hours/month' },
            { value: '40', label: 'Up to 40 hours/month' },
            { value: 'custom', label: 'Custom (to be discussed)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Current Environment',
      questions: [
        {
          id: 'sla_solution_count',
          question: 'How many solutions/apps need support?',
          type: 'select',
          options: [
            { value: '1-3', label: '1-3 solutions' },
            { value: '4-10', label: '4-10 solutions' },
            { value: '11-20', label: '11-20 solutions' },
            { value: '20+', label: 'More than 20 solutions' },
          ],
          required: true,
        },
        {
          id: 'sla_documentation',
          question: 'Is the current solution documentation up to date?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, well documented' },
            { value: 'partial', label: 'Partially documented' },
            { value: 'no', label: 'No documentation available' },
            { value: 'unknown', label: 'Not sure' },
          ],
          required: true,
        },
        {
          id: 'sla_health_checks',
          question: 'Do you want proactive health checks included?',
          type: 'radio',
          options: [
            { value: 'yes_monthly', label: 'Yes, monthly health checks' },
            { value: 'yes_quarterly', label: 'Yes, quarterly health checks' },
            { value: 'no', label: 'Reactive support only' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Contract Preferences',
      questions: [
        {
          id: 'sla_duration',
          question: 'Preferred contract duration?',
          type: 'radio',
          options: [
            { value: '6months', label: '6 months' },
            { value: '12months', label: '12 months' },
            { value: '24months', label: '24 months' },
            { value: 'flexible', label: 'Flexible / to be discussed' },
          ],
          required: true,
        },
        {
          id: 'sla_notes',
          question: 'Any specific SLA requirements or expectations?',
          type: 'textarea',
          placeholder: 'Escalation requirements, reporting needs, specific KPIs, etc.',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Strategic Advisory Requirements
// ============================================================================

export const STRATEGIC_ADVISORY_REQUIREMENTS: ServiceRequirementsConfig = {
  category: 'Strategic Advisory',
  title: 'Strategic Advisory Requirements',
  subtitle: 'Help us understand your strategic consulting needs',
  sections: [
    {
      title: 'Advisory Focus',
      description: 'What strategic areas do you need help with?',
      questions: [
        {
          id: 'strategy_focus',
          question: 'What is the primary focus of this engagement?',
          type: 'multiselect',
          options: [
            { value: 'roadmap', label: 'Technology Roadmap Development' },
            { value: 'governance', label: 'Governance Framework Design' },
            { value: 'transformation', label: 'Digital Transformation Strategy' },
            { value: 'adoption', label: 'Adoption & Change Management' },
            { value: 'architecture', label: 'Enterprise Architecture Review' },
            { value: 'ai_strategy', label: 'AI / Copilot Strategy' },
            { value: 'cost', label: 'Cost Optimisation & Licensing' },
          ],
          required: true,
        },
        {
          id: 'strategy_horizon',
          question: 'What planning horizon are you looking at?',
          type: 'radio',
          options: [
            { value: '6months', label: 'Short-term (6 months)' },
            { value: '12months', label: 'Medium-term (12 months)' },
            { value: '2-3years', label: 'Long-term (2-3 years)' },
            { value: 'multi', label: 'Multi-phase (short + long term)' },
          ],
          required: true,
        },
        {
          id: 'strategy_stakeholders',
          question: 'Who are the key stakeholders for this initiative?',
          type: 'multiselect',
          options: [
            { value: 'cio', label: 'CIO / CTO' },
            { value: 'it_director', label: 'IT Director / Manager' },
            { value: 'business', label: 'Business Unit Leaders' },
            { value: 'ceo', label: 'CEO / COO' },
            { value: 'hr', label: 'HR / People Leader' },
            { value: 'procurement', label: 'Procurement' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Current State',
      questions: [
        {
          id: 'strategy_maturity',
          question: 'How would you rate your current digital workplace maturity?',
          type: 'scale',
          validation: { min: 1, max: 5 },
          required: true,
        },
        {
          id: 'strategy_existing_roadmap',
          question: 'Do you have an existing technology roadmap?',
          type: 'radio',
          options: [
            { value: 'yes_current', label: 'Yes, and it is current' },
            { value: 'yes_outdated', label: 'Yes, but it needs updating' },
            { value: 'no', label: 'No roadmap exists' },
          ],
          required: true,
        },
        {
          id: 'strategy_challenges',
          question: 'What are your top challenges?',
          type: 'multiselect',
          options: [
            { value: 'adoption', label: 'Low user adoption of M365' },
            { value: 'sprawl', label: 'Tool/app sprawl' },
            { value: 'governance', label: 'Lack of governance' },
            { value: 'security', label: 'Security concerns' },
            { value: 'cost', label: 'Rising costs / licensing complexity' },
            { value: 'skills', label: 'Lack of internal skills' },
            { value: 'integration', label: 'System integration gaps' },
            { value: 'change', label: 'Resistance to change' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Deliverables',
      questions: [
        {
          id: 'strategy_deliverables',
          question: 'What deliverables do you expect?',
          type: 'multiselect',
          options: [
            { value: 'report', label: 'Written strategy document' },
            { value: 'roadmap', label: 'Visual roadmap with milestones' },
            { value: 'presentation', label: 'Executive presentation' },
            { value: 'workshop', label: 'Strategy workshop facilitation' },
            { value: 'budget', label: 'Budget estimation & business case' },
            { value: 'governance', label: 'Governance framework document' },
          ],
          required: true,
        },
        {
          id: 'strategy_notes',
          question: 'Any additional context about your strategic priorities?',
          type: 'textarea',
          placeholder: 'Industry-specific challenges, recent mergers, regulatory changes, etc.',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Service Requirements Map
// ============================================================================

export const SERVICE_REQUIREMENTS_MAP: Record<ServiceCategory, ServiceRequirementsConfig> = {
  'Power Platform': POWER_PLATFORM_REQUIREMENTS,
  'SPFx Development': SPFX_REQUIREMENTS,
  'SharePoint Migration': MIGRATION_REQUIREMENTS,
  'M365 Assessment': ASSESSMENT_REQUIREMENTS,
  'Copilot Agents': COPILOT_REQUIREMENTS,
  'MS Viva': VIVA_REQUIREMENTS,
  'Training': TRAINING_REQUIREMENTS,
  'Proposal': PROPOSAL_REQUIREMENTS,
  'Tender': TENDER_REQUIREMENTS,
  'Ad-Hoc Support': ADHOC_SUPPORT_REQUIREMENTS,
  'SLA': SLA_REQUIREMENTS,
  'Strategic Advisory': STRATEGIC_ADVISORY_REQUIREMENTS,
};

/**
 * Get the requirements configuration for a service category
 */
export function getServiceRequirements(category: ServiceCategory): ServiceRequirementsConfig {
  return SERVICE_REQUIREMENTS_MAP[category];
}

/**
 * Validate that all required questions are answered
 */
export function validateRequirements(
  category: ServiceCategory,
  answers: Record<string, unknown>
): { valid: boolean; missingFields: string[] } {
  const config = getServiceRequirements(category);
  const missingFields: string[] = [];

  config.sections.forEach(section => {
    section.questions.forEach(question => {
      if (question.required) {
        const answer = answers[question.id];
        if (answer === undefined || answer === null || answer === '' ||
            (Array.isArray(answer) && answer.length === 0)) {
          missingFields.push(question.id);
        }
      }
    });
  });

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}
