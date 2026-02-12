/**
 * DWx Traffic Manager - Process Guide Content
 * All guide data for the interactive step-by-step walkthrough system.
 * v2.18.0
 *
 * 10 guides: 5 Account Manager + 5 Manager
 */

import type { ProcessGuide, GuideRole, GuideCategory } from '../types/ProcessGuide';

// ============================================================================
// Account Manager Guides (5)
// ============================================================================

const amWelcome: ProcessGuide = {
  id: 'am-welcome',
  title: 'Welcome to DWx Traffic Manager',
  shortDescription: 'Get oriented with the app layout, navigation, and your role as an Account Manager.',
  category: 'getting-started',
  roles: ['account_manager', 'all'],
  iconName: 'Rocket24Regular',
  estimatedMinutes: 8,
  difficulty: 'beginner',
  isRecommended: true,
  sortOrder: 1,
  steps: [
    {
      id: 'am-welcome-1',
      title: 'Understanding the Landing Page',
      description:
        'When you first open DWx Traffic Manager, you land on the **Landing Page**. This is your home base.\n\n' +
        'The landing page shows:\n' +
        '- Quick-action cards to browse services, view products, or create a new request\n' +
        '- Key stats about the Digital Workplace team\n' +
        '- A rotating slogan showcasing DWx capabilities\n' +
        '- Meet the Team section with clickable profile cards\n\n' +
        'Take a moment to explore the landing page and familiarise yourself with the layout.',
      iconName: 'Home24Regular',
      tips: [
        'Click on any team member card to see their profile, specialisations, and contact details.',
        'The footer contains quick links to all major sections of the app.',
        'Stats update in real-time as new requests and deals flow through the system.',
      ],
      actionButton: { label: 'Go to Landing Page', route: '/' },
      screenshot: {
        src: '/screenshots/landing-page.png',
        alt: 'DWx Traffic Manager Landing Page showing masthead with stats, quick-action cards, team panel, and branded footer',
        caption: 'The Landing Page — your home base with quick actions, team profiles, and live stats.',
      },
    },
    {
      id: 'am-welcome-2',
      title: 'Navigating the App',
      description:
        'The **header navigation bar** is your primary way to move around the app. It appears on every page.\n\n' +
        'As an Account Manager, you have access to:\n' +
        '- **Services** - Browse the full DWx service catalogue (12 categories)\n' +
        '- **Products** - View DWx Apps, HyperParts, Adaptive Cards, and AI Agents\n' +
        '- **New Request** - Create a new service request for a client\n' +
        '- **My Requests** - Track all your submitted requests and their progress\n' +
        '- **Knowledge Base** - FAQs, glossary terms, and helpful articles\n\n' +
        'Manager-only sections (Dashboard, Admin, Pipeline) are visible only to managers.',
      iconName: 'Navigation24Regular',
      tips: [
        'The header highlights your current page with a bold underline.',
        'Use the Knowledge Base for quick answers to common questions about services and processes.',
        'Hero banners on most pages can be collapsed by clicking the chevron toggle at the bottom.',
      ],
    },
    {
      id: 'am-welcome-3',
      title: 'Your Role as an Account Manager',
      description:
        'As an Account Manager (AM), you are the **primary point of contact** between clients and the DWx pre-sales team.\n\n' +
        'Your key responsibilities:\n' +
        '- **Create service requests** when a client expresses interest in a DWx offering\n' +
        '- **Qualify leads** by confirming the client\'s genuine interest and budget\n' +
        '- **Provide client context** so specialists can prepare effectively\n' +
        '- **Track your requests** through the sales funnel stages\n' +
        '- **Respond to follow-ups** when deals go stale or need attention\n\n' +
        'You do NOT assign specialists or manage the pipeline directly - that is the manager\'s responsibility.',
      iconName: 'Person24Regular',
      tips: [
        'Always include as much client context as possible when creating a request - it helps specialists prepare.',
        'Keep your requests up to date with the latest client feedback and next steps.',
        'Check My Requests regularly for any follow-up reminders or stage changes.',
      ],
      warningText: 'Only managers can move deals through pipeline stages and assign specialists. If a deal needs attention, contact your manager.',
    },
    {
      id: 'am-welcome-4',
      title: 'Understanding the Sales Funnel',
      description:
        'Every service request follows a **7-stage sales funnel**:\n\n' +
        '1. **Lead** - Request submitted, waiting for AM to qualify\n' +
        '2. **Qualified** - AM confirmed client interest, awaiting specialist\n' +
        '3. **Discovery** - Pre-sales discovery meeting scheduled/completed\n' +
        '4. **Proposal** - Formal proposal being prepared\n' +
        '5. **Negotiation** - Client reviewing and negotiating terms\n' +
        '6. **Won** - Deal closed successfully\n' +
        '7. **Lost** - Deal did not proceed (can be reopened)\n\n' +
        'Your primary involvement is in stages 1-2 (creating and qualifying). Managers handle stage transitions from Qualified onwards.',
      iconName: 'DataFunnel24Regular',
      tips: [
        'You can track your deal\'s current stage in the My Requests page.',
        'Each stage has specific entry criteria and exit actions.',
        'Lost deals can be reopened as new leads if circumstances change.',
        'The weighted pipeline value is calculated as Deal Value x Probability.',
      ],
      successCriteria: 'You understand the app layout, your role, and the sales funnel stages.',
      actionButton: { label: 'View My Requests', route: '/requests' },
      visualStepper: { dataKey: 'sales-funnel', style: 'funnel' },
    },
  ],
};

const amCreateServiceRequest: ProcessGuide = {
  id: 'am-create-service-request',
  title: 'Creating a Service Request',
  shortDescription: 'Step-by-step guide to submitting a new service request for your client.',
  category: 'requests',
  roles: ['account_manager', 'all'],
  iconName: 'DocumentAdd24Regular',
  estimatedMinutes: 12,
  difficulty: 'beginner',
  isRecommended: true,
  sortOrder: 2,
  steps: [
    {
      id: 'am-csr-1',
      title: 'Navigate to New Request',
      description:
        'Click **"New Request"** in the header navigation bar, or use the quick-action card on the Landing Page.\n\n' +
        'This opens the **Service Request Form** - a 5-step wizard that guides you through providing all the information the pre-sales team needs.',
      iconName: 'Add24Regular',
      tips: [
        'You can also create a request from the Service Catalogue by clicking "Request" on any service card.',
        'The form auto-saves your progress if you navigate away accidentally.',
      ],
      actionButton: { label: 'Start New Request', route: '/request' },
      screenshot: {
        src: '/screenshots/new-request-wizard.png',
        alt: 'New Service Request form showing hero banner and 6-step wizard stepper dots',
        caption: 'The Service Request wizard — a guided 6-step form for capturing all deal information.',
      },
    },
    {
      id: 'am-csr-2',
      title: 'Step 1: Select a Service',
      description:
        'The first step is choosing which **DWx service** your client is interested in.\n\n' +
        'Browse the service dropdown to see all 12 categories:\n' +
        '- Power Platform Development\n' +
        '- SPFx Development\n' +
        '- SharePoint Migration\n' +
        '- M365 Tenant Assessment\n' +
        '- Enterprise Copilot Agents\n' +
        '- Microsoft Viva Suite\n' +
        '- Training\n' +
        '- Proposal Writing\n' +
        '- Tender Response\n' +
        '- Ad-Hoc Support\n' +
        '- SLA Management\n' +
        '- Strategic Advisory\n\n' +
        'Select the service that best matches your client\'s needs. You\'ll also set the **Interest Level** (Hot, Warm, or Cold).',
      iconName: 'Apps24Regular',
      screenshot: {
        src: '/screenshots/service-catalog.png',
        alt: 'Service Catalogue page with gradient hero banner, search bar, category pill filters, and service cards',
        caption: 'The Service Catalogue — browse all 12 categories with pill filters and search.',
      },
      tips: [
        'If unsure which service fits, browse the Service Catalogue first to read full descriptions.',
        'Hot = client ready to proceed, Warm = interested but exploring, Cold = early-stage enquiry.',
        'The interest level helps managers prioritise which deals to action first.',
      ],
    },
    {
      id: 'am-csr-3',
      title: 'Step 2: Client Information',
      description:
        'Enter your **client\'s details**. This is critical for specialist preparation.\n\n' +
        'Required fields:\n' +
        '- **Client/Company Name** - Start typing to search existing clients (auto-populates contact info)\n' +
        '- **Contact Name** - Primary contact for this engagement\n' +
        '- **Contact Email** - For meeting invitations and correspondence\n' +
        '- **Industry** - Helps tailor the approach (Technology, Finance, Healthcare, etc.)\n' +
        '- **Company Size** - SMB, Medium, Large, or Enterprise\n\n' +
        'If the client already exists in the system, selecting them from the dropdown will auto-fill all contact fields.',
      iconName: 'Building24Regular',
      tips: [
        'Type the client name to search - if they exist, selecting them fills in contact details automatically.',
        'For new clients, fill in all fields carefully as this creates the client profile.',
        'Industry and company size help the specialist tailor their discovery approach.',
      ],
      warningText: 'Double-check the client email address - this is used for calendar invitations and correspondence.',
    },
    {
      id: 'am-csr-4',
      title: 'Step 3: Requirements & Context',
      description:
        'This is where you provide the **business context** that makes or breaks a discovery meeting.\n\n' +
        'Key fields:\n' +
        '- **Requirements Summary** - What does the client need? Be specific about pain points and desired outcomes\n' +
        '- **Budget** - Client\'s stated budget (helps scope the proposal)\n' +
        '- **Timeline** - When does the client want to start/complete?\n' +
        '- **Deal Value (ZAR)** - Your estimated value of this deal\n' +
        '- **Deal Probability (%)** - Likelihood of winning (0-100%)\n' +
        '- **Service History** - Any past engagements with this client\n\n' +
        'The more context you provide, the better prepared the specialist will be.',
      iconName: 'ClipboardTextEdit24Regular',
      tips: [
        'Copy-paste relevant sections from client emails into the requirements field.',
        'If you have an RFP or requirements document, you can attach it in a later step.',
        'Deal Value x Probability = Weighted Pipeline Value (used for forecasting).',
        'Be honest about probability - it helps managers forecast accurately.',
      ],
    },
    {
      id: 'am-csr-5',
      title: 'Step 4: Proposed Time Slots',
      description:
        'Suggest up to **3 time slots** for the discovery meeting.\n\n' +
        'These are proposed times that you\'ve discussed or believe would work for the client. The manager will confirm the final slot and create the calendar event.\n\n' +
        'For each slot, select:\n' +
        '- **Date** - The proposed meeting date\n' +
        '- **Time** - The proposed meeting time\n\n' +
        'The system checks for calendar conflicts when the manager confirms a slot.',
      iconName: 'CalendarLtr24Regular',
      tips: [
        'Propose at least 2 slots to give flexibility.',
        'Check with your client before submitting to avoid back-and-forth.',
        'Slots are in South African Standard Time (SAST/UTC+2).',
      ],
    },
    {
      id: 'am-csr-6',
      title: 'Step 5: Review & Submit',
      description:
        'The final step shows a **summary of everything** you\'ve entered. Review each section carefully.\n\n' +
        'What happens after you submit:\n' +
        '1. The request enters the **Lead** stage\n' +
        '2. You receive a confirmation email\n' +
        '3. Managers are notified of the new request\n' +
        '4. The deal appears in the sales pipeline\n' +
        '5. A per-deal checklist is auto-created from the service template\n\n' +
        'You can track progress in **My Requests** at any time.',
      iconName: 'CheckmarkCircle24Regular',
      tips: [
        'You can go back to any step to make corrections before submitting.',
        'After submission, you can still edit contact info, deal value, and requirements via My Requests.',
        'The deal checklist helps track preparation tasks for this specific engagement.',
      ],
      successCriteria: 'Your service request is submitted and visible in My Requests.',
      actionButton: { label: 'View My Requests', route: '/requests' },
    },
  ],
};

const amCreateProductRequest: ProcessGuide = {
  id: 'am-create-product-request',
  title: 'Creating a Product Demo Request',
  shortDescription: 'Request a demo or trial deployment for any DWx product.',
  category: 'requests',
  roles: ['account_manager', 'all'],
  iconName: 'Box24Regular',
  estimatedMinutes: 8,
  difficulty: 'beginner',
  sortOrder: 3,
  steps: [
    {
      id: 'am-cpr-1',
      title: 'Browse the Product Catalogue',
      description:
        'Before creating a product request, browse the **Product Catalogue** to find the right product for your client.\n\n' +
        'Products are organised into 4 tabs:\n' +
        '- **Apps** (16 products) - Full SharePoint/Teams applications like License Pulse, Contract Manager, etc.\n' +
        '- **HyperParts** (17 products) - SPFx web parts for SharePoint pages (HyperNews, HyperNav, HyperFAQ, etc.)\n' +
        '- **Cards** (6 products) - Adaptive Cards for Teams (Leave Request, Approval, etc.)\n' +
        '- **Agents** (10 products) - AI Copilot agents and automations\n\n' +
        'Each product card shows the name, description, category, and version. Click a card for full details.',
      iconName: 'Grid24Regular',
      tips: [
        'Use the search bar and category pill filters to narrow down products.',
        'The HyperParts tab has a purple gradient hero with category-specific filtering.',
        'Product details include features, ideal use cases, and deployment information.',
      ],
      actionButton: { label: 'Browse Products', route: '/products' },
      screenshot: {
        src: '/screenshots/product-catalog.png',
        alt: 'Product Catalogue showing 4 tabs (Apps, HyperParts, Cards, Agents) with category pills and product cards',
        caption: 'The Product Catalogue — 49 products across Apps, HyperParts, Cards, and Agents.',
      },
    },
    {
      id: 'am-cpr-2',
      title: 'Start the Product Request',
      description:
        'Navigate to **"New Request"** from the header, then select the **Product** tab at the top of the form.\n\n' +
        'Alternatively, managers can use the **Quick Create** button in the Sales Pipeline to create product requests directly.\n\n' +
        'The product request form captures:\n' +
        '- Product selection (from the catalogue)\n' +
        '- Request type: **Demo** (presentation) or **Trial Deployment** (hands-on POC)\n' +
        '- Client information (same auto-populate as service requests)\n' +
        '- Estimated value and proposed time slots',
      iconName: 'DocumentAdd24Regular',
      tips: [
        'Choose "Demo" for a quick showcase, "Trial Deployment" for a hands-on proof of concept.',
        'Trial deployments typically take longer and may require specialist preparation.',
        'Include any specific client requirements or scenarios they want to see.',
      ],
      actionButton: { label: 'Create Product Request', route: '/product-request' },
    },
    {
      id: 'am-cpr-3',
      title: 'Fill in Client Details & Context',
      description:
        'Provide the same level of detail as a service request:\n\n' +
        '- **Client name** - Start typing to search existing clients\n' +
        '- **Contact information** - Auto-populated if client exists\n' +
        '- **Client context** - What problem are they trying to solve? What caught their interest?\n' +
        '- **Additional notes** - Any special requirements or constraints\n' +
        '- **Proposed time slots** - Up to 3 preferred times for the demo/trial',
      iconName: 'PersonInfo24Regular',
      tips: [
        'Mention which specific features the client wants to see in the demo.',
        'For trial deployments, note any technical constraints (tenant, licensing, etc.).',
        'The client context helps the specialist prepare a targeted presentation.',
      ],
    },
    {
      id: 'am-cpr-4',
      title: 'Submit & Track Progress',
      description:
        'After submission, the product request follows its own workflow:\n\n' +
        '1. **Pending Review** - Manager reviews the request\n' +
        '2. **Awaiting Approval** - Manager approves and assigns a specialist\n' +
        '3. **Confirmed** - Demo/trial date confirmed, calendar event created\n' +
        '4. **Completed** - Demo/trial delivered\n' +
        '5. **Cancelled** - Request cancelled (if client withdraws)\n\n' +
        'Track your product requests in the **"Product Requests"** tab within My Requests.',
      iconName: 'TaskListSquareLtr24Regular',
      tips: [
        'Product requests appear in a separate tab from service requests in My Requests.',
        'You\'ll receive email notifications when the status changes.',
        'If a demo goes well, the manager may convert it into a full service request.',
      ],
      successCriteria: 'Your product demo request is submitted and visible in My Requests > Product Requests tab.',
      actionButton: { label: 'View My Requests', route: '/requests' },
      visualStepper: { dataKey: 'product-request', style: 'linear' },
    },
  ],
};

const amManageRequests: ProcessGuide = {
  id: 'am-manage-requests',
  title: 'Managing My Requests',
  shortDescription: 'Track, update, and manage your submitted service and product requests.',
  category: 'requests',
  roles: ['account_manager', 'all'],
  iconName: 'TaskListSquareLtr24Regular',
  estimatedMinutes: 10,
  difficulty: 'intermediate',
  sortOrder: 4,
  steps: [
    {
      id: 'am-mr-1',
      title: 'The My Requests Dashboard',
      description:
        'The **My Requests** page is your central hub for tracking all submissions.\n\n' +
        'The hero banner shows key stats:\n' +
        '- **Active Deals** - Requests currently in the pipeline\n' +
        '- **Pipeline Value** - Total value of your active deals (ZAR)\n' +
        '- **Win Rate** - Your personal win/loss ratio\n\n' +
        'Below the hero, you\'ll see two tabs:\n' +
        '- **Service Requests** - All your service-related submissions\n' +
        '- **Product Requests** - All your product demo/trial submissions\n\n' +
        'Each tab has search, filter, sort, and both grid and list view options.',
      iconName: 'Board24Regular',
      tips: [
        'Use the status pill filters (All, Lead, Qualified, etc.) to quickly find requests by stage.',
        'The search bar searches across client name, service name, and contact details.',
        'Toggle between grid view (cards) and list view (table) using the icons in the toolbar.',
      ],
      actionButton: { label: 'Open My Requests', route: '/requests' },
      screenshot: {
        src: '/screenshots/my-requests.png',
        alt: 'My Requests page with hero stats (Active Deals, Pipeline Value, Win Rate), tabs, search, and deal cards with stage badges',
        caption: 'My Requests — track all your deals with hero stats, stage filters, and detailed cards.',
      },
    },
    {
      id: 'am-mr-2',
      title: 'Understanding Request Cards',
      description:
        'Each request card shows key information at a glance:\n\n' +
        '- **Client name** (bold title) and service/product name\n' +
        '- **Stage badge** - Colour-coded: blue (Lead), purple (Qualified), teal (Discovery), amber (Proposal), etc.\n' +
        '- **Urgency badge** - Orange (warning) or red (critical/overdue) if the deal needs attention\n' +
        '- **Meta pills** - AM name, deal value (ZAR), interest level, specialist (if assigned)\n' +
        '- **Footer** - Schedule date and creation date\n\n' +
        'Click any card to open the **full details modal** with 8 tabs of information.',
      iconName: 'ContactCard24Regular',
      tips: [
        'An orange "Warning" badge means the deal has been idle for 7+ days.',
        'A red "Critical" or "Overdue" badge means 14+ days without activity.',
        'Cards with a specialist name pill mean a pre-sales resource has been assigned.',
      ],
      warningText: 'Pay attention to urgency badges! Stale deals lose momentum and are harder to close.',
    },
    {
      id: 'am-mr-3',
      title: 'Viewing Request Details',
      description:
        'Clicking a request card opens the **Request Details Modal** with up to 8 tabs:\n\n' +
        '1. **Details** - Full request info (contact, service, deal value, requirements)\n' +
        '2. **People** - AM and specialist info, proposal tracker (if applicable)\n' +
        '3. **Schedule** - Proposed and confirmed meeting times\n' +
        '4. **Actions** - Follow-up reminders, email history\n' +
        '5. **Activity** - Chronological timeline of all changes to this deal\n' +
        '6. **Documents** - Attached files (RFPs, proposals, etc.)\n' +
        '7. **Checklist** - Per-deal preparation checklist with completion tracking\n' +
        '8. **Post Mortem** - Analysis of Won/Lost deals (only visible for closed deals)\n\n' +
        'The Details tab has editable sections - click the edit icon to update contact info, deal value, or requirements.',
      iconName: 'DocumentBulletList24Regular',
      tips: [
        'The Activity tab is invaluable for seeing the full history of a deal.',
        'The Checklist tab shows preparation tasks that need to be completed.',
        'You can update contact info, deal value, requirements, and comments directly from the Details tab.',
      ],
    },
    {
      id: 'am-mr-4',
      title: 'Editing Your Requests',
      description:
        'You can edit certain fields even after submission:\n\n' +
        '**Editable sections** (click the pencil icon):\n' +
        '- Contact information (name, email, phone)\n' +
        '- Deal information (value, probability, expected close date, budget)\n' +
        '- Requirements and service history\n' +
        '- Comments and notes\n\n' +
        '**Not editable by AMs**:\n' +
        '- Funnel stage (manager only)\n' +
        '- Specialist assignment (manager only)\n' +
        '- Confirmed meeting time (manager only)\n\n' +
        'All changes are audit-logged and visible in the Activity tab.',
      iconName: 'Edit24Regular',
      tips: [
        'Update the deal value as you learn more about the client\'s budget.',
        'Add new information to the comments field after client conversations.',
        'The audit trail shows exactly what changed, when, and by whom.',
      ],
    },
    {
      id: 'am-mr-5',
      title: 'Using Advanced Filters & Search',
      description:
        'Both the Service and Product request tabs have powerful filtering:\n\n' +
        '**Quick filters:**\n' +
        '- Status pill bar - click a stage/status to filter\n' +
        '- Search box - full-text search across names and details\n' +
        '- Sort dropdown - newest, oldest, highest/lowest value, name A-Z\n\n' +
        '**Advanced Filter Panel** (click "Filters" button):\n' +
        '- Service/product name\n' +
        '- Client name\n' +
        '- Min/max deal value\n' +
        '- Date range\n' +
        '- Has specialist assigned\n\n' +
        'Use the grid/list toggle to switch between card view and table view.',
      iconName: 'Filter24Regular',
      tips: [
        'Combine status filter with search for precise results (e.g. all "Hot" leads for "Acme Corp").',
        'List view shows more requests at once and is better for bulk scanning.',
        'Pagination controls at the bottom let you navigate through large lists.',
      ],
      successCriteria: 'You can find, view, edit, and filter your requests confidently.',
    },
  ],
};

const amKnowledgeBase: ProcessGuide = {
  id: 'am-knowledge-base',
  title: 'Using the Knowledge Base',
  shortDescription: 'Find answers to common questions, learn terminology, and read helpful articles.',
  category: 'requests',
  roles: ['account_manager', 'all'],
  iconName: 'BookOpen24Regular',
  estimatedMinutes: 6,
  difficulty: 'beginner',
  sortOrder: 5,
  steps: [
    {
      id: 'am-kb-1',
      title: 'Accessing the Knowledge Base',
      description:
        'Click **"Knowledge Base"** in the header navigation. This is available to all users.\n\n' +
        'The Knowledge Base has a hero banner with a search bar and three content tabs:\n' +
        '- **FAQ** - Frequently asked questions organised by category\n' +
        '- **Glossary** - Key terms and definitions used in DWx\n' +
        '- **Articles** - In-depth guides and reference material',
      iconName: 'Library24Regular',
      tips: [
        'Use the search bar in the hero to search across all three content types simultaneously.',
        'The Knowledge Base is managed by managers - if you need something added, let them know.',
      ],
      actionButton: { label: 'Open Knowledge Base', route: '/knowledge-base' },
      screenshot: {
        src: '/screenshots/knowledge-base.png',
        alt: 'Knowledge Base page with hero banner, search bar, and Featured Articles and Popular Questions sections',
        caption: 'The Knowledge Base — search FAQs, glossary terms, and in-depth articles.',
      },
    },
    {
      id: 'am-kb-2',
      title: 'Browsing FAQs',
      description:
        'The **FAQ tab** shows questions grouped by category:\n\n' +
        '- **General** - App usage and account questions\n' +
        '- **Services** - Questions about DWx service offerings\n' +
        '- **Products** - Questions about DWx products\n' +
        '- **Process** - Workflow and procedure questions\n' +
        '- **Technical** - Technical requirements and specifications\n' +
        '- **Commercial** - Pricing, licensing, and contract questions\n\n' +
        'Click any question to expand the answer. Use the category dropdown to filter.',
      iconName: 'ChatHelp24Regular',
      tips: [
        'FAQs use an accordion layout - click to expand, click again to collapse.',
        'Category filters help you find relevant questions quickly.',
        'If your question isn\'t answered, ask your manager to add it to the Knowledge Base.',
      ],
    },
    {
      id: 'am-kb-3',
      title: 'Using the Glossary',
      description:
        'The **Glossary tab** provides definitions for key terms used throughout DWx.\n\n' +
        'Terms are organised alphabetically with an **A-Z letter bar** at the top. Click any letter to jump to that section.\n\n' +
        'Common terms you\'ll encounter:\n' +
        '- SPFx, Power Platform, Copilot Agents\n' +
        '- Funnel stages (Lead, Qualified, Discovery, etc.)\n' +
        '- Deal metrics (Weighted Pipeline, Win Rate, etc.)\n' +
        '- DWx-specific terms (HyperParts, License Pulse, etc.)',
      iconName: 'TextSortAscending24Regular',
      tips: [
        'The letter bar navigation helps you jump to specific sections in a large glossary.',
        'Use the search bar if you\'re not sure which letter to look under.',
      ],
    },
    {
      id: 'am-kb-4',
      title: 'Reading Articles',
      description:
        'The **Articles tab** contains longer-form content like guides, best practices, and reference material.\n\n' +
        'Articles are displayed as cards showing:\n' +
        '- Title and category badge\n' +
        '- Preview of the content\n' +
        '- Tags for related topics\n\n' +
        'Click "Read More" on any card to open the full article in a dialog.',
      iconName: 'Document24Regular',
      tips: [
        'Articles are tagged with categories, making them easy to filter.',
        'Bookmark useful articles by noting their titles for quick reference.',
        'Articles are maintained by managers and updated regularly.',
      ],
      successCriteria: 'You can navigate all three Knowledge Base sections and find information quickly.',
    },
  ],
};

// ============================================================================
// Manager Guides (5)
// ============================================================================

const mgrPipelineOverview: ProcessGuide = {
  id: 'mgr-pipeline-overview',
  title: 'Sales Pipeline Management',
  shortDescription: 'Master the sales funnel dashboard, Kanban board, and deal progression workflow.',
  category: 'pipeline',
  roles: ['manager'],
  iconName: 'DataFunnel24Regular',
  estimatedMinutes: 15,
  difficulty: 'intermediate',
  isRecommended: true,
  sortOrder: 6,
  steps: [
    {
      id: 'mgr-po-1',
      title: 'The Sales Pipeline Dashboard',
      description:
        'The **Pipeline** page is the manager\'s command centre for all active deals.\n\n' +
        'The hero banner shows real-time stats:\n' +
        '- **Active Deals** - Total deals in the pipeline (excluding Won/Lost)\n' +
        '- **Pipeline Value** - Sum of all active deal values (ZAR)\n' +
        '- **Weighted Pipeline** - Value adjusted by probability\n' +
        '- **Urgency pills** - Count of overdue and at-risk deals\n\n' +
        'Below the hero, you\'ll find tabs for different views: **Overview**, **Board** (Kanban), **Product Queue**, and the **Quick Create** button.',
      iconName: 'ChartMultiple24Regular',
      tips: [
        'The Quick Create button lets you add new service or product requests without leaving the pipeline.',
        'Urgency pills in the hero help you spot deals that need immediate attention.',
        'The Attention Required card highlights overdue, critical, and warning-level deals.',
      ],
      actionButton: { label: 'Open Pipeline', route: '/pipeline' },
      screenshot: {
        src: '/screenshots/sales-pipeline.png',
        alt: 'Sales Pipeline dashboard with hero stats, 6 KPI cards, Attention Required card, Sales Funnel chart, and Conversion Rates',
        caption: 'The Sales Pipeline — real-time KPIs, funnel visualisation, and deal urgency tracking.',
      },
    },
    {
      id: 'mgr-po-2',
      title: 'Overview Tab: KPIs & Funnel',
      description:
        'The **Overview** tab shows key metrics and visualisations:\n\n' +
        '**KPI Cards:**\n' +
        '- Pipeline Value, Win Rate, Average Deal Size, Hot Leads count\n\n' +
        '**Funnel Chart:**\n' +
        '- Visual breakdown of deals by stage (Lead through Negotiation)\n' +
        '- Width represents deal count at each stage\n\n' +
        '**Conversion Rates:**\n' +
        '- Stage-to-stage conversion percentages\n' +
        '- Helps identify where deals are getting stuck\n\n' +
        '**Attention Required:**\n' +
        '- Deals grouped by urgency: overdue (14+ days), critical (7-14 days), warning (stale)',
      iconName: 'DataArea24Regular',
      tips: [
        'A win rate below 30% may indicate issues with qualification or proposal quality.',
        'Low conversion from Discovery to Proposal often means discovery meetings need improvement.',
        'The Attention Required card links to specific deals that need follow-up.',
      ],
    },
    {
      id: 'mgr-po-3',
      title: 'The Kanban Board',
      description:
        'The **Board** tab shows a drag-and-drop Kanban view with 5 columns:\n\n' +
        '**Lead** | **Qualified** | **Discovery** | **Proposal** | **Negotiation**\n\n' +
        'Each column shows:\n' +
        '- Stage name with colour-coded dot\n' +
        '- Deal count and total value\n' +
        '- Draggable deal cards\n\n' +
        '**Moving deals:** Drag a card from one column to the next to advance its stage. The system validates the transition against allowed stage paths.\n\n' +
        '**Won/Lost:** Use the 3-dot menu on any card to mark as Won or Lost (these are terminal stages and don\'t have columns).',
      iconName: 'Board24Regular',
      tips: [
        'You can only drag deals forward or backward by one stage at a time.',
        'Won/Lost are accessible only through the context menu (3-dot icon on each card).',
        'Each card shows client name, service, deal value, interest badge, and days-in-stage.',
        'Invalid transitions (e.g. Lead directly to Proposal) are automatically rejected.',
      ],
      warningText: 'Moving a deal to Won or Lost is a significant action - it triggers post-mortem creation and client LTV updates.',
      screenshot: {
        src: '/screenshots/kanban-board.png',
        alt: 'Kanban Board with 5 drag-and-drop columns (Lead, Qualified, Discovery, Proposal, Negotiation) showing deal cards with values and interest badges',
        caption: 'The Kanban Board — drag deals between stages, with per-column value totals and deal cards.',
      },
    },
    {
      id: 'mgr-po-4',
      title: 'The Service Queue',
      description:
        'The **Service Queue** (in the Manager Dashboard) shows all service requests in a table format.\n\n' +
        'Key features:\n' +
        '- **Search & filter** by stage, AM, interest level, date range\n' +
        '- **Bulk operations** - Select multiple deals and advance, approve, or export\n' +
        '- **Individual actions** - Click any row for full request details\n' +
        '- **Stage transition buttons** - Quick-action buttons for common transitions\n\n' +
        'The queue validates each bulk operation against allowed transitions and skips invalid ones.',
      iconName: 'TextBulletListSquare24Regular',
      tips: [
        'Use bulk operations to advance multiple qualified leads at once.',
        'The queue shows days-in-stage so you can spot bottlenecks.',
        'Export the queue to Excel for offline analysis or reporting.',
      ],
      actionButton: { label: 'Open Dashboard', route: '/dashboard' },
      screenshot: {
        src: '/screenshots/manager-dashboard.png',
        alt: 'Manager Dashboard with grouped sidebar navigation, KPI cards, Booking Status pie chart, and Bookings by Type bar chart',
        caption: 'The Manager Dashboard — grouped sidebar with Pipeline, Schedule, Analytics, and Operations.',
      },
    },
    {
      id: 'mgr-po-5',
      title: 'The Product Queue',
      description:
        'The **Product Queue** manages product demo and trial requests separately from service requests.\n\n' +
        'Product requests follow their own workflow:\n' +
        '**Pending Review** → **Awaiting Approval** → **Confirmed** → **Completed**\n\n' +
        'From the Product Queue, you can:\n' +
        '- Review and approve product requests\n' +
        '- Assign specialists to demos/trials\n' +
        '- Confirm demo dates (creates calendar events)\n' +
        '- Mark demos as completed or cancel requests',
      iconName: 'Box24Regular',
      tips: [
        'Product requests are accessible from both the Pipeline and Dashboard sidebar.',
        'Confirming a demo date automatically creates a Teams calendar event.',
        'Successful demos can be converted into full service requests.',
      ],
    },
    {
      id: 'mgr-po-6',
      title: 'Quick Create: Adding Deals Instantly',
      description:
        'The **Quick Create** button in the pipeline header lets you add deals without the full form wizard.\n\n' +
        'It supports two modes:\n' +
        '- **Service Request** - Select service, interest level, client, deal value, time slots\n' +
        '- **Product Request** - Select category, product, request type (Demo/Trial), client, time slots\n\n' +
        'Toggle between modes using the buttons at the top of the dialog. Client auto-populate works the same way.',
      iconName: 'Flash24Regular',
      tips: [
        'Quick Create is great for capturing deals during meetings or calls.',
        'Service requests go directly to the Service Queue, product requests to the Product Queue.',
        'You can paste client email threads into the "Client Context" field for background.',
      ],
    },
    {
      id: 'mgr-po-7',
      title: 'Understanding Stage Transitions',
      description:
        'Each stage has specific **allowed transitions**:\n\n' +
        '- **Lead** → Qualified or Lost\n' +
        '- **Qualified** → Discovery, Lead (demote), or Lost\n' +
        '- **Discovery** → Proposal, Qualified (demote), or Lost\n' +
        '- **Proposal** → Negotiation, Discovery (demote), or Lost\n' +
        '- **Negotiation** → Won, Lost, or Proposal (demote)\n' +
        '- **Won** → No further transitions (terminal)\n' +
        '- **Lost** → Lead (reopen as new lead)\n\n' +
        'Each transition triggers actions: email notifications, SLA timestamp recording, audit logging, and stage-specific automations (e.g. proposal auto-creation on Proposal stage, post-mortem on Won/Lost).',
      iconName: 'ArrowForward24Regular',
      tips: [
        'Moving to Discovery requires a specialist to be assigned first.',
        'Moving to Proposal auto-creates a proposal record.',
        'Won/Lost automatically generates a post-mortem for analysis.',
        'Lost deals can be reopened as leads if circumstances change.',
      ],
      successCriteria: 'You can navigate the pipeline, use the Kanban board, manage queues, and understand stage transitions.',
      visualStepper: { dataKey: 'sales-funnel', style: 'flowchart' },
    },
  ],
};

const mgrSpecialistAssignment: ProcessGuide = {
  id: 'mgr-specialist-assignment',
  title: 'Assigning Specialists to Deals',
  shortDescription: 'How to assign, reassign, and manage pre-sales specialist workloads.',
  category: 'pipeline',
  roles: ['manager'],
  iconName: 'PeopleTeam24Regular',
  estimatedMinutes: 10,
  difficulty: 'intermediate',
  sortOrder: 7,
  steps: [
    {
      id: 'mgr-sa-1',
      title: 'When to Assign a Specialist',
      description:
        'Specialists should be assigned when a deal moves from **Qualified** to **Discovery**.\n\n' +
        'Before assigning, consider:\n' +
        '- The **service category** - match to specialist expertise\n' +
        '- The **complexity level** - enterprise deals may need senior resources\n' +
        '- The **specialist\'s workload** - check current deal count vs. capacity\n' +
        '- The **client\'s timeline** - urgent deals need available specialists\n\n' +
        'Specialist information is managed in the **Admin > Specialists** tab.',
      iconName: 'PersonAvailable24Regular',
      tips: [
        'Each specialist has a maximum concurrent deal limit (typically 3-5).',
        'Check the Resources tab in the Dashboard for workload visibility.',
        'Match specialist roles: Solution Architect, Technical Specialist, or Consultant.',
      ],
    },
    {
      id: 'mgr-sa-2',
      title: 'Using the Assign Specialist Dialog',
      description:
        'To assign a specialist:\n\n' +
        '1. Open a deal from the Pipeline or Dashboard queue\n' +
        '2. In the **People** tab, click **"Assign Specialist"**\n' +
        '3. The dialog shows available specialists with:\n' +
        '   - Name, email, and role\n' +
        '   - Specialisations (service categories they cover)\n' +
        '   - Current deal count vs. maximum capacity\n' +
        '   - Active/inactive status\n' +
        '4. Select a specialist and confirm\n\n' +
        'The system sends email notifications to both the AM and the assigned specialist.',
      iconName: 'PersonAdd24Regular',
      tips: [
        'Specialists at capacity (max deals) show a warning indicator.',
        'The specialist\'s deal count increments automatically on assignment.',
        'Both the AM and specialist receive email notifications with deal details.',
      ],
      warningText: 'Assigning an overloaded specialist may lead to delays. Check workload first.',
    },
    {
      id: 'mgr-sa-3',
      title: 'Confirming Discovery Sessions',
      description:
        'After assigning a specialist, the next step is **confirming the discovery meeting**.\n\n' +
        '1. Review the AM\'s proposed time slots in the **Schedule** tab\n' +
        '2. Click **"Confirm Discovery"** on the preferred slot\n' +
        '3. The system:\n' +
        '   - Creates a Teams calendar event for specialist + AM + client\n' +
        '   - Checks for calendar conflicts\n' +
        '   - Auto-creates a **Session Prep** record for the specialist\n' +
        '   - Sends confirmation emails to all parties\n' +
        '   - Moves the deal to the Discovery stage\n\n' +
        'The specialist can then access their Session Prep to review AI-generated talking points and prepare.',
      iconName: 'CalendarCheckmark24Regular',
      tips: [
        'Calendar conflict detection runs automatically - you\'ll see a warning if there\'s a clash.',
        'Session Prep records include AI-generated client profiles and talking points.',
        'A reminder email is sent 24 hours before the meeting if prep is not complete.',
      ],
      visualStepper: { dataKey: 'session-prep', style: 'cards' },
    },
    {
      id: 'mgr-sa-4',
      title: 'Reassigning Specialists',
      description:
        'Sometimes you need to reassign a deal to a different specialist:\n\n' +
        '- The original specialist is unavailable or overloaded\n' +
        '- The deal requires different expertise\n' +
        '- The client requests a change\n\n' +
        'To reassign:\n' +
        '1. Open the deal details\n' +
        '2. In the People tab, click the edit/reassign button\n' +
        '3. Select the new specialist\n' +
        '4. Confirm the reassignment\n\n' +
        'The system automatically:\n' +
        '- Decrements the old specialist\'s deal count\n' +
        '- Increments the new specialist\'s deal count\n' +
        '- Notifies the old specialist that they\'ve been removed\n' +
        '- Notifies the new specialist of their assignment',
      iconName: 'PeopleSwap24Regular',
      tips: [
        'The previous specialist receives a courteous "you have been reassigned" notification.',
        'Deal count management is automatic - you don\'t need to manually adjust.',
        'The audit trail records the reassignment for transparency.',
      ],
    },
    {
      id: 'mgr-sa-5',
      title: 'Managing Specialist Capacity',
      description:
        'Monitor specialist workloads from two places:\n\n' +
        '**Dashboard > Resources Tab:**\n' +
        '- Visual workload bars for each specialist\n' +
        '- Current deal count vs. maximum capacity\n' +
        '- Specialisation areas\n\n' +
        '**Admin > Specialists:**\n' +
        '- Full CRUD for specialist profiles\n' +
        '- Set maximum concurrent deal limits\n' +
        '- Manage specialisations (which service categories they cover)\n' +
        '- Toggle active/inactive status\n\n' +
        'When a deal is Won or Lost, the specialist\'s deal count automatically decrements.',
      iconName: 'ScaleFill24Regular',
      tips: [
        'Set realistic max deal limits based on complexity - enterprise deals need more focus.',
        'Inactive specialists won\'t appear in the assignment dialog.',
        'The dashboard Resources tab gives you a quick capacity overview.',
      ],
      successCriteria: 'You can assign specialists, confirm discovery sessions, reassign when needed, and monitor capacity.',
      actionButton: { label: 'View Resources', route: '/dashboard' },
    },
  ],
};

const mgrProposalWorkflow: ProcessGuide = {
  id: 'mgr-proposal-workflow',
  title: 'Proposal Management Workflow',
  shortDescription: 'Create, review, approve, and send proposals with AI-powered content generation.',
  category: 'pipeline',
  roles: ['manager'],
  iconName: 'DocumentCheckmark24Regular',
  estimatedMinutes: 18,
  difficulty: 'advanced',
  sortOrder: 8,
  steps: [
    {
      id: 'mgr-pw-1',
      title: 'How Proposals Are Created',
      description:
        'Proposals are **auto-created** when a deal moves to the **Proposal** stage.\n\n' +
        'The system creates a proposal record linked to the service request with:\n' +
        '- Client and service details pre-filled\n' +
        '- Default terms and conditions\n' +
        '- 11 editable sections ready for content\n\n' +
        'You can access the proposal from:\n' +
        '- The **Proposal Tracker** card in the deal\'s People tab\n' +
        '- The **"Open Proposal Builder"** button in the deal details',
      iconName: 'DocumentAdd24Regular',
      tips: [
        'Proposals are only created when a deal reaches the Proposal stage - not before.',
        'The auto-creation is non-blocking: if it fails, the stage transition still succeeds.',
        'Each proposal has a version number that increments on major revisions.',
      ],
    },
    {
      id: 'mgr-pw-2',
      title: 'The Proposal Builder',
      description:
        'The **Proposal Builder** is a large dialog with 11 section tabs:\n\n' +
        '1. **Executive Summary** - Overview, objectives, success criteria\n' +
        '2. **Solution Overview** - Description, approach, differentiators\n' +
        '3. **Technology Stack** - Technologies with roles and justifications\n' +
        '4. **Scope of Work** - Deliverables with hours, exclusions\n' +
        '5. **Pricing** - Line items, subtotal, tax, discount, grand total (ZAR)\n' +
        '6. **Timeline** - Phases with milestones and week numbers\n' +
        '7. **Team Composition** - Team members, roles, responsibilities\n' +
        '8. **Terms & Conditions** - Payment, warranty, liability, IP\n' +
        '9. **Change Control** - Process, approval levels, pricing impact\n' +
        '10. **Risks & Mitigations** - Risk register with likelihood and impact\n' +
        '11. **Signing Page** - Signatory details and proposed date\n\n' +
        'Each section can be edited manually or generated by AI.',
      iconName: 'DocumentEdit24Regular',
      tips: [
        'Work through sections in order - earlier sections inform later ones.',
        'The Pricing section calculates totals automatically from line items.',
        'The Timeline section uses week numbers for phase planning.',
      ],
    },
    {
      id: 'mgr-pw-3',
      title: 'AI Content Generation',
      description:
        'Each proposal section has a **"Generate with AI"** button that uses Azure OpenAI to create content.\n\n' +
        'The AI considers:\n' +
        '- Client industry, size, and requirements\n' +
        '- Selected service category and complexity\n' +
        '- Deal value and timeline expectations\n' +
        '- Discovery notes (if available)\n\n' +
        'AI-generated content is a **starting point** - always review and customise before submitting.',
      iconName: 'Sparkle24Regular',
      tips: [
        'Generate the Executive Summary first - it provides context for other sections.',
        'The more deal context you provide, the better the AI output.',
        'AI generation requires Azure OpenAI to be configured - check with your admin.',
        'You can regenerate any section multiple times until you\'re satisfied.',
      ],
      warningText: 'Always review AI-generated content carefully. It may need adjustment for accuracy and tone.',
    },
    {
      id: 'mgr-pw-4',
      title: 'Proposal Status Workflow',
      description:
        'Proposals follow a specific approval workflow:\n\n' +
        '1. **Draft** - Initial creation, content being developed\n' +
        '2. **Internal Review** - Submitted for manager review\n' +
        '3. **Revision Requested** - Manager requests changes (returns to Draft)\n' +
        '4. **Approved** - Manager approves the proposal\n' +
        '5. **Sent to Client** - Proposal delivered to the client\n' +
        '6. **Accepted** - Client accepted the proposal\n' +
        '7. **Declined** - Client declined the proposal\n\n' +
        'Status transitions are enforced - you can\'t skip steps.',
      iconName: 'ArrowFlow24Regular',
      visualStepper: { dataKey: 'proposal-workflow', style: 'flowchart' },
      tips: [
        'Use "Internal Review" to flag a proposal for another manager\'s review.',
        'Adding internal notes helps reviewers understand your approach.',
        'Moving to "Sent to Client" records the sent date for tracking.',
      ],
    },
    {
      id: 'mgr-pw-5',
      title: 'Exporting Proposals',
      description:
        'Once approved, you can export the proposal in two formats:\n\n' +
        '**PDF Export:**\n' +
        '- DW-branded A4 document\n' +
        '- Cover page with DWx blue stripe\n' +
        '- Auto-generated table of contents\n' +
        '- Professional tables for scope, pricing, timeline\n' +
        '- Page numbers and Enterprise "CONFIDENTIAL" watermark\n' +
        '- Available from the "Download PDF" button in the Proposal Builder\n\n' +
        '**Word Export:**\n' +
        '- Editable Word document for further customisation\n' +
        '- DW-branded template formatting',
      iconName: 'ArrowDownload24Regular',
      tips: [
        'PDF export is available once the proposal is Approved or later.',
        'The PDF filename follows the pattern: "{Client} - {Service} Proposal v{Version}.pdf".',
        'Enterprise proposals include a "CONFIDENTIAL" watermark automatically.',
      ],
    },
    {
      id: 'mgr-pw-6',
      title: 'Tracking Proposal Progress',
      description:
        'The **Proposal Tracker** card appears in the deal\'s People tab for deals at Proposal stage or later.\n\n' +
        'It shows:\n' +
        '- Current proposal status with colour-coded badge\n' +
        '- Version number\n' +
        '- Key dates (created, sent, client response)\n' +
        '- Quick-action buttons (Open Builder, Download PDF)\n\n' +
        'The tracker persists even after the deal moves to Negotiation, Won, or Lost, giving you a complete history.',
      iconName: 'DocumentSearch24Regular',
      tips: [
        'The Proposal Tracker stays visible through all post-Proposal stages.',
        'Version history helps you track how the proposal evolved.',
        'Client feedback is captured in the proposal record for future reference.',
      ],
    },
    {
      id: 'mgr-pw-7',
      title: 'Proposal Templates',
      description:
        'Three proposal templates are available:\n\n' +
        '- **Standard** - For typical engagements (most common)\n' +
        '- **Enterprise** - For large-scale, complex engagements (adds confidentiality watermark)\n' +
        '- **Custom** - For non-standard requirements\n\n' +
        'The template affects the PDF export formatting and default terms.\n\n' +
        'Default Terms & Conditions cover:\n' +
        '- Payment terms (50/50 or milestone-based)\n' +
        '- Warranty period\n' +
        '- Liability limitations\n' +
        '- Confidentiality obligations\n' +
        '- IP ownership\n' +
        '- Termination clauses',
      iconName: 'DocumentCopy24Regular',
      tips: [
        'Enterprise templates are recommended for deals over R500,000.',
        'Default T&C can be customised per proposal in the Terms section.',
        'The signing page section captures both DW and client signatory details.',
      ],
      successCriteria: 'You can create, edit, review, export, and track proposals through their full lifecycle.',
    },
  ],
};

const mgrDeliveryHandover: ProcessGuide = {
  id: 'mgr-delivery-handover',
  title: 'Won Deal Delivery Handover',
  shortDescription: 'Hand over won deals to the delivery team with milestones, resources, and sign-off.',
  category: 'delivery',
  roles: ['manager'],
  iconName: 'Handshake24Regular',
  estimatedMinutes: 20,
  difficulty: 'advanced',
  sortOrder: 9,
  steps: [
    {
      id: 'mgr-dh-1',
      title: 'What Happens When a Deal is Won',
      description:
        'When a deal moves to **Won**, several things happen automatically:\n\n' +
        '1. Client lifetime value (LTV) is updated in the client record\n' +
        '2. Specialist deal count is decremented\n' +
        '3. A **Post-Mortem** record is created for win analysis\n' +
        '4. Won confirmation email sent to AM and managers\n' +
        '5. The deal becomes eligible for **Delivery Handover**\n\n' +
        'The Delivery Handover process is managed through the **Delivery Command Centre** (/delivery route).',
      iconName: 'Trophy24Regular',
      tips: [
        'Always celebrate wins with the team - it boosts morale and motivation.',
        'The post-mortem for won deals captures what went right for future reference.',
        'Delivery handover should start as soon as possible after winning to maintain momentum.',
      ],
      actionButton: { label: 'Open Delivery Hub', route: '/delivery' },
      visualStepper: { dataKey: 'delivery-handover', style: 'linear' },
    },
    {
      id: 'mgr-dh-2',
      title: 'The Delivery Command Centre',
      description:
        'The **Delivery Command Centre** at /delivery is the hub for all handover activities.\n\n' +
        'It has two main tabs:\n' +
        '- **Projects** - All active delivery handovers with status tracking\n' +
        '- **Capacity** - Resource availability and allocation\n\n' +
        'The hero banner shows real-time stats including active handovers, overdue items, and team capacity.\n\n' +
        'From here you can create new handovers, track milestones, assign delivery resources, and monitor progress.',
      iconName: 'Rocket24Regular',
      tips: [
        'The Delivery Command Centre is accessible from the Dashboard sidebar.',
        'Use the Capacity tab to check resource availability before starting a handover.',
        'Each project card shows overall progress, priority, and key dates.',
      ],
    },
    {
      id: 'mgr-dh-3',
      title: 'Creating a Handover Package',
      description:
        'To initiate a delivery handover:\n\n' +
        '1. Click **"New Handover"** in the Delivery Command Centre\n' +
        '2. Select the won deal from the dropdown\n' +
        '3. The system pre-fills information from the deal:\n' +
        '   - Client details and contacts\n' +
        '   - Service scope from the proposal\n' +
        '   - Assigned specialist info\n' +
        '4. Add delivery-specific details:\n' +
        '   - **Delivery team** members and roles\n' +
        '   - **Milestones** with target dates\n' +
        '   - **Deliverables** and acceptance criteria\n' +
        '   - **Handover meeting** date\n' +
        '   - **Priority** level and estimated duration',
      iconName: 'ClipboardTask24Regular',
      tips: [
        'Include all proposal deliverables as milestones with target dates.',
        'Set realistic milestone dates - they\'re used for SLA tracking.',
        'Assign a dedicated project manager or delivery lead.',
      ],
      warningText: 'Ensure the delivery team is briefed on the client context before the handover meeting.',
    },
    {
      id: 'mgr-dh-4',
      title: 'Milestone & Progress Tracking',
      description:
        'Each handover has milestones that track delivery progress:\n\n' +
        '**Milestone states:**\n' +
        '- **Not Started** - Work hasn\'t begun\n' +
        '- **In Progress** - Currently being worked on\n' +
        '- **Completed** - Finished and verified\n' +
        '- **Overdue** - Past the target date\n\n' +
        'Progress is calculated as the percentage of completed milestones. The Delivery Command Centre shows an overall progress bar for each project.\n\n' +
        'Email notifications are sent when milestones become overdue.',
      iconName: 'TaskListSquareAdd24Regular',
      tips: [
        'Update milestone status regularly to keep the delivery dashboard accurate.',
        'Overdue milestones trigger automated alerts to the delivery team.',
        'Use the milestone notes field to record blockers or dependencies.',
      ],
    },
    {
      id: 'mgr-dh-5',
      title: 'Client Sign-Off & Acceptance',
      description:
        'Delivery isn\'t complete until the **client signs off**.\n\n' +
        'The sign-off process:\n' +
        '1. All deliverables submitted and reviewed\n' +
        '2. Client acceptance recorded per deliverable\n' +
        '3. Final sign-off with signatory name and date\n' +
        '4. **CSAT score** collected (1-5 star rating)\n' +
        '5. Handover marked as **Complete**\n\n' +
        'CSAT (Customer Satisfaction) scores feed into the Delivery Analytics dashboard for trend analysis.',
      iconName: 'CheckmarkSquare24Regular',
      tips: [
        'Get sign-off in writing (the system records who signed and when).',
        'CSAT feedback helps improve future delivery processes.',
        'A completed handover triggers a final notification to all stakeholders.',
      ],
    },
    {
      id: 'mgr-dh-6',
      title: 'Delivery Analytics & KPIs',
      description:
        'The **Delivery Analytics** tab in the Manager Dashboard provides insights across all handovers:\n\n' +
        '**Key metrics:**\n' +
        '- On-time delivery rate\n' +
        '- Average CSAT score\n' +
        '- Active vs. completed handovers\n' +
        '- Overdue milestone count\n\n' +
        '**Charts:**\n' +
        '- Milestone completion trends\n' +
        '- CSAT distribution\n' +
        '- Resource utilisation\n\n' +
        'Use these insights to identify bottlenecks and improve the delivery process.',
      iconName: 'DataUsage24Regular',
      tips: [
        'An on-time rate below 80% may indicate scope or resource issues.',
        'CSAT trends help identify recurring client satisfaction themes.',
        'The Delivery Analytics tab is in the Dashboard under the Operations nav group.',
      ],
      successCriteria: 'You can create handovers, track milestones, collect sign-offs, and monitor delivery analytics.',
      actionButton: { label: 'View Delivery Analytics', route: '/dashboard' },
    },
  ],
};

const mgrAdminOverview: ProcessGuide = {
  id: 'mgr-admin-overview',
  title: 'Administration Panel Overview',
  shortDescription: 'Manage team members, clients, services, specialists, and system settings.',
  category: 'admin',
  roles: ['manager'],
  iconName: 'Settings24Regular',
  estimatedMinutes: 12,
  difficulty: 'intermediate',
  sortOrder: 10,
  steps: [
    {
      id: 'mgr-ao-1',
      title: 'Accessing the Admin Panel',
      description:
        'Click **"Admin"** in the header navigation (manager-only).\n\n' +
        'The Admin panel uses a **grouped sidebar** with 6 groups and 13 tabs:\n\n' +
        '**People:** Team Members, Account Managers, Specialists\n' +
        '**Data:** Clients, Services, SLA Configuration\n' +
        '**Content:** Landing Page, Knowledge Base\n' +
        '**Operations:** Checklist, Documents\n' +
        '**Access:** Manager Access, Guest Invitations\n' +
        '**System:** SP Provisioning',
      iconName: 'PanelLeft24Regular',
      tips: [
        'The sidebar groups related functionality for easy navigation.',
        'Each tab has its own search, filter, and CRUD capabilities.',
        'Changes to admin data are audit-logged automatically.',
      ],
      actionButton: { label: 'Open Admin Panel', route: '/admin' },
      screenshot: {
        src: '/screenshots/admin-panel.png',
        alt: 'Admin Panel with grouped sidebar (People, Catalog, Data, System) and Team Members table with search and pagination',
        caption: 'The Admin Panel — 13 tabs organised into 6 groups for managing all system data.',
      },
    },
    {
      id: 'mgr-ao-2',
      title: 'Managing People',
      description:
        'The **People** group has three tabs:\n\n' +
        '**Team Members:**\n' +
        '- View and edit all DWx team members\n' +
        '- Manage roles and active status\n\n' +
        '**Account Managers:**\n' +
        '- Full CRUD with Entra ID user picker\n' +
        '- Regions: Western Cape, Gauteng, KZN, UK\n' +
        '- Sources: Internal, External, Guest\n' +
        '- Status: Active, Inactive, On Leave\n\n' +
        '**Specialists:**\n' +
        '- Pre-sales specialist profiles\n' +
        '- Specialisations (service categories)\n' +
        '- Maximum concurrent deal limits\n' +
        '- Current workload tracking',
      iconName: 'People24Regular',
      tips: [
        'Use the Entra ID picker when adding AMs to link their Azure AD account.',
        'Setting a specialist to "Inactive" hides them from the assignment dialog.',
        'The Business Unit column shows the AM\'s department.',
      ],
    },
    {
      id: 'mgr-ao-3',
      title: 'Managing Data',
      description:
        'The **Data** group manages core business data:\n\n' +
        '**Clients:**\n' +
        '- Client profiles with contact info, industry, size\n' +
        '- Premium client flag for priority handling\n' +
        '- XLSX import for bulk client data loading\n' +
        '- Orphan protection: can\'t delete clients with active deals\n\n' +
        '**Services:**\n' +
        '- 12-category service catalogue management\n' +
        '- 4-tab form: Basic Info, Content, Engagement Phases, Relations\n' +
        '- Rich content (What\'s Included, Benefits, Ideal For) stored as JSON\n' +
        '- XLSX import for bulk service updates\n\n' +
        '**SLA Configuration:**\n' +
        '- SLA target days per complexity level\n' +
        '- Per-service overrides for specific SLA targets',
      iconName: 'Database24Regular',
      tips: [
        'Use XLSX import for bulk client or service updates - download the template first.',
        'Service content JSON fields have defaults in code as fallback.',
        'SLA configuration affects the SLA dashboard and breach alerts.',
      ],
    },
    {
      id: 'mgr-ao-4',
      title: 'Managing Content',
      description:
        'The **Content** group controls user-facing content:\n\n' +
        '**Landing Page:**\n' +
        '- 7 sub-tabs: Slogans, What We Do, Stats, Testimonial, Team Members, Text Content, Footer Links\n' +
        '- Content loads from SharePoint with hardcoded fallback\n' +
        '- Changes appear immediately on the landing page\n\n' +
        '**Knowledge Base:**\n' +
        '- Manage FAQ, Glossary, and Article entries\n' +
        '- Set categories, tags, and active/draft status\n' +
        '- Content available to all users via the Knowledge Base page',
      iconName: 'TextDescription24Regular',
      tips: [
        'Landing page content falls back to defaults if SharePoint data is empty.',
        'Knowledge Base entries can be set to draft (inactive) while being written.',
        'Articles support full rich text content.',
      ],
    },
    {
      id: 'mgr-ao-5',
      title: 'Operations, Access & System',
      description:
        '**Operations:**\n' +
        '- **Checklist** - Per-service checklist template editor (auto-copied to deals on creation)\n' +
        '- **Documents** - Document library management\n\n' +
        '**Access:**\n' +
        '- **Manager Access** - Control who has manager privileges\n' +
        '- **Guest Invitations** - Invite external partner AMs to the system\n\n' +
        '**System:**\n' +
        '- **SP Provisioning** - Create and manage SharePoint lists\n' +
        '- 4 sub-tabs: Overview (stats), Lists (create/re-provision), Seed Data, Tools',
      iconName: 'Wrench24Regular',
      tips: [
        'Checklist templates have 12 category defaults that can be customised.',
        'Guest invitations support external partner AM onboarding.',
        'SP Provisioning is for initial setup - use carefully in production.',
      ],
      warningText: 'SP Provisioning creates or modifies SharePoint lists. Use with caution in production environments.',
    },
    {
      id: 'mgr-ao-6',
      title: 'Audit Trail & Monitoring',
      description:
        'Every admin action is **automatically logged** to the DWxAuditLog SharePoint list.\n\n' +
        'The audit system tracks 14 entity types:\n' +
        '- Booking, TeamMember, Client, Checklist, User\n' +
        '- AccountManager, ServiceRequest, Service, Specialist\n' +
        '- ProductRequest, LandingPageContent, KnowledgeBase\n' +
        '- Proposal, PostMortem\n\n' +
        'Each log entry records: action type, entity, who performed it, when, and old/new values.\n\n' +
        'View audit logs for any specific deal in the **Activity** tab of the request details.',
      iconName: 'History24Regular',
      tips: [
        'The Activity tab on each deal shows a human-readable timeline of changes.',
        'Audit logs include before/after values for all field changes.',
        'Use audit logs to investigate discrepancies or track who made changes.',
      ],
      successCriteria: 'You understand the admin panel structure and can manage all aspects of the system.',
    },
  ],
};

// ============================================================================
// All Guides Array
// ============================================================================

export const ALL_PROCESS_GUIDES: ProcessGuide[] = [
  amWelcome,
  amCreateServiceRequest,
  amCreateProductRequest,
  amManageRequests,
  amKnowledgeBase,
  mgrPipelineOverview,
  mgrSpecialistAssignment,
  mgrProposalWorkflow,
  mgrDeliveryHandover,
  mgrAdminOverview,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get guides filtered by role. 'manager' sees all guides, 'account_manager' sees AM + 'all' guides.
 */
export function getGuidesByRole(role: GuideRole): ProcessGuide[] {
  if (role === 'manager') return ALL_PROCESS_GUIDES;
  return ALL_PROCESS_GUIDES.filter(
    (g) => g.roles.includes(role) || g.roles.includes('all')
  ).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get guides for a specific category, optionally filtered by role.
 */
export function getGuidesForCategory(category: GuideCategory, role?: GuideRole): ProcessGuide[] {
  let guides = ALL_PROCESS_GUIDES.filter((g) => g.category === category);
  if (role) {
    if (role === 'manager') return guides.sort((a, b) => a.sortOrder - b.sortOrder);
    guides = guides.filter((g) => g.roles.includes(role) || g.roles.includes('all'));
  }
  return guides.sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get recommended guides for a role (isRecommended: true).
 */
export function getRecommendedGuides(role: GuideRole): ProcessGuide[] {
  return getGuidesByRole(role).filter((g) => g.isRecommended);
}
