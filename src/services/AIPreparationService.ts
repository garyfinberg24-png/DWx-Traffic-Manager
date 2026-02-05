/**
 * DWx Traffic Manager - AI Preparation Service
 * Azure OpenAI integration for generating session preparation content
 */

import { config } from '../config/environmentConfig';
import {
  AIGenerationContext,
  AIGenerationResult,
  ClientProfile,
  TalkingPoint,
  SuggestedResource,
  MeetingAgenda,
  AgendaItem,
  TalkingPointCategory,
  ResourceType,
} from '../types/SessionPreparation';

/**
 * Generate a unique ID for items
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Azure OpenAI configuration
 */
interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

/**
 * Get Azure OpenAI configuration from environment
 */
const getAzureOpenAIConfig = (): AzureOpenAIConfig => {
  return {
    endpoint: config.azureOpenAI?.endpoint || '',
    apiKey: config.azureOpenAI?.apiKey || '',
    deploymentName: config.azureOpenAI?.deploymentName || 'gpt-4o',
    apiVersion: config.azureOpenAI?.apiVersion || '2024-02-15-preview',
  };
};

/**
 * Check if Azure OpenAI is configured
 */
export const isAIConfigured = (): boolean => {
  const cfg = getAzureOpenAIConfig();
  return Boolean(cfg.endpoint && cfg.apiKey);
};

/**
 * Call Azure OpenAI API
 */
async function callAzureOpenAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const cfg = getAzureOpenAIConfig();

  if (!cfg.endpoint || !cfg.apiKey) {
    throw new Error('Azure OpenAI is not configured. Please set VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY.');
  }

  const url = `${cfg.endpoint}/openai/deployments/${cfg.deploymentName}/chat/completions?api-version=${cfg.apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': cfg.apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Parse JSON from AI response, handling markdown code blocks
 */
function parseAIJson<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

class AIPreparationService {
  /**
   * Generate all preparation content at once
   */
  async generateAllContent(context: AIGenerationContext): Promise<AIGenerationResult> {
    try {
      // Generate in parallel for speed
      const [clientProfile, talkingPoints, meetingAgenda] = await Promise.all([
        this.generateClientProfile(context),
        this.generateTalkingPoints(context),
        this.generateMeetingAgenda(context),
      ]);

      // Generate resources based on client profile and context
      const suggestedResources = await this.generateSuggestedResources(context, clientProfile);

      return {
        success: true,
        clientProfile,
        talkingPoints,
        suggestedResources,
        meetingAgenda,
      };
    } catch (error) {
      console.error('[AIPreparationService] Failed to generate content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate AI content',
      };
    }
  }

  /**
   * Generate client profile
   */
  async generateClientProfile(context: AIGenerationContext): Promise<ClientProfile> {
    const systemPrompt = `You are a pre-sales consultant assistant. Generate a comprehensive client profile for an upcoming meeting.

Return a JSON object with this exact structure:
{
  "companyOverview": "Brief description of the company and what they do",
  "industry": "Primary industry",
  "companySize": "Employee count range or classification",
  "keyStakeholders": ["Name or role of likely decision makers"],
  "previousEngagements": [], // Leave empty, will be filled from data
  "recentNews": ["Recent news or developments about the company"],
  "potentialPainPoints": ["Likely challenges or needs based on industry and company type"],
  "competitorContext": "Brief overview of competitive landscape"
}

Be concise but informative. Focus on actionable insights for the sales meeting.`;

    const userPrompt = `Generate a client profile for:

Company: ${context.clientName}
Industry: ${context.clientIndustry}
Company Size: ${context.clientSize}
Premium Client: ${context.isPremium ? 'Yes' : 'No'}

Service Being Discussed: ${context.serviceName}
Service Category: ${context.serviceCategory}
Deal Value: R${context.dealValue.toLocaleString()}

Account Manager: ${context.accountManagerName}
Meeting Duration: ${context.meetingDuration} minutes
${context.additionalNotes ? `Additional Context: ${context.additionalNotes}` : ''}

Previous Engagements:
${context.previousEngagements.length > 0
  ? context.previousEngagements.map(e => `- ${e.serviceName}: ${e.outcome} (R${e.value.toLocaleString()})`).join('\n')
  : 'No previous engagements on record'}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.6);
    const parsed = parseAIJson<Omit<ClientProfile, 'previousEngagements' | 'generatedAt'>>(response);

    return {
      ...parsed,
      previousEngagements: context.previousEngagements,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate talking points
   */
  async generateTalkingPoints(context: AIGenerationContext): Promise<TalkingPoint[]> {
    const systemPrompt = `You are a pre-sales consultant assistant. Generate talking points for an upcoming client meeting.

Return a JSON array of talking points with this structure:
[
  {
    "category": "opening" | "discovery" | "value_prop" | "objection" | "closing",
    "content": "The actual talking point text",
    "order": 1
  }
]

Categories:
- opening: Ice breakers and rapport building (2-3 points)
- discovery: Questions to understand their needs (3-4 points)
- value_prop: Key benefits and differentiators (3-4 points)
- objection: Responses to common concerns (2-3 points)
- closing: Next steps and call to action (2-3 points)

Total should be 12-16 talking points. Make them specific to the client and service.`;

    const userPrompt = `Generate talking points for a meeting with:

Client: ${context.clientName}
Industry: ${context.clientIndustry}
Company Size: ${context.clientSize}
Premium Client: ${context.isPremium ? 'Yes' : 'No'}

Service: ${context.serviceName}
Category: ${context.serviceCategory}
Prerequisites: ${context.servicePrerequisites.join(', ') || 'None'}
Engagement Phases: ${context.serviceEngagementPhases.join(', ') || 'Standard'}

Deal Value: R${context.dealValue.toLocaleString()}
Meeting Duration: ${context.meetingDuration} minutes

Previous History:
${context.previousEngagements.length > 0
  ? context.previousEngagements.map(e => `- ${e.serviceName}: ${e.outcome}`).join('\n')
  : 'First engagement with this client'}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);
    const parsed = parseAIJson<Array<{ category: TalkingPointCategory; content: string; order: number }>>(response);

    return parsed.map((point) => ({
      id: generateId(),
      category: point.category,
      content: point.content,
      isCustom: false,
      order: point.order,
    }));
  }

  /**
   * Generate suggested resources
   */
  async generateSuggestedResources(
    context: AIGenerationContext,
    clientProfile: ClientProfile
  ): Promise<SuggestedResource[]> {
    const systemPrompt = `You are a pre-sales consultant assistant. Suggest relevant resources for a client meeting.

Return a JSON array of suggested resources with this structure:
[
  {
    "name": "Resource name",
    "type": "slide_deck" | "case_study" | "datasheet" | "demo_script" | "proposal_template" | "video",
    "relevanceScore": 0-100,
    "reason": "Brief explanation of why this resource is relevant"
  }
]

Suggest 4-6 resources. Be realistic about what types of materials would exist for this service category.
The URL will be filled in later from the document library.`;

    const userPrompt = `Suggest resources for a ${context.serviceName} meeting with ${context.clientName}:

Industry: ${context.clientIndustry}
Company Size: ${context.clientSize}
Service Category: ${context.serviceCategory}
Deal Value: R${context.dealValue.toLocaleString()}

Pain Points Identified:
${clientProfile.potentialPainPoints.join('\n')}

Competitor Context: ${clientProfile.competitorContext}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.6);
    const parsed = parseAIJson<Array<{ name: string; type: ResourceType; relevanceScore: number; reason: string }>>(response);

    return parsed.map((resource) => ({
      id: generateId(),
      name: resource.name,
      type: resource.type,
      url: '', // Will be filled in from document library
      relevanceScore: resource.relevanceScore,
      reason: resource.reason,
      selected: resource.relevanceScore >= 70, // Auto-select high-relevance resources
    }));
  }

  /**
   * Generate meeting agenda
   */
  async generateMeetingAgenda(context: AIGenerationContext): Promise<MeetingAgenda> {
    const systemPrompt = `You are a pre-sales consultant assistant. Generate a meeting agenda.

Return a JSON object with this structure:
{
  "totalDuration": ${context.meetingDuration},
  "items": [
    {
      "title": "Agenda item title",
      "duration": 5,
      "description": "What happens during this segment",
      "order": 1
    }
  ]
}

The total duration of all items should equal ${context.meetingDuration} minutes.
Create 5-8 agenda items appropriate for a ${context.serviceCategory} pre-sales meeting.`;

    const userPrompt = `Create a ${context.meetingDuration}-minute meeting agenda for:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Engagement Phases: ${context.serviceEngagementPhases.join(', ') || 'Discovery, Demo, Q&A'}

This is a ${context.previousEngagements.length > 0 ? 'follow-up' : 'first'} meeting with this client.
Deal Value: R${context.dealValue.toLocaleString()}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.5);
    const parsed = parseAIJson<{ totalDuration: number; items: Array<Omit<AgendaItem, 'id'>> }>(response);

    return {
      totalDuration: parsed.totalDuration,
      items: parsed.items.map((item) => ({
        ...item,
        id: generateId(),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Regenerate a specific section
   */
  async regenerateSection(
    section: 'clientProfile' | 'talkingPoints' | 'suggestedResources' | 'meetingAgenda',
    context: AIGenerationContext,
    existingClientProfile?: ClientProfile
  ): Promise<AIGenerationResult> {
    try {
      switch (section) {
        case 'clientProfile': {
          const clientProfile = await this.generateClientProfile(context);
          return { success: true, clientProfile };
        }
        case 'talkingPoints': {
          const talkingPoints = await this.generateTalkingPoints(context);
          return { success: true, talkingPoints };
        }
        case 'suggestedResources': {
          const profile = existingClientProfile || await this.generateClientProfile(context);
          const suggestedResources = await this.generateSuggestedResources(context, profile);
          return { success: true, suggestedResources };
        }
        case 'meetingAgenda': {
          const meetingAgenda = await this.generateMeetingAgenda(context);
          return { success: true, meetingAgenda };
        }
        default:
          return { success: false, error: 'Invalid section specified' };
      }
    } catch (error) {
      console.error(`[AIPreparationService] Failed to regenerate ${section}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Failed to regenerate ${section}`,
      };
    }
  }

  /**
   * Generate a custom talking point
   */
  async generateCustomTalkingPoint(
    category: TalkingPointCategory,
    context: AIGenerationContext,
    customInstruction: string
  ): Promise<TalkingPoint | null> {
    try {
      const systemPrompt = `You are a pre-sales consultant assistant. Generate a single talking point based on the user's instruction.
Return only the talking point text, no JSON, no quotes, just the text.`;

      const userPrompt = `Generate a ${category} talking point for a meeting with ${context.clientName} about ${context.serviceName}.

Instruction: ${customInstruction}`;

      const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);

      return {
        id: generateId(),
        category,
        content: response.trim(),
        isCustom: true,
        order: 999, // Will be reordered by UI
      };
    } catch (error) {
      console.error('[AIPreparationService] Failed to generate custom talking point:', error);
      return null;
    }
  }

  /**
   * Refine/improve existing talking point
   */
  async refineTalkingPoint(
    point: TalkingPoint,
    context: AIGenerationContext,
    refinementInstruction: string
  ): Promise<TalkingPoint | null> {
    try {
      const systemPrompt = `You are a pre-sales consultant assistant. Refine the given talking point based on the instruction.
Return only the refined talking point text, no JSON, no quotes, just the text.`;

      const userPrompt = `Refine this ${point.category} talking point for a meeting with ${context.clientName}:

Original: "${point.content}"

Instruction: ${refinementInstruction}`;

      const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.6);

      return {
        ...point,
        content: response.trim(),
        isCustom: true,
      };
    } catch (error) {
      console.error('[AIPreparationService] Failed to refine talking point:', error);
      return null;
    }
  }
}

// Export singleton instance
export const aiPreparationService = new AIPreparationService();
