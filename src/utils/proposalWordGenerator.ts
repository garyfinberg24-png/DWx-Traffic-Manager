/**
 * DWx Traffic Manager - Proposal Word Document Generator
 * Generates a DW-branded .docx from proposal data using the `docx` library.
 * Produces an editable Word document that users can further format before sending.
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
import { Proposal, ProposalType } from '../types/Proposal';

// ============================================================================
// Types
// ============================================================================

export interface ProposalWordContext {
  proposal: Proposal;
  clientName: string;
  serviceName: string;
  accountManagerName: string;
  proposalType: ProposalType;
}

// ============================================================================
// Brand Colors (hex)
// ============================================================================

const DWX_BLUE = '1A5A8A';
const DWX_TEAL = '1E6B7B';
const DWX_DARK = '242424';
const DWX_GREY = '616161';
const DWX_GREEN = '107C10';
const DWX_RED = 'D13438';

// ============================================================================
// Helper Factories
// ============================================================================

function heading(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({
        text,
        color: DWX_BLUE,
        bold: true,
        size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 26 : 22,
      }),
    ],
  });
}

function subheading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        color: DWX_TEAL,
        bold: true,
        size: 22,
      }),
    ],
  });
}

function para(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text, color: DWX_DARK, size: 20 }),
    ],
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [
      new TextRun({ text, color: DWX_DARK, size: 20 }),
    ],
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function tableHeaderCell(text: string, color: string = DWX_BLUE): TableCell {
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

function tableCell(text: string, options?: { bold?: boolean; alignment?: typeof AlignmentType[keyof typeof AlignmentType] }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: options?.alignment,
        spacing: { before: 30, after: 30 },
        children: [
          new TextRun({
            text,
            size: 18,
            color: DWX_DARK,
            bold: options?.bold,
          }),
        ],
      }),
    ],
  });
}

function impactBadge(text: string): TableCell {
  let color = DWX_GREY;
  if (text === 'High') color = DWX_RED;
  else if (text === 'Medium') color = 'F59E0B';
  else if (text === 'Low') color = DWX_GREEN;
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
// Main Export
// ============================================================================

export async function generateProposalWord(context: ProposalWordContext): Promise<void> {
  const { proposal, clientName, serviceName, accountManagerName, proposalType } = context;

  const sections: Paragraph[] = [];
  let sectionNumber = 0;

  function addSection(title: string): void {
    sectionNumber++;
    sections.push(heading(`${sectionNumber}. ${title}`));
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
    if (es.overview) sections.push(para(es.overview));
    if (es.objectives?.length) {
      sections.push(subheading('Objectives'));
      es.objectives.forEach(o => sections.push(bulletItem(o)));
    }
    if (es.successCriteria?.length) {
      sections.push(subheading('Success Criteria'));
      es.successCriteria.forEach(c => sections.push(bulletItem(c)));
    }
  }

  // 2. Solution Overview
  if (proposal.SolutionOverview) {
    const so = proposal.SolutionOverview;
    addSection('Solution Overview');
    if (so.description) sections.push(para(so.description));
    if (so.approach) {
      sections.push(subheading('Approach'));
      sections.push(para(so.approach));
    }
    if (so.differentiators?.length) {
      sections.push(subheading('Key Differentiators'));
      so.differentiators.forEach(d => sections.push(bulletItem(d)));
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
            tableHeaderCell('Technology'),
            tableHeaderCell('Role'),
            tableHeaderCell('Justification'),
          ],
        }),
        ...proposal.TechnologyStack.technologies.map(t =>
          new TableRow({
            children: [
              tableCell(t.name, { bold: true }),
              tableCell(t.role),
              tableCell(t.justification),
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
      sections.push(subheading('Deliverables'));
      const sowTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              tableHeaderCell('Deliverable'),
              tableHeaderCell('Description'),
              tableHeaderCell('Est. Hours'),
            ],
          }),
          ...sow.deliverables.map(d =>
            new TableRow({
              children: [
                tableCell(d.title, { bold: true }),
                tableCell(d.description),
                tableCell(String(d.hours || '-'), { alignment: AlignmentType.CENTER }),
              ],
            })
          ),
        ],
      });
      sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
      tables.push({ afterIndex: sections.length - 1, table: sowTable });
    }
    if (sow.exclusions?.length) {
      sections.push(subheading('Exclusions'));
      sow.exclusions.forEach(e => sections.push(bulletItem(e)));
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
            tableCell(li.description),
            tableCell(String(li.quantity || 1), { alignment: AlignmentType.CENTER }),
            tableCell(formatCurrency(li.unitPrice || 0), { alignment: AlignmentType.RIGHT }),
            tableCell(formatCurrency(li.total || 0), { alignment: AlignmentType.RIGHT }),
          ],
        })
      );

      // Summary rows
      const summaryRows: TableRow[] = [];
      const addSummaryRow = (label: string, value: string, bold = false) => {
        summaryRows.push(new TableRow({
          children: [
            tableCell(''),
            tableCell(''),
            tableCell(label, { bold, alignment: AlignmentType.RIGHT }),
            tableCell(value, { bold, alignment: AlignmentType.RIGHT }),
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
              tableHeaderCell('Description', DWX_GREEN),
              tableHeaderCell('Qty', DWX_GREEN),
              tableHeaderCell('Unit Price', DWX_GREEN),
              tableHeaderCell('Total', DWX_GREEN),
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
            tableHeaderCell('Phase'),
            tableHeaderCell('Start Week'),
            tableHeaderCell('End Week'),
            tableHeaderCell('Milestones'),
          ],
        }),
        ...proposal.Timeline.phases.map(p =>
          new TableRow({
            children: [
              tableCell(p.name, { bold: true }),
              tableCell(`Week ${p.startWeek}`, { alignment: AlignmentType.CENTER }),
              tableCell(`Week ${p.endWeek}`, { alignment: AlignmentType.CENTER }),
              tableCell(p.milestones?.join(', ') || '-'),
            ],
          })
        ),
      ],
    });
    sections.push(new Paragraph({ spacing: { after: 40 }, children: [] }));
    tables.push({ afterIndex: sections.length - 1, table: timelineTable });

    if (proposal.Timeline.totalWeeks) {
      sections.push(para(`Total estimated duration: ${proposal.Timeline.totalWeeks} weeks`));
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
            tableHeaderCell('Role', DWX_TEAL),
            tableHeaderCell('Name', DWX_TEAL),
            tableHeaderCell('Responsibility', DWX_TEAL),
          ],
        }),
        ...proposal.TeamComposition.members.map(m =>
          new TableRow({
            children: [
              tableCell(m.role, { bold: true }),
              tableCell(m.name || '-'),
              tableCell(m.responsibility),
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
      sections.push(subheading(label));
      sections.push(para(value));
    }
  }

  // 9. Change Control
  if (proposal.ChangeControl) {
    const cc = proposal.ChangeControl;
    addSection('Change Control');
    if (cc.process) sections.push(para(cc.process));
    if (cc.approvalLevels?.length) {
      sections.push(subheading('Approval Levels'));
      cc.approvalLevels.forEach(a => sections.push(bulletItem(a)));
    }
    if (cc.pricingImpact) {
      sections.push(subheading('Pricing Impact'));
      sections.push(para(cc.pricingImpact));
    }
  }

  // 10. Risks & Mitigations
  if (proposal.Risks?.length || proposal.Assumptions?.length) {
    addSection('Risks & Mitigations');
    if (proposal.Assumptions?.length) {
      sections.push(subheading('Assumptions'));
      proposal.Assumptions.forEach(a => sections.push(bulletItem(a)));
    }
    if (proposal.Risks?.length) {
      sections.push(subheading('Risk Register'));
      const riskTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              tableHeaderCell('Risk', DWX_RED),
              tableHeaderCell('Impact', DWX_RED),
              tableHeaderCell('Likelihood', DWX_RED),
              tableHeaderCell('Mitigation', DWX_RED),
            ],
          }),
          ...proposal.Risks.map(r =>
            new TableRow({
              children: [
                tableCell(r.risk),
                impactBadge(r.impact),
                impactBadge(r.likelihood || '-'),
                tableCell(r.mitigation),
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
    sections.push(para('By signing below, both parties agree to the terms and conditions outlined in this proposal.'));
    sections.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

    // Client side
    sections.push(subheading('Client'));
    if (sp.clientSignatory) sections.push(para(`Name: ${sp.clientSignatory}`));
    if (sp.clientTitle) sections.push(para(`Title: ${sp.clientTitle}`));
    sections.push(para('Signature: ___________________________'));
    sections.push(para('Date: ___________________________'));

    sections.push(new Paragraph({ spacing: { before: 200 }, children: [] }));

    // DW side
    sections.push(subheading('Digital Workplace'));
    if (sp.dwSignatory) sections.push(para(`Name: ${sp.dwSignatory}`));
    if (sp.dwTitle) sections.push(para(`Title: ${sp.dwTitle}`));
    sections.push(para('Signature: ___________________________'));
    sections.push(para('Date: ___________________________'));
  }

  // ---- Merge sections and tables in order ----
  // Tables need to be inserted at the right positions
  const allContent: (Paragraph | Table)[] = [];
  sections.forEach((section, idx) => {
    allContent.push(section);
    // Insert any tables that should follow this section
    const matchingTables = tables.filter(t => t.afterIndex === idx);
    matchingTables.forEach(t => allContent.push(t.table));
  });

  // ---- Build Document ----
  const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 20, color: DWX_DARK },
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
              new TextRun({ text: 'Digital Workplace', bold: true, size: 56, color: DWX_BLUE }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: 'Proposal Document', size: 28, color: DWX_TEAL }),
            ],
          }),
          // Horizontal rule
          new Paragraph({
            spacing: { after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 6, color: DWX_TEAL, space: 1 },
            },
            children: [],
          }),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: clientName, bold: true, size: 48, color: DWX_DARK }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({ text: serviceName, size: 32, color: DWX_GREY }),
            ],
          }),
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          // Metadata
          para(`Version: v${proposal.Version || 1}`),
          para(`Date: ${dateStr}`),
          para(`Prepared by: ${accountManagerName || 'Digital Workplace'}`),
          para(`Type: ${proposalType || 'Standard'}`),
          ...(proposal.ValidUntil ? [
            para(`Valid until: ${new Date(proposal.ValidUntil).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}`),
          ] : []),
          ...(proposalType === 'Enterprise' ? [
            new Paragraph({
              spacing: { before: 400 },
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'CONFIDENTIAL', bold: true, size: 28, color: 'C0C0C0' }),
              ],
            }),
          ] : []),
          // Page break
          new Paragraph({ children: [new PageBreak()] }),
          // Table of Contents
          heading('Table of Contents', HeadingLevel.HEADING_1),
          ...tocEntries.map((entry, i) => para(`${i + 1}. ${entry}`)),
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
                  new TextRun({ text: `${clientName} — ${serviceName} Proposal`, size: 16, color: DWX_GREY, italics: true }),
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
                  new TextRun({ text: 'Prepared by Digital Workplace | Confidential', size: 16, color: DWX_GREY }),
                ],
              }),
            ],
          }),
        },
        children: allContent,
      },
    ],
  });

  // ---- Save ----
  const blob = await Packer.toBlob(doc);
  const fileName = `${clientName} - ${serviceName} Proposal v${proposal.Version || 1}.docx`;
  saveAs(blob, fileName);
}
