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
// Service Requirements Map
// ============================================================================

export const SERVICE_REQUIREMENTS_MAP: Record<ServiceCategory, ServiceRequirementsConfig> = {
  'Power Platform': POWER_PLATFORM_REQUIREMENTS,
  'SPFx Development': SPFX_REQUIREMENTS,
  'SharePoint Migration': MIGRATION_REQUIREMENTS,
  'M365 Assessment': ASSESSMENT_REQUIREMENTS,
  'Copilot Agents': COPILOT_REQUIREMENTS,
  'MS Viva': VIVA_REQUIREMENTS,
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
