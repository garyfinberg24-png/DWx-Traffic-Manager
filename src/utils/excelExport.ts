import { Booking } from '../types/Booking';
import { format } from 'date-fns';

interface ExportColumn {
  header: string;
  accessor: (booking: Booking) => string | number;
  width?: number;
}

const BOOKING_COLUMNS: ExportColumn[] = [
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
