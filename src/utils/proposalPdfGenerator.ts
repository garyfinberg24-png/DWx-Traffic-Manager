/**
 * DWx Traffic Manager - Proposal PDF Generator
 * Generates a polished template-themed PDF from proposal data using jsPDF + jspdf-autotable.
 * Theme colours change based on the selected template (Standard/Enterprise/Custom).
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Proposal, ProposalType, getTemplateTheme } from '../types/Proposal';

// ============================================================================
// Types
// ============================================================================

export interface ProposalPdfContext {
  proposal: Proposal;
  clientName: string;
  serviceName: string;
  accountManagerName: string;
  proposalType: ProposalType;
  templateName?: string;
}

// ============================================================================
// Colour Helpers
// ============================================================================

/** Convert hex colour (e.g. '1A5A8A') to RGB tuple */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// ============================================================================
// Main Export
// ============================================================================

export async function generateProposalPdf(context: ProposalPdfContext): Promise<void> {
  const { proposal, clientName, serviceName, accountManagerName, proposalType, templateName } = context;
  const theme = getTemplateTheme(templateName);

  // Resolve theme hex colours to RGB tuples for jsPDF
  const PRIMARY = hexToRgb(theme.primary);
  const ACCENT = hexToRgb(theme.accent);
  const DARK = hexToRgb(theme.dark);
  const GREY = hexToRgb(theme.grey);
  const SUCCESS = hexToRgb(theme.success);
  const DANGER = hexToRgb(theme.danger);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();   // 210
  const pageHeight = doc.internal.pageSize.getHeight(); // 297
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;
  let sectionNumber = 0;

  // ---- Helper Functions ----

  function addNewPageIfNeeded(requiredSpace: number): void {
    if (currentY + requiredSpace > pageHeight - 30) {
      doc.addPage();
      currentY = margin;
    }
  }

  function addSectionHeading(title: string): void {
    sectionNumber++;
    addNewPageIfNeeded(20);
    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionNumber}. ${title}`, margin, currentY);
    currentY += 3;
    // Underline
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 8;
  }

  function addParagraph(text: string): void {
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    addNewPageIfNeeded(lines.length * 5 + 4);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 5 + 4;
  }

  function addBulletList(items: string[]): void {
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    for (const item of items) {
      const lines = doc.splitTextToSize(item, contentWidth - 8);
      addNewPageIfNeeded(lines.length * 5 + 2);
      doc.text('\u2022', margin + 2, currentY);
      doc.text(lines, margin + 8, currentY);
      currentY += lines.length * 5 + 2;
    }
    currentY += 2;
  }

  function addSubheading(text: string): void {
    addNewPageIfNeeded(12);
    doc.setFontSize(12);
    doc.setTextColor(...ACCENT);
    doc.setFont('helvetica', 'bold');
    doc.text(text, margin, currentY);
    currentY += 7;
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  // ---- Cover Page ----

  // Top primary colour stripe
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // CONFIDENTIAL watermark (driven by theme, not proposalType)
  if (theme.confidentialWatermark) {
    doc.setFontSize(60);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'bold');
    doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight / 2, { angle: 45, align: 'center' });
  }

  // Company name in white on stripe
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(theme.companyName, margin, 35);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(theme.coverSubtitle, margin, 48);

  // Accent line
  doc.setFillColor(...ACCENT);
  doc.rect(0, 80, pageWidth, 3, 'F');

  // Client name (large)
  doc.setFontSize(24);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(clientName, margin, 110);

  // Service name
  doc.setFontSize(16);
  doc.setTextColor(...GREY);
  doc.setFont('helvetica', 'normal');
  doc.text(serviceName, margin, 122);

  // Metadata block
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  currentY = 150;
  const metadata: [string, string][] = [
    ['Version', `v${proposal.Version || 1}`],
    ['Date', new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })],
    ['Prepared by', accountManagerName || theme.companyName],
    ['Type', proposalType || 'Standard'],
  ];
  if (proposal.ValidUntil) {
    metadata.push(['Valid until', new Date(proposal.ValidUntil).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })]);
  }
  for (const [label, value] of metadata) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, currentY);
    currentY += 7;
  }

  // Footer on cover
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text(theme.footerText, margin, pageHeight - 15);

  // ---- Table of Contents ----
  doc.addPage();
  currentY = margin;
  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', margin, currentY);
  currentY += 12;

  // Build TOC entries based on which sections have data
  const tocEntries: string[] = [];
  if (proposal.ExecutiveSummary) tocEntries.push('Executive Summary');
  if (proposal.SolutionOverview) tocEntries.push('Solution Overview');
  if (proposal.TechnologyStack) tocEntries.push('Technology Stack');
  if (proposal.ScopeOfWork) tocEntries.push('Scope of Work');
  if (proposal.PricingBreakdown) tocEntries.push('Pricing');
  if (proposal.Timeline) tocEntries.push('Timeline & Milestones');
  if (proposal.TeamComposition) tocEntries.push('Team Composition');
  if (proposal.Terms) tocEntries.push('Terms & Conditions');
  if (proposal.ChangeControl) tocEntries.push('Change Control');
  if (proposal.Risks?.length || proposal.Assumptions?.length) tocEntries.push('Risks & Mitigations');
  if (proposal.SigningPage) tocEntries.push('Signing Page');

  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'normal');
  tocEntries.forEach((entry, i) => {
    doc.text(`${i + 1}. ${entry}`, margin + 4, currentY);
    currentY += 8;
  });

  // ---- Content Sections ----
  doc.addPage();
  currentY = margin;
  sectionNumber = 0;

  // 1. Executive Summary
  if (proposal.ExecutiveSummary) {
    const es = proposal.ExecutiveSummary;
    addSectionHeading('Executive Summary');
    if (es.overview) addParagraph(es.overview);
    if (es.objectives?.length) {
      addSubheading('Objectives');
      addBulletList(es.objectives);
    }
    if (es.successCriteria?.length) {
      addSubheading('Success Criteria');
      addBulletList(es.successCriteria);
    }
  }

  // 2. Solution Overview
  if (proposal.SolutionOverview) {
    const so = proposal.SolutionOverview;
    addSectionHeading('Solution Overview');
    if (so.description) addParagraph(so.description);
    if (so.approach) {
      addSubheading('Approach');
      addParagraph(so.approach);
    }
    if (so.differentiators?.length) {
      addSubheading('Key Differentiators');
      addBulletList(so.differentiators);
    }
  }

  // 3. Technology Stack
  if (proposal.TechnologyStack && proposal.TechnologyStack.technologies?.length) {
    addSectionHeading('Technology Stack');
    addNewPageIfNeeded(30);
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Technology', 'Role', 'Justification']],
      body: proposal.TechnologyStack.technologies.map(t => [t.name, t.role, t.justification]),
      headStyles: { fillColor: [...PRIMARY], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // 4. Scope of Work
  if (proposal.ScopeOfWork) {
    const sow = proposal.ScopeOfWork;
    addSectionHeading('Scope of Work');
    if (sow.deliverables?.length) {
      addSubheading('Deliverables');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Deliverable', 'Description', 'Est. Hours']],
        body: sow.deliverables.map(d => [d.title, d.description, String(d.hours || '-')]),
        headStyles: { fillColor: [...PRIMARY], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 45 }, 2: { cellWidth: 25, halign: 'center' } },
      });
      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }
    if (sow.exclusions?.length) {
      addSubheading('Exclusions');
      addBulletList(sow.exclusions);
    }
  }

  // 5. Pricing
  if (proposal.PricingBreakdown) {
    const pb = proposal.PricingBreakdown;
    addSectionHeading('Pricing');
    if (pb.lineItems?.length) {
      addNewPageIfNeeded(30);
      const tableBody: string[][] = pb.lineItems.map(li => [
        li.description,
        String(li.quantity || 1),
        formatCurrency(li.unitPrice || 0),
        formatCurrency(li.total || 0),
      ]);
      // Add summary rows
      const lineItemCount = pb.lineItems.length;
      if (pb.subtotal) tableBody.push(['', '', 'Subtotal', formatCurrency(pb.subtotal)]);
      if (pb.discount) tableBody.push(['', '', 'Discount', `-${formatCurrency(pb.discount)}`]);
      if (pb.tax) tableBody.push(['', '', 'Tax', formatCurrency(pb.tax)]);
      if (pb.grandTotal) tableBody.push(['', '', 'Grand Total', formatCurrency(pb.grandTotal)]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: tableBody,
        headStyles: { fillColor: [...SUCCESS], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
        },
        didParseCell: (data) => {
          // Bold the summary rows
          if (data.section === 'body' && data.row.index >= lineItemCount) {
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });
      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  // 6. Timeline
  if (proposal.Timeline && proposal.Timeline.phases?.length) {
    addSectionHeading('Timeline & Milestones');
    addNewPageIfNeeded(30);
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Phase', 'Start Week', 'End Week', 'Milestones']],
      body: proposal.Timeline.phases.map(p => [
        p.name,
        `Week ${p.startWeek}`,
        `Week ${p.endWeek}`,
        p.milestones?.join(', ') || '-',
      ]),
      headStyles: { fillColor: [...PRIMARY], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
    });
    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    if (proposal.Timeline.totalWeeks) {
      addParagraph(`Total estimated duration: ${proposal.Timeline.totalWeeks} weeks`);
    }
  }

  // 7. Team Composition
  if (proposal.TeamComposition && proposal.TeamComposition.members?.length) {
    addSectionHeading('Team Composition');
    addNewPageIfNeeded(30);
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Role', 'Name', 'Responsibility']],
      body: proposal.TeamComposition.members.map(m => [m.role, m.name || '-', m.responsibility]),
      headStyles: { fillColor: [...ACCENT], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
    });
    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // 8. Terms & Conditions
  if (proposal.Terms) {
    const t = proposal.Terms;
    addSectionHeading('Terms & Conditions');
    const termItems: [string, string][] = ([
      ['Payment Terms', t.paymentTerms],
      ['Warranty', t.warranty],
      ['Liability', t.liability],
      ['Confidentiality', t.confidentiality],
      ['IP Ownership', t.ipOwnership],
      ['Termination', t.termination],
    ] as [string, string][]).filter(([, v]) => v);
    for (const [label, value] of termItems) {
      addSubheading(label);
      addParagraph(value);
    }
  }

  // 9. Change Control
  if (proposal.ChangeControl) {
    const cc = proposal.ChangeControl;
    addSectionHeading('Change Control');
    if (cc.process) addParagraph(cc.process);
    if (cc.approvalLevels?.length) {
      addSubheading('Approval Levels');
      addBulletList(cc.approvalLevels);
    }
    if (cc.pricingImpact) {
      addSubheading('Pricing Impact');
      addParagraph(cc.pricingImpact);
    }
  }

  // 10. Risks & Mitigations
  if (proposal.Risks?.length || proposal.Assumptions?.length) {
    addSectionHeading('Risks & Mitigations');
    if (proposal.Assumptions?.length) {
      addSubheading('Assumptions');
      addBulletList(proposal.Assumptions);
    }
    if (proposal.Risks?.length) {
      addSubheading('Risk Register');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Risk', 'Impact', 'Likelihood', 'Mitigation']],
        body: proposal.Risks.map(r => [r.risk, r.impact, r.likelihood || '-', r.mitigation]),
        headStyles: { fillColor: [...DANGER], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 1: { cellWidth: 22 }, 2: { cellWidth: 25 } },
      });
      currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  // 11. Signing Page
  if (proposal.SigningPage) {
    const sp = proposal.SigningPage;
    doc.addPage();
    currentY = margin;
    addSectionHeading('Signing Page');

    currentY += 5;
    addParagraph('By signing below, both parties agree to the terms and conditions outlined in this proposal.');
    currentY += 10;

    // Two signature blocks side by side
    const halfWidth = (contentWidth - 20) / 2;
    const sigBlockY = currentY;

    // Client side
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.text('Client', margin, sigBlockY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (sp.clientSignatory) doc.text(`Name: ${sp.clientSignatory}`, margin, sigBlockY + 8);
    if (sp.clientTitle) doc.text(`Title: ${sp.clientTitle}`, margin, sigBlockY + 15);
    doc.text('Signature: ___________________', margin, sigBlockY + 29);
    doc.text('Date: ___________________', margin, sigBlockY + 36);

    // DW side
    const dwX = margin + halfWidth + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(theme.companyName, dwX, sigBlockY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (sp.dwSignatory) doc.text(`Name: ${sp.dwSignatory}`, dwX, sigBlockY + 8);
    if (sp.dwTitle) doc.text(`Title: ${sp.dwTitle}`, dwX, sigBlockY + 15);
    doc.text('Signature: ___________________', dwX, sigBlockY + 29);
    doc.text('Date: ___________________', dwX, sigBlockY + 36);
  }

  // ---- Page Numbers (skip cover page) ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`Page ${i - 1} of ${pageCount - 1}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text(`${clientName} \u2014 ${serviceName} ${theme.headerSuffix}`, margin, pageHeight - 10);
  }

  // ---- Save ----
  const fileName = `${clientName} - ${serviceName} Proposal v${proposal.Version || 1}.pdf`;
  doc.save(fileName);
}
