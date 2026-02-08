/**
 * DWx Traffic Manager - Report PDF Generator
 * Generates DW-branded PDF reports from report data using jsPDF + jspdf-autotable.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PipelineReportData,
  AMPerformanceReportData,
  RevenueReportData,
} from '../types/Report';

// ============================================================================
// Brand Colors
// ============================================================================

const DWX_BLUE = [26, 90, 138] as const;      // #1a5a8a
const DWX_TEAL = [30, 107, 123] as const;     // #1e6b7b
const DWX_DARK = [36, 36, 36] as const;       // #242424
const DWX_GREY = [97, 97, 97] as const;       // #616161
const DWX_GREEN = [16, 124, 16] as const;     // #107c10
const DWX_RED = [209, 52, 56] as const;       // #d13438

// ============================================================================
// Helpers
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// Report Title Mapping
// ============================================================================

const REPORT_TITLES: Record<string, string> = {
  'pipeline': 'Pipeline & Funnel Report',
  'am-performance': 'AM Performance Report',
  'revenue': 'Revenue & Commercial Report',
};

const REPORT_FILE_NAMES: Record<string, string> = {
  'pipeline': 'Pipeline_Funnel',
  'am-performance': 'AM_Performance',
  'revenue': 'Revenue_Commercial',
};

// ============================================================================
// TOC Entries
// ============================================================================

const PIPELINE_TOC = [
  'Key Metrics',
  'Stage Breakdown',
  'Conversion Rates',
  'Deal Aging',
  '3-Month Forecast',
  'Top 10 Deals',
];

const AM_PERFORMANCE_TOC = [
  'Key Metrics',
  'AM Leaderboard',
  'Win Rate by AM',
  'Monthly Activity',
];

const REVENUE_TOC = [
  'Key Metrics',
  'Revenue by Service',
  'Revenue by Industry',
  'Monthly Revenue Trends',
  'Deal Size Distribution',
];

// ============================================================================
// Main Export
// ============================================================================

export function generateReportPdf(
  reportData: PipelineReportData | AMPerformanceReportData | RevenueReportData,
): void {
  const config = reportData.config;
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
    doc.setTextColor(...DWX_BLUE);
    doc.setFont('helvetica', 'bold');
    doc.text(`${sectionNumber}. ${title}`, margin, currentY);
    currentY += 3;
    // Underline
    doc.setDrawColor(...DWX_BLUE);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, margin + contentWidth, currentY);
    currentY += 8;
  }

  function getLastAutoTableY(): number {
    return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  // ===========================================================================
  // Cover Page
  // ===========================================================================

  // Top blue stripe
  doc.setFillColor(...DWX_BLUE);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Company name in white on blue stripe
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Workplace', margin, 35);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Report', margin, 48);

  // Teal accent line
  doc.setFillColor(...DWX_TEAL);
  doc.rect(0, 80, pageWidth, 3, 'F');

  // Report title
  doc.setFontSize(24);
  doc.setTextColor(...DWX_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text(REPORT_TITLES[config.type] || 'Report', margin, 110);

  // Date range label
  doc.setFontSize(16);
  doc.setTextColor(...DWX_GREY);
  doc.setFont('helvetica', 'normal');
  doc.text(config.dateRange.label, margin, 122);

  // Metadata block
  doc.setFontSize(11);
  doc.setTextColor(...DWX_DARK);
  currentY = 150;
  const metadata: [string, string][] = [
    ['Generated by', config.generatedBy || 'Digital Workplace'],
    ['Date', formatDate()],
    ['Period', config.dateRange.label],
  ];
  for (const [label, value] of metadata) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 40, currentY);
    currentY += 7;
  }

  // Footer on cover
  doc.setFontSize(9);
  doc.setTextColor(...DWX_GREY);
  doc.text('Prepared by Digital Workplace | Confidential', margin, pageHeight - 15);

  // ===========================================================================
  // Table of Contents (page 2)
  // ===========================================================================

  doc.addPage();
  currentY = margin;
  doc.setFontSize(20);
  doc.setTextColor(...DWX_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', margin, currentY);
  currentY += 12;

  let tocEntries: string[];
  switch (config.type) {
    case 'pipeline':
      tocEntries = PIPELINE_TOC;
      break;
    case 'am-performance':
      tocEntries = AM_PERFORMANCE_TOC;
      break;
    case 'revenue':
      tocEntries = REVENUE_TOC;
      break;
    default:
      tocEntries = [];
  }

  doc.setFontSize(12);
  doc.setTextColor(...DWX_DARK);
  doc.setFont('helvetica', 'normal');
  tocEntries.forEach((entry, i) => {
    doc.text(`${i + 1}. ${entry}`, margin + 4, currentY);
    currentY += 8;
  });

  // ===========================================================================
  // Content Sections — dispatch by report type
  // ===========================================================================

  doc.addPage();
  currentY = margin;
  sectionNumber = 0;

  switch (config.type) {
    case 'pipeline':
      renderPipelineReport(reportData as PipelineReportData);
      break;
    case 'am-performance':
      renderAMPerformanceReport(reportData as AMPerformanceReportData);
      break;
    case 'revenue':
      renderRevenueReport(reportData as RevenueReportData);
      break;
  }

  // ===========================================================================
  // Page Numbers (skip cover page)
  // ===========================================================================

  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...DWX_GREY);
    doc.text(`Page ${i - 1} of ${pageCount - 1}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.text(`DWx ${REPORT_TITLES[config.type] || 'Report'}`, margin, pageHeight - 10);
  }

  // ===========================================================================
  // Save
  // ===========================================================================

  const fileName = `DWx_${REPORT_FILE_NAMES[config.type] || 'Report'}_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);

  // =========================================================================
  // Pipeline Report Renderer
  // =========================================================================

  function renderPipelineReport(data: PipelineReportData): void {
    // --- 1. Key Metrics ---
    addSectionHeading('Key Metrics');
    addNewPageIfNeeded(40);
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Metric', 'Value']],
      body: [
        ['Total Pipeline', formatCurrency(data.overview.totalPipeline)],
        ['Weighted Pipeline', formatCurrency(data.overview.weightedPipeline)],
        ['Average Deal Size', formatCurrency(data.overview.avgDealSize)],
        ['Hot Leads', String(data.overview.hotLeads)],
        ['Open Deals', String(data.overview.openDeals)],
      ],
      headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    });
    currentY = getLastAutoTableY() + 10;

    // --- 2. Stage Breakdown ---
    if (data.stageBreakdown.length > 0) {
      addSectionHeading('Stage Breakdown');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Stage', 'Count', 'Value (ZAR)', 'Weighted Value (ZAR)', '% of Pipeline']],
        body: data.stageBreakdown.map(s => [
          s.stage,
          String(s.count),
          formatCurrency(s.value),
          formatCurrency(s.weightedValue),
          `${s.percentage.toFixed(1)}%`,
        ]),
        headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'center' },
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 3. Conversion Rates ---
    if (data.conversionRates.length > 0) {
      addSectionHeading('Conversion Rates');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Transition', 'Rate (%)']],
        body: data.conversionRates.map(c => [
          `${c.from} \u2192 ${c.to}`,
          `${c.rate.toFixed(1)}%`,
        ]),
        headStyles: { fillColor: [...DWX_TEAL], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: { 1: { halign: 'center' } },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 4. Deal Aging ---
    if (data.dealAging.length > 0) {
      addSectionHeading('Deal Aging');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Stage', 'Avg Days', 'Min Days', 'Max Days', 'Deals']],
        body: data.dealAging.map(a => [
          a.stage,
          String(a.avgDays),
          String(a.minDays),
          String(a.maxDays),
          String(a.dealCount),
        ]),
        headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 5. 3-Month Forecast ---
    if (data.forecast.length > 0) {
      addSectionHeading('3-Month Forecast');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Period', 'Expected (ZAR)', 'Weighted (ZAR)']],
        body: data.forecast.map(f => [
          f.period,
          formatCurrency(f.expected),
          formatCurrency(f.weighted),
        ]),
        headStyles: { fillColor: [...DWX_GREEN], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 6. Top 10 Deals ---
    if (data.topDeals.length > 0) {
      addSectionHeading('Top 10 Deals');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Client', 'Service', 'Value (ZAR)', 'Stage', 'Days', 'Probability']],
        body: data.topDeals.map(d => [
          d.client,
          d.service,
          formatCurrency(d.value),
          d.stage,
          String(d.daysInPipeline),
          `${d.probability}%`,
        ]),
        headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          2: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'center' },
        },
      });
      currentY = getLastAutoTableY() + 10;
    }
  }

  // =========================================================================
  // AM Performance Report Renderer
  // =========================================================================

  function renderAMPerformanceReport(data: AMPerformanceReportData): void {
    // --- 1. Key Metrics ---
    addSectionHeading('Key Metrics');
    addNewPageIfNeeded(40);
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Metric', 'Value']],
      body: [
        ['Active Account Managers', String(data.summary.totalAMs)],
        ['Average Win Rate', `${data.summary.avgWinRate.toFixed(1)}%`],
        ['Total Revenue', formatCurrency(data.summary.totalRevenue)],
        ['Avg Cycle Time', `${data.summary.avgCycleTime} days`],
      ],
      headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    });
    currentY = getLastAutoTableY() + 10;

    // --- 2. AM Leaderboard ---
    if (data.leaderboard.length > 0) {
      addSectionHeading('AM Leaderboard');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Rank', 'Name', 'Deals', 'Won', 'Lost', 'Open', 'Win Rate (%)', 'Revenue (ZAR)', 'Avg Deal (ZAR)', 'Avg Cycle (days)']],
        body: data.leaderboard.map(am => [
          String(am.rank),
          am.name,
          String(am.totalDeals),
          String(am.wonDeals),
          String(am.lostDeals),
          String(am.openDeals),
          `${am.winRate.toFixed(1)}%`,
          formatCurrency(am.totalRevenue),
          formatCurrency(am.avgDealSize),
          String(am.avgCycleDays),
        ]),
        headStyles: { fillColor: [...DWX_BLUE], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 28 },
          2: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 10, halign: 'center' },
          4: { cellWidth: 10, halign: 'center' },
          5: { cellWidth: 10, halign: 'center' },
          6: { cellWidth: 18, halign: 'center' },
          7: { cellWidth: 25, halign: 'right' },
          8: { cellWidth: 23, halign: 'right' },
          9: { cellWidth: 20, halign: 'center' },
        },
        didParseCell: (cellData) => {
          // Highlight top 3 ranks
          if (cellData.section === 'body' && cellData.row.index < 3) {
            cellData.cell.styles.fontStyle = 'bold';
          }
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 3. Win Rate by AM ---
    if (data.winRateByAM.length > 0) {
      addSectionHeading('Win Rate by AM');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Name', 'Win Rate (%)', 'Total Deals']],
        body: data.winRateByAM.map(w => [
          w.name,
          `${w.winRate.toFixed(1)}%`,
          String(w.totalDeals),
        ]),
        headStyles: { fillColor: [...DWX_TEAL], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
        },
        didParseCell: (cellData) => {
          // Color-code win rates: green >= 60%, red < 30%
          if (cellData.section === 'body' && cellData.column.index === 1) {
            const rate = data.winRateByAM[cellData.row.index]?.winRate ?? 0;
            if (rate >= 60) {
              cellData.cell.styles.textColor = [...DWX_GREEN];
              cellData.cell.styles.fontStyle = 'bold';
            } else if (rate < 30) {
              cellData.cell.styles.textColor = [...DWX_RED];
            }
          }
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 4. Monthly Activity ---
    if (data.activityTrend.length > 0) {
      addSectionHeading('Monthly Activity');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Period', 'Created', 'Won', 'Lost']],
        body: data.activityTrend.map(t => [
          t.period,
          String(t.created),
          String(t.won),
          String(t.lost),
        ]),
        headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
        },
        didParseCell: (cellData) => {
          // Color-code Won green, Lost red
          if (cellData.section === 'body' && cellData.column.index === 2) {
            cellData.cell.styles.textColor = [...DWX_GREEN];
          }
          if (cellData.section === 'body' && cellData.column.index === 3) {
            cellData.cell.styles.textColor = [...DWX_RED];
          }
        },
      });
      currentY = getLastAutoTableY() + 10;
    }
  }

  // =========================================================================
  // Revenue Report Renderer
  // =========================================================================

  function renderRevenueReport(data: RevenueReportData): void {
    // --- 1. Key Metrics ---
    addSectionHeading('Key Metrics');
    addNewPageIfNeeded(40);
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Metric', 'Value']],
      body: [
        ['Total Won Revenue', formatCurrency(data.overview.totalWonRevenue)],
        ['Active Pipeline', formatCurrency(data.overview.activePipeline)],
        ['Average Deal Size', formatCurrency(data.overview.avgDealSize)],
        ['Win Rate', `${data.overview.winRate.toFixed(1)}%`],
        ['Forecasted Revenue', formatCurrency(data.overview.forecastedRevenue)],
      ],
      headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    });
    currentY = getLastAutoTableY() + 10;

    // --- 2. Revenue by Service ---
    if (data.revenueByService.length > 0) {
      addSectionHeading('Revenue by Service');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Service', 'Revenue (ZAR)', 'Deal Count']],
        body: data.revenueByService.map(s => [
          s.service,
          formatCurrency(s.revenue),
          String(s.dealCount),
        ]),
        headStyles: { fillColor: [...DWX_GREEN], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'center' },
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 3. Revenue by Industry ---
    if (data.revenueByIndustry.length > 0) {
      addSectionHeading('Revenue by Industry');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Industry', 'Revenue (ZAR)', 'Deal Count', '% of Total']],
        body: data.revenueByIndustry.map(ind => [
          ind.industry,
          formatCurrency(ind.revenue),
          String(ind.dealCount),
          `${ind.percentage.toFixed(1)}%`,
        ]),
        headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'center' },
          3: { halign: 'center' },
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 4. Monthly Revenue Trends ---
    if (data.monthlyTrends.length > 0) {
      addSectionHeading('Monthly Revenue Trends');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Period', 'Revenue (ZAR)', 'Deals']],
        body: data.monthlyTrends.map(m => [
          m.period,
          formatCurrency(m.revenue),
          String(m.dealCount),
        ]),
        headStyles: { fillColor: [...DWX_TEAL], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'center' },
        },
      });
      currentY = getLastAutoTableY() + 10;
    }

    // --- 5. Deal Size Distribution ---
    if (data.dealSizeDistribution.length > 0) {
      addSectionHeading('Deal Size Distribution');
      addNewPageIfNeeded(30);
      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Range', 'Won', 'Lost', 'Won Revenue (ZAR)']],
        body: data.dealSizeDistribution.map(d => [
          d.label,
          String(d.wonCount),
          String(d.lostCount),
          formatCurrency(d.wonRevenue),
        ]),
        headStyles: { fillColor: [...DWX_BLUE], fontSize: 10 },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
        },
        didParseCell: (cellData) => {
          // Color-code Won green, Lost red
          if (cellData.section === 'body' && cellData.column.index === 1) {
            cellData.cell.styles.textColor = [...DWX_GREEN];
          }
          if (cellData.section === 'body' && cellData.column.index === 2) {
            cellData.cell.styles.textColor = [...DWX_RED];
          }
        },
      });
      currentY = getLastAutoTableY() + 10;
    }
  }
}
