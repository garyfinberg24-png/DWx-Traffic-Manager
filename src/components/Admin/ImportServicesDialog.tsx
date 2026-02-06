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
import { Dismiss16Regular, ArrowUpload24Regular, ArrowDownload24Regular } from '@fluentui/react-icons';
import * as XLSX from 'xlsx';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import {
  DWServiceInput,
  ServiceCategory,
  ServiceComplexity,
  ServiceDuration,
  PricingModel,
  SpecialistRole,
  DEFAULT_SERVICES,
} from '../../types/ServiceRequest';

const useStyles = makeStyles({
  surface: {
    maxWidth: '900px',
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
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
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
  templateInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f3f2f1',
    borderRadius: '4px',
    fontSize: '12px',
  },
  headerButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
});

const VALID_CATEGORIES: ServiceCategory[] = [
  'Power Platform', 'SPFx Development', 'SharePoint Migration',
  'M365 Assessment', 'Copilot Agents', 'MS Viva', 'Training',
  'Proposal', 'Tender', 'Ad-Hoc Support', 'SLA', 'Strategic Advisory',
];
const VALID_DURATIONS: ServiceDuration[] = ['30min', '1hr', '2hr', 'Half-day', 'Full-day', 'Multi-day'];
const VALID_COMPLEXITIES: ServiceComplexity[] = ['Low', 'Medium', 'High', 'Enterprise'];
const VALID_PRICING: PricingModel[] = ['Fixed', 'Hourly', 'Project-based', 'TBD'];
const VALID_ROLES: SpecialistRole[] = ['Solution Architect', 'Technical Specialist', 'Consultant'];

interface ImportServicesDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedService {
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  duration: string;
  complexity: string;
  pricingModel: string;
  basePrice?: number;
  iconName: string;
  sortOrder: number;
  isActive: boolean;
  prerequisites: string;
  requiredRoles: string[];
  whatsIncluded: string[];
  keyBenefits: string[];
  idealFor: string[];
  relatedCategories: string[];
  engagementPhases: { name: string; description: string }[];
  errors: string[];
}

export const ImportServicesDialog: React.FC<ImportServicesDialogProps> = ({
  open,
  onClose,
  onImportComplete,
}) => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedServices, setParsedServices] = useState<ParsedService[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const findValue = (row: Record<string, unknown>, keys: string[]): unknown => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
        return row[key];
      }
    }
    return undefined;
  };

  const parsePipeArray = (value: unknown): string[] => {
    if (!value) return [];
    return String(value).split('|').map(s => s.trim()).filter(Boolean);
  };

  const parseEngagementPhases = (value: unknown): { name: string; description: string }[] => {
    if (!value) return [];
    return String(value).split('|').map(phase => {
      const colonIndex = phase.indexOf(':');
      if (colonIndex === -1) return { name: phase.trim(), description: '' };
      return {
        name: phase.substring(0, colonIndex).trim(),
        description: phase.substring(colonIndex + 1).trim(),
      };
    }).filter(p => p.name);
  };

  const parseRow = (row: Record<string, unknown>): ParsedService => {
    const errors: string[] = [];

    const title = String(findValue(row, ['Title', 'title', 'Service Name', 'ServiceName', 'Name']) || '');
    const shortDescription = String(findValue(row, ['ShortDescription', 'Short Description', 'Summary', 'short_description']) || '');
    const description = String(findValue(row, ['Description', 'description', 'Full Description', 'Details']) || '');
    const category = String(findValue(row, ['Category', 'category', 'Service Category']) || '');
    const duration = String(findValue(row, ['TypicalDuration', 'Typical Duration', 'Duration', 'duration']) || '1hr');
    const complexity = String(findValue(row, ['ComplexityLevel', 'Complexity Level', 'Complexity', 'complexity']) || 'Medium');
    const pricingModel = String(findValue(row, ['PricingModel', 'Pricing Model', 'Pricing', 'pricing']) || 'TBD');
    const basePriceRaw = findValue(row, ['BasePrice', 'Base Price', 'Price', 'price']);
    const iconName = String(findValue(row, ['IconName', 'Icon Name', 'Icon', 'icon']) || '');
    const sortOrderRaw = findValue(row, ['SortOrder', 'Sort Order', 'Order', 'order']);
    const isActiveRaw = findValue(row, ['IsActive', 'Is Active', 'Active', 'active']);
    const prerequisites = String(findValue(row, ['Prerequisites', 'prerequisites', 'Pre-requisites']) || '');

    const requiredRoles = parsePipeArray(findValue(row, ['RequiredRoles', 'Required Roles', 'Roles', 'roles']));
    const whatsIncluded = parsePipeArray(findValue(row, ['WhatsIncluded', 'Whats Included', "What's Included", 'Included']));
    const keyBenefits = parsePipeArray(findValue(row, ['KeyBenefits', 'Key Benefits', 'Benefits', 'benefits']));
    const idealFor = parsePipeArray(findValue(row, ['IdealFor', 'Ideal For', 'Target Audience', 'ideal_for']));
    const relatedCategories = parsePipeArray(findValue(row, ['RelatedCategories', 'Related Categories', 'Related', 'related']));
    const engagementPhases = parseEngagementPhases(findValue(row, ['EngagementPhases', 'Engagement Phases', 'Phases', 'Timeline']));

    // Validation
    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');
    if (category && !VALID_CATEGORIES.includes(category as ServiceCategory)) {
      errors.push(`Invalid category: "${category}"`);
    }
    if (!VALID_DURATIONS.includes(duration as ServiceDuration)) {
      errors.push(`Invalid duration: "${duration}"`);
    }
    if (!VALID_COMPLEXITIES.includes(complexity as ServiceComplexity)) {
      errors.push(`Invalid complexity: "${complexity}"`);
    }
    if (!VALID_PRICING.includes(pricingModel as PricingModel)) {
      errors.push(`Invalid pricing: "${pricingModel}"`);
    }

    // Validate roles
    for (const role of requiredRoles) {
      if (!VALID_ROLES.includes(role as SpecialistRole)) {
        errors.push(`Invalid role: "${role}"`);
      }
    }

    // Validate related categories
    for (const cat of relatedCategories) {
      if (!VALID_CATEGORIES.includes(cat as ServiceCategory)) {
        errors.push(`Invalid related category: "${cat}"`);
      }
    }

    const basePrice = basePriceRaw ? Number(basePriceRaw) : undefined;
    if (basePriceRaw && isNaN(Number(basePriceRaw))) {
      errors.push('Base price must be a number');
    }

    const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : 0;
    const isActive = isActiveRaw === undefined ? true :
      ['yes', 'y', 'true', '1', 'active'].includes(String(isActiveRaw).toLowerCase());

    return {
      title,
      shortDescription,
      description,
      category: category || 'Power Platform',
      duration,
      complexity,
      pricingModel,
      basePrice,
      iconName,
      sortOrder,
      isActive,
      prerequisites,
      requiredRoles,
      whatsIncluded,
      keyBenefits,
      idealFor,
      relatedCategories,
      engagementPhases,
      errors,
    };
  };

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

        const services = jsonData.map((row) => parseRow(row));
        setParsedServices(services);
      } catch (error) {
        setParseError(
          `Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure it's a valid Excel (.xlsx) or CSV file.`
        );
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const sample = DEFAULT_SERVICES[0];
    const headers = [
      'Title', 'ShortDescription', 'Description', 'Category', 'TypicalDuration',
      'ComplexityLevel', 'PricingModel', 'BasePrice', 'IconName', 'SortOrder',
      'IsActive', 'Prerequisites', 'RequiredRoles', 'WhatsIncluded',
      'KeyBenefits', 'IdealFor', 'RelatedCategories', 'EngagementPhases',
    ];

    const sampleRow = [
      sample.Title,
      sample.ShortDescription,
      sample.Description,
      sample.Category,
      sample.TypicalDuration,
      sample.ComplexityLevel,
      sample.PricingModel,
      sample.BasePrice || '',
      sample.IconName || '',
      sample.SortOrder,
      'true',
      sample.Prerequisites || '',
      sample.RequiredRoles?.join('|') || '',
      sample.WhatsIncluded?.join('|') || '',
      sample.KeyBenefits?.join('|') || '',
      sample.IdealFor?.join('|') || '',
      sample.RelatedCategories?.join('|') || '',
      sample.EngagementPhases?.map(p => `${p.name}:${p.description}`).join('|') || '',
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);

    // Set column widths
    ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 15) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Services');
    XLSX.writeFile(wb, 'DWx_Services_Import_Template.xlsx');
  };

  const validServices = parsedServices.filter((s) => s.errors.length === 0);
  const invalidServices = parsedServices.filter((s) => s.errors.length > 0);

  const handleImport = async () => {
    if (validServices.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    const errors: string[] = [];
    let success = 0;

    for (let i = 0; i < validServices.length; i++) {
      const svc = validServices[i];
      try {
        const input: DWServiceInput = {
          Title: svc.title,
          ShortDescription: svc.shortDescription,
          Description: svc.description,
          Category: svc.category as ServiceCategory,
          TypicalDuration: svc.duration as ServiceDuration,
          ComplexityLevel: svc.complexity as ServiceComplexity,
          PricingModel: svc.pricingModel as PricingModel,
          BasePrice: svc.basePrice,
          IconName: svc.iconName || undefined,
          SortOrder: svc.sortOrder,
          IsActive: svc.isActive,
          Prerequisites: svc.prerequisites || undefined,
          RequiredRoles: svc.requiredRoles as SpecialistRole[],
          WhatsIncluded: svc.whatsIncluded.length > 0 ? svc.whatsIncluded : undefined,
          KeyBenefits: svc.keyBenefits.length > 0 ? svc.keyBenefits : undefined,
          IdealFor: svc.idealFor.length > 0 ? svc.idealFor : undefined,
          RelatedCategories: svc.relatedCategories.length > 0 ? svc.relatedCategories as ServiceCategory[] : undefined,
          EngagementPhases: svc.engagementPhases.length > 0 ? svc.engagementPhases : undefined,
        };
        await serviceCatalogService.createService(input);
        success++;
      } catch (error) {
        errors.push(`Failed to import "${svc.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      setImportProgress((i + 1) / validServices.length);
    }

    setImportResult({ success, failed: errors.length, errors });
    setIsImporting(false);

    if (success > 0) {
      onImportComplete();
    }
  };

  const handleClose = () => {
    setParsedServices([]);
    setImportResult(null);
    setParseError(null);
    setImportProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_e, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <div className={styles.header}>
            <DialogTitle>Import Services from Spreadsheet</DialogTitle>
            <div className={styles.headerButtons}>
              <Button
                appearance="subtle"
                icon={<ArrowDownload24Regular />}
                onClick={handleDownloadTemplate}
                size="small"
              >
                Template
              </Button>
              <Button
                appearance="subtle"
                icon={<Dismiss16Regular />}
                onClick={handleClose}
              />
            </div>
          </div>

          <DialogContent className={styles.body}>
            {/* File upload */}
            {parsedServices.length === 0 && !importResult && (
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
                    Expected columns: Title, ShortDescription, Description, Category, TypicalDuration, ComplexityLevel, PricingModel, BasePrice
                  </Text>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div className={styles.templateInfo}>
                  <Text style={{ display: 'block', fontWeight: 600, marginBottom: '4px' }}>Array fields format:</Text>
                  <Text style={{ display: 'block', fontSize: '11px' }}>
                    Use pipe (|) to separate items: <code>"item1|item2|item3"</code>
                  </Text>
                  <Text style={{ display: 'block', fontSize: '11px', marginTop: '4px' }}>
                    Engagement phases: <code>"Discovery:Requirements|Design:Architecture|Build:Development"</code>
                  </Text>
                  <Text style={{ display: 'block', fontSize: '11px', marginTop: '4px' }}>
                    Click "Template" to download a sample spreadsheet with correct column names.
                  </Text>
                </div>
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
            {parsedServices.length > 0 && !importResult && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <Text style={{ fontSize: '14px' }}>
                    <strong>{parsedServices.length}</strong> rows found ·{' '}
                    <span style={{ color: '#107c10' }}><strong>{validServices.length}</strong> valid</span>
                    {invalidServices.length > 0 && (
                      <span style={{ color: '#d13438' }}> · <strong>{invalidServices.length}</strong> with errors</span>
                    )}
                  </Text>
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className={styles.previewTable}>
                    <thead>
                      <tr>
                        <th className={styles.th}>#</th>
                        <th className={styles.th}>Title</th>
                        <th className={styles.th}>Category</th>
                        <th className={styles.th}>Duration</th>
                        <th className={styles.th}>Complexity</th>
                        <th className={styles.th}>Pricing</th>
                        <th className={styles.th}>Price</th>
                        <th className={styles.th}>Content</th>
                        <th className={styles.th}>Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedServices.map((svc, i) => {
                        const contentCount =
                          (svc.whatsIncluded.length > 0 ? 1 : 0) +
                          (svc.keyBenefits.length > 0 ? 1 : 0) +
                          (svc.idealFor.length > 0 ? 1 : 0) +
                          (svc.engagementPhases.length > 0 ? 1 : 0);
                        return (
                          <tr key={i} className={svc.errors.length > 0 ? styles.errorRow : ''}>
                            <td className={styles.td}>{i + 1}</td>
                            <td className={styles.td}>{svc.title || '—'}</td>
                            <td className={styles.td}>{svc.category || '—'}</td>
                            <td className={styles.td}>{svc.duration}</td>
                            <td className={styles.td}>{svc.complexity}</td>
                            <td className={styles.td}>{svc.pricingModel}</td>
                            <td className={styles.td}>{svc.basePrice ? `R${svc.basePrice.toLocaleString()}` : '—'}</td>
                            <td className={styles.td}>
                              {contentCount > 0 ? `${contentCount} section${contentCount > 1 ? 's' : ''}` : '—'}
                            </td>
                            <td className={styles.td}>
                              {svc.errors.length > 0 ? (
                                <span className={styles.errorText}>{svc.errors.join('; ')}</span>
                              ) : (
                                <span className={styles.successText}>✓</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                    Successfully imported {importResult.success} service{importResult.success !== 1 ? 's' : ''}.
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
            {parsedServices.length > 0 && !importResult ? (
              <>
                <Button
                  appearance="secondary"
                  onClick={() => {
                    setParsedServices([]);
                    setParseError(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  disabled={isImporting}
                >
                  Back
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleImport}
                  disabled={validServices.length === 0 || isImporting}
                >
                  Import {validServices.length} Service{validServices.length !== 1 ? 's' : ''}
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
