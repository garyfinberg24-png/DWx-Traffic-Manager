/**
 * ResourcesTab - Sales Resources & Documents
 * Displays product brochures, explainers, rate cards, and other sales materials
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Card,
  Button,
  Spinner,
  Badge,
} from '@fluentui/react-components';
import {
  DocumentPdf24Regular,
  Document24Regular,
  SlideLayout24Regular,
  ArrowDownload24Regular,
  Open24Regular,
  FolderOpen24Regular,
  Info24Regular,
} from '@fluentui/react-icons';
import { getAuthService } from '../../services/serviceFactory';
import { config } from '../../config/environmentConfig';

const authService = getAuthService();

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
  },
  subtitle: {
    fontSize: '13px',
    color: '#616161',
    marginTop: '4px',
  },
  categorySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e8e8e8',
  },
  categoryIcon: {
    width: '24px',
    height: '24px',
    color: '#1a5a8a',
  },
  categoryTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  documentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  documentCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      border: '1px solid #1a5a8a',
    },
  },
  documentHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  documentIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pdfIcon: {
    backgroundColor: '#fde7e9',
    color: '#d13438',
  },
  docxIcon: {
    backgroundColor: '#e6f2ff',
    color: '#0078d4',
  },
  pptxIcon: {
    backgroundColor: '#fff4e5',
    color: '#d83b01',
  },
  xlsxIcon: {
    backgroundColor: '#e6f9e6',
    color: '#107c10',
  },
  documentInfo: {
    flex: 1,
    minWidth: 0,
  },
  documentName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  documentDescription: {
    fontSize: '12px',
    color: '#616161',
    lineHeight: '1.4',
  },
  documentMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#8a8a8a',
  },
  documentActions: {
    display: 'flex',
    gap: '8px',
    marginTop: 'auto',
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    gap: '12px',
    color: '#616161',
  },
  infoCard: {
    padding: '16px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  infoIcon: {
    color: '#0284c7',
    flexShrink: 0,
  },
  infoText: {
    fontSize: '13px',
    color: '#0c4a6e',
    lineHeight: '1.5',
  },
});

interface SalesDocument {
  id: string;
  name: string;
  description: string;
  category: 'brochures' | 'explainers' | 'rate-cards' | 'templates' | 'presentations';
  fileType: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  fileName: string;
  path: string;
  size?: string;
  lastModified?: string;
  isNew?: boolean;
}

// Define the sales documents available in SharePoint
const SALES_DOCUMENTS: SalesDocument[] = [
  // Product Brochures
  {
    id: 'service-catalog',
    name: 'DWx Service Catalog',
    description: 'Complete overview of all Digital Workplace services and solutions',
    category: 'brochures',
    fileType: 'pdf',
    fileName: 'DWx Service Catalog.pdf',
    path: 'DWx%20Service%20Catalog.pdf',
    isNew: true,
  },
  {
    id: 'product-overview',
    name: 'DWx Products Overview',
    description: 'Comprehensive guide to DWx Apps, Web Parts, and Adaptive Cards',
    category: 'brochures',
    fileType: 'pdf',
    fileName: 'DWx Products Overview.pdf',
    path: 'DWx%20Products%20Overview.pdf',
  },
  {
    id: 'agents-brochure',
    name: 'DWx Copilot Agents',
    description: 'AI-powered agents for enterprise automation and self-service',
    category: 'brochures',
    fileType: 'pdf',
    fileName: 'DWx Copilot Agents.pdf',
    path: 'DWx%20Copilot%20Agents.pdf',
    isNew: true,
  },
  // Product Explainers
  {
    id: 'power-platform-explainer',
    name: 'Power Platform Solutions',
    description: 'Technical deep-dive into Power Platform custom development',
    category: 'explainers',
    fileType: 'pdf',
    fileName: 'Power Platform Solutions.pdf',
    path: 'Power%20Platform%20Solutions.pdf',
  },
  {
    id: 'spfx-explainer',
    name: 'SPFx Development Guide',
    description: 'SharePoint Framework development capabilities and best practices',
    category: 'explainers',
    fileType: 'pdf',
    fileName: 'SPFx Development Guide.pdf',
    path: 'SPFx%20Development%20Guide.pdf',
  },
  {
    id: 'migration-explainer',
    name: 'Migration & Assessment',
    description: 'SharePoint migration methodology and M365 assessment approach',
    category: 'explainers',
    fileType: 'pdf',
    fileName: 'Migration Assessment Guide.pdf',
    path: 'Migration%20Assessment%20Guide.pdf',
  },
  {
    id: 'zero-to-hero-explainer',
    name: 'Zero to AI Copilot Hero',
    description: 'Training program overview and curriculum for Copilot Studio mastery',
    category: 'explainers',
    fileType: 'pdf',
    fileName: 'Zero to Hero Training.pdf',
    path: 'Zero%20to%20Hero%20Training.pdf',
    isNew: true,
  },
  // Rate Cards
  {
    id: 'services-rate-card',
    name: 'Services Rate Card 2025',
    description: 'Current pricing for professional services and consulting',
    category: 'rate-cards',
    fileType: 'xlsx',
    fileName: 'DWx Rate Card 2025.xlsx',
    path: 'DWx%20Rate%20Card%202025.xlsx',
  },
  {
    id: 'products-pricing',
    name: 'Products Pricing Guide',
    description: 'Licensing and pricing for DWx Apps and solutions',
    category: 'rate-cards',
    fileType: 'pdf',
    fileName: 'DWx Products Pricing.pdf',
    path: 'DWx%20Products%20Pricing.pdf',
  },
  // Templates
  {
    id: 'proposal-template',
    name: 'Proposal Template',
    description: 'Standard proposal template for client engagements',
    category: 'templates',
    fileType: 'docx',
    fileName: 'DWx Proposal Template.docx',
    path: 'DWx%20Proposal%20Template.docx',
  },
  {
    id: 'sow-template',
    name: 'Statement of Work',
    description: 'SOW template for project scoping and deliverables',
    category: 'templates',
    fileType: 'docx',
    fileName: 'DWx SOW Template.docx',
    path: 'DWx%20SOW%20Template.docx',
  },
  // Presentations
  {
    id: 'company-deck',
    name: 'Company Overview Deck',
    description: 'Digital Workplace company presentation for client meetings',
    category: 'presentations',
    fileType: 'pptx',
    fileName: 'DWx Company Overview.pptx',
    path: 'DWx%20Company%20Overview.pptx',
  },
  {
    id: 'services-deck',
    name: 'Services Presentation',
    description: 'Detailed services presentation for discovery meetings',
    category: 'presentations',
    fileType: 'pptx',
    fileName: 'DWx Services Deck.pptx',
    path: 'DWx%20Services%20Deck.pptx',
  },
];

const CATEGORY_CONFIG: Record<string, { title: string; icon: React.ReactNode }> = {
  'brochures': { title: 'Product Brochures', icon: <DocumentPdf24Regular /> },
  'explainers': { title: 'Product Explainers', icon: <Document24Regular /> },
  'rate-cards': { title: 'Rate Cards & Pricing', icon: <Document24Regular /> },
  'templates': { title: 'Document Templates', icon: <Document24Regular /> },
  'presentations': { title: 'Presentations', icon: <SlideLayout24Regular /> },
};

export const ResourcesTab: React.FC = () => {
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(true);
  const [availableDocuments, setAvailableDocuments] = useState<Set<string>>(new Set());
  const [driveId, setDriveId] = useState<string | null>(null);

  useEffect(() => {
    checkDocumentAvailability();
  }, []);

  const checkDocumentAvailability = async () => {
    try {
      setIsLoading(true);
      const token = await authService.getGraphToken();
      const siteUrl = config.sharepoint.siteUrl;
      const libraryName = config.sharepoint.documentLibrary;

      const url = new URL(siteUrl);
      const hostname = url.hostname;
      const sitePath = url.pathname;

      // Get drives
      const drivesResponse = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}:/drives`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!drivesResponse.ok) {
        console.error('Failed to get drives');
        setIsLoading(false);
        return;
      }

      const drivesData = await drivesResponse.json();
      const drive = drivesData.value?.find((d: { name: string }) => d.name === libraryName);

      if (!drive) {
        console.error(`Document library '${libraryName}' not found`);
        setIsLoading(false);
        return;
      }

      setDriveId(drive.id);

      // Check which documents exist
      const available = new Set<string>();

      // Get all files in the root of the library
      const filesResponse = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${drive.id}/root/children`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        const fileNames = filesData.value?.map((f: { name: string }) => f.name) || [];

        SALES_DOCUMENTS.forEach((doc) => {
          if (fileNames.includes(doc.fileName)) {
            available.add(doc.id);
          }
        });
      }

      setAvailableDocuments(available);
    } catch (error) {
      console.error('Error checking document availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (doc: SalesDocument) => {
    if (!driveId) return;

    try {
      const token = await authService.getGraphToken();

      // Get download URL
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${doc.path}:/content`,
        {
          headers: { Authorization: `Bearer ${token}` },
          redirect: 'manual',
        }
      );

      // Graph API returns a redirect to the actual download URL
      if (response.type === 'opaqueredirect' || response.status === 302) {
        // For redirects, we need to get the download URL differently
        const downloadUrlResponse = await fetch(
          `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${doc.path}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (downloadUrlResponse.ok) {
          const fileData = await downloadUrlResponse.json();
          if (fileData['@microsoft.graph.downloadUrl']) {
            window.open(fileData['@microsoft.graph.downloadUrl'], '_blank');
          }
        }
      } else if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  const handleOpenInSharePoint = (doc: SalesDocument) => {
    const siteUrl = config.sharepoint.siteUrl;
    const libraryName = config.sharepoint.documentLibrary;
    const fileUrl = `${siteUrl}/${libraryName}/${doc.fileName}`;
    window.open(fileUrl, '_blank');
  };

  const getIconClass = (fileType: string): string => {
    switch (fileType) {
      case 'pdf':
        return styles.pdfIcon;
      case 'docx':
        return styles.docxIcon;
      case 'pptx':
        return styles.pptxIcon;
      case 'xlsx':
        return styles.xlsxIcon;
      default:
        return styles.docxIcon;
    }
  };

  const getIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <DocumentPdf24Regular />;
      case 'pptx':
        return <SlideLayout24Regular />;
      default:
        return <Document24Regular />;
    }
  };

  const groupedDocuments = SALES_DOCUMENTS.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, SalesDocument[]>);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Loading resources..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Info Card */}
      <div className={styles.infoCard}>
        <Info24Regular className={styles.infoIcon} />
        <div>
          <Text className={styles.infoText}>
            <strong>Sales Resources Library</strong> - Access product brochures, explainers, rate cards, and presentation materials.
            Documents are stored in SharePoint and synced automatically. Grayed-out items haven't been uploaded yet.
          </Text>
        </div>
      </div>

      {/* Document Categories */}
      {Object.entries(groupedDocuments).map(([category, docs]) => (
        <div key={category} className={styles.categorySection}>
          <div className={styles.categoryHeader}>
            <span className={styles.categoryIcon}>
              {CATEGORY_CONFIG[category]?.icon}
            </span>
            <Text className={styles.categoryTitle}>
              {CATEGORY_CONFIG[category]?.title || category}
            </Text>
            <Badge appearance="filled" color="informative" size="small">
              {docs.filter((d) => availableDocuments.has(d.id)).length}/{docs.length}
            </Badge>
          </div>

          <div className={styles.documentsGrid}>
            {docs.map((doc) => {
              const isAvailable = availableDocuments.has(doc.id);

              return (
                <Card
                  key={doc.id}
                  className={styles.documentCard}
                  style={{ opacity: isAvailable ? 1 : 0.5 }}
                >
                  <div className={styles.documentHeader}>
                    <div className={`${styles.documentIcon} ${getIconClass(doc.fileType)}`}>
                      {getIcon(doc.fileType)}
                    </div>
                    <div className={styles.documentInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text className={styles.documentName}>{doc.name}</Text>
                        {doc.isNew && (
                          <Badge appearance="filled" color="success" size="small">
                            New
                          </Badge>
                        )}
                      </div>
                      <Text className={styles.documentDescription}>
                        {doc.description}
                      </Text>
                    </div>
                  </div>

                  <div className={styles.documentMeta}>
                    <span>{doc.fileType.toUpperCase()}</span>
                    {doc.size && <span>• {doc.size}</span>}
                    {!isAvailable && <span style={{ color: '#d13438' }}>• Not uploaded</span>}
                  </div>

                  <div className={styles.documentActions}>
                    <Button
                      className={styles.actionButton}
                      appearance="primary"
                      icon={<ArrowDownload24Regular />}
                      size="small"
                      disabled={!isAvailable}
                      onClick={() => handleDownload(doc)}
                    >
                      Download
                    </Button>
                    <Button
                      className={styles.actionButton}
                      appearance="secondary"
                      icon={<Open24Regular />}
                      size="small"
                      disabled={!isAvailable}
                      onClick={() => handleOpenInSharePoint(doc)}
                    >
                      Open
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {availableDocuments.size === 0 && (
        <div className={styles.emptyState}>
          <FolderOpen24Regular style={{ width: '48px', height: '48px' }} />
          <Text>No documents available yet</Text>
          <Text style={{ fontSize: '12px' }}>
            Upload documents to the SharePoint library to see them here
          </Text>
        </div>
      )}
    </div>
  );
};

export default ResourcesTab;
