/**
 * DWx Traffic Manager - AI Chat Service
 * Azure OpenAI integration for the DWx Copilot side panel
 */

import { config } from '../config/environmentConfig';
import { ChatMessage, ChatContext, MAX_CHAT_HISTORY } from '../types/AIChat';

class AIChatService {
  /**
   * Check if Azure OpenAI is configured
   */
  isConfigured(): boolean {
    return Boolean(config.azureOpenAI?.endpoint && config.azureOpenAI?.apiKey);
  }

  /**
   * Build the system prompt with context awareness
   */
  buildSystemPrompt(context: ChatContext): string {
    const pageDescriptions: Record<string, string> = {
      '/': 'the Landing Page (home page)',
      '/services': 'the Service Catalog (browsing available services)',
      '/products': 'the Product Catalog (browsing DWx products)',
      '/request': 'the Service Request Form (creating a new service request)',
      '/product-request': 'the Product Request Form (requesting a product demo/trial)',
      '/requests': 'My Requests (viewing their service and product requests)',
      '/knowledge-base': 'the Knowledge Base (FAQs, glossary, articles)',
      '/pipeline': 'the Sales Funnel Dashboard (pipeline overview, Kanban board)',
      '/dashboard': 'the Manager Dashboard (analytics, reports, approvals)',
      '/admin': 'the Admin Panel (system configuration)',
    };

    const currentPageDesc = pageDescriptions[context.currentPage]
      || `a page at ${context.currentPage}`;

    const roleDesc = context.userRole === 'manager'
      ? 'a Manager with full access to the pipeline, dashboard, and admin panels'
      : 'an Account Manager who creates and manages service requests';

    return `You are DWx Copilot, an AI assistant for the DWx Traffic Manager application — a Microsoft Teams app used by Digital Workplace (DWx) for pre-sales coordination, service request management, and sales funnel tracking.

The user "${context.userName}" is ${roleDesc}. They are currently viewing ${currentPageDesc}.

About DWx Traffic Manager:
- It manages service requests through a sales funnel: Lead → Qualified → Discovery → Proposal → Negotiation → Won/Lost
- Digital Workplace offers 12 service categories: Power Platform, SPFx Development, SharePoint Migration, M365 Assessment, Copilot Agents, MS Viva, Training, Proposal Writing, Tender Response, Ad-Hoc Support, SLA Management, and Strategic Advisory
- Account Managers create service requests for clients, managers assign specialists and oversee the pipeline
- The app includes session preparation with AI-generated content, proposal management, and deal tracking
- Currency is ZAR (South African Rand)

Guidelines:
- Be professional, concise, and helpful
- Keep responses to 2-3 short paragraphs maximum
- Use bullet points for lists
- When explaining app features, reference specific pages or actions the user can take
- If asked about something outside the app's scope, politely redirect to relevant app features`;
  }

  /**
   * Send a message to Azure OpenAI and get a response
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: ChatMessage[],
    context: ChatContext
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Azure OpenAI is not configured. Please set VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY in your environment.');
    }

    const endpoint = config.azureOpenAI.endpoint;
    const apiKey = config.azureOpenAI.apiKey;
    const deploymentName = config.azureOpenAI.deploymentName || 'gpt-4o';
    const apiVersion = config.azureOpenAI.apiVersion || '2024-02-15-preview';

    const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    // Build messages array: system prompt + trimmed history + new user message
    const systemPrompt = this.buildSystemPrompt(context);
    const recentHistory = conversationHistory.slice(-MAX_CHAT_HISTORY);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...recentHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'I was unable to generate a response. Please try again.';
  }
}

export const aiChatService = new AIChatService();
