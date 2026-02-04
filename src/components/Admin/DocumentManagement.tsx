import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Field,
  Input,
  Checkbox,
} from '@fluentui/react-components';
import {
  Document24Regular,
  DocumentPdf24Regular,
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  Checkmark24Regular,
  Dismiss16Regular,
  Dismiss24Regular,
  Delete24Regular,
  Play24Regular,
  Rocket24Regular,
  Save24Regular,
  FolderOpen24Regular,
} from '@fluentui/react-icons';
import { getAuthService } from '../../services/serviceFactory';
import { config } from '../../config/environmentConfig';
import { BOOKING_DOCUMENTS } from '../../services/DocumentService';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  // Tabs
  tabs: {
    display: 'flex',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px 8px 0 0',
    overflow: 'hidden',
  },
  tab: {
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    position: 'relative',
    transition: 'all 0.15s ease',
  },
  tabActive: {
    color: '#1e6b7b',
  },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: '0',
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: '#1e6b7b',
  },
  tabBadge: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  tabBadgeActive: {
    backgroundColor: '#e8f4f6',
    color: '#1e6b7b',
  },
  // Table Panel
  panel: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '0 0 8px 8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderTop: 'none',
    overflow: 'hidden',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  thCheckbox: {
    textAlign: 'center',
    width: '100px',
  },
  thActions: {
    width: '100px',
    textAlign: 'right',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
  columnHeaderDemo: {
    color: '#e65100',
  },
  columnHeaderDeployment: {
    color: '#2e7d32',
  },
  td: {
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    fontSize: '14px',
  },
  tdCheckbox: {
    textAlign: 'center',
    width: '100px',
  },
  tdActions: {
    width: '100px',
    textAlign: 'right',
  },
  trLast: {
    borderBottom: 'none',
  },
  documentCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  documentIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  documentIconPdf: {
    backgroundColor: '#fde7e9',
    color: '#d13438',
  },
  documentIconDocx: {
    backgroundColor: '#e6f2fb',
    color: '#0078d4',
  },
  documentDetails: {
    minWidth: 0,
  },
  documentName: {
    fontWeight: '500',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '350px',
  },
  documentMeta: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  actionButtons: {
    display: 'flex',
    gap: '4px',
    justifyContent: 'flex-end',
  },
  // Upload Section
  uploadSection: {
    padding: '20px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  dropZone: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  dropZoneContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  },
  dropZoneIcon: {
    width: '32px',
    height: '32px',
    color: tokens.colorNeutralForeground3,
  },
  dropZoneText: {
    textAlign: 'left',
  },
  // Summary Footer
  summaryFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  summaryStats: {
    display: 'flex',
    gap: '24px',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  },
  statIcon: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  statIconDemo: {
    backgroundColor: '#e65100',
  },
  statIconDeployment: {
    backgroundColor: '#2e7d32',
  },
  statValue: {
    fontWeight: '600',
  },
  // Dialog styles
  dialogSurface: {
    maxWidth: '480px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25.6px 57.6px 0 rgba(0,0,0,.22), 0 4.8px 14.4px 0 rgba(0,0,0,.18)',
  },
  dialogBody: {
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
    overflow: 'hidden',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2a8a9d 100%)',
    color: 'white',
    position: 'relative',
    flexShrink: 0,
  },
  dialogHeaderIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogHeaderContent: {
    flex: 1,
  },
  dialogHeaderTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  dialogHeaderSubtitle: {
    fontSize: '12px',
    opacity: 0.9,
  },
  dialogCloseBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    minWidth: '28px',
    width: '28px',
    height: '28px',
    padding: '0',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogContent: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dialogFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#f9f9f9',
    flexShrink: 0,
  },
  primaryBtn: {
    backgroundColor: '#1e6b7b',
  },
  selectedFile: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
  },
  fileInput: {
    display: 'none',
  },
  attachmentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  attachmentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  attachmentOptionIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentOptionIconDemo: {
    backgroundColor: '#fff3e0',
    color: '#e65100',
  },
  attachmentOptionIconDeployment: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: tokens.colorNeutralForeground3,
  },
});

interface DocumentConfig {
  id: string;
  fileName: string;
  fileType: 'pdf' | 'docx';
  size?: string;
  updatedDate?: string;
  attachToDemo: boolean;
  attachToDeployment: boolean;
}

// Storage key for document settings
const STORAGE_KEY = 'lp_document_settings';

// Get initial documents from configured documents
const getInitialDocuments = (): DocumentConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load document settings from storage:', e);
  }

  // Default documents based on BOOKING_DOCUMENTS config
  return [
    {
      id: 'demo-explainer',
      fileName: BOOKING_DOCUMENTS.Demo.fileName,
      fileType: 'pdf',
      size: '2.4 MB',
      updatedDate: 'Jan 15, 2026',
      attachToDemo: true,
      attachToDeployment: false,
    },
    {
      id: 'deployment-requirements',
      fileName: BOOKING_DOCUMENTS.Deployment.fileName,
      fileType: 'docx',
      size: '856 KB',
      updatedDate: 'Jan 10, 2026',
      attachToDemo: false,
      attachToDeployment: true,
    },
  ];
};

type TabValue = 'all' | 'demo' | 'deployment';

export const DocumentManagement: React.FC = () => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  // Documents state
  const [documents, setDocuments] = useState<DocumentConfig[]>(getInitialDocuments);

  // Upload dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState('');
  const [attachToDemo, setAttachToDemo] = useState(true);
  const [attachToDeployment, setAttachToDeployment] = useState(false);

  // Track changes
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current = JSON.stringify(documents);
    if (stored && current !== stored) {
      setHasChanges(true);
    }
  }, [documents]);

  // Filter documents based on active tab
  const filteredDocuments = documents.filter((doc) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'demo') return doc.attachToDemo;
    if (activeTab === 'deployment') return doc.attachToDeployment;
    return true;
  });

  // Count documents for each type
  const demoCount = documents.filter((d) => d.attachToDemo).length;
  const deploymentCount = documents.filter((d) => d.attachToDeployment).length;

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
      setUploadMessage({ type: 'success', text: 'Document settings saved successfully!' });
      setHasChanges(false);
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (error) {
      setUploadMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDemo = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, attachToDemo: !doc.attachToDemo } : doc))
    );
    setHasChanges(true);
  };

  const handleToggleDeployment = (docId: string) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, attachToDeployment: !doc.attachToDeployment } : doc))
    );
    setHasChanges(true);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setHasChanges(true);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
      ];
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
        setCustomFileName(file.name);
        setAttachToDemo(true);
        setAttachToDeployment(false);
        setDialogOpen(true);
      } else {
        setUploadMessage({ type: 'error', text: 'Please upload a PDF or Word document (.pdf, .docx, .doc)' });
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setCustomFileName(files[0].name);
      setAttachToDemo(true);
      setAttachToDeployment(false);
      setDialogOpen(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    setCustomFileName('');
    setAttachToDemo(true);
    setAttachToDeployment(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadMessage(null);

    try {
      const authService = getAuthService();
      const token = await authService.getGraphToken();
      const siteUrl = config.sharepoint.siteUrl;
      const libraryName = config.sharepoint.documentLibrary;

      const url = new URL(siteUrl);
      const hostname = url.hostname;
      const sitePath = url.pathname;

      const drivesResponse = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}:/drives`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!drivesResponse.ok) {
        throw new Error('Failed to access document library');
      }

      const drivesData = await drivesResponse.json();
      const drive = drivesData.value?.find((d: { name: string }) => d.name === libraryName);

      if (!drive) {
        throw new Error(`Document library '${libraryName}' not found`);
      }

      const fileName = encodeURIComponent(customFileName || selectedFile.name);
      const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${fileName}:/content`;

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      // Add to documents list
      const newDoc: DocumentConfig = {
        id: `doc_${Date.now()}`,
        fileName: customFileName || selectedFile.name,
        fileType: selectedFile.type.includes('pdf') ? 'pdf' : 'docx',
        size: `${(selectedFile.size / 1024).toFixed(0)} KB`,
        updatedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        attachToDemo,
        attachToDeployment,
      };

      setDocuments((prev) => [...prev, newDoc]);
      setHasChanges(true);

      setUploadMessage({
        type: 'success',
        text: `Document "${customFileName || selectedFile.name}" uploaded successfully!`,
      });

      handleCloseDialog();
      setTimeout(() => setUploadMessage(null), 5000);
    } catch (error) {
      console.error('Failed to upload document:', error);
      setUploadMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload document. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <FolderOpen24Regular />
            Document Management
          </div>
          <Text className={styles.headerSubtitle}>
            Configure which documents are attached to booking confirmation emails
          </Text>
        </div>
      </div>

      {uploadMessage && (
        <MessageBar intent={uploadMessage.type === 'success' ? 'success' : 'error'}>
          <MessageBarBody>
            <MessageBarTitle>{uploadMessage.type === 'success' ? 'Success' : 'Error'}</MessageBarTitle>
            {uploadMessage.text}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Tabs */}
      <div>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Document24Regular style={{ width: '16px', height: '16px' }} />
            All Documents
            <span className={`${styles.tabBadge} ${activeTab === 'all' ? styles.tabBadgeActive : ''}`}>
              {documents.length}
            </span>
            {activeTab === 'all' && <div className={styles.tabActiveIndicator} />}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'demo' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('demo')}
          >
            <Play24Regular style={{ width: '16px', height: '16px' }} />
            Demo Attachments
            <span className={`${styles.tabBadge} ${activeTab === 'demo' ? styles.tabBadgeActive : ''}`}>
              {demoCount}
            </span>
            {activeTab === 'demo' && <div className={styles.tabActiveIndicator} />}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'deployment' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('deployment')}
          >
            <Rocket24Regular style={{ width: '16px', height: '16px' }} />
            Deployment Attachments
            <span className={`${styles.tabBadge} ${activeTab === 'deployment' ? styles.tabBadgeActive : ''}`}>
              {deploymentCount}
            </span>
            {activeTab === 'deployment' && <div className={styles.tabActiveIndicator} />}
          </button>
        </div>

        <div className={styles.panel}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Document</th>
                  <th className={`${styles.th} ${styles.thCheckbox}`}>
                    <div className={`${styles.columnHeader} ${styles.columnHeaderDemo}`}>
                      <Play24Regular style={{ width: '14px', height: '14px' }} />
                      Demo
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.thCheckbox}`}>
                    <div className={`${styles.columnHeader} ${styles.columnHeaderDeployment}`}>
                      <Rocket24Regular style={{ width: '14px', height: '14px' }} />
                      Deployment
                    </div>
                  </th>
                  <th className={`${styles.th} ${styles.thActions}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyState}>
                      <Text size={400}>No documents found</Text>
                      <Text size={200} style={{ display: 'block', marginTop: '4px' }}>
                        Upload a document to get started
                      </Text>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc, index) => (
                    <tr key={doc.id}>
                      <td className={`${styles.td} ${index === filteredDocuments.length - 1 ? styles.trLast : ''}`}>
                        <div className={styles.documentCell}>
                          <div
                            className={`${styles.documentIcon} ${
                              doc.fileType === 'pdf' ? styles.documentIconPdf : styles.documentIconDocx
                            }`}
                          >
                            {doc.fileType === 'pdf' ? (
                              <DocumentPdf24Regular style={{ width: '18px', height: '18px' }} />
                            ) : (
                              <Document24Regular style={{ width: '18px', height: '18px' }} />
                            )}
                          </div>
                          <div className={styles.documentDetails}>
                            <div className={styles.documentName}>{doc.fileName}</div>
                            <div className={styles.documentMeta}>
                              {doc.fileType.toUpperCase()} {doc.size && `• ${doc.size}`}{' '}
                              {doc.updatedDate && `• Updated ${doc.updatedDate}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={`${styles.td} ${styles.tdCheckbox} ${index === filteredDocuments.length - 1 ? styles.trLast : ''}`}>
                        <Checkbox
                          checked={doc.attachToDemo}
                          onChange={() => handleToggleDemo(doc.id)}
                        />
                      </td>
                      <td className={`${styles.td} ${styles.tdCheckbox} ${index === filteredDocuments.length - 1 ? styles.trLast : ''}`}>
                        <Checkbox
                          checked={doc.attachToDeployment}
                          onChange={() => handleToggleDeployment(doc.id)}
                        />
                      </td>
                      <td className={`${styles.td} ${styles.tdActions} ${index === filteredDocuments.length - 1 ? styles.trLast : ''}`}>
                        <div className={styles.actionButtons}>
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<ArrowDownload24Regular />}
                            title="Download"
                          />
                          <Button
                            appearance="subtle"
                            size="small"
                            icon={<Delete24Regular />}
                            title="Remove"
                            onClick={() => handleDeleteDocument(doc.id)}
                            style={{ color: tokens.colorPaletteRedForeground1 }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.uploadSection}>
            <div
              className={styles.dropZone}
              style={isDragging ? { borderColor: '#1e6b7b', backgroundColor: '#e8f4f6' } : undefined}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleOpenFileDialog}
            >
              <div className={styles.dropZoneContent}>
                <ArrowUpload24Regular className={styles.dropZoneIcon} />
                <div className={styles.dropZoneText}>
                  <Text weight="semibold" style={{ display: 'block' }}>
                    Upload a new document
                  </Text>
                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                    Drag and drop or click to browse • PDF, DOCX up to 10MB
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.summaryFooter}>
            <div className={styles.summaryStats}>
              <div className={styles.stat}>
                <span className={`${styles.statIcon} ${styles.statIconDemo}`} />
                <span>
                  <span className={styles.statValue}>{demoCount}</span> Demo attachments
                </span>
              </div>
              <div className={styles.stat}>
                <span className={`${styles.statIcon} ${styles.statIconDeployment}`} />
                <span>
                  <span className={styles.statValue}>{deploymentCount}</span> Deployment attachments
                </span>
              </div>
            </div>
            <Button
              appearance="primary"
              className={styles.primaryBtn}
              icon={isSaving ? <Spinner size="tiny" /> : <Save24Regular />}
              onClick={handleSaveSettings}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
        onChange={handleFileSelect}
        className={styles.fileInput}
      />

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(_, d) => !d.open && handleCloseDialog()}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody className={styles.dialogBody}>
            {/* Header */}
            <div className={styles.dialogHeader}>
              <div className={styles.dialogHeaderIcon}>
                <ArrowUpload24Regular />
              </div>
              <div className={styles.dialogHeaderContent}>
                <div className={styles.dialogHeaderTitle}>Upload Document</div>
                <div className={styles.dialogHeaderSubtitle}>Add a new document to the library</div>
              </div>
              <button
                className={styles.dialogCloseBtn}
                onClick={handleCloseDialog}
                aria-label="Close dialog"
              >
                <Dismiss16Regular />
              </button>
            </div>

            <DialogContent className={styles.dialogContent}>
              {selectedFile && (
                <div className={styles.selectedFile}>
                  {getFileExtension(selectedFile.name) === 'pdf' ? (
                    <DocumentPdf24Regular />
                  ) : (
                    <Document24Regular />
                  )}
                  <div>
                    <Text weight="semibold">{selectedFile.name}</Text>
                    <Text size={100} style={{ color: tokens.colorNeutralForeground3, display: 'block' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </Text>
                  </div>
                </div>
              )}

              <Field label="File Name" hint="You can rename the file before uploading">
                <Input
                  value={customFileName}
                  onChange={(_, data) => setCustomFileName(data.value)}
                  placeholder="Enter file name"
                />
              </Field>

              <Field label="Attach to Booking Types">
                <div className={styles.attachmentOptions}>
                  <div className={styles.attachmentOption}>
                    <Checkbox
                      checked={attachToDemo}
                      onChange={(_, data) => setAttachToDemo(!!data.checked)}
                    />
                    <div
                      className={`${styles.attachmentOptionIcon} ${styles.attachmentOptionIconDemo}`}
                    >
                      <Play24Regular style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div>
                      <Text weight="semibold" style={{ display: 'block' }}>
                        Demo Bookings
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Send with demo confirmation emails
                      </Text>
                    </div>
                  </div>
                  <div className={styles.attachmentOption}>
                    <Checkbox
                      checked={attachToDeployment}
                      onChange={(_, data) => setAttachToDeployment(!!data.checked)}
                    />
                    <div
                      className={`${styles.attachmentOptionIcon} ${styles.attachmentOptionIconDeployment}`}
                    >
                      <Rocket24Regular style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div>
                      <Text weight="semibold" style={{ display: 'block' }}>
                        Deployment Bookings
                      </Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Send with deployment confirmation emails
                      </Text>
                    </div>
                  </div>
                </div>
              </Field>
            </DialogContent>

            {/* Footer */}
            <div className={styles.dialogFooter}>
              <Button
                appearance="secondary"
                icon={<Dismiss24Regular />}
                onClick={handleCloseDialog}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                className={styles.primaryBtn}
                icon={isUploading ? <Spinner size="tiny" /> : <Checkmark24Regular />}
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !customFileName.trim()}
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default DocumentManagement;
