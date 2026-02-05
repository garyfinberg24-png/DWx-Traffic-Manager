import { Booking } from '../types/Booking';
import { ServiceRequest, Specialist } from '../types/ServiceRequest';
import { ProductRequest } from '../types/ProductRequest';
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
