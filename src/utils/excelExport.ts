import { Booking } from '../types/Booking';
import { ServiceRequest, Specialist } from '../types/ServiceRequest';
import { ProductRequest } from '../types/ProductRequest';
import {
  PipelineReportData,
  AMPerformanceReportData,
  RevenueReportData,
} from '../types/Report';
import { format } from 'date-fns';

interface ExportColumn<T = Booking> {
  header: string;
  accessor: (item: T) => string | number;
  width?: number;
}

const BOOKING_COLUMNS: ExportColumn<Booking>[] = [
  { header: 'ID', accessor: (b) => b.Id, width: 10 },
  { header: 'Client Name', accessor: (b) => b.ClientName, width: 30 },
  { header: 'Booking Type', accessor: (b) => b.BookingType, width: 15 },
  { header: 'Status', accessor: (b) => b.Status, width: 20 },
  { header: 'License Count', accessor: (b) => b.LicenseCount, width: 15 },
  { header: 'Premium Client', accessor: (b) => (b.IsPremiumClient ? 'Yes' : 'No'), width: 15 },
  { header: 'Account Manager', accessor: (b) => b.AccountManagerName, width: 25 },
  { header: 'Account Manager Email', accessor: (b) => b.AccountManagerEmail, width: 30 },
  {
    header: 'Confirmed Date',
    accessor: (b) =>
      b.ConfirmedDateTime
        ? format(new Date(b.ConfirmedDateTime), 'yyyy-MM-dd HH:mm')
        : 'Not Confirmed',
    width: 20,
  },
  {
    header: 'Proposed Slot 1',
    accessor: (b) => format(new Date(b.ProposedSlot1), 'yyyy-MM-dd HH:mm'),
    width: 20,
  },
  {
    header: 'Proposed Slot 2',
    accessor: (b) => format(new Date(b.ProposedSlot2), 'yyyy-MM-dd HH:mm'),
    width: 20,
  },
  {
    header: 'Proposed Slot 3',
    accessor: (b) => format(new Date(b.ProposedSlot3), 'yyyy-MM-dd HH:mm'),
    width: 20,
  },
  { header: 'Comments', accessor: (b) => b.Comments || '', width: 40 },
  { header: 'Outcome', accessor: (b) => b.Outcome || '', width: 30 },
  { header: 'Next Steps', accessor: (b) => b.NextSteps || '', width: 30 },
  {
    header: 'Created',
    accessor: (b) => format(new Date(b.Created), 'yyyy-MM-dd HH:mm'),
    width: 20,
  },
];

/**
 * Escape special characters for CSV
 */
function escapeCSV(value: string | number): string {
  const stringValue = String(value);
  // If the value contains comma, newline, or double quote, wrap in quotes
  if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert bookings to CSV string
 */
export function bookingsToCSV(bookings: Booking[]): string {
  const headers = BOOKING_COLUMNS.map((col) => col.header);
  const headerRow = headers.map(escapeCSV).join(',');

  const dataRows = bookings.map((booking) =>
    BOOKING_COLUMNS.map((col) => escapeCSV(col.accessor(booking))).join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download bookings as CSV file
 */
export function downloadBookingsCSV(bookings: Booking[], filename?: string): void {
  const csv = bookingsToCSV(bookings);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `DWx_Bookings_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert bookings to Excel-compatible XML (SpreadsheetML)
 * This creates an .xls file that Excel can open without additional libraries
 */
export function bookingsToExcelXML(bookings: Booking[]): string {
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1E6B7B" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Data">
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Premium">
      <Font ss:Color="#8B6914"/>
      <Interior ss:Color="#FFF4CE" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Confirmed">
      <Font ss:Color="#107C10"/>
      <Interior ss:Color="#DFF6DD" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Cancelled">
      <Font ss:Color="#D13438"/>
      <Interior ss:Color="#FDE7E9" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Bookings">
    <Table>
      ${BOOKING_COLUMNS.map(
        (col) => `<Column ss:Width="${(col.width || 15) * 6}"/>`
      ).join('\n      ')}
      <Row>
        ${BOOKING_COLUMNS.map(
          (col) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`
        ).join('\n        ')}
      </Row>
      ${bookings
        .map(
          (booking) => `<Row>
        ${BOOKING_COLUMNS.map((col) => {
          const value = col.accessor(booking);
          const type = typeof value === 'number' ? 'Number' : 'String';
          let styleId = 'Data';
          if (booking.IsPremiumClient && col.header === 'Premium Client') {
            styleId = 'Premium';
          } else if (booking.Status === 'Confirmed' && col.header === 'Status') {
            styleId = 'Confirmed';
          } else if (booking.Status === 'Cancelled' && col.header === 'Status') {
            styleId = 'Cancelled';
          }
          return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXML(String(value))}</Data></Cell>`;
        }).join('\n        ')}
      </Row>`
        )
        .join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`;

  return workbook;
}

/**
 * Escape special characters for XML
 */
function escapeXML(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download bookings as Excel file
 */
export function downloadBookingsExcel(bookings: Booking[], filename?: string): void {
  const xml = bookingsToExcelXML(bookings);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);

  const defaultFilename = `DWx_Bookings_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xls`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Generic Excel/CSV Export
// ============================================================================

/**
 * Generic function to convert any array of items to CSV
 */
function itemsToCSV<T>(items: T[], columns: ExportColumn<T>[]): string {
  const headerRow = columns.map((col) => escapeCSV(col.header)).join(',');
  const dataRows = items.map((item) =>
    columns.map((col) => escapeCSV(col.accessor(item))).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Generic function to convert any array of items to Excel XML
 */
function itemsToExcelXML<T>(
  items: T[],
  columns: ExportColumn<T>[],
  sheetName: string,
  getRowStyle?: (item: T, colHeader: string) => string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1E6B7B" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Data">
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Won">
      <Font ss:Color="#107C10"/>
      <Interior ss:Color="#DFF6DD" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Lost">
      <Font ss:Color="#D13438"/>
      <Interior ss:Color="#FDE7E9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Hot">
      <Font ss:Color="#D13438"/>
      <Interior ss:Color="#FDE7E9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Premium">
      <Font ss:Color="#8B6914"/>
      <Interior ss:Color="#FFF4CE" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Confirmed">
      <Font ss:Color="#107C10"/>
      <Interior ss:Color="#DFF6DD" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Cancelled">
      <Font ss:Color="#D13438"/>
      <Interior ss:Color="#FDE7E9" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXML(sheetName)}">
    <Table>
      ${columns.map((col) => `<Column ss:Width="${(col.width || 15) * 6}"/>`).join('\n      ')}
      <Row>
        ${columns.map((col) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`).join('\n        ')}
      </Row>
      ${items
        .map(
          (item) => `<Row>
        ${columns
          .map((col) => {
            const value = col.accessor(item);
            const type = typeof value === 'number' ? 'Number' : 'String';
            const styleId = getRowStyle ? getRowStyle(item, col.header) : 'Data';
            return `<Cell ss:StyleID="${styleId}"><Data ss:Type="${type}">${escapeXML(String(value))}</Data></Cell>`;
          })
          .join('\n        ')}
      </Row>`
        )
        .join('\n      ')}
    </Table>
  </Worksheet>
</Workbook>`;
}

/**
 * Generic download helper
 */
function downloadExcel(xml: string, defaultName: string, filename?: string): void {
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadCSV(csv: string, defaultName: string, filename?: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Service Request Export
// ============================================================================

const SERVICE_REQUEST_COLUMNS: ExportColumn<ServiceRequest>[] = [
  { header: 'ID', accessor: (r) => r.Id, width: 8 },
  { header: 'Client', accessor: (r) => r.ClientName, width: 25 },
  { header: 'Service', accessor: (r) => r.ServiceName, width: 30 },
  { header: 'Stage', accessor: (r) => r.FunnelStage, width: 15 },
  { header: 'Interest', accessor: (r) => r.InterestLevel, width: 10 },
  { header: 'Deal Value', accessor: (r) => r.DealValue || 0, width: 15 },
  { header: 'Probability', accessor: (r) => r.DealProbability ? `${r.DealProbability}%` : '-', width: 12 },
  { header: 'Weighted Pipeline', accessor: (r) => r.WeightedPipeline || 0, width: 18 },
  { header: 'Account Manager', accessor: (r) => r.AccountManagerName, width: 25 },
  { header: 'Contact', accessor: (r) => r.ContactName, width: 20 },
  { header: 'Contact Email', accessor: (r) => r.ContactEmail, width: 25 },
  { header: 'Industry', accessor: (r) => r.Industry || '-', width: 15 },
  { header: 'Company Size', accessor: (r) => r.CompanySize || '-', width: 12 },
  { header: 'Specialist', accessor: (r) => r.AssignedSpecialistName || 'Unassigned', width: 22 },
  { header: 'Expected Close', accessor: (r) => r.ExpectedCloseDate ? format(new Date(r.ExpectedCloseDate), 'yyyy-MM-dd') : '-', width: 15 },
  { header: 'Created', accessor: (r) => format(new Date(r.Created), 'yyyy-MM-dd'), width: 12 },
];

export function downloadServiceRequestsExcel(requests: ServiceRequest[], filename?: string): void {
  const xml = itemsToExcelXML(requests, SERVICE_REQUEST_COLUMNS, 'Service Requests', (r, col) => {
    if (col === 'Stage' && r.FunnelStage === 'Won') return 'Won';
    if (col === 'Stage' && r.FunnelStage === 'Lost') return 'Lost';
    if (col === 'Interest' && r.InterestLevel === 'Hot') return 'Hot';
    return 'Data';
  });
  downloadExcel(xml, `DWx_ServiceRequests_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xls`, filename);
}

export function downloadServiceRequestsCSV(requests: ServiceRequest[], filename?: string): void {
  const csv = itemsToCSV(requests, SERVICE_REQUEST_COLUMNS);
  downloadCSV(csv, `DWx_ServiceRequests_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`, filename);
}

// ============================================================================
// Product Request Export
// ============================================================================

const PRODUCT_REQUEST_COLUMNS: ExportColumn<ProductRequest>[] = [
  { header: 'ID', accessor: (r) => r.Id, width: 8 },
  { header: 'Client', accessor: (r) => r.ClientName, width: 25 },
  { header: 'Product', accessor: (r) => r.ProductName, width: 25 },
  { header: 'Type', accessor: (r) => r.RequestType, width: 18 },
  { header: 'Product Type', accessor: (r) => r.ProductType, width: 15 },
  { header: 'Status', accessor: (r) => r.Status, width: 18 },
  { header: 'Premium', accessor: (r) => r.IsPremiumClient ? 'Yes' : 'No', width: 10 },
  { header: 'Licenses', accessor: (r) => r.LicenseCount || 0, width: 10 },
  { header: 'Est. Value', accessor: (r) => r.EstimatedValue || 0, width: 15 },
  { header: 'Account Manager', accessor: (r) => r.AccountManagerName, width: 25 },
  { header: 'Contact', accessor: (r) => r.ContactName, width: 20 },
  { header: 'Specialist', accessor: (r) => r.AssignedSpecialistName || 'Unassigned', width: 22 },
  { header: 'Confirmed Date', accessor: (r) => r.ConfirmedDateTime ? format(new Date(r.ConfirmedDateTime), 'yyyy-MM-dd HH:mm') : '-', width: 18 },
  { header: 'Created', accessor: (r) => format(new Date(r.Created), 'yyyy-MM-dd'), width: 12 },
];

export function downloadProductRequestsExcel(requests: ProductRequest[], filename?: string): void {
  const xml = itemsToExcelXML(requests, PRODUCT_REQUEST_COLUMNS, 'Product Requests', (r, col) => {
    if (col === 'Status' && r.Status === 'Confirmed') return 'Confirmed';
    if (col === 'Status' && r.Status === 'Cancelled') return 'Cancelled';
    if (col === 'Premium' && r.IsPremiumClient) return 'Premium';
    return 'Data';
  });
  downloadExcel(xml, `DWx_ProductRequests_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xls`, filename);
}

export function downloadProductRequestsCSV(requests: ProductRequest[], filename?: string): void {
  const csv = itemsToCSV(requests, PRODUCT_REQUEST_COLUMNS);
  downloadCSV(csv, `DWx_ProductRequests_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`, filename);
}

// ============================================================================
// Specialist Export
// ============================================================================

const SPECIALIST_COLUMNS: ExportColumn<Specialist>[] = [
  { header: 'ID', accessor: (s) => s.Id, width: 8 },
  { header: 'Name', accessor: (s) => s.Title, width: 25 },
  { header: 'Email', accessor: (s) => s.Email, width: 30 },
  { header: 'Role', accessor: (s) => s.Role, width: 20 },
  { header: 'Specializations', accessor: (s) => s.Specializations.join(', '), width: 40 },
  { header: 'Current Deals', accessor: (s) => s.CurrentDealCount, width: 12 },
  { header: 'Max Deals', accessor: (s) => s.MaxConcurrentDeals, width: 12 },
  { header: 'Capacity', accessor: (s) => `${s.CurrentDealCount}/${s.MaxConcurrentDeals}`, width: 12 },
  { header: 'Active', accessor: (s) => s.IsActive ? 'Yes' : 'No', width: 10 },
  { header: 'Phone', accessor: (s) => s.Phone || '-', width: 18 },
];

export function downloadSpecialistsExcel(specialists: Specialist[], filename?: string): void {
  const xml = itemsToExcelXML(specialists, SPECIALIST_COLUMNS, 'Specialists');
  downloadExcel(xml, `DWx_Specialists_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xls`, filename);
}

export function downloadSpecialistsCSV(specialists: Specialist[], filename?: string): void {
  const csv = itemsToCSV(specialists, SPECIALIST_COLUMNS);
  downloadCSV(csv, `DWx_Specialists_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`, filename);
}

// ============================================================================
// Multi-Sheet Report Export
// ============================================================================

interface SheetData {
  name: string;
  columns: { header: string; width?: number }[];
  rows: (string | number)[][];
}

/**
 * Generate SpreadsheetML XML workbook with multiple worksheets.
 * Reuses the same DW-branded styles as existing single-sheet exports
 * and adds a Currency number format for ZAR value columns.
 */
function generateMultiSheetWorkbook(sheets: SheetData[]): string {
  const stylesXml = `
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#1E6B7B" ss:Pattern="Solid"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Data">
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Won">
      <Font ss:Color="#107C10"/>
      <Interior ss:Color="#DFF6DD" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Lost">
      <Font ss:Color="#D13438"/>
      <Interior ss:Color="#FDE7E9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Hot">
      <Font ss:Color="#D13438"/>
      <Interior ss:Color="#FDE7E9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Premium">
      <Font ss:Color="#8B6914"/>
      <Interior ss:Color="#FFF4CE" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Confirmed">
      <Font ss:Color="#107C10"/>
      <Interior ss:Color="#DFF6DD" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Cancelled">
      <Font ss:Color="#D13438"/>
      <Interior ss:Color="#FDE7E9" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="#,##0"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
  </Styles>`;

  const worksheetsXml = sheets
    .map((sheet) => {
      const columnsXml = sheet.columns
        .map((col) => `<Column ss:Width="${(col.width || 15) * 6}"/>`)
        .join('\n      ');

      const headerRowXml = sheet.columns
        .map(
          (col) =>
            `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(col.header)}</Data></Cell>`
        )
        .join('\n        ');

      const dataRowsXml = sheet.rows
        .map(
          (row) =>
            `<Row>
        ${row
          .map((cell) => {
            const type = typeof cell === 'number' ? 'Number' : 'String';
            return `<Cell ss:StyleID="Data"><Data ss:Type="${type}">${escapeXML(String(cell))}</Data></Cell>`;
          })
          .join('\n        ')}
      </Row>`
        )
        .join('\n      ');

      return `<Worksheet ss:Name="${escapeXML(sheet.name)}">
    <Table>
      ${columnsXml}
      <Row>
        ${headerRowXml}
      </Row>
      ${dataRowsXml}
    </Table>
  </Worksheet>`;
    })
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${stylesXml}
  ${worksheetsXml}
</Workbook>`;
}

// ============================================================================
// Pipeline Report Export
// ============================================================================

/**
 * Download a multi-sheet Pipeline Report as Excel (SpreadsheetML).
 *
 * Sheets: Overview, Stage Breakdown, Conversion Rates, Deal Aging, Forecast, Top Deals
 */
export function downloadPipelineReportExcel(data: PipelineReportData): void {
  const { overview, stageBreakdown, conversionRates, dealAging, forecast, topDeals, config } = data;

  const sheets: SheetData[] = [
    // Sheet 1: Overview
    {
      name: 'Overview',
      columns: [
        { header: 'Total Pipeline', width: 20 },
        { header: 'Weighted Pipeline', width: 20 },
        { header: 'Avg Deal Size', width: 18 },
        { header: 'Hot Leads', width: 12 },
        { header: 'Open Deals', width: 12 },
        { header: 'Generated By', width: 25 },
        { header: 'Date Range', width: 25 },
      ],
      rows: [
        [
          `R ${overview.totalPipeline.toLocaleString()}`,
          `R ${overview.weightedPipeline.toLocaleString()}`,
          `R ${overview.avgDealSize.toLocaleString()}`,
          overview.hotLeads,
          overview.openDeals,
          config.generatedBy,
          config.dateRange.label,
        ],
      ],
    },
    // Sheet 2: Stage Breakdown
    {
      name: 'Stage Breakdown',
      columns: [
        { header: 'Stage', width: 18 },
        { header: 'Count', width: 10 },
        { header: 'Value', width: 18 },
        { header: 'Weighted Value', width: 18 },
        { header: '% of Pipeline', width: 14 },
      ],
      rows: stageBreakdown.map((s) => [
        s.stage,
        s.count,
        s.value,
        s.weightedValue,
        `${s.percentage.toFixed(1)}%`,
      ]),
    },
    // Sheet 3: Conversion Rates
    {
      name: 'Conversion Rates',
      columns: [
        { header: 'Transition', width: 30 },
        { header: 'Rate (%)', width: 12 },
      ],
      rows: conversionRates.map((c) => [
        `${c.from} \u2192 ${c.to}`,
        `${c.rate.toFixed(1)}%`,
      ]),
    },
    // Sheet 4: Deal Aging
    {
      name: 'Deal Aging',
      columns: [
        { header: 'Stage', width: 18 },
        { header: 'Avg Days', width: 12 },
        { header: 'Min Days', width: 12 },
        { header: 'Max Days', width: 12 },
        { header: 'Deal Count', width: 12 },
      ],
      rows: dealAging.map((d) => [d.stage, d.avgDays, d.minDays, d.maxDays, d.dealCount]),
    },
    // Sheet 5: Forecast
    {
      name: 'Forecast',
      columns: [
        { header: 'Period', width: 18 },
        { header: 'Expected', width: 18 },
        { header: 'Weighted', width: 18 },
      ],
      rows: forecast.map((f) => [f.period, f.expected, f.weighted]),
    },
    // Sheet 6: Top Deals
    {
      name: 'Top Deals',
      columns: [
        { header: 'Client', width: 25 },
        { header: 'Service', width: 30 },
        { header: 'Value', width: 18 },
        { header: 'Stage', width: 15 },
        { header: 'Days in Pipeline', width: 16 },
        { header: 'Probability (%)', width: 15 },
      ],
      rows: topDeals.map((d) => [
        d.client,
        d.service,
        d.value,
        d.stage,
        d.daysInPipeline,
        `${d.probability}%`,
      ]),
    },
  ];

  const xml = generateMultiSheetWorkbook(sheets);
  downloadExcel(xml, `DWx_Pipeline_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xls`);
}

// ============================================================================
// AM Performance Report Export
// ============================================================================

/**
 * Download a multi-sheet AM Performance Report as Excel (SpreadsheetML).
 *
 * Sheets: Summary, Leaderboard, Activity Trend
 */
export function downloadAMPerformanceReportExcel(data: AMPerformanceReportData): void {
  const { summary, leaderboard, activityTrend, config } = data;

  const sheets: SheetData[] = [
    // Sheet 1: Summary
    {
      name: 'Summary',
      columns: [
        { header: 'Active AMs', width: 14 },
        { header: 'Avg Win Rate', width: 14 },
        { header: 'Total Revenue', width: 20 },
        { header: 'Avg Cycle Time', width: 16 },
        { header: 'Generated By', width: 25 },
        { header: 'Date Range', width: 25 },
      ],
      rows: [
        [
          summary.totalAMs,
          `${summary.avgWinRate.toFixed(1)}%`,
          `R ${summary.totalRevenue.toLocaleString()}`,
          `${summary.avgCycleTime.toFixed(0)} days`,
          config.generatedBy,
          config.dateRange.label,
        ],
      ],
    },
    // Sheet 2: Leaderboard
    {
      name: 'Leaderboard',
      columns: [
        { header: 'Rank', width: 8 },
        { header: 'Name', width: 25 },
        { header: 'Email', width: 30 },
        { header: 'Total Deals', width: 12 },
        { header: 'Won', width: 10 },
        { header: 'Lost', width: 10 },
        { header: 'Open', width: 10 },
        { header: 'Win Rate (%)', width: 14 },
        { header: 'Revenue', width: 18 },
        { header: 'Avg Deal', width: 18 },
        { header: 'Avg Cycle (days)', width: 16 },
      ],
      rows: leaderboard.map((am) => [
        am.rank,
        am.name,
        am.email,
        am.totalDeals,
        am.wonDeals,
        am.lostDeals,
        am.openDeals,
        `${am.winRate.toFixed(1)}%`,
        am.totalRevenue,
        am.avgDealSize,
        am.avgCycleDays,
      ]),
    },
    // Sheet 3: Activity Trend
    {
      name: 'Activity Trend',
      columns: [
        { header: 'Period', width: 18 },
        { header: 'Created', width: 12 },
        { header: 'Won', width: 12 },
        { header: 'Lost', width: 12 },
      ],
      rows: activityTrend.map((t) => [t.period, t.created, t.won, t.lost]),
    },
  ];

  const xml = generateMultiSheetWorkbook(sheets);
  downloadExcel(xml, `DWx_AM_Performance_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xls`);
}

// ============================================================================
// Revenue Report Export
// ============================================================================

/**
 * Download a multi-sheet Revenue Report as Excel (SpreadsheetML).
 *
 * Sheets: Overview, By Service, By Industry, Monthly Trends, Deal Size Distribution
 */
export function downloadRevenueReportExcel(data: RevenueReportData): void {
  const { overview, revenueByService, revenueByIndustry, monthlyTrends, dealSizeDistribution, config } = data;

  const sheets: SheetData[] = [
    // Sheet 1: Overview
    {
      name: 'Overview',
      columns: [
        { header: 'Total Won Revenue', width: 20 },
        { header: 'Active Pipeline', width: 20 },
        { header: 'Avg Deal Size', width: 18 },
        { header: 'Win Rate', width: 12 },
        { header: 'Forecasted Revenue', width: 20 },
        { header: 'Generated By', width: 25 },
        { header: 'Date Range', width: 25 },
      ],
      rows: [
        [
          `R ${overview.totalWonRevenue.toLocaleString()}`,
          `R ${overview.activePipeline.toLocaleString()}`,
          `R ${overview.avgDealSize.toLocaleString()}`,
          `${overview.winRate.toFixed(1)}%`,
          `R ${overview.forecastedRevenue.toLocaleString()}`,
          config.generatedBy,
          config.dateRange.label,
        ],
      ],
    },
    // Sheet 2: By Service
    {
      name: 'By Service',
      columns: [
        { header: 'Service', width: 30 },
        { header: 'Revenue', width: 18 },
        { header: 'Deal Count', width: 12 },
      ],
      rows: revenueByService.map((s) => [s.service, s.revenue, s.dealCount]),
    },
    // Sheet 3: By Industry
    {
      name: 'By Industry',
      columns: [
        { header: 'Industry', width: 25 },
        { header: 'Revenue', width: 18 },
        { header: 'Deal Count', width: 12 },
        { header: '% of Total', width: 12 },
      ],
      rows: revenueByIndustry.map((i) => [
        i.industry,
        i.revenue,
        i.dealCount,
        `${i.percentage.toFixed(1)}%`,
      ]),
    },
    // Sheet 4: Monthly Trends
    {
      name: 'Monthly Trends',
      columns: [
        { header: 'Period', width: 18 },
        { header: 'Revenue', width: 18 },
        { header: 'Deal Count', width: 12 },
      ],
      rows: monthlyTrends.map((m) => [m.period, m.revenue, m.dealCount]),
    },
    // Sheet 5: Deal Size Distribution
    {
      name: 'Deal Size Distribution',
      columns: [
        { header: 'Range', width: 18 },
        { header: 'Won', width: 10 },
        { header: 'Lost', width: 10 },
        { header: 'Won Revenue', width: 18 },
      ],
      rows: dealSizeDistribution.map((d) => [d.label, d.wonCount, d.lostCount, d.wonRevenue]),
    },
  ];

  const xml = generateMultiSheetWorkbook(sheets);
  downloadExcel(xml, `DWx_Revenue_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xls`);
}
