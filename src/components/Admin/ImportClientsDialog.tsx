import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  DialogTitle,
  Button,
  Text,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  makeStyles,
} from '@fluentui/react-components';
import { Dismiss16Regular, ArrowUpload24Regular } from '@fluentui/react-icons';
import * as XLSX from 'xlsx';
import { referenceDataService } from '../../services/ReferenceDataService';
import { ClientInput, ClientIndustry, ClientContractStatus, CLIENT_INDUSTRIES, CLIENT_CONTRACT_STATUSES } from '../../types/ReferenceData';

const useStyles = makeStyles({
  surface: {
    maxWidth: '800px',
    width: '90vw',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e1e1e1',
  },
  body: {
    padding: '24px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
  },
  dropZone: {
    border: '2px dashed #d0d0d0',
    borderRadius: '8px',
    padding: '32px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    backgroundColor: '#fafafa',
  },
  previewTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: '16px',
    fontSize: '12px',
  },
  th: {
    padding: '8px',
    textAlign: 'left' as const,
    backgroundColor: '#f3f2f1',
    borderBottom: '2px solid #e1e1e1',
    fontWeight: '600',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '6px 8px',
    borderBottom: '1px solid #f0f0f0',
  },
  errorRow: {
    backgroundColor: '#fdf3f3',
  },
  errorText: {
    color: '#d13438',
    fontSize: '11px',
  },
  successText: {
    color: '#107c10',
    fontSize: '11px',
  },
});

interface ImportClientsDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedClient {
  company: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  industry?: string;
  isPremium: boolean;
  accountManager?: string;
  accountManagerEmail?: string;
  status: string;
  errors: string[];
}

const VALID_INDUSTRIES = CLIENT_INDUSTRIES;
const VALID_STATUSES = CLIENT_CONTRACT_STATUSES;

export const ImportClientsDialog: React.FC<ImportClientsDialogProps> = ({
  open,
  onClose,
  onImportComplete,
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedClients, setParsedClients] = useState<ParsedClient[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (jsonData.length === 0) {
          setParseError('The spreadsheet is empty. Please check the file.');
          return;
        }

        const clients = jsonData.map((row) => parseRow(row));
        setParsedClients(clients);
      } catch (error) {
        setParseError(
          `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure it's a valid Excel (.xlsx) or CSV file.`
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const parseRow = (row: Record<string, unknown>): ParsedClient => {
    const errors: string[] = [];

    // Flexible column name matching
    const company = findValue(row, ['company', 'Company', 'title', 'Title', 'client', 'Client', 'ClientName', 'Company Name']) as string || '';
    const contactName = findValue(row, ['contactName', 'Contact Name', 'PrimaryContactName', 'Contact', 'Name', 'Primary Contact']) as string || '';
    const contactEmail = findValue(row, ['contactEmail', 'Contact Email', 'PrimaryContactEmail', 'Email', 'Primary Email']) as string || '';
    const phone = findValue(row, ['phone', 'Phone', 'Telephone', 'Tel']) as string || '';
    const industry = findValue(row, ['industry', 'Industry', 'Sector']) as string || '';
    const premiumRaw = findValue(row, ['premium', 'Premium', 'IsPremium', 'Is Premium', 'VIP']) as string || '';
    const accountManager = findValue(row, ['accountManager', 'Account Manager', 'AccountManagerName', 'AM', 'Manager']) as string || '';
    const accountManagerEmail = findValue(row, ['accountManagerEmail', 'AM Email', 'AccountManagerEmail', 'Manager Email']) as string || '';
    const status = findValue(row, ['status', 'Status', 'ContractStatus', 'Contract Status']) as string || 'Active';

    if (!company) errors.push('Company name is required');
    if (!contactName) errors.push('Contact name is required');
    if (!contactEmail) errors.push('Contact email is required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) errors.push('Invalid email format');

    if (industry && !VALID_INDUSTRIES.includes(industry as ClientIndustry)) {
      errors.push(`Invalid industry: "${industry}". Valid: ${VALID_INDUSTRIES.join(', ')}`);
    }

    const normalizedStatus = VALID_STATUSES.find(
      (s) => s.toLowerCase() === (status || '').toLowerCase()
    ) || 'Active';

    const isPremium = ['yes', 'y', 'true', '1', 'premium'].includes(
      String(premiumRaw).toLowerCase()
    );

    return {
      company,
      contactName,
      contactEmail,
      phone,
      industry,
      isPremium,
      accountManager,
      accountManagerEmail,
      status: normalizedStatus,
      errors,
    };
  };

  const findValue = (row: Record<string, unknown>, keys: string[]): unknown => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return undefined;
  };

  const validClients = parsedClients.filter((c) => c.errors.length === 0);
  const invalidClients = parsedClients.filter((c) => c.errors.length > 0);

  const handleImport = async () => {
    if (validClients.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < validClients.length; i++) {
      const client = validClients[i];
      try {
        const input: ClientInput = {
          Title: client.company,
          PrimaryContactName: client.contactName,
          PrimaryContactEmail: client.contactEmail,
          Phone: client.phone,
          Industry: client.industry as ClientIndustry | undefined,
          IsPremium: client.isPremium,
          AccountManagerEmail: client.accountManagerEmail,
          ContractStatus: client.status as ClientContractStatus,
        };
        await referenceDataService.createClient(input, client.accountManager);
        success++;
      } catch (error) {
        errors.push(`Failed to import "${client.company}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      setImportProgress((i + 1) / validClients.length);
    }

    setImportResult({ success, failed: errors.length, errors });
    setIsImporting(false);

    if (success > 0) {
      onImportComplete();
    }
  };

  const handleClose = () => {
    setParsedClients([]);
    setImportResult(null);
    setParseError(null);
    setImportProgress(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_e, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <div className={styles.header}>
            <DialogTitle>Import Clients from Spreadsheet</DialogTitle>
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              onClick={handleClose}
            />
          </div>

          <DialogContent className={styles.body}>
            {/* File upload */}
            {parsedClients.length === 0 && !importResult && (
              <>
                <div
                  className={styles.dropZone}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ArrowUpload24Regular style={{ width: '48px', height: '48px', color: '#1e6b7b', marginBottom: '12px' }} />
                  <Text style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>
                    Click to upload an Excel or CSV file
                  </Text>
                  <Text style={{ fontSize: '12px', color: '#616161' }}>
                    Expected columns: Company, Contact Name, Contact Email, Phone, Industry, Premium (Y/N), Account Manager, Status
                  </Text>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {parseError && (
                  <MessageBar intent="error" style={{ marginTop: '12px' }}>
                    <MessageBarBody>
                      <MessageBarTitle>Parse Error</MessageBarTitle>
                      {parseError}
                    </MessageBarBody>
                  </MessageBar>
                )}
              </>
            )}

            {/* Preview table */}
            {parsedClients.length > 0 && !importResult && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <Text style={{ fontSize: '14px' }}>
                    <strong>{parsedClients.length}</strong> rows found ·{' '}
                    <span style={{ color: '#107c10' }}><strong>{validClients.length}</strong> valid</span>
                    {invalidClients.length > 0 && (
                      <span style={{ color: '#d13438' }}> · <strong>{invalidClients.length}</strong> with errors</span>
                    )}
                  </Text>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th className={styles.th}>#</th>
                        <th className={styles.th}>Company</th>
                        <th className={styles.th}>Contact</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Industry</th>
                        <th className={styles.th}>Premium</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedClients.map((client, i) => (
                        <tr key={i} className={client.errors.length > 0 ? styles.errorRow : ''}>
                          <td className={styles.td}>{i + 1}</td>
                          <td className={styles.td}>{client.company || '—'}</td>
                          <td className={styles.td}>{client.contactName || '—'}</td>
                          <td className={styles.td}>{client.contactEmail || '—'}</td>
                          <td className={styles.td}>{client.industry || '—'}</td>
                          <td className={styles.td}>{client.isPremium ? '★ Yes' : 'No'}</td>
                          <td className={styles.td}>{client.status}</td>
                          <td className={styles.td}>
                            {client.errors.length > 0 ? (
                              <span className={styles.errorText}>{client.errors.join('; ')}</span>
                            ) : (
                              <span className={styles.successText}>✓</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isImporting && (
                  <div style={{ marginTop: '16px' }}>
                    <Text style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                      Importing... {Math.round(importProgress * 100)}%
                    </Text>
                    <ProgressBar value={importProgress} />
                  </div>
                )}
              </>
            )}

            {/* Import result */}
            {importResult && (
              <div style={{ padding: '16px 0' }}>
                <MessageBar intent={importResult.failed === 0 ? 'success' : 'warning'} style={{ marginBottom: '12px' }}>
                  <MessageBarBody>
                    <MessageBarTitle>Import Complete</MessageBarTitle>
                    Successfully imported {importResult.success} client{importResult.success !== 1 ? 's' : ''}.
                    {importResult.failed > 0 && ` ${importResult.failed} failed.`}
                  </MessageBarBody>
                </MessageBar>
                {importResult.errors.map((err, i) => (
                  <Text key={i} style={{ display: 'block', fontSize: '12px', color: '#d13438', marginTop: '4px' }}>
                    {err}
                  </Text>
                ))}
              </div>
            )}
          </DialogContent>

          <div className={styles.footer}>
            {parsedClients.length > 0 && !importResult ? (
              <>
                <Button
                  appearance="secondary"
                  onClick={() => {
                    setParsedClients([]);
                    setParseError(null);
                  }}
                  disabled={isImporting}
                >
                  Back
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleImport}
                  disabled={validClients.length === 0 || isImporting}
                >
                  Import {validClients.length} Client{validClients.length !== 1 ? 's' : ''}
                </Button>
              </>
            ) : (
              <Button appearance="secondary" onClick={handleClose}>
                {importResult ? 'Done' : 'Cancel'}
              </Button>
            )}
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
