/**
 * DWx Traffic Manager - Proposal Word Document Generator
 *
 * Two-mode generation:
 *  1. **Template mode** (primary) — Loads a physical .docx from SharePoint,
 *     injects proposal data via docxtemplater placeholders, and downloads.
 *  2. **Programmatic mode** (fallback) — Builds the document from scratch using
 *     the `docx` library with theme-aware styling.
 *
 * Template mode is attempted first; if the template cannot be fetched (offline,
 * file missing, etc.) the programmatic fallback kicks in transparently.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  TabStopType,
  TabStopPosition,
} from 'docx';
import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { Proposal, ProposalType, TemplateTheme, getTemplateTheme } from '../types/Proposal';
import { proposalTemplateService } from '../services/ProposalTemplateService';

// ============================================================================
// Types
// ============================================================================

export interface ProposalWordContext {
  proposal: Proposal;
  clientName: string;
  serviceName: string;
  accountManagerName: string;
  proposalType: ProposalType;
  templateName?: string;
}

// ============================================================================
// Template-based generation (docxtemplater)
// ============================================================================

/**
 * Build a flat data object from proposal data for docxtemplater placeholders.
 * This is the "contract" between the Word template and the code.
 */
function buildTemplateData(ctx: ProposalWordContext) {
  const { proposal, clientName, serviceName, accountManagerName, proposalType } = ctx;
  const theme = getTemplateTheme(ctx.templateName);
  const dateStr = new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validUntilStr = proposal.ValidUntil
    ? new Date(proposal.ValidUntil).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // ---------- Cover page ----------
  const data: Record<string, unknown> = {
    companyName: theme.companyName,
    coverSubtitle: theme.coverSubtitle,
    clientName,
    serviceName,
    version: proposal.Version || 1,
    date: dateStr,
    preparedBy: accountManagerName || theme.companyName,
    proposalType: proposalType || 'Standard',
    validUntil: validUntilStr,
    isConfidential: theme.confidentialWatermark,
    headerSuffix: theme.headerSuffix,
    footerText: theme.footerText,
  };

  // ---------- Executive Summary ----------
  const es = proposal.ExecutiveSummary;
  data.hasExecutiveSummary = !!es;
  data.executiveOverview = es?.overview || '';
  data.objectives = (es?.objectives || []).map((o) => ({ text: o }));
  data.hasObjectives = (es?.objectives?.length || 0) > 0;
  data.successCriteria = (es?.successCriteria || []).map((c) => ({ text: c }));
  data.hasSuccessCriteria = (es?.successCriteria?.length || 0) > 0;

  // ---------- Solution Overview ----------
  const so = proposal.SolutionOverview;
  data.hasSolutionOverview = !!so;
  data.solutionDescription = so?.description || '';
  data.solutionApproach = so?.approach || '';
  data.hasSolutionApproach = !!so?.approach;
  data.differentiators = (so?.differentiators || []).map((d) => ({ text: d }));
  data.hasDifferentiators = (so?.differentiators?.length || 0) > 0;

  // ---------- Technology Stack ----------
  const ts = proposal.TechnologyStack;
  data.hasTechStack = (ts?.technologies?.length || 0) > 0;
  data.technologies = (ts?.technologies || []).map((t) => ({
    name: t.name,
    role: t.role,
    justification: t.justification,
  }));

  // ---------- Scope of Work ----------
  const sow = proposal.ScopeOfWork;
  data.hasScopeOfWork = !!sow;
  data.hasDeliverables = (sow?.deliverables?.length || 0) > 0;
  data.deliverables = (sow?.deliverables || []).map((d) => ({
    title: d.title,
    description: d.description,
    hours: d.hours || '-',
  }));
  data.exclusions = (sow?.exclusions || []).map((e) => ({ text: e }));
  data.hasExclusions = (sow?.exclusions?.length || 0) > 0;

  // ---------- Pricing ----------
  const pb = proposal.PricingBreakdown;
  data.hasPricing = !!pb;
  data.lineItems = (pb?.lineItems || []).map((li) => ({
    description: li.description,
    quantity: li.quantity || 1,
    unitPrice: fmtCurrency(li.unitPrice || 0),
    total: fmtCurrency(li.total || 0),
  }));
  data.subtotal = pb?.subtotal ? fmtCurrency(pb.subtotal) : '';
  data.hasSubtotal = !!pb?.subtotal;
  data.discount = pb?.discount ? fmtCurrency(pb.discount) : '';
  data.hasDiscount = !!pb?.discount;
  data.tax = pb?.tax ? fmtCurrency(pb.tax) : '';
  data.hasTax = !!pb?.tax;
  data.grandTotal = pb?.grandTotal ? fmtCurrency(pb.grandTotal) : '';
  data.hasGrandTotal = !!pb?.grandTotal;

  // ---------- Timeline ----------
  const tl = proposal.Timeline;
  data.hasTimeline = (tl?.phases?.length || 0) > 0;
  data.phases = (tl?.phases || []).map((p) => ({
    name: p.name,
    startWeek: p.startWeek,
    endWeek: p.endWeek,
    milestones: p.milestones?.join(', ') || '-',
  }));
  data.totalWeeks = tl?.totalWeeks || '';
  data.hasTotalWeeks = !!tl?.totalWeeks;

  // ---------- Team Composition ----------
  const tc = proposal.TeamComposition;
  data.hasTeamComposition = (tc?.members?.length || 0) > 0;
  data.teamMembers = (tc?.members || []).map((m) => ({
    role: m.role,
    name: m.name || '-',
    responsibility: m.responsibility,
  }));

  // ---------- Terms & Conditions ----------
  const terms = proposal.Terms;
  data.hasTerms = !!terms;
  data.paymentTerms = terms?.paymentTerms || '';
  data.hasPaymentTerms = !!terms?.paymentTerms;
  data.warranty = terms?.warranty || '';
  data.hasWarranty = !!terms?.warranty;
  data.liability = terms?.liability || '';
  data.hasLiability = !!terms?.liability;
  data.confidentiality = terms?.confidentiality || '';
  data.hasConfidentiality = !!terms?.confidentiality;
  data.ipOwnership = terms?.ipOwnership || '';
  data.hasIpOwnership = !!terms?.ipOwnership;
  data.termination = terms?.termination || '';
  data.hasTermination = !!terms?.termination;

  // ---------- Change Control ----------
  const cc = proposal.ChangeControl;
  data.hasChangeControl = !!cc;
  data.changeProcess = cc?.process || '';
  data.hasChangeProcess = !!cc?.process;
  data.approvalLevels = (cc?.approvalLevels || []).map((a) => ({ text: a }));
  data.hasApprovalLevels = (cc?.approvalLevels?.length || 0) > 0;
  data.pricingImpact = cc?.pricingImpact || '';
  data.hasPricingImpact = !!cc?.pricingImpact;

  // ---------- Assumptions & Risks ----------
  data.assumptions = (proposal.Assumptions || []).map((a) => ({ text: a }));
  data.hasAssumptions = (proposal.Assumptions?.length || 0) > 0;
  data.risks = (proposal.Risks || []).map((r) => ({
    risk: r.risk,
    impact: r.impact,
    likelihood: r.likelihood || '-',
    mitigation: r.mitigation,
  }));
  data.hasRisks = (proposal.Risks?.length || 0) > 0;
  data.hasRisksSection = data.hasAssumptions || data.hasRisks;

  // ---------- Signing Page ----------
  const sp = proposal.SigningPage;
  data.hasSigningPage = !!sp;
  data.clientSignatory = sp?.clientSignatory || '';
  data.clientTitle = sp?.clientTitle || '';
  data.dwSignatory = sp?.dwSignatory || '';
  data.dwTitle = sp?.dwTitle || '';

  // ---------- TOC ----------
  const tocEntries: { num: number; title: string }[] = [];
  let tocNum = 0;
  if (data.hasExecutiveSummary) tocEntries.push({ num: ++tocNum, title: 'Executive Summary' });
  if (data.hasSolutionOverview) tocEntries.push({ num: ++tocNum, title: 'Solution Overview' });
  if (data.hasTechStack) tocEntries.push({ num: ++tocNum, title: 'Technology Stack' });
  if (data.hasScopeOfWork) tocEntries.push({ num: ++tocNum, title: 'Scope of Work' });
  if (data.hasPricing) tocEntries.push({ num: ++tocNum, title: 'Pricing' });
  if (data.hasTimeline) tocEntries.push({ num: ++tocNum, title: 'Timeline & Milestones' });
  if (data.hasTeamComposition) tocEntries.push({ num: ++tocNum, title: 'Team Composition' });
  if (data.hasTerms) tocEntries.push({ num: ++tocNum, title: 'Terms & Conditions' });
  if (data.hasChangeControl) tocEntries.push({ num: ++tocNum, title: 'Change Control' });
  if (data.hasRisksSection) tocEntries.push({ num: ++tocNum, title: 'Risks & Mitigations' });
  if (data.hasSigningPage) tocEntries.push({ num: ++tocNum, title: 'Signing Page' });
  data.tocEntries = tocEntries;

  return data;
}

function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Attempt template-based generation.
 * Returns a Blob if successful, null if the template could not be loaded.
 */
async function generateFromTemplate(ctx: ProposalWordContext): Promise<Blob | null> {
  try {
    const templateBuffer = await proposalTemplateService.fetchTemplate();
    if (!templateBuffer) {
      console.warn('[proposalWordGenerator] Template not found in SharePoint, falling back to programmatic generation');
      return null;
    }

    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      // Silently ignore undefined tags so the template works even if
      // some sections are empty.
      nullGetter: () => '',
    });

    const data = buildTemplateData(ctx);
    doc.render(data);

    const outputBuffer = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return outputBuffer as Blob;
  } catch (error) {
    console.error('[proposalWordGenerator] Template generation failed, falling back to programmatic:', error);
    return null;
  }
}

// ============================================================================
// Programmatic fallback helpers (theme-aware)
// ============================================================================

function heading(text: string, theme: TemplateTheme, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({
        text,
        color: theme.primary,
        bold: true,
        size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22,
      }),
    ],
  });
}

function subheading(text: string, theme: TemplateTheme): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        color: theme.accent,
        bold: true,
        size: 22,
      }),
    ],
  });
}

function para(text: string, theme: TemplateTheme): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text, color: theme.dark, size: 20 }),
    ],
  });
}

function bulletItem(text: string, theme: TemplateTheme): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text, color: theme.dark, size: 20 }),
    ],
  });
}

function formatCurrency(value: number): string {
  return fmtCurrency(value);
}

function tableHeaderCell(text: string, color: string): TableCell {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color },
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({ text, bold: true, color: 'FFFFFF', size: 20 }),
        ],
      }),
    ],
  });
}

function tableCell(text: string, theme: TemplateTheme, options?: { bold?: boolean; alignment?: typeof AlignmentType[keyof typeof AlignmentType] }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: options?.alignment,
        spacing: { before: 30, after: 30 },
        children: [
          new TextRun({
            text,
            size: 18,
            color: theme.dark,
            bold: options?.bold,
          }),
        ],
      }),
    ],
  });
}

function impactBadge(text: string, theme: TemplateTheme): TableCell {
  let color = theme.grey;
  if (text === 'High') color = theme.danger;
  else if (text === 'Medium') color = 'F59E0B';
  else if (text === 'Low') color = theme.success;
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 30, after: 30 },
        children: [
          new TextRun({ text, size: 18, bold: true, color }),
        ],
      }),
    ],
  });
}

// ============================================================================
// Programmatic fallback generator
// ============================================================================

async function generateProgrammatic(context: ProposalWordContext): Promise<Blob> {
  const { proposal, clientName, serviceName, accountManagerName, proposalType, templateName } = context;
  const theme = getTemplateTheme(templateName);

  const sections: Paragraph[] = [];
  let sectionNumber = 0;

  function addSection(title: string): void {
    sectionNumber++;
    sections.push(heading(`${sectionNumber}. ${title}`, theme));
  }

  // ---- Build TOC entries ----
  const tocEntries: string[] = [];
  if (proposal.ExecutiveSummary) tocEntries.push('Executive Summary');
  if (proposal.SolutionOverview) tocEntries.push('Solution Overview');
  if (proposal.TechnologyStack?.technologies?.length) tocEntries.push('Technology Stack');
  if (proposal.ScopeOfWork) tocEntries.push('Scope of Work');
  if (proposal.PricingBreakdown) tocEntries.push('Pricing');
  if (proposal.Timeline?.phases?.length) tocEntries.push('Timeline & Milestones');
  if (proposal.TeamComposition?.members?.length) tocEntries.push('Team Composition');
  if (proposal.Terms) tocEntries.push('Terms & Conditions');
  if (proposal.ChangeControl) tocEntries.push('Change Control');
  if (proposal.Risks?.length || proposal.Assumptions?.length) tocEntries.push('Risks & Mitigations');
  if (proposal.SigningPage) tocEntries.push('Signing Page');

  // ---- Content sections ----
  const tables: { afterIndex: number; table: Table }[] = [];

  // 1. Executive Summary
  if (proposal.ExecutiveSummary) {
    const es = proposal.ExecutiveSummary;
    addSection('Executive Summary');
    if (es.overview) sections.push(para(es.overview, theme));
    if (es.objectives?.length) {
      sections.push(subheading('Objectives', theme));
      es.objectives.forEach(o => sections.push(bulletItem(o, theme)));
    }
    if (es.successCriteria?.length) {
      sections.push(subheading('Success Criteria', theme));
      es.successCriteria.forEach(c => sections.push(bulletItem(c, theme)));
    }
  }

  // 2. Solution Overview
  if (proposal.SolutionOverview) {
    const so = proposal.SolutionOverview;
    addSection('Solution Overview');
    if (so.description) sections.push(para(so.description, theme));
    if (so.approach) {
      sections.push(subheading('Approach', theme));
      sections.push(para(so.approach, theme));
    }
    if (so.differentiators?.length) {
      sections.push(subheading('Key Differentiators', theme));
      so.differentiators.forEach(d => sections.push(bulletItem(d, theme)));
    }
  }

  // 3. Technology Stack
  if (proposal.TechnologyStack?.technologies?.length) {
    addSection('Technology Stack');
    const techTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            tableHeaderCell('Technology', theme.primary),
            tableHeaderCell('Role', theme.primary),
            tableHeaderCell('Justification', theme.primary),
          ],
        }),
        ...proposal.TechnologyStack.technologies.map(t =>
          new TableRow({
            children: [
              tableCell(t.name, theme, { bold: true }),
              tableCell(t.role, theme),
              tableCell(t.justification, theme),
            ],
          })
        ),
      ],
    });
    sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
    tables.push({ afterIndex: sections.length - 1, table: techTable });
  }

  // 4. Scope of Work
  if (proposal.ScopeOfWork) {
    const sow = proposal.ScopeOfWork;
    addSection('Scope of Work');
    if (sow.deliverables?.length) {
      sections.push(subheading('Deliverables', theme));
      const sowTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              tableHeaderCell('Deliverable', theme.primary),
              tableHeaderCell('Description', theme.primary),
              tableHeaderCell('Est. Hours', theme.primary),
            ],
          }),
          ...sow.deliverables.map(d =>
            new TableRow({
              children: [
                tableCell(d.title, theme, { bold: true }),
                tableCell(d.description, theme),
                tableCell(String(d.hours || '-'), theme, { alignment: AlignmentType.CENTER }),
              ],
            })
          ),
        ],
      });
      sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
      tables.push({ afterIndex: sections.length - 1, table: sowTable });
    }
    if (sow.exclusions?.length) {
      sections.push(subheading('Exclusions', theme));
      sow.exclusions.forEach(e => sections.push(bulletItem(e, theme)));
    }
  }

  // 5. Pricing
  if (proposal.PricingBreakdown) {
    const pb = proposal.PricingBreakdown;
    addSection('Pricing');
    if (pb.lineItems?.length) {
      const pricingRows = pb.lineItems.map(li =>
        new TableRow({
          children: [
            tableCell(li.description, theme),
            tableCell(String(li.quantity || 1), theme, { alignment: AlignmentType.CENTER }),
            tableCell(formatCurrency(li.unitPrice || 0), theme, { alignment: AlignmentType.RIGHT }),
            tableCell(formatCurrency(li.total || 0), theme, { alignment: AlignmentType.RIGHT }),
          ],
        })
      );

      const summaryRows: TableRow[] = [];
      const addSummaryRow = (label: string, value: string, bold = false) => {
        summaryRows.push(new TableRow({
          children: [
            tableCell('', theme),
            tableCell('', theme),
            tableCell(label, theme, { bold, alignment: AlignmentType.RIGHT }),
            tableCell(value, theme, { bold, alignment: AlignmentType.RIGHT }),
          ],
        }));
      };
      if (pb.subtotal) addSummaryRow('Subtotal', formatCurrency(pb.subtotal));
      if (pb.discount) addSummaryRow('Discount', `-${formatCurrency(pb.discount)}`);
      if (pb.tax) addSummaryRow('Tax', formatCurrency(pb.tax));
      if (pb.grandTotal) addSummaryRow('Grand Total', formatCurrency(pb.grandTotal), true);

      const pricingTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              tableHeaderCell('Description', theme.success),
              tableHeaderCell('Qty', theme.success),
              tableHeaderCell('Unit Price', theme.success),
              tableHeaderCell('Total', theme.success),
            ],
          }),
          ...pricingRows,
          ...summaryRows,
        ],
      });
      sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
      tables.push({ afterIndex: sections.length - 1, table: pricingTable });
    }
  }

  // 6. Timeline
  if (proposal.Timeline?.phases?.length) {
    addSection('Timeline & Milestones');
    const timelineTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            tableHeaderCell('Phase', theme.primary),
            tableHeaderCell('Start Week', theme.primary),
            tableHeaderCell('End Week', theme.primary),
            tableHeaderCell('Milestones', theme.primary),
          ],
        }),
        ...proposal.Timeline.phases.map(p =>
          new TableRow({
            children: [
              tableCell(p.name, theme, { bold: true }),
              tableCell(`Week ${p.startWeek}`, theme, { alignment: AlignmentType.CENTER }),
              tableCell(`Week ${p.endWeek}`, theme, { alignment: AlignmentType.CENTER }),
              tableCell(p.milestones?.join(', ') || '-', theme),
            ],
          })
        ),
      ],
    });
    sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
    tables.push({ afterIndex: sections.length - 1, table: timelineTable });

    if (proposal.Timeline.totalWeeks) {
      sections.push(para(`Total estimated duration: ${proposal.Timeline.totalWeeks} weeks`, theme));
    }
  }

  // 7. Team Composition
  if (proposal.TeamComposition?.members?.length) {
    addSection('Team Composition');
    const teamTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            tableHeaderCell('Role', theme.accent),
            tableHeaderCell('Name', theme.accent),
            tableHeaderCell('Responsibility', theme.accent),
          ],
        }),
        ...proposal.TeamComposition.members.map(m =>
          new TableRow({
            children: [
              tableCell(m.role, theme, { bold: true }),
              tableCell(m.name || '-', theme),
              tableCell(m.responsibility, theme),
            ],
          })
        ),
      ],
    });
    sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
    tables.push({ afterIndex: sections.length - 1, table: teamTable });
  }

  // 8. Terms & Conditions
  if (proposal.Terms) {
    const t = proposal.Terms;
    addSection('Terms & Conditions');
    const termItems: [string, string][] = ([
      ['Payment Terms', t.paymentTerms],
      ['Warranty', t.warranty],
      ['Liability', t.liability],
      ['Confidentiality', t.confidentiality],
      ['IP Ownership', t.ipOwnership],
      ['Termination', t.termination],
    ] as [string, string][]).filter(([, v]) => v);
    for (const [label, value] of termItems) {
      sections.push(subheading(label, theme));
      sections.push(para(value, theme));
    }
  }

  // 9. Change Control
  if (proposal.ChangeControl) {
    const cc = proposal.ChangeControl;
    addSection('Change Control');
    if (cc.process) sections.push(para(cc.process, theme));
    if (cc.approvalLevels?.length) {
      sections.push(subheading('Approval Levels', theme));
      cc.approvalLevels.forEach(a => sections.push(bulletItem(a, theme)));
    }
    if (cc.pricingImpact) {
      sections.push(subheading('Pricing Impact', theme));
      sections.push(para(cc.pricingImpact, theme));
    }
  }

  // 10. Risks & Mitigations
  if (proposal.Risks?.length || proposal.Assumptions?.length) {
    addSection('Risks & Mitigations');
    if (proposal.Assumptions?.length) {
      sections.push(subheading('Assumptions', theme));
      proposal.Assumptions.forEach(a => sections.push(bulletItem(a, theme)));
    }
    if (proposal.Risks?.length) {
      sections.push(subheading('Risk Register', theme));
      const riskTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              tableHeaderCell('Risk', theme.danger),
              tableHeaderCell('Impact', theme.danger),
              tableHeaderCell('Likelihood', theme.danger),
              tableHeaderCell('Mitigation', theme.danger),
            ],
          }),
          ...proposal.Risks.map(r =>
            new TableRow({
              children: [
                tableCell(r.risk, theme),
                impactBadge(r.impact, theme),
                impactBadge(r.likelihood || '-', theme),
                tableCell(r.mitigation, theme),
              ],
            })
          ),
        ],
      });
      sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
      tables.push({ afterIndex: sections.length - 1, table: riskTable });
    }
  }

  // 11. Signing Page
  if (proposal.SigningPage) {
    const sp = proposal.SigningPage;
    addSection('Signing Page');
    sections.push(para('By signing below, both parties agree to the terms and conditions outlined in this proposal.', theme));
    sections.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

    sections.push(subheading('Client', theme));
    if (sp.clientSignatory) sections.push(para(`Name: ${sp.clientSignatory}`, theme));
    if (sp.clientTitle) sections.push(para(`Title: ${sp.clientTitle}`, theme));
    sections.push(para('Signature: ___________________________', theme));
    sections.push(para('Date: ___________________________', theme));

    sections.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

    sections.push(subheading(theme.companyName, theme));
    if (sp.dwSignatory) sections.push(para(`Name: ${sp.dwSignatory}`, theme));
    if (sp.dwTitle) sections.push(para(`Title: ${sp.dwTitle}`, theme));
    sections.push(para('Signature: ___________________________', theme));
    sections.push(para('Date: ___________________________', theme));
  }

  // ---- Merge sections and tables in order ----
  const allContent: (Paragraph | Table)[] = [];
  sections.forEach((section, idx) => {
    allContent.push(section);
    const matchingTables = tables.filter(t => t.afterIndex === idx);
    matchingTables.forEach(t => allContent.push(t.table));
  });

  // ---- Build Document ----
  const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: theme.dark },
        },
      },
    },
    sections: [
      // Cover Page
      {
        properties: {},
        children: [
          new Paragraph({ spacing: { before: 600 }, children: [] }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: theme.companyName, bold: true, size: 56, color: theme.primary }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: theme.coverSubtitle, size: 28, color: theme.accent }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: theme.accent, space: 1 },
            },
            children: [],
          }),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: clientName, bold: true, size: 48, color: theme.dark }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: serviceName, size: 32, color: theme.grey }),
            ],
          }),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          para(`Version: v${proposal.Version || 1}`, theme),
          para(`Date: ${dateStr}`, theme),
          para(`Prepared by: ${accountManagerName || theme.companyName}`, theme),
          para(`Type: ${proposalType || 'Standard'}`, theme),
          ...(proposal.ValidUntil ? [
            para(`Valid until: ${new Date(proposal.ValidUntil).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`, theme),
          ] : []),
          ...(theme.confidentialWatermark ? [
            new Paragraph({
              spacing: { before: 400 },
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'CONFIDENTIAL', bold: true, size: 28, color: 'C0C0C0' }),
              ],
            }),
          ] : []),
          new Paragraph({ children: [new PageBreak()] }),
          heading('Table of Contents', theme, HeadingLevel.HEADING_1),
          ...tocEntries.map((entry, i) => para(`${i + 1}. ${entry}`, theme)),
        ],
      },
      // Content
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: `${clientName} \u2014 ${serviceName} ${theme.headerSuffix}`, size: 16, color: theme.grey, italics: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
                children: [
                  new TextRun({ text: theme.footerText, size: 16, color: theme.grey }),
                ],
              }),
            ],
          }),
        },
        children: allContent,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

// ============================================================================
// Main Export
// ============================================================================

/**
 * Generate a proposal Word document.
 *
 * 1. Attempts to load the corporate .docx template from SharePoint and inject
 *    proposal data via docxtemplater placeholders.
 * 2. If the template is unavailable, falls back to programmatic generation.
 */
export async function generateProposalWord(context: ProposalWordContext): Promise<void> {
  const { proposal, clientName, serviceName } = context;
  const fileName = `${clientName} - ${serviceName} Proposal v${proposal.Version || 1}.docx`;

  // Try template-based generation first
  const templateBlob = await generateFromTemplate(context);

  if (templateBlob) {
    saveAs(templateBlob, fileName);
    return;
  }

  // Fallback to programmatic generation
  const programmaticBlob = await generateProgrammatic(context);
  saveAs(programmaticBlob, fileName);
}
