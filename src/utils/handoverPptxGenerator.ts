/**
 * DWx Traffic Manager - Handover PowerPoint Deck Generator
 * Generates a DW-branded 15-slide PPTX presentation from delivery handover data.
 * Uses PptxGenJS for client-side generation.
 * v2.16.0
 */
import PptxGenJS from 'pptxgenjs';
import type { DeliveryHandover, SignOffStatus } from '../types/DeliveryHandover';
import type { ServiceRequest } from '../types/ServiceRequest';
import type { Proposal } from '../types/Proposal';

// ============================================================================
// Brand Constants
// ============================================================================

const DWX_BLUE = '1a5a8a';
const DWX_TEAL = '1e6b7b';
const DWX_WHITE = 'FFFFFF';
const DWX_DARK = '1e293b';
const DWX_LIGHT_BG = 'f1f5f9';
const DWX_GREEN = '107c10';
const DWX_AMBER = 'f59e0b';
const DWX_RED = 'd13438';
const FONT = 'Segoe UI';

// ============================================================================
// Context Interface
// ============================================================================

export interface HandoverPptxContext {
  handover: DeliveryHandover;
  request: ServiceRequest;
  proposal?: Proposal | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function addSlideHeader(slide: PptxGenJS.Slide, title: string) {
  // Blue header bar
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.8,
    fill: { color: DWX_BLUE },
  });
  // Title text
  slide.addText(title, {
    x: 0.5,
    y: 0.1,
    w: 9,
    h: 0.6,
    fontSize: 24,
    fontFace: FONT,
    color: DWX_WHITE,
    bold: true,
  });
}

function addFooter(slide: PptxGenJS.Slide, pageNum: number) {
  // Footer bar
  slide.addShape('rect', {
    x: 0,
    y: 7.0,
    w: '100%',
    h: 0.5,
    fill: { color: DWX_TEAL },
  });
  // Left text
  slide.addText('DWx Traffic Manager | Digital Workplace', {
    x: 0.5,
    y: 7.05,
    w: 6,
    h: 0.4,
    fontSize: 9,
    fontFace: FONT,
    color: DWX_WHITE,
  });
  // Page number
  slide.addText(`${pageNum}`, {
    x: 8.5,
    y: 7.05,
    w: 1,
    h: 0.4,
    fontSize: 9,
    fontFace: FONT,
    color: DWX_WHITE,
    align: 'right',
  });
}

type TableRow = Array<{ text: string; options?: PptxGenJS.TableCellProps }>;

function addBrandedTable(
  slide: PptxGenJS.Slide,
  headers: string[],
  rows: string[][],
  startY: number,
  options?: { colW?: number[] }
) {
  const headerRow: TableRow = headers.map((h) => ({
    text: h,
    options: {
      bold: true,
      fontSize: 10,
      fontFace: FONT,
      color: DWX_WHITE,
      fill: { color: DWX_TEAL },
      border: { type: 'solid', color: DWX_TEAL, pt: 0.5 },
      valign: 'middle',
      margin: [3, 5, 3, 5],
    } as PptxGenJS.TableCellProps,
  }));

  const dataRows: TableRow[] = rows.map((row, rowIdx) =>
    row.map((cell) => ({
      text: cell,
      options: {
        fontSize: 9,
        fontFace: FONT,
        color: DWX_DARK,
        fill: { color: rowIdx % 2 === 0 ? DWX_WHITE : DWX_LIGHT_BG },
        border: { type: 'solid', color: 'e2e8f0', pt: 0.5 },
        valign: 'top',
        margin: [3, 5, 3, 5],
      } as PptxGenJS.TableCellProps,
    }))
  );

  const tableData = [headerRow, ...dataRows];

  slide.addTable(tableData, {
    x: 0.5,
    y: startY,
    w: 9,
    colW: options?.colW,
    fontSize: 9,
    fontFace: FONT,
    autoPage: true,
    autoPageRepeatHeader: true,
  });
}

function addBulletList(
  slide: PptxGenJS.Slide,
  items: string[],
  startY: number,
  options?: { fontSize?: number; maxItems?: number }
) {
  const fontSize = options?.fontSize || 11;
  const maxItems = options?.maxItems || 12;
  const displayItems = items.slice(0, maxItems);

  const textItems = displayItems.map((item) => ({
    text: item,
    options: {
      fontSize,
      fontFace: FONT,
      color: DWX_DARK,
      bullet: { type: 'bullet' as const },
      paraSpaceAfter: 6,
    },
  }));

  slide.addText(textItems, {
    x: 0.5,
    y: startY,
    w: 9,
    h: 5.5 - startY + 1,
    valign: 'top',
  });
}

function addSectionTitle(slide: PptxGenJS.Slide, title: string, y: number) {
  slide.addText(title, {
    x: 0.5,
    y,
    w: 9,
    h: 0.35,
    fontSize: 13,
    fontFace: FONT,
    color: DWX_BLUE,
    bold: true,
  });
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'TBD';
  try {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number | undefined): string {
  if (!value) return 'TBD';
  return `R ${value.toLocaleString('en-ZA')}`;
}

// ============================================================================
// Slide Renderers
// ============================================================================

function addTitleSlide(pptx: PptxGenJS, ctx: HandoverPptxContext) {
  const slide = pptx.addSlide();
  const { handover } = ctx;

  // Full background
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
    fill: { color: DWX_BLUE },
  });

  // Accent teal bar at bottom
  slide.addShape('rect', {
    x: 0,
    y: 6.5,
    w: '100%',
    h: 1.0,
    fill: { color: DWX_TEAL },
  });

  // Title
  slide.addText('Delivery Handover', {
    x: 0.8,
    y: 1.2,
    w: 8.4,
    h: 0.6,
    fontSize: 16,
    fontFace: FONT,
    color: DWX_WHITE,
    charSpacing: 4,
  });

  // Client name
  slide.addText(handover.ClientName, {
    x: 0.8,
    y: 2.0,
    w: 8.4,
    h: 1.0,
    fontSize: 36,
    fontFace: FONT,
    color: DWX_WHITE,
    bold: true,
  });

  // Service / Project name
  slide.addText(handover.ServiceName + (handover.ProjectName !== handover.ServiceName ? ` | ${handover.ProjectName}` : ''), {
    x: 0.8,
    y: 3.0,
    w: 8.4,
    h: 0.6,
    fontSize: 18,
    fontFace: FONT,
    color: DWX_WHITE,
  });

  // Separator line
  slide.addShape('rect', {
    x: 0.8,
    y: 3.8,
    w: 2.5,
    h: 0.04,
    fill: { color: DWX_WHITE },
  });

  // Key details
  const details = [
    `Contract Value: ${formatCurrency(handover.ContractValue)}`,
    `Won Date: ${formatDate(handover.WonDate)}`,
    `Category: ${handover.ServiceCategory}`,
    `Status: ${handover.HandoverStatus}`,
  ].join('  |  ');

  slide.addText(details, {
    x: 0.8,
    y: 4.2,
    w: 8.4,
    h: 0.4,
    fontSize: 11,
    fontFace: FONT,
    color: DWX_WHITE,
  });

  // Account Manager
  slide.addText(`Account Manager: ${handover.AccountManagerName}`, {
    x: 0.8,
    y: 4.8,
    w: 8.4,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: DWX_WHITE,
  });

  // Pre-sales specialist
  if (handover.PreSalesSpecialistName) {
    slide.addText(`Pre-Sales Specialist: ${handover.PreSalesSpecialistName}`, {
      x: 0.8,
      y: 5.1,
      w: 8.4,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT,
      color: DWX_WHITE,
    });
  }

  // Footer text
  slide.addText('DWx Traffic Manager | Digital Workplace', {
    x: 0.8,
    y: 6.65,
    w: 5,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: DWX_WHITE,
  });

  slide.addText(formatDate(new Date().toISOString()), {
    x: 6.5,
    y: 6.65,
    w: 3,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: DWX_WHITE,
    align: 'right',
  });
}

function addExecutiveSummarySlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  const { handover, request } = ctx;
  addSlideHeader(slide, 'Executive Summary');
  addFooter(slide, pageNum);

  const brief = handover.ClientBrief;
  const scope = handover.ScopeSnapshot;

  // Summary text
  const summaryText = brief?.executiveSummary || request.Requirements || 'No executive summary available.';
  slide.addText(summaryText, {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 1.5,
    fontSize: 11,
    fontFace: FONT,
    color: DWX_DARK,
    valign: 'top',
  });

  // Key info grid
  const infoY = 2.8;
  addSectionTitle(slide, 'Key Details', infoY);

  const keyDetails = [
    ['Client', handover.ClientName],
    ['Service', handover.ServiceName],
    ['Category', handover.ServiceCategory],
    ['Contract Value', formatCurrency(handover.ContractValue)],
    ['Total Hours', scope ? `${scope.totalHours} hrs` : 'TBD'],
    ['Total Weeks', scope ? `${scope.totalWeeks} weeks` : 'TBD'],
    ['Pricing Model', scope?.pricingModel || 'TBD'],
    ['Planned Kickoff', formatDate(handover.PlannedKickoffDate)],
  ];

  addBrandedTable(slide, ['Item', 'Detail'], keyDetails, infoY + 0.4, { colW: [2.5, 6.5] });
}

function addScopeOfWorkSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Scope of Work');
  addFooter(slide, pageNum);

  const scope = ctx.handover.ScopeSnapshot;

  if (!scope || scope.deliverables.length === 0) {
    slide.addText('Scope of work details will be populated from the approved proposal.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
    return;
  }

  // Deliverables table
  addSectionTitle(slide, 'Deliverables', 1.1);
  const deliverableRows = scope.deliverables.map((d) => [
    d.title,
    d.description,
    `${d.hours} hrs`,
  ]);
  addBrandedTable(slide, ['Deliverable', 'Description', 'Hours'], deliverableRows, 1.5, {
    colW: [2.5, 5, 1.5],
  });

  // Exclusions
  if (scope.exclusions.length > 0) {
    const exclY = 1.5 + 0.35 + deliverableRows.length * 0.35 + 0.4;
    if (exclY < 5.5) {
      addSectionTitle(slide, 'Exclusions', exclY);
      addBulletList(slide, scope.exclusions, exclY + 0.35, { fontSize: 10 });
    }
  }
}

function addTechStackSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Technology Stack');
  addFooter(slide, pageNum);

  const scope = ctx.handover.ScopeSnapshot;

  if (!scope || scope.technologies.length === 0) {
    slide.addText('Technology stack will be defined during project planning.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
    return;
  }

  const techRows = scope.technologies.map((t) => [t.name, t.role]);
  addBrandedTable(slide, ['Technology', 'Role'], techRows, 1.1, { colW: [3, 6] });
}

function addDeliveryTeamSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Delivery Team');
  addFooter(slide, pageNum);

  const team = ctx.handover.DeliveryTeam;

  if (!team || team.length === 0) {
    slide.addText('Delivery team assignments are pending.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
    return;
  }

  const teamRows = team.map((t) => [
    t.resourceName,
    t.role,
    t.resourceEmail,
    `${t.allocationPercent}%`,
    `${formatDate(t.startDate)} - ${formatDate(t.endDate)}`,
    t.isConfirmed ? 'Yes' : 'No',
  ]);

  addBrandedTable(
    slide,
    ['Name', 'Role', 'Email', 'Allocation', 'Period', 'Confirmed'],
    teamRows,
    1.1,
    { colW: [1.8, 1.5, 2.2, 0.8, 1.7, 1] }
  );
}

function addStakeholdersSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Key Stakeholders');
  addFooter(slide, pageNum);

  const brief = ctx.handover.ClientBrief;
  const { request, handover } = ctx;

  // Pre-sales contacts
  addSectionTitle(slide, 'Pre-Sales Team', 1.1);
  const preSalesRows: string[][] = [
    ['Account Manager', handover.AccountManagerName, handover.AccountManagerEmail],
  ];
  if (handover.PreSalesSpecialistName) {
    preSalesRows.push(['Pre-Sales Specialist', handover.PreSalesSpecialistName, handover.PreSalesSpecialistEmail || '']);
  }
  addBrandedTable(slide, ['Role', 'Name', 'Email'], preSalesRows, 1.45, { colW: [2.5, 3, 3.5] });

  // Client contacts
  const clientStartY = 1.45 + 0.35 + preSalesRows.length * 0.35 + 0.4;
  addSectionTitle(slide, 'Client Contacts', clientStartY);

  if (brief && brief.keyStakeholders.length > 0) {
    const stakeholderRows = brief.keyStakeholders.map((s) => [
      s.name,
      s.role,
      s.relationship,
      s.notes || '',
    ]);
    addBrandedTable(
      slide,
      ['Name', 'Role', 'Relationship', 'Notes'],
      stakeholderRows,
      clientStartY + 0.35,
      { colW: [2, 2, 2, 3] }
    );
  } else {
    // Fallback to request contact info
    const contactRows: string[][] = [];
    if (request.ContactName) {
      contactRows.push(['Primary Contact', request.ContactName, request.ContactEmail || '']);
    }
    addBrandedTable(slide, ['Role', 'Name', 'Email'], contactRows.length > 0 ? contactRows : [['TBD', '', '']], clientStartY + 0.35, { colW: [2.5, 3, 3.5] });
  }

  // Communication preferences
  if (brief?.communicationPreferences) {
    const commY = clientStartY + 2;
    if (commY < 5.8) {
      addSectionTitle(slide, 'Communication Preferences', commY);
      slide.addText(brief.communicationPreferences, {
        x: 0.5,
        y: commY + 0.35,
        w: 9,
        h: 0.8,
        fontSize: 10,
        fontFace: FONT,
        color: DWX_DARK,
      });
    }
  }
}

function addTimelineSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Timeline & Milestones');
  addFooter(slide, pageNum);

  const scope = ctx.handover.ScopeSnapshot;
  const { handover } = ctx;

  // Key dates summary
  addSectionTitle(slide, 'Key Dates', 1.1);
  const dateRows = [
    ['Won Date', formatDate(handover.WonDate)],
    ['Handover Meeting', formatDate(handover.HandoverMeetingDate)],
    ['Planned Kickoff', formatDate(handover.PlannedKickoffDate)],
    ['Planned Go-Live', formatDate(handover.PlannedGoLive)],
  ];
  addBrandedTable(slide, ['Milestone', 'Date'], dateRows, 1.45, { colW: [3, 6] });

  // Timeline phases
  if (scope && scope.timeline.length > 0) {
    const phaseY = 1.45 + 0.35 + dateRows.length * 0.35 + 0.4;
    addSectionTitle(slide, 'Project Phases', phaseY);

    const phaseRows = scope.timeline.map((p) => [
      p.name,
      `Week ${p.startWeek}`,
      `Week ${p.endWeek}`,
      `${p.endWeek - p.startWeek + 1} weeks`,
      p.milestones.join(', ') || '-',
    ]);
    addBrandedTable(
      slide,
      ['Phase', 'Start', 'End', 'Duration', 'Milestones'],
      phaseRows,
      phaseY + 0.35,
      { colW: [2, 1, 1, 1, 4] }
    );
  }
}

function addRisksSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Risks & Assumptions');
  addFooter(slide, pageNum);

  const items = ctx.handover.RisksAndAssumptions;
  const risks = items.filter((i) => i.type === 'Risk');
  const assumptions = items.filter((i) => i.type === 'Assumption');

  if (risks.length > 0) {
    addSectionTitle(slide, 'Risks', 1.1);
    const riskRows = risks.map((r) => [r.description, r.impact, r.mitigation, r.owner]);
    addBrandedTable(
      slide,
      ['Risk', 'Impact', 'Mitigation', 'Owner'],
      riskRows,
      1.45,
      { colW: [3, 1, 3.5, 1.5] }
    );
  }

  if (assumptions.length > 0) {
    const assY = risks.length > 0 ? 1.45 + 0.35 + risks.length * 0.35 + 0.4 : 1.1;
    addSectionTitle(slide, 'Assumptions', assY);
    addBulletList(slide, assumptions.map((a) => a.description), assY + 0.35, { fontSize: 10 });
  }

  if (items.length === 0) {
    slide.addText('Risks and assumptions will be populated during handover planning.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
  }
}

function addSuccessFactorsSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Critical Success Factors');
  addFooter(slide, pageNum);

  const brief = ctx.handover.ClientBrief;
  const factors = brief?.criticalSuccessFactors || [];

  if (factors.length > 0) {
    addBulletList(slide, factors, 1.2, { fontSize: 13 });
  } else {
    slide.addText('Critical success factors will be identified during the handover process.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
  }

  // Win reason context
  if (brief?.winReason) {
    const winY = factors.length > 0 ? Math.min(1.2 + factors.length * 0.45 + 0.5, 5.0) : 3.5;
    addSectionTitle(slide, 'Why We Won', winY);
    slide.addText(brief.winReason, {
      x: 0.5,
      y: winY + 0.35,
      w: 9,
      h: 1.0,
      fontSize: 11,
      fontFace: FONT,
      color: DWX_DARK,
    });
  }
}

function addProjectPlanSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Project Plan');
  addFooter(slide, pageNum);

  const plan = ctx.handover.ProjectPlan;

  if (!plan || plan.phases.length === 0) {
    slide.addText('Project plan will be generated using AI during the handover process.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
    return;
  }

  // Summary bar
  const summaryText = `${plan.totalWeeks} weeks  |  ${plan.totalHours} hours  |  ${plan.phases.length} phases  |  ${plan.riskBuffer}% risk buffer`;
  slide.addText(summaryText, {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 0.35,
    fontSize: 12,
    fontFace: FONT,
    color: DWX_TEAL,
    bold: true,
  });

  // Phase timeline table
  addSectionTitle(slide, 'Phase Timeline', 1.6);
  const phaseRows = plan.phases.map((p) => {
    const taskCount = p.tasks?.length || 0;
    const phaseHours = p.tasks?.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) || 0;
    return [
      p.name,
      p.description.length > 60 ? p.description.substring(0, 57) + '...' : p.description,
      `Wk ${p.startWeek}-${p.endWeek}`,
      `${taskCount} tasks`,
      `${phaseHours}h`,
    ];
  });
  addBrandedTable(
    slide,
    ['Phase', 'Description', 'Weeks', 'Tasks', 'Effort'],
    phaseRows,
    1.95,
    { colW: [1.8, 3.5, 1, 1, 0.7] }
  );

  // Resource allocation (if fits on same slide)
  if (plan.resourceAllocation.length > 0) {
    const resY = 1.95 + 0.35 + phaseRows.length * 0.35 + 0.4;
    if (resY < 5.2) {
      addSectionTitle(slide, 'Resource Allocation', resY);
      const resRows = plan.resourceAllocation.map((r) => [
        r.role,
        r.name,
        `${r.totalHours}h`,
        r.phases.join(', '),
      ]);
      addBrandedTable(
        slide,
        ['Role', 'Name', 'Hours', 'Phases'],
        resRows,
        resY + 0.35,
        { colW: [2, 2, 1, 4] }
      );
    }
  }
}

function addEnvironmentSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Environment Setup');
  addFooter(slide, pageNum);

  const env = ctx.handover.EnvironmentSetup;

  if (!env) {
    slide.addText('Environment setup details will be documented during project initiation.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
    return;
  }

  // Environments table
  if (env.environments.length > 0) {
    addSectionTitle(slide, 'Environments', 1.1);
    const envRows = env.environments.map((e) => [e.name, e.url || '-', e.status, e.notes || '-']);
    addBrandedTable(slide, ['Environment', 'URL', 'Status', 'Notes'], envRows, 1.45, {
      colW: [1.5, 3.5, 1.5, 2.5],
    });
  }

  // Access requirements
  if (env.accessRequirements.length > 0) {
    const accY = env.environments.length > 0
      ? 1.45 + 0.35 + env.environments.length * 0.35 + 0.4
      : 1.1;
    addSectionTitle(slide, 'Access Requirements', accY);
    addBulletList(slide, env.accessRequirements, accY + 0.35, { fontSize: 10 });
  }

  // Tooling
  if (env.tooling.length > 0) {
    const toolY = 5.0;
    addSectionTitle(slide, 'Tooling & Infrastructure', toolY);
    const toolText = env.tooling.join('  |  ');
    slide.addText(toolText, {
      x: 0.5,
      y: toolY + 0.35,
      w: 9,
      h: 0.4,
      fontSize: 10,
      fontFace: FONT,
      color: DWX_DARK,
    });
  }

  // Repository + CI/CD
  if (env.repositoryUrl || env.cicdPipeline) {
    const repoY = 5.8;
    const repoItems: string[] = [];
    if (env.repositoryUrl) repoItems.push(`Repository: ${env.repositoryUrl}`);
    if (env.cicdPipeline) repoItems.push(`CI/CD: ${env.cicdPipeline}`);
    slide.addText(repoItems.join('    |    '), {
      x: 0.5,
      y: repoY,
      w: 9,
      h: 0.3,
      fontSize: 9,
      fontFace: FONT,
      color: '64748b',
    });
  }
}

function addChecklistSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Handover Checklist');
  addFooter(slide, pageNum);

  const checklist = ctx.handover.HandoverChecklist;

  if (!checklist || checklist.length === 0) {
    slide.addText('Handover checklist will be generated when the handover process begins.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
    return;
  }

  // Completion summary
  const completed = checklist.filter((i) => i.isCompleted).length;
  const total = checklist.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const summaryColor = pct === 100 ? DWX_GREEN : pct >= 50 ? DWX_AMBER : DWX_RED;

  slide.addText(`${completed}/${total} items completed (${pct}%)`, {
    x: 0.5,
    y: 1.1,
    w: 9,
    h: 0.35,
    fontSize: 12,
    fontFace: FONT,
    color: summaryColor,
    bold: true,
  });

  // Checklist table
  const checklistRows = checklist.slice(0, 15).map((item) => [
    item.isCompleted ? '\u2713' : '\u2717',
    item.category,
    item.description,
    item.isRequired ? 'Required' : 'Optional',
  ]);

  addBrandedTable(
    slide,
    ['', 'Category', 'Item', 'Priority'],
    checklistRows,
    1.55,
    { colW: [0.5, 1.8, 5.5, 1.2] }
  );
}

function addContactSheetSlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Contact Sheet');
  addFooter(slide, pageNum);

  const { handover, request } = ctx;

  // DWx Pre-Sales Team
  addSectionTitle(slide, 'DWx Pre-Sales Team', 1.1);
  const preSalesContacts: string[][] = [
    ['Account Manager', handover.AccountManagerName, handover.AccountManagerEmail],
  ];
  if (handover.PreSalesSpecialistName) {
    preSalesContacts.push(['Pre-Sales Specialist', handover.PreSalesSpecialistName, handover.PreSalesSpecialistEmail || '']);
  }
  addBrandedTable(slide, ['Role', 'Name', 'Email'], preSalesContacts, 1.45, { colW: [2.5, 3, 3.5] });

  // DWx Delivery Team
  const delY = 1.45 + 0.35 + preSalesContacts.length * 0.35 + 0.4;
  addSectionTitle(slide, 'DWx Delivery Team', delY);

  const deliveryContacts: string[][] = [];
  if (handover.DeliveryManagerName) {
    deliveryContacts.push(['Delivery Manager', handover.DeliveryManagerName, handover.DeliveryManagerEmail || '']);
  }
  if (handover.ProjectManagerName) {
    deliveryContacts.push(['Project Manager', handover.ProjectManagerName, handover.ProjectManagerEmail || '']);
  }
  // Add assigned team members
  if (handover.DeliveryTeam.length > 0) {
    handover.DeliveryTeam.forEach((t) => {
      deliveryContacts.push([t.role, t.resourceName, t.resourceEmail]);
    });
  }

  if (deliveryContacts.length > 0) {
    addBrandedTable(slide, ['Role', 'Name', 'Email'], deliveryContacts, delY + 0.35, { colW: [2.5, 3, 3.5] });
  } else {
    slide.addText('Delivery team pending assignment', {
      x: 0.5,
      y: delY + 0.35,
      w: 9,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT,
      color: '94a3b8',
    });
  }

  // Client contacts
  const clientY = delY + 0.35 + Math.max(deliveryContacts.length, 1) * 0.35 + 0.5;
  if (clientY < 5.5) {
    addSectionTitle(slide, 'Client Contacts', clientY);
    const clientContacts: string[][] = [];
    if (request.ContactName) {
      clientContacts.push(['Primary Contact', request.ContactName, request.ContactEmail || '']);
    }
    if (clientContacts.length > 0) {
      addBrandedTable(slide, ['Role', 'Name', 'Email'], clientContacts, clientY + 0.35, { colW: [2.5, 3, 3.5] });
    }
  }
}

// ============================================================================
// Slide: Acceptance Summary (v2.17.0)
// ============================================================================

const SIGNOFF_STATUS_PPTX_COLORS: Record<SignOffStatus, string> = {
  'Pending': '94a3b8',
  'Submitted': 'f59e0b',
  'Approved': '107c10',
  'Rejected': 'd13438',
  'Resubmitted': '8b5cf6',
};

function addAcceptanceSummarySlide(pptx: PptxGenJS, ctx: HandoverPptxContext, pageNum: number) {
  const slide = pptx.addSlide();
  addSlideHeader(slide, 'Acceptance Summary');
  addFooter(slide, pageNum);

  const { handover } = ctx;
  const signOffs = handover.DeliverableSignOffs;
  const finalSignOff = handover.FinalSignOff;

  // If no sign-offs yet, show placeholder
  if (signOffs.length === 0 && !finalSignOff) {
    slide.addText('Deliverable sign-offs have not been initialized yet.', {
      x: 0.5,
      y: 2.5,
      w: 9,
      h: 1,
      fontSize: 14,
      fontFace: FONT,
      color: '94a3b8',
      align: 'center',
    });
    return;
  }

  // Summary stats
  const approvedCount = signOffs.filter((s) => s.status === 'Approved').length;
  const totalCount = signOffs.length;

  addSectionTitle(slide, 'Deliverable Acceptance Status', 1.1);

  // Summary text
  slide.addText(`${approvedCount} of ${totalCount} deliverables approved`, {
    x: 0.5,
    y: 1.45,
    w: 9,
    h: 0.3,
    fontSize: 11,
    fontFace: FONT,
    color: approvedCount === totalCount ? DWX_GREEN : DWX_AMBER,
    bold: true,
  });

  // Deliverables table
  if (totalCount > 0) {
    // Custom table with status coloring
    const headerRow = ['Deliverable', 'Status', 'Date', 'Approved By'].map((h) => ({
      text: h,
      options: {
        bold: true,
        fontSize: 10,
        fontFace: FONT,
        color: DWX_WHITE,
        fill: { color: DWX_TEAL },
        border: { type: 'solid' as const, color: DWX_TEAL, pt: 0.5 },
        valign: 'middle' as const,
        margin: [3, 5, 3, 5] as [number, number, number, number],
      },
    }));

    const dataRows = signOffs.map((so, rowIdx) => [
      {
        text: so.title,
        options: {
          fontSize: 9,
          fontFace: FONT,
          color: DWX_DARK,
          fill: { color: rowIdx % 2 === 0 ? DWX_WHITE : DWX_LIGHT_BG },
          border: { type: 'solid' as const, color: 'e2e8f0', pt: 0.5 },
          valign: 'top' as const,
          margin: [3, 5, 3, 5] as [number, number, number, number],
        },
      },
      {
        text: so.status,
        options: {
          fontSize: 9,
          fontFace: FONT,
          color: SIGNOFF_STATUS_PPTX_COLORS[so.status] || DWX_DARK,
          bold: true,
          fill: { color: rowIdx % 2 === 0 ? DWX_WHITE : DWX_LIGHT_BG },
          border: { type: 'solid' as const, color: 'e2e8f0', pt: 0.5 },
          valign: 'top' as const,
          margin: [3, 5, 3, 5] as [number, number, number, number],
        },
      },
      {
        text: so.approvedDate ? formatDate(so.approvedDate) : so.submittedDate ? formatDate(so.submittedDate) : '-',
        options: {
          fontSize: 9,
          fontFace: FONT,
          color: DWX_DARK,
          fill: { color: rowIdx % 2 === 0 ? DWX_WHITE : DWX_LIGHT_BG },
          border: { type: 'solid' as const, color: 'e2e8f0', pt: 0.5 },
          valign: 'top' as const,
          margin: [3, 5, 3, 5] as [number, number, number, number],
        },
      },
      {
        text: so.approvedBy || '-',
        options: {
          fontSize: 9,
          fontFace: FONT,
          color: DWX_DARK,
          fill: { color: rowIdx % 2 === 0 ? DWX_WHITE : DWX_LIGHT_BG },
          border: { type: 'solid' as const, color: 'e2e8f0', pt: 0.5 },
          valign: 'top' as const,
          margin: [3, 5, 3, 5] as [number, number, number, number],
        },
      },
    ]);

    slide.addTable([headerRow, ...dataRows], {
      x: 0.5,
      y: 1.85,
      w: 9,
      colW: [3.5, 1.5, 2, 2],
      fontSize: 9,
      fontFace: FONT,
    });
  }

  // Final sign-off section (if recorded)
  if (finalSignOff && finalSignOff.isComplete) {
    const signOffY = totalCount > 0 ? Math.min(1.85 + 0.35 + totalCount * 0.35 + 0.5, 4.5) : 2.0;

    addSectionTitle(slide, 'Final Handover Sign-Off', signOffY);

    // Sign-off details in 2-column layout
    const leftX = 0.5;
    const rightX = 5.0;
    const detailY = signOffY + 0.4;

    // Client signatory
    slide.addText('Client Signatory:', { x: leftX, y: detailY, w: 2, h: 0.25, fontSize: 9, fontFace: FONT, color: '64748b', bold: true });
    slide.addText(`${finalSignOff.clientSignatory}${finalSignOff.clientTitle ? ` (${finalSignOff.clientTitle})` : ''}`, {
      x: leftX, y: detailY + 0.22, w: 4, h: 0.25, fontSize: 10, fontFace: FONT, color: DWX_DARK,
    });

    // DW signatory
    slide.addText('DW Signatory:', { x: rightX, y: detailY, w: 2, h: 0.25, fontSize: 9, fontFace: FONT, color: '64748b', bold: true });
    slide.addText(`${finalSignOff.dwSignatory}${finalSignOff.dwTitle ? ` (${finalSignOff.dwTitle})` : ''}`, {
      x: rightX, y: detailY + 0.22, w: 4.5, h: 0.25, fontSize: 10, fontFace: FONT, color: DWX_DARK,
    });

    // Signed date
    slide.addText('Signed Date:', { x: leftX, y: detailY + 0.55, w: 2, h: 0.25, fontSize: 9, fontFace: FONT, color: '64748b', bold: true });
    slide.addText(finalSignOff.signedDate ? formatDate(finalSignOff.signedDate) : '-', {
      x: leftX, y: detailY + 0.77, w: 4, h: 0.25, fontSize: 10, fontFace: FONT, color: DWX_DARK,
    });

    // Rating
    const stars = Array.from({ length: 5 }, (_, i) => i < finalSignOff.overallRating ? '\u2605' : '\u2606').join(' ');
    slide.addText('Overall Rating:', { x: rightX, y: detailY + 0.55, w: 2, h: 0.25, fontSize: 9, fontFace: FONT, color: '64748b', bold: true });
    slide.addText(`${stars}  (${finalSignOff.overallRating}/5)`, {
      x: rightX, y: detailY + 0.77, w: 4.5, h: 0.25, fontSize: 12, fontFace: FONT, color: DWX_AMBER,
    });

    // Client feedback (if provided)
    if (finalSignOff.clientFeedback) {
      const feedbackY = detailY + 1.15;
      slide.addText('Client Feedback:', { x: leftX, y: feedbackY, w: 2, h: 0.25, fontSize: 9, fontFace: FONT, color: '64748b', bold: true });
      slide.addShape('rect', {
        x: leftX,
        y: feedbackY + 0.25,
        w: 9,
        h: 0.8,
        fill: { color: DWX_LIGHT_BG },
        rectRadius: 0.05,
      });
      slide.addText(`"${finalSignOff.clientFeedback}"`, {
        x: leftX + 0.15,
        y: feedbackY + 0.3,
        w: 8.7,
        h: 0.7,
        fontSize: 10,
        fontFace: FONT,
        color: DWX_DARK,
        italic: true,
        valign: 'top',
      });
    }
  }
}

function addThankYouSlide(pptx: PptxGenJS, ctx: HandoverPptxContext) {
  const slide = pptx.addSlide();
  const { handover } = ctx;

  // Full background
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: '100%',
    fill: { color: DWX_TEAL },
  });

  // Accent bar
  slide.addShape('rect', {
    x: 0,
    y: 6.5,
    w: '100%',
    h: 1.0,
    fill: { color: DWX_BLUE },
  });

  // Main text
  slide.addText('Next Steps', {
    x: 0.8,
    y: 1.0,
    w: 8.4,
    h: 0.6,
    fontSize: 14,
    fontFace: FONT,
    color: DWX_WHITE,
    charSpacing: 3,
  });

  slide.addText('Ready to Deliver', {
    x: 0.8,
    y: 1.7,
    w: 8.4,
    h: 0.8,
    fontSize: 32,
    fontFace: FONT,
    color: DWX_WHITE,
    bold: true,
  });

  // Next steps content
  const nextSteps: string[] = [];
  if (handover.PlannedKickoffDate) {
    nextSteps.push(`Kickoff Meeting: ${formatDate(handover.PlannedKickoffDate)}`);
  }
  if (handover.DeliveryManagerName) {
    nextSteps.push(`Delivery Lead: ${handover.DeliveryManagerName}`);
  }
  if (handover.PlannedGoLive) {
    nextSteps.push(`Target Go-Live: ${formatDate(handover.PlannedGoLive)}`);
  }

  // Client expectations
  if (handover.ClientExpectations) {
    nextSteps.push('');
    nextSteps.push(handover.ClientExpectations);
  }

  if (nextSteps.length > 0) {
    const textItems = nextSteps.map((step) => ({
      text: step,
      options: {
        fontSize: 13,
        fontFace: FONT,
        color: DWX_WHITE,
        bullet: step.length > 0 ? { type: 'bullet' as const } : undefined,
        paraSpaceAfter: 6,
      },
    }));

    slide.addText(textItems, {
      x: 0.8,
      y: 3.0,
      w: 8.4,
      h: 3.0,
      valign: 'top',
    });
  }

  // Footer
  slide.addText('DWx Traffic Manager | Digital Workplace', {
    x: 0.8,
    y: 6.65,
    w: 5,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: DWX_WHITE,
  });

  slide.addText(formatDate(new Date().toISOString()), {
    x: 6.5,
    y: 6.65,
    w: 3,
    h: 0.3,
    fontSize: 10,
    fontFace: FONT,
    color: DWX_WHITE,
    align: 'right',
  });
}

// ============================================================================
// Main Export Function
// ============================================================================

export async function generateHandoverPptx(context: HandoverPptxContext): Promise<void> {
  const pptx = new PptxGenJS();
  const { handover } = context;

  // Presentation metadata
  pptx.author = 'DWx Traffic Manager';
  pptx.company = 'Digital Workplace';
  pptx.subject = `Delivery Handover - ${handover.ClientName} - ${handover.ServiceName}`;
  pptx.title = `${handover.ClientName} - ${handover.ServiceName} Handover Deck`;

  // Layout: Widescreen 16:9
  pptx.defineLayout({ name: 'DWx', width: 10, height: 7.5 });
  pptx.layout = 'DWx';

  // Generate all slides
  let page = 1;
  addTitleSlide(pptx, context);
  addExecutiveSummarySlide(pptx, context, ++page);
  addScopeOfWorkSlide(pptx, context, ++page);
  addTechStackSlide(pptx, context, ++page);
  addDeliveryTeamSlide(pptx, context, ++page);
  addStakeholdersSlide(pptx, context, ++page);
  addTimelineSlide(pptx, context, ++page);
  addRisksSlide(pptx, context, ++page);
  addSuccessFactorsSlide(pptx, context, ++page);
  addProjectPlanSlide(pptx, context, ++page);
  addEnvironmentSlide(pptx, context, ++page);
  addChecklistSlide(pptx, context, ++page);
  addAcceptanceSummarySlide(pptx, context, ++page);
  addContactSheetSlide(pptx, context, ++page);
  addThankYouSlide(pptx, context);

  // Generate and download
  const filename = `${handover.ClientName} - ${handover.ServiceName} Handover Deck`;
  await pptx.writeFile({ fileName: filename });
}
