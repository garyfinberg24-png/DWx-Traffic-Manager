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

import {
  ProposalAIContext,
  ProposalAIResult,
  ProposalSectionKey,
  ExecutiveSummary,
  SolutionOverview,
  TechnologyStack,
  ScopeOfWork,
  PricingBreakdown,
  ProposalTimeline,
  TeamComposition,
  ProposalRisk,
} from '../types/Proposal';

import {
  PostMortemAIContext,
  TimelineAnalysis,
  AccountabilityAssessment,
  RootCauseAnalysis,
  PostMortemIssue,
  LessonLearned,
  ActionItem,
} from '../types/PostMortem';

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

  // Normalize endpoint — remove trailing slash to prevent double-slash in URL
  const baseEndpoint = cfg.endpoint.replace(/\/+$/, '');
  const url = `${baseEndpoint}/openai/deployments/${cfg.deploymentName}/chat/completions?api-version=${cfg.apiVersion}`;

  console.log('[AIPreparationService] Calling Azure OpenAI:', url.split('?')[0]);

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
    console.error('[AIPreparationService] API error:', response.status, errorText);
    throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '';
  console.log('[AIPreparationService] Response length:', content.length, 'chars');
  return content;
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

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[AIPreparationService] JSON parse failed. First 200 chars:', cleaned.slice(0, 200));
    throw new Error(`Failed to parse AI response as JSON: ${(err as Error).message}`);
  }
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

  // ==========================================================================
  // Proposal AI Generation
  // ==========================================================================

  /**
   * Generate all proposal sections in parallel
   */
  async generateProposalContent(context: ProposalAIContext): Promise<ProposalAIResult> {
    try {
      console.log('[AIPreparationService] Starting 8 parallel proposal generation calls...');
      const results = await Promise.allSettled([
        this.generateExecutiveSummary(context),
        this.generateSolutionOverview(context),
        this.generateTechStack(context),
        this.generateScopeOfWork(context),
        this.generatePricingEstimate(context),
        this.generateTimeline(context),
        this.generateTeamComposition(context),
        this.generateAssumptionsAndRisks(context),
      ]);

      const sectionNames = ['ExecutiveSummary', 'SolutionOverview', 'TechStack', 'ScopeOfWork', 'Pricing', 'Timeline', 'TeamComposition', 'AssumptionsAndRisks'];
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.error(`[AIPreparationService] ${sectionNames[i]} FAILED:`, r.reason?.message || r.reason);
        } else {
          console.log(`[AIPreparationService] ${sectionNames[i]} OK`);
        }
      });

      const getValue = <T>(result: PromiseSettledResult<T>): T | undefined =>
        result.status === 'fulfilled' ? result.value : undefined;

      const assumptionsAndRisks = getValue(results[7]) as
        | { assumptions: string[]; risks: ProposalRisk[] }
        | undefined;

      const executiveSummary = getValue(results[0]) as ExecutiveSummary | undefined;
      const solutionOverview = getValue(results[1]) as SolutionOverview | undefined;
      const technologyStack = getValue(results[2]) as TechnologyStack | undefined;
      const scopeOfWork = getValue(results[3]) as ScopeOfWork | undefined;
      const pricingBreakdown = getValue(results[4]) as PricingBreakdown | undefined;
      const timeline = getValue(results[5]) as ProposalTimeline | undefined;
      const teamComposition = getValue(results[6]) as TeamComposition | undefined;
      const assumptions = assumptionsAndRisks?.assumptions;
      const risks = assumptionsAndRisks?.risks;

      // Check if at least one section was generated successfully
      const hasAnyContent = executiveSummary || solutionOverview || technologyStack ||
        scopeOfWork || pricingBreakdown || timeline || teamComposition || assumptions || risks;

      if (!hasAnyContent) {
        // Collect error messages from rejected promises
        const errors = results
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map(r => r.reason?.message || String(r.reason));
        const errorSample = errors.length > 0 ? errors[0] : 'Unknown error';
        console.error('[AIPreparationService] All proposal sections failed:', errors);
        return {
          success: false,
          error: `AI generation failed: ${errorSample}`,
        };
      }

      // Log partial failures
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        console.warn(`[AIPreparationService] ${failedCount}/8 proposal sections failed`);
      }

      return {
        success: true,
        executiveSummary,
        solutionOverview,
        technologyStack,
        scopeOfWork,
        pricingBreakdown,
        timeline,
        teamComposition,
        assumptions,
        risks,
      };
    } catch (error) {
      console.error('[AIPreparationService] Failed to generate proposal content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate proposal content',
      };
    }
  }

  /**
   * Generate executive summary for a proposal
   */
  async generateExecutiveSummary(context: ProposalAIContext): Promise<ExecutiveSummary> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "overview": "2-3 paragraph overview of the proposed engagement",
  "objectives": ["3-5 key project objectives"],
  "successCriteria": ["2-4 measurable success criteria/outcomes"]
}

Be professional, concise, and focused on business value.`;

    const userPrompt = `Generate an executive summary for a proposal:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Requirements: ${context.requirements || 'Not specified'}
Discovery Notes: ${context.discoveryNotes || 'Not available'}
Deal Value: R${context.dealValue.toLocaleString()}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);
    return parseAIJson<ExecutiveSummary>(response);
  }

  /**
   * Generate solution overview for a proposal
   */
  async generateSolutionOverview(context: ProposalAIContext): Promise<SolutionOverview> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "description": "2-3 paragraphs describing the proposed solution",
  "approach": "Description of the methodology and approach DW will use",
  "differentiators": ["3-5 reasons why DW is the right partner for this engagement"]
}

Be specific to the service category and Microsoft technology stack.`;

    const userPrompt = `Generate a solution overview for a proposal:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Description: ${context.serviceDescription}
Complexity: ${context.serviceComplexity}
Requirements: ${context.requirements || 'Not specified'}
Discovery Notes: ${context.discoveryNotes || 'Not available'}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);
    return parseAIJson<SolutionOverview>(response);
  }

  /**
   * Generate technology stack recommendation for a proposal
   */
  async generateTechStack(context: ProposalAIContext): Promise<TechnologyStack> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "technologies": [
    { "name": "Technology name", "role": "Role in the solution", "justification": "Why this technology is recommended" }
  ]
}

Include Microsoft technologies relevant to the service category. Recommend 4-8 technologies.`;

    const userPrompt = `Generate a technology stack for a ${context.serviceCategory} proposal:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Description: ${context.serviceDescription}
Complexity: ${context.serviceComplexity}
Requirements: ${context.requirements || 'Not specified'}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);
    return parseAIJson<TechnologyStack>(response);
  }

  /**
   * Generate scope of work for a proposal
   */
  async generateScopeOfWork(context: ProposalAIContext): Promise<ScopeOfWork> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "deliverables": [
    { "title": "Deliverable title", "description": "Brief description", "hours": 16 }
  ],
  "exclusions": ["Items explicitly out of scope"]
}

Include 4-8 deliverables with realistic hour estimates based on the service complexity and duration. Include 3-5 exclusions.`;

    const userPrompt = `Generate a scope of work for a proposal:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Complexity: ${context.serviceComplexity}
Duration: ${context.serviceDuration}
Requirements: ${context.requirements || 'Not specified'}
Discovery Notes: ${context.discoveryNotes || 'Not available'}
Deal Value: R${context.dealValue.toLocaleString()}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);
    return parseAIJson<ScopeOfWork>(response);
  }

  /**
   * Generate pricing estimate for a proposal
   */
  async generatePricingEstimate(context: ProposalAIContext): Promise<PricingBreakdown> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "lineItems": [
    { "description": "Line item description", "quantity": 1, "unitPrice": 10000, "total": 10000 }
  ],
  "subtotal": 100000,
  "tax": 15000,
  "discount": 0,
  "grandTotal": 115000
}

Use ZAR currency. Tax should be 15% VAT. Line items should map to deliverables. Base estimates on the deal value provided.`;

    const userPrompt = `Generate a pricing breakdown for a proposal:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Complexity: ${context.serviceComplexity}
Duration: ${context.serviceDuration}
Deal Value: R${context.dealValue.toLocaleString()}
Proposal Type: ${context.proposalType}
Requirements: ${context.requirements || 'Not specified'}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.5);
    return parseAIJson<PricingBreakdown>(response);
  }

  /**
   * Generate timeline for a proposal
   */
  async generateTimeline(context: ProposalAIContext): Promise<ProposalTimeline> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "phases": [
    { "name": "Phase name", "startWeek": 1, "endWeek": 2, "milestones": ["Milestone 1", "Milestone 2"] }
  ],
  "totalWeeks": 12
}

Align the timeline with the service duration. Include 3-6 phases with realistic milestones.`;

    const userPrompt = `Generate a project timeline for a proposal:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Complexity: ${context.serviceComplexity}
Duration: ${context.serviceDuration}
Requirements: ${context.requirements || 'Not specified'}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.5);
    return parseAIJson<ProposalTimeline>(response);
  }

  /**
   * Generate team composition for a proposal
   */
  async generateTeamComposition(context: ProposalAIContext): Promise<TeamComposition> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "members": [
    { "role": "Team role", "name": "Team member name", "responsibility": "Key responsibilities" }
  ]
}

Include the specialist as lead. Typical roles: Solution Architect, Technical Specialist, Project Manager, Developer. Include 3-6 team members.`;

    const userPrompt = `Generate a team composition for a proposal:

Client: ${context.clientName}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Complexity: ${context.serviceComplexity}
Specialist Lead: ${context.specialistName}
Account Manager: ${context.accountManagerName}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);
    return parseAIJson<TeamComposition>(response);
  }

  /**
   * Generate assumptions and risks for a proposal
   */
  async generateAssumptionsAndRisks(
    context: ProposalAIContext
  ): Promise<{ assumptions: string[]; risks: ProposalRisk[] }> {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. Generate a professional executive summary for a client proposal.

Return a JSON object with this exact structure:
{
  "assumptions": ["5-8 project assumptions"],
  "risks": [
    { "risk": "Risk description", "impact": "High" | "Medium" | "Low", "mitigation": "Mitigation strategy", "likelihood": "High" | "Medium" | "Low" }
  ]
}

Include 5-8 realistic assumptions and 4-6 risks with appropriate impact and likelihood levels.`;

    const userPrompt = `Generate assumptions and risks for a proposal:

Client: ${context.clientName}
Industry: ${context.clientIndustry}
Company Size: ${context.clientSize}
Service: ${context.serviceName}
Category: ${context.serviceCategory}
Complexity: ${context.serviceComplexity}
Duration: ${context.serviceDuration}
Deal Value: R${context.dealValue.toLocaleString()}
Requirements: ${context.requirements || 'Not specified'}`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.7);
    return parseAIJson<{ assumptions: string[]; risks: ProposalRisk[] }>(response);
  }

  /**
   * Regenerate a specific proposal section
   */
  async regenerateProposalSection(
    section: ProposalSectionKey,
    context: ProposalAIContext
  ): Promise<unknown> {
    switch (section) {
      case 'executiveSummary':
        return this.generateExecutiveSummary(context);
      case 'solutionOverview':
        return this.generateSolutionOverview(context);
      case 'technologyStack':
        return this.generateTechStack(context);
      case 'scopeOfWork':
        return this.generateScopeOfWork(context);
      case 'pricingBreakdown':
        return this.generatePricingEstimate(context);
      case 'timeline':
        return this.generateTimeline(context);
      case 'teamComposition':
        return this.generateTeamComposition(context);
      case 'assumptions': {
        const result = await this.generateAssumptionsAndRisks(context);
        return result.assumptions;
      }
      case 'risks': {
        const result = await this.generateAssumptionsAndRisks(context);
        return result.risks;
      }
      default:
        throw new Error(`Unknown proposal section: ${section}`);
    }
  }
}

// Export singleton instance
export const aiPreparationService = new AIPreparationService();

// ============================================================================
// Post-Mortem AI Generation (standalone exported functions)
// ============================================================================

/**
 * Format PostMortemAIContext into a readable summary for AI prompts
 */
function formatPostMortemContext(context: PostMortemAIContext): string {
  const lines: string[] = [];
  lines.push(`Client: ${context.clientName}`);
  lines.push(`Service: ${context.serviceName}`);
  if (context.serviceCategory) {
    lines.push(`Service Category: ${context.serviceCategory}`);
  }
  lines.push(`Deal Outcome: ${context.finalStage}`);
  if (context.winLossReason) {
    lines.push(`Win/Loss Reason: ${context.winLossReason}`);
  }
  if (context.dealValue != null) {
    lines.push(`Deal Value: R${context.dealValue.toLocaleString()} (ZAR)`);
  }
  lines.push(`Account Manager: ${context.accountManagerName}`);
  if (context.specialistName) {
    lines.push(`Specialist: ${context.specialistName}`);
  }
  if (context.totalDurationDays != null) {
    lines.push(`Total Sales Cycle Duration: ${context.totalDurationDays} days`);
  }

  if (context.slaBreakdown.length > 0) {
    lines.push('');
    lines.push('SLA Breakdown by Stage:');
    for (const entry of context.slaBreakdown) {
      const target = entry.targetDays != null ? ` (target: ${entry.targetDays} days)` : '';
      lines.push(`  - ${entry.stage}: ${entry.daysInStage} days${target} — ${entry.status}`);
    }
  }

  if (context.auditLogSummary.length > 0) {
    lines.push('');
    lines.push('Audit Log Summary:');
    for (const entry of context.auditLogSummary) {
      lines.push(`  - ${entry}`);
    }
  }

  if (context.checklistCompletion != null) {
    lines.push(`Checklist Completion: ${context.checklistCompletion}%`);
  }
  if (context.emailCount != null) {
    lines.push(`Emails Sent: ${context.emailCount}`);
  }
  if (context.sessionPrepStatus) {
    lines.push(`Session Prep Status: ${context.sessionPrepStatus}`);
  }
  if (context.proposalStatus) {
    lines.push(`Proposal Status: ${context.proposalStatus}`);
  }

  return lines.join('\n');
}

/**
 * Generate a timeline analysis for a post-mortem
 * Analyses stage durations, SLA compliance, bottlenecks, and overall efficiency
 */
export async function generatePostMortemTimelineAnalysis(
  context: PostMortemAIContext
): Promise<TimelineAnalysis | null> {
  try {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. You analyse sales cycle timelines to identify bottlenecks, SLA breaches, and efficiency improvements.

Return a JSON object with this exact structure:
{
  "totalDuration": 45,
  "stageBreakdown": [
    {
      "stage": "Lead",
      "daysInStage": 5,
      "targetDays": 3,
      "variance": 2,
      "bottleneck": true
    }
  ],
  "criticalPath": ["Lead", "Qualified", "Discovery"],
  "delayFactors": ["Slow response from client during Discovery", "Specialist unavailable for 5 days"],
  "slaBreachCount": 2,
  "efficiency": "Good",
  "summary": "Overall the deal progressed well with minor delays in the Discovery phase..."
}

Valid stages: Lead, Qualified, Discovery, Proposal, Negotiation, Won, Lost.
Efficiency levels: "Excellent" (all within SLA), "Good" (minor delays), "Acceptable" (some breaches), "Poor" (multiple breaches).
variance = daysInStage - targetDays (positive means over target).
bottleneck = true if the stage took significantly longer than target.
Only include stages the deal actually passed through.`;

    const contextSummary = formatPostMortemContext(context);

    const userPrompt = `Analyse the sales cycle timeline for this completed deal and identify bottlenecks and efficiency issues:

${contextSummary}

Provide a thorough timeline analysis based on the SLA breakdown and audit log data above.`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.3);
    return parseAIJson<TimelineAnalysis>(response);
  } catch (error) {
    console.error('[AIPreparationService] Failed to generate post-mortem timeline analysis:', error);
    return null;
  }
}

/**
 * Generate an accountability assessment for a post-mortem
 * Evaluates AM, specialist, and client performance with balanced scoring
 */
export async function generateAccountabilityAssessment(
  context: PostMortemAIContext
): Promise<AccountabilityAssessment | null> {
  try {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. You provide fair, balanced performance assessments and accountability attribution for completed deals.

Return a JSON object with this exact structure:
{
  "amAccountability": {
    "score": 75,
    "strengths": ["Maintained regular client communication", "Quick response to qualification"],
    "improvementAreas": ["Could have escalated pricing concerns earlier"],
    "specificIssues": ["3-day gap between Discovery and Proposal follow-up"]
  },
  "specialistAccountability": {
    "score": 85,
    "strengths": ["Thorough session preparation", "Strong technical demo"],
    "improvementAreas": ["Documentation could be more detailed"],
    "specificIssues": []
  },
  "clientFactors": {
    "score": 60,
    "positiveFactors": ["Clear requirements", "Engaged decision maker"],
    "challenges": ["Delayed feedback on proposal", "Budget approval process"]
  },
  "systemGaps": ["No automated follow-up reminders configured", "SLA alerts not triggered"],
  "overallAssessment": "The deal was managed competently with some areas for improvement..."
}

Scores are 0-100 where 100 is perfect performance. Be fair and constructive.
For Won deals, focus on what went well and what could be replicated.
For Lost deals, focus on lessons without blame.`;

    const contextSummary = formatPostMortemContext(context);

    const userPrompt = `Provide a balanced accountability assessment for this ${context.finalStage === 'Won' ? 'won' : 'lost'} deal${context.winLossReason ? ` (reason: "${context.winLossReason}")` : ''}:

${contextSummary}

Assess each party's contribution fairly. Consider responsiveness, preparation quality, communication, and process adherence.`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.5);
    return parseAIJson<AccountabilityAssessment>(response);
  } catch (error) {
    console.error('[AIPreparationService] Failed to generate accountability assessment:', error);
    return null;
  }
}

/**
 * Generate a root cause analysis for a post-mortem
 * Identifies the primary cause, contributing factors, and preventability
 */
export async function generateRootCauseAnalysis(
  context: PostMortemAIContext
): Promise<RootCauseAnalysis | null> {
  try {
    const systemPrompt = `You are a root cause analysis expert at Digital Workplace (DW), a Microsoft consulting firm in South Africa. You identify underlying causes behind deal outcomes, not just symptoms.

Return a JSON object with this exact structure:
{
  "primaryCause": "The primary underlying reason this deal was won/lost",
  "contributingFactors": [
    "Contributing factor 1 - how it influenced the outcome",
    "Contributing factor 2 - how it influenced the outcome",
    "Contributing factor 3 - how it influenced the outcome"
  ],
  "preventability": "Somewhat Preventable",
  "recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    "Specific, actionable recommendation 3"
  ]
}

preventability must be one of: "Highly Preventable", "Somewhat Preventable", "Unavoidable".
For Won deals, identify what drove the win and how to replicate it.
For Lost deals, identify root causes and how to prevent recurrence.
Include 3-5 contributing factors and 3-5 recommendations. Be specific, not generic.`;

    const contextSummary = formatPostMortemContext(context);

    const userPrompt = `Perform a root cause analysis for this ${context.finalStage === 'Won' ? 'won' : 'lost'} deal${context.winLossReason ? ` (stated reason: "${context.winLossReason}")` : ''}:

${contextSummary}

Go beyond the stated reason. Identify the underlying root cause and contributing factors based on the timeline, audit log, and process data above.`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.4);
    return parseAIJson<RootCauseAnalysis>(response);
  } catch (error) {
    console.error('[AIPreparationService] Failed to generate root cause analysis:', error);
    return null;
  }
}

/**
 * Suggest issues identified during a deal for the post-mortem
 * Returns 3-8 categorised issues with severity and ownership attribution
 */
export async function suggestPostMortemIssues(
  context: PostMortemAIContext
): Promise<PostMortemIssue[]> {
  try {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. You identify issues and blockers in completed deals to drive process improvement.

Return a JSON array of 3-8 issues with this structure:
[
  {
    "category": "Process",
    "severity": "Major",
    "owner": "Account Manager",
    "description": "Clear description of the issue that occurred",
    "impact": "How this issue affected the deal outcome"
  }
]

Valid categories: "Communication", "Process", "Technical", "Commercial", "Client-Side", "Resource", "Documentation".
Valid severities: "Minor", "Moderate", "Major", "Critical".
Valid owners: "Account Manager", "Specialist", "Management", "Client", "System".

For Won deals, include issues that occurred even though the deal was won — these represent risks that could cause future losses.
For Lost deals, focus on the issues that contributed to the loss.
Be specific and evidence-based, drawing from the audit log and SLA data.`;

    const contextSummary = formatPostMortemContext(context);

    const userPrompt = `Identify 3-8 issues from this ${context.finalStage === 'Won' ? 'won' : 'lost'} deal${context.winLossReason ? ` (reason: "${context.winLossReason}")` : ''}:

${contextSummary}

Identify issues across communication, process, technical, commercial, client-side, resource, and documentation areas. Each issue should be specific to this deal, not generic.`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.6);
    const parsed = parseAIJson<Array<{
      category: PostMortemIssue['category'];
      severity: PostMortemIssue['severity'];
      owner: PostMortemIssue['owner'];
      description: string;
      impact: string;
    }>>(response);

    return parsed.map((issue) => ({
      id: generateId(),
      category: issue.category,
      severity: issue.severity,
      owner: issue.owner,
      description: issue.description,
      impact: issue.impact,
      aiGenerated: true,
    }));
  } catch (error) {
    console.error('[AIPreparationService] Failed to suggest post-mortem issues:', error);
    return [];
  }
}

/**
 * Suggest lessons learned from a completed deal
 * Returns 3-6 typed lessons with context and applicability
 */
export async function suggestPostMortemLessons(
  context: PostMortemAIContext
): Promise<LessonLearned[]> {
  try {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. You extract actionable lessons from completed deals.

Return a JSON array of 3-6 lessons with this structure:
[
  {
    "type": "Process Improvement",
    "lesson": "The key insight or lesson learned",
    "context": "What was happening in this deal that led to this lesson"
  }
]

Valid types: "Process Improvement", "Best Practice", "Pitfall to Avoid", "Client Management", "Technical Learning".

For Won deals, focus on best practices worth replicating and process improvements that could make future wins easier.
For Lost deals, focus on pitfalls to avoid and process improvements that could prevent similar losses.
Make lessons specific and actionable, not generic platitudes.`;

    const contextSummary = formatPostMortemContext(context);

    const userPrompt = `Extract 3-6 actionable lessons from this ${context.finalStage === 'Won' ? 'won' : 'lost'} deal${context.winLossReason ? ` (reason: "${context.winLossReason}")` : ''}:

${contextSummary}

Focus on lessons that would be valuable for future deals in similar situations. Each lesson should be specific enough to be actionable.`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.6);
    const parsed = parseAIJson<Array<{
      type: LessonLearned['type'];
      lesson: string;
      context: string;
    }>>(response);

    return parsed.map((lesson) => ({
      id: generateId(),
      type: lesson.type,
      lesson: lesson.lesson,
      context: lesson.context,
      applicability: context.serviceCategory ? [context.serviceCategory] : [],
      aiGenerated: true,
    }));
  } catch (error) {
    console.error('[AIPreparationService] Failed to suggest post-mortem lessons:', error);
    return [];
  }
}

/**
 * Suggest action items to prevent similar issues in future deals
 * Returns 3-6 prioritised, categorised action items
 */
export async function suggestPostMortemActionItems(
  context: PostMortemAIContext
): Promise<ActionItem[]> {
  try {
    const systemPrompt = `You are a senior business consultant at Digital Workplace (DW), a Microsoft consulting firm in South Africa. You recommend concrete, actionable improvements from deal post-mortems.

Return a JSON array of 3-6 action items with this structure:
[
  {
    "title": "Short action item title",
    "description": "Detailed description of what needs to be done and why",
    "priority": "High",
    "category": "Process"
  }
]

Valid priorities: "Low", "Medium", "High", "Urgent".
Valid categories: "Process", "System", "Training", "Documentation", "Template".

Action items should be:
- Specific and measurable (not vague)
- Assigned to a clear category
- Prioritised based on potential impact
- Focused on preventing recurrence of identified issues
For Won deals, focus on scaling what worked. For Lost deals, focus on fixing what broke.`;

    const contextSummary = formatPostMortemContext(context);

    const userPrompt = `Recommend 3-6 concrete action items based on this ${context.finalStage === 'Won' ? 'won' : 'lost'} deal${context.winLossReason ? ` (reason: "${context.winLossReason}")` : ''}:

${contextSummary}

Each action item should address a specific gap or opportunity identified in this deal. Prioritise items that would have the most impact on future deal outcomes.`;

    const response = await callAzureOpenAI(systemPrompt, userPrompt, 0.6);
    const parsed = parseAIJson<Array<{
      title: string;
      description: string;
      priority: ActionItem['priority'];
      category: ActionItem['category'];
    }>>(response);

    return parsed.map((item) => ({
      id: generateId(),
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: 'Open' as const,
      category: item.category,
      aiGenerated: true,
    }));
  } catch (error) {
    console.error('[AIPreparationService] Failed to suggest post-mortem action items:', error);
    return [];
  }
}
