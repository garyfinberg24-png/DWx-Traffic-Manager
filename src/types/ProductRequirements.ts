/**
 * DWx Traffic Manager - Product Requirements Types
 * Unique discovery questions for each product type (Apps, Web Parts, Adaptive Cards, Agents)
 */

import { ProductType } from './Product';
import { ServiceQuestion } from './ServiceRequirements';

// ============================================================================
// Product Requirements Configuration
// ============================================================================

export interface ProductRequirementsConfig {
  productType: ProductType;
  title: string;
  subtitle: string;
  sections: {
    title: string;
    description?: string;
    questions: ServiceQuestion[];
  }[];
}

// ============================================================================
// DWx Apps Requirements
// ============================================================================

export const DWX_APP_REQUIREMENTS: ProductRequirementsConfig = {
  productType: 'app',
  title: 'DWx App Requirements',
  subtitle: 'Help us understand your app deployment and customization needs',
  sections: [
    {
      title: 'Deployment Environment',
      description: 'Where and how will this app be used?',
      questions: [
        {
          id: 'app_deployment_target',
          question: 'Where do you want to deploy this app?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint', label: 'SharePoint Online' },
            { value: 'teams', label: 'Microsoft Teams' },
            { value: 'viva', label: 'Viva Connections' },
            { value: 'standalone', label: 'Standalone (Azure hosted)' },
          ],
          required: true,
        },
        {
          id: 'app_scope',
          question: 'What is the deployment scope?',
          type: 'radio',
          options: [
            { value: 'pilot', label: 'Pilot (single team/department)' },
            { value: 'department', label: 'Department-wide' },
            { value: 'organization', label: 'Organization-wide' },
            { value: 'multi_org', label: 'Multiple organizations/tenants' },
          ],
          required: true,
        },
        {
          id: 'app_users',
          question: 'How many users will use this app?',
          type: 'select',
          options: [
            { value: '1-25', label: '1-25 users' },
            { value: '26-100', label: '26-100 users' },
            { value: '101-500', label: '101-500 users' },
            { value: '501-1000', label: '501-1000 users' },
            { value: '1000+', label: 'More than 1000 users' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Customization Requirements',
      description: 'What customizations do you need?',
      questions: [
        {
          id: 'app_branding',
          question: 'Do you need custom branding?',
          type: 'radio',
          options: [
            { value: 'standard', label: 'No, standard DWx branding is fine' },
            { value: 'colors', label: 'Yes, custom colors only' },
            { value: 'full', label: 'Yes, full branding (logo, colors, fonts)' },
          ],
          required: true,
        },
        {
          id: 'app_integrations',
          question: 'What systems need to integrate with this app?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint_lists', label: 'SharePoint Lists' },
            { value: 'sharepoint_libraries', label: 'SharePoint Document Libraries' },
            { value: 'graph_api', label: 'Microsoft Graph API' },
            { value: 'power_automate', label: 'Power Automate flows' },
            { value: 'dataverse', label: 'Dataverse' },
            { value: 'd365', label: 'Dynamics 365' },
            { value: 'external_api', label: 'External APIs (please specify)' },
            { value: 'none', label: 'No additional integrations needed' },
          ],
          required: true,
        },
        {
          id: 'app_custom_features',
          question: 'Do you need any custom features beyond the standard app?',
          type: 'textarea',
          placeholder: 'Describe any specific features, workflows, or modifications you need...',
          required: false,
        },
      ],
    },
    {
      title: 'Data & Security',
      questions: [
        {
          id: 'app_data_source',
          question: 'Where will the app data be stored?',
          type: 'radio',
          options: [
            { value: 'sharepoint', label: 'SharePoint Lists (included)' },
            { value: 'existing_sp', label: 'Existing SharePoint Lists' },
            { value: 'dataverse', label: 'Dataverse' },
            { value: 'sql', label: 'Azure SQL Database' },
            { value: 'other', label: 'Other (please specify in comments)' },
          ],
          required: true,
        },
        {
          id: 'app_permissions',
          question: 'What permission model do you need?',
          type: 'radio',
          options: [
            { value: 'all', label: 'All users have the same access' },
            { value: 'role_based', label: 'Role-based access (Admin, Manager, User)' },
            { value: 'department', label: 'Department-based isolation' },
            { value: 'custom', label: 'Custom permission model (please describe)' },
          ],
          required: true,
        },
        {
          id: 'app_data_migration',
          question: 'Do you have existing data to migrate?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, starting fresh' },
            { value: 'excel', label: 'Yes, from Excel/CSV' },
            { value: 'sharepoint', label: 'Yes, from existing SharePoint' },
            { value: 'other_system', label: 'Yes, from another system' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Timeline & Support',
      questions: [
        {
          id: 'app_urgency',
          question: 'When do you need this app deployed?',
          type: 'select',
          options: [
            { value: 'asap', label: 'As soon as possible' },
            { value: '2weeks', label: 'Within 2 weeks' },
            { value: '1month', label: 'Within 1 month' },
            { value: '3months', label: 'Within 3 months' },
            { value: 'flexible', label: 'Flexible timeline' },
          ],
          required: true,
        },
        {
          id: 'app_training',
          question: 'Do you need user training?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, just documentation' },
            { value: 'admin', label: 'Admin training only' },
            { value: 'all', label: 'Yes, end-user training included' },
            { value: 'train_trainer', label: 'Train-the-trainer approach' },
          ],
          required: true,
        },
        {
          id: 'app_support',
          question: 'What level of ongoing support do you need?',
          type: 'radio',
          options: [
            { value: 'none', label: 'No ongoing support needed' },
            { value: 'email', label: 'Email support' },
            { value: 'sla', label: 'SLA-based support' },
            { value: 'managed', label: 'Fully managed service' },
          ],
          required: true,
        },
      ],
    },
  ],
};

// ============================================================================
// Web Parts Requirements
// ============================================================================

export const WEBPART_REQUIREMENTS: ProductRequirementsConfig = {
  productType: 'webpart',
  title: 'Web Part Requirements',
  subtitle: 'Help us understand your SharePoint web part needs',
  sections: [
    {
      title: 'Deployment Locations',
      description: 'Where will this web part be used?',
      questions: [
        {
          id: 'wp_sites',
          question: 'Which SharePoint sites will use this web part?',
          type: 'multiselect',
          options: [
            { value: 'intranet', label: 'Intranet / Communication sites' },
            { value: 'team_sites', label: 'Team sites' },
            { value: 'hub', label: 'Hub sites' },
            { value: 'all', label: 'All sites (tenant-wide)' },
          ],
          required: true,
        },
        {
          id: 'wp_pages',
          question: 'Where on pages will the web part appear?',
          type: 'multiselect',
          options: [
            { value: 'home', label: 'Site home pages' },
            { value: 'section', label: 'Full-width sections' },
            { value: 'column', label: 'Column layouts (1/2, 1/3, etc.)' },
            { value: 'vertical', label: 'Vertical section (sidebar)' },
          ],
          required: true,
        },
        {
          id: 'wp_quantity',
          question: 'How many instances of this web part do you expect?',
          type: 'select',
          options: [
            { value: '1-5', label: '1-5 instances' },
            { value: '6-20', label: '6-20 instances' },
            { value: '21-50', label: '21-50 instances' },
            { value: '50+', label: 'More than 50 instances' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Configuration & Customization',
      questions: [
        {
          id: 'wp_config_level',
          question: 'What level of configuration do end users need?',
          type: 'radio',
          options: [
            { value: 'none', label: 'No configuration (fixed layout)' },
            { value: 'basic', label: 'Basic (titles, colors, show/hide)' },
            { value: 'moderate', label: 'Moderate (data source, filters, layout)' },
            { value: 'advanced', label: 'Advanced (full customization per instance)' },
          ],
          required: true,
        },
        {
          id: 'wp_branding',
          question: 'Should the web part match your site branding?',
          type: 'radio',
          options: [
            { value: 'inherit', label: 'Yes, inherit site theme automatically' },
            { value: 'custom', label: 'Yes, custom branded design' },
            { value: 'standard', label: 'No, standard DWx styling' },
          ],
          required: true,
        },
        {
          id: 'wp_responsive',
          question: 'Is mobile responsiveness important?',
          type: 'radio',
          options: [
            { value: 'critical', label: 'Critical - many mobile users' },
            { value: 'important', label: 'Important - should work on mobile' },
            { value: 'desktop', label: 'Desktop-only is acceptable' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Data Sources',
      description: 'Where will the web part get its data?',
      questions: [
        {
          id: 'wp_data_source',
          question: 'What data sources will the web part use?',
          type: 'multiselect',
          options: [
            { value: 'sp_list', label: 'SharePoint List(s)' },
            { value: 'sp_library', label: 'SharePoint Document Library' },
            { value: 'sp_search', label: 'SharePoint Search' },
            { value: 'graph', label: 'Microsoft Graph (users, calendar, etc.)' },
            { value: 'external', label: 'External API' },
            { value: 'static', label: 'Static/configured data only' },
          ],
          required: true,
        },
        {
          id: 'wp_existing_data',
          question: 'Do you have existing data sources to connect?',
          type: 'radio',
          options: [
            { value: 'yes', label: 'Yes, existing SharePoint lists/libraries' },
            { value: 'create', label: 'No, need to create new data sources' },
            { value: 'both', label: 'Mix of existing and new' },
          ],
          required: true,
        },
        {
          id: 'wp_caching',
          question: 'How fresh does the data need to be?',
          type: 'radio',
          options: [
            { value: 'realtime', label: 'Real-time (always current)' },
            { value: 'minutes', label: 'Near real-time (cache for a few minutes)' },
            { value: 'hours', label: 'Periodic refresh (hours/daily)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Additional Requirements',
      questions: [
        {
          id: 'wp_audience_targeting',
          question: 'Do you need audience targeting?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, same content for everyone' },
            { value: 'groups', label: 'Yes, by security/M365 groups' },
            { value: 'department', label: 'Yes, by department' },
            { value: 'custom', label: 'Yes, custom targeting rules' },
          ],
          required: true,
        },
        {
          id: 'wp_multilingual',
          question: 'Do you need multi-language support?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, single language' },
            { value: 'yes', label: 'Yes, multiple languages' },
          ],
          required: true,
        },
        {
          id: 'wp_notes',
          question: 'Any other specific requirements?',
          type: 'textarea',
          placeholder: 'Describe any specific functionality, design requirements, or constraints...',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Adaptive Cards Requirements
// ============================================================================

export const ADAPTIVE_CARD_REQUIREMENTS: ProductRequirementsConfig = {
  productType: 'adaptive-card',
  title: 'Adaptive Card Requirements',
  subtitle: 'Help us understand your Teams card needs',
  sections: [
    {
      title: 'Card Usage',
      description: 'How will this adaptive card be used?',
      questions: [
        {
          id: 'card_distribution',
          question: 'How will the card be distributed?',
          type: 'multiselect',
          options: [
            { value: 'bot', label: 'Via a Teams Bot' },
            { value: 'flow', label: 'Via Power Automate flow' },
            { value: 'connector', label: 'Via incoming webhook/connector' },
            { value: 'viva', label: 'Viva Connections dashboard' },
            { value: 'outlook', label: 'Outlook actionable messages' },
          ],
          required: true,
        },
        {
          id: 'card_audience',
          question: 'Who will receive these cards?',
          type: 'multiselect',
          options: [
            { value: 'individuals', label: 'Individual users (1:1 chat)' },
            { value: 'channels', label: 'Teams channels' },
            { value: 'group_chat', label: 'Group chats' },
            { value: 'all', label: 'All of the above' },
          ],
          required: true,
        },
        {
          id: 'card_volume',
          question: 'Expected card volume?',
          type: 'select',
          options: [
            { value: 'low', label: 'Low (< 50 cards/day)' },
            { value: 'medium', label: 'Medium (50-500 cards/day)' },
            { value: 'high', label: 'High (500-5000 cards/day)' },
            { value: 'very_high', label: 'Very high (5000+ cards/day)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Interactivity',
      description: 'What actions should the card support?',
      questions: [
        {
          id: 'card_actions',
          question: 'What interactive elements are needed?',
          type: 'multiselect',
          options: [
            { value: 'approve_reject', label: 'Approve/Reject buttons' },
            { value: 'form_input', label: 'Form inputs (text, dates, dropdowns)' },
            { value: 'toggle', label: 'Toggle switches' },
            { value: 'links', label: 'Links to external resources' },
            { value: 'expand', label: 'Expandable/collapsible sections' },
            { value: 'refresh', label: 'Refresh/update card' },
            { value: 'display_only', label: 'Display only (no interaction)' },
          ],
          required: true,
        },
        {
          id: 'card_workflow',
          question: 'Does the card trigger a workflow?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, informational only' },
            { value: 'simple', label: 'Yes, simple action (update status)' },
            { value: 'flow', label: 'Yes, triggers Power Automate flow' },
            { value: 'complex', label: 'Yes, complex workflow with multiple steps' },
          ],
          required: true,
        },
        {
          id: 'card_update',
          question: 'Should the card update after user action?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No update needed' },
            { value: 'status', label: 'Yes, show updated status' },
            { value: 'replace', label: 'Yes, replace with new card' },
            { value: 'refresh', label: 'Yes, user can refresh manually' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Data & Integration',
      questions: [
        {
          id: 'card_data_source',
          question: 'Where does the card data come from?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint', label: 'SharePoint List' },
            { value: 'dataverse', label: 'Dataverse' },
            { value: 'd365', label: 'Dynamics 365' },
            { value: 'graph', label: 'Microsoft Graph' },
            { value: 'custom_api', label: 'Custom API' },
            { value: 'flow_data', label: 'Data from triggering flow' },
          ],
          required: true,
        },
        {
          id: 'card_write_back',
          question: 'Do actions need to write data back?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, read-only card' },
            { value: 'sharepoint', label: 'Yes, to SharePoint' },
            { value: 'dataverse', label: 'Yes, to Dataverse' },
            { value: 'custom', label: 'Yes, to custom endpoint' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Design & Branding',
      questions: [
        {
          id: 'card_branding',
          question: 'Do you need custom branding?',
          type: 'radio',
          options: [
            { value: 'standard', label: 'Standard DWx card design' },
            { value: 'colors', label: 'Custom colors to match brand' },
            { value: 'logo', label: 'Include company logo/imagery' },
          ],
          required: true,
        },
        {
          id: 'card_complexity',
          question: 'What is the card layout complexity?',
          type: 'radio',
          options: [
            { value: 'simple', label: 'Simple (title + body + buttons)' },
            { value: 'moderate', label: 'Moderate (multiple sections, tables)' },
            { value: 'complex', label: 'Complex (columns, images, multiple forms)' },
          ],
          required: true,
        },
        {
          id: 'card_notes',
          question: 'Any specific requirements or examples?',
          type: 'textarea',
          placeholder: 'Describe the card purpose, attach mockups if available, or reference examples...',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// DWx Agents (Copilot) Requirements
// ============================================================================

export const AGENT_REQUIREMENTS: ProductRequirementsConfig = {
  productType: 'agent',
  title: 'DWx Agent Requirements',
  subtitle: 'Help us understand your AI assistant needs',
  sections: [
    {
      title: 'Agent Purpose',
      description: 'What should this agent do for your organization?',
      questions: [
        {
          id: 'agent_primary_function',
          question: 'What is the primary function of this agent?',
          type: 'select',
          options: [
            { value: 'qa', label: 'Answer questions from knowledge base' },
            { value: 'helpdesk', label: 'Handle support/helpdesk requests' },
            { value: 'process', label: 'Guide users through processes' },
            { value: 'data', label: 'Retrieve and present data' },
            { value: 'actions', label: 'Perform actions on behalf of users' },
            { value: 'mixed', label: 'Combination of the above' },
          ],
          required: true,
        },
        {
          id: 'agent_audience',
          question: 'Who will interact with this agent?',
          type: 'multiselect',
          options: [
            { value: 'all_employees', label: 'All employees' },
            { value: 'specific_dept', label: 'Specific department(s)' },
            { value: 'managers', label: 'Managers/Leadership' },
            { value: 'external', label: 'External users (customers/partners)' },
            { value: 'it', label: 'IT staff only' },
            { value: 'hr', label: 'HR staff only' },
          ],
          required: true,
        },
        {
          id: 'agent_interaction_volume',
          question: 'Expected interaction volume?',
          type: 'select',
          options: [
            { value: 'low', label: 'Low (< 50 queries/day)' },
            { value: 'medium', label: 'Medium (50-200 queries/day)' },
            { value: 'high', label: 'High (200-1000 queries/day)' },
            { value: 'very_high', label: 'Very high (1000+ queries/day)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Knowledge Sources',
      description: 'What information should the agent know?',
      questions: [
        {
          id: 'agent_knowledge_sources',
          question: 'What knowledge sources should the agent access?',
          type: 'multiselect',
          options: [
            { value: 'sharepoint_docs', label: 'SharePoint document libraries' },
            { value: 'sharepoint_pages', label: 'SharePoint pages/wiki' },
            { value: 'sharepoint_lists', label: 'SharePoint lists' },
            { value: 'confluence', label: 'Confluence/other wiki' },
            { value: 'servicenow', label: 'ServiceNow knowledge base' },
            { value: 'website', label: 'Public website content' },
            { value: 'custom', label: 'Custom knowledge base' },
          ],
          required: true,
        },
        {
          id: 'agent_content_volume',
          question: 'How much content does the agent need to know?',
          type: 'select',
          options: [
            { value: 'small', label: 'Small (< 100 documents/pages)' },
            { value: 'medium', label: 'Medium (100-500 documents)' },
            { value: 'large', label: 'Large (500-2000 documents)' },
            { value: 'very_large', label: 'Very large (2000+ documents)' },
          ],
          required: true,
        },
        {
          id: 'agent_content_updates',
          question: 'How often does the content change?',
          type: 'radio',
          options: [
            { value: 'static', label: 'Rarely (quarterly or less)' },
            { value: 'monthly', label: 'Monthly updates' },
            { value: 'weekly', label: 'Weekly updates' },
            { value: 'daily', label: 'Frequently (daily changes)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Agent Capabilities',
      description: 'What should the agent be able to do?',
      questions: [
        {
          id: 'agent_actions',
          question: 'Should the agent take actions?',
          type: 'multiselect',
          options: [
            { value: 'answer_only', label: 'Answer questions only' },
            { value: 'create_ticket', label: 'Create support tickets' },
            { value: 'send_email', label: 'Send emails' },
            { value: 'update_records', label: 'Update records/lists' },
            { value: 'book_meetings', label: 'Book meetings' },
            { value: 'trigger_flows', label: 'Trigger Power Automate flows' },
            { value: 'escalate', label: 'Escalate to human agent' },
          ],
          required: true,
        },
        {
          id: 'agent_channels',
          question: 'Where should the agent be available?',
          type: 'multiselect',
          options: [
            { value: 'teams_chat', label: 'Teams 1:1 chat' },
            { value: 'teams_channel', label: 'Teams channels' },
            { value: 'sharepoint', label: 'SharePoint sites' },
            { value: 'viva', label: 'Viva Connections' },
            { value: 'web', label: 'External web chat' },
          ],
          required: true,
        },
        {
          id: 'agent_handoff',
          question: 'Do you need human handoff capability?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, agent handles everything' },
            { value: 'optional', label: 'Yes, user can request human' },
            { value: 'auto', label: 'Yes, auto-escalate for complex issues' },
            { value: 'required', label: 'Yes, always confirm with human' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Security & Compliance',
      questions: [
        {
          id: 'agent_data_sensitivity',
          question: 'Data sensitivity level?',
          type: 'select',
          options: [
            { value: 'public', label: 'Public information only' },
            { value: 'internal', label: 'Internal confidential' },
            { value: 'sensitive', label: 'Contains sensitive data (PII, financial)' },
            { value: 'regulated', label: 'Regulated data (healthcare, legal)' },
          ],
          required: true,
        },
        {
          id: 'agent_permissions',
          question: 'How should the agent respect permissions?',
          type: 'radio',
          options: [
            { value: 'none', label: 'Same access for all users' },
            { value: 'user_context', label: 'Respect user permissions (only show what they can access)' },
            { value: 'role_based', label: 'Role-based responses' },
          ],
          required: true,
        },
        {
          id: 'agent_audit',
          question: 'Do you need conversation logging/auditing?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No logging required' },
            { value: 'basic', label: 'Basic (questions and responses)' },
            { value: 'full', label: 'Full audit trail (compliance)' },
          ],
          required: true,
        },
      ],
    },
    {
      title: 'Existing Systems',
      questions: [
        {
          id: 'agent_existing',
          question: 'Do you have existing chatbots or agents?',
          type: 'radio',
          options: [
            { value: 'no', label: 'No, this is new' },
            { value: 'pva', label: 'Yes, Power Virtual Agents/Copilot Studio' },
            { value: 'other', label: 'Yes, other platform' },
            { value: 'replacing', label: 'Yes, replacing existing solution' },
          ],
          required: true,
        },
        {
          id: 'agent_copilot_license',
          question: 'Do you have Copilot/Copilot Studio licenses?',
          type: 'radio',
          options: [
            { value: 'yes_both', label: 'Yes, M365 Copilot + Copilot Studio' },
            { value: 'yes_studio', label: 'Yes, Copilot Studio only' },
            { value: 'no', label: 'No, need licensing guidance' },
            { value: 'planning', label: 'Planning to purchase' },
          ],
          required: true,
        },
        {
          id: 'agent_notes',
          question: 'Any specific requirements or use cases to highlight?',
          type: 'textarea',
          placeholder: 'Describe specific scenarios, common questions, or integration requirements...',
          required: false,
        },
      ],
    },
  ],
};

// ============================================================================
// Product Requirements Map
// ============================================================================

export const PRODUCT_REQUIREMENTS_MAP: Record<ProductType, ProductRequirementsConfig> = {
  'app': DWX_APP_REQUIREMENTS,
  'webpart': WEBPART_REQUIREMENTS,
  'adaptive-card': ADAPTIVE_CARD_REQUIREMENTS,
  'agent': AGENT_REQUIREMENTS,
};

/**
 * Get the requirements configuration for a product type
 */
export function getProductRequirements(productType: ProductType): ProductRequirementsConfig {
  return PRODUCT_REQUIREMENTS_MAP[productType];
}

/**
 * Validate that all required questions are answered for a product
 */
export function validateProductRequirements(
  productType: ProductType,
  answers: Record<string, unknown>
): { valid: boolean; missingFields: string[] } {
  const config = getProductRequirements(productType);
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
