/**
 * DWx Traffic Manager - SLA Management
 * Admin panel for viewing and editing SLA targets across all services,
 * plus editing default targets by complexity level.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  makeStyles,
  tokens,
  shorthands,
  Spinner,
  Button,
  Input,
  Badge,
  Tooltip,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  SaveRegular,
  ArrowClockwise24Regular,
} from '@fluentui/react-icons';
import {
  DWService,
  SLATargets,
  DEFAULT_SLA_TARGETS,
  ServiceComplexity,
} from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { useToast } from '../../contexts/ToastContext';
import { DW_COLORS } from '../../utils/buttonStyles';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
  },
  subtitle: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  tabContent: {
    marginTop: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e1e1'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('20px'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    ...shorthands.borderRadius('8px'),
    ...shorthands.overflow('hidden'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e1e1'),
  },
  th: {
    ...shorthands.padding('10px', '14px'),
    fontSize: '12px',
    fontWeight: '600',
    color: '#616161',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e1e1e1',
    textAlign: 'left' as const,
  },
  td: {
    ...shorthands.padding('10px', '14px'),
    fontSize: '13px',
    color: '#242424',
    borderBottom: '1px solid #f0f0f0',
    verticalAlign: 'middle',
  },
  inputCell: {
    width: '100px',
  },
  slaInput: {
    width: '80px',
  },
  serviceNameCell: {
    fontWeight: '600',
    minWidth: '180px',
  },
  complexityBadge: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: '600',
    color: '#ffffff',
  },
  defaultsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    '@media (max-width: 800px)': {
      gridTemplateColumns: '1fr',
    },
  },
  defaultCard: {
    ...shorthands.border('1px', 'solid', '#e1e1e1'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: '#ffffff',
  },
  defaultCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f0f0f0',
  },
  defaultCardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  fieldRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '8px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding('48px', '0'),
  },
  emptyState: {
    textAlign: 'center' as const,
    ...shorthands.padding('32px', '16px'),
    color: '#616161',
    fontSize: '13px',
  },
  saveBtn: {
    backgroundColor: DW_COLORS.teal,
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  unsavedDot: {
    width: '6px',
    height: '6px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#f7630c',
    display: 'inline-block',
    marginLeft: '4px',
  },
  rowModified: {
    backgroundColor: 'rgba(30, 107, 123, 0.04)',
  },
});

// ============================================================================
// Complexity badge colors
// ============================================================================

const COMPLEXITY_COLORS: Record<ServiceComplexity, string> = {
  Low: '#10B981',
  Medium: '#3B82F6',
  High: '#F59E0B',
  Enterprise: '#8B5CF6',
};

type SLATab = 'services' | 'defaults';

// ============================================================================
// Component
// ============================================================================

export const SLAManagement: React.FC = () => {
  const styles = useStyles();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null); // service Id being saved
  const [services, setServices] = useState<DWService[]>([]);
  const [activeTab, setActiveTab] = useState<SLATab>('services');

  // Local editable SLA targets per service (keyed by service Id)
  const [editTargets, setEditTargets] = useState<Record<number, SLATargets>>({});
  // Track which services have unsaved changes
  const [dirtyServices, setDirtyServices] = useState<Set<number>>(new Set());

  // Load services
  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const result = await serviceCatalogService.getServices();
      // Sort by category then name
      result.sort((a, b) => a.Category.localeCompare(b.Category) || a.Title.localeCompare(b.Title));
      setServices(result);
      // Initialize edit targets from current service SLA targets
      const targets: Record<number, SLATargets> = {};
      for (const s of result) {
        const complexity = s.ComplexityLevel || 'Medium';
        targets[s.Id] = s.SLATargets || { ...DEFAULT_SLA_TARGETS[complexity] };
      }
      setEditTargets(targets);
      setDirtyServices(new Set());
    } catch (err) {
      console.error('Failed to load services for SLA management:', err);
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Update a single SLA target field for a service
  const handleTargetChange = (serviceId: number, field: keyof SLATargets, value: string) => {
    const numVal = value ? Number(value) : undefined;
    setEditTargets(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: numVal,
      },
    }));
    setDirtyServices(prev => new Set(prev).add(serviceId));
  };

  // Save SLA targets for a single service
  const handleSaveService = async (service: DWService) => {
    const targets = editTargets[service.Id];
    if (!targets) return;

    setSaving(service.Id);
    try {
      // Build updated service input with SLA targets
      await serviceCatalogService.updateService(service.Id, {
        Title: service.Title,
        Description: service.Description || '',
        ShortDescription: service.ShortDescription || '',
        Category: service.Category,
        TypicalDuration: service.TypicalDuration,
        ComplexityLevel: service.ComplexityLevel,
        PricingModel: service.PricingModel,
        BasePrice: service.BasePrice,
        IconName: service.IconName || '',
        SortOrder: service.SortOrder || 0,
        IsActive: service.IsActive !== false,
        Prerequisites: service.Prerequisites || '',
        RequiredRoles: service.RequiredRoles || [],
        WhatsIncluded: service.WhatsIncluded || [],
        EngagementPhases: service.EngagementPhases || [],
        KeyBenefits: service.KeyBenefits || [],
        IdealFor: service.IdealFor || [],
        RelatedCategories: service.RelatedCategories || [],
        SLATargets: Object.values(targets).some(v => v != null && v > 0) ? targets : undefined,
      });

      // Update local state
      setServices(prev =>
        prev.map(s => s.Id === service.Id ? { ...s, SLATargets: targets } : s)
      );
      setDirtyServices(prev => {
        const next = new Set(prev);
        next.delete(service.Id);
        return next;
      });
      showToast(`SLA targets saved for ${service.Title}`, 'success');
    } catch (err) {
      console.error('Failed to save SLA targets:', err);
      showToast('Failed to save SLA targets', 'error');
    } finally {
      setSaving(null);
    }
  };

  // Reset a service's SLA targets to complexity defaults
  const handleResetToDefaults = (service: DWService) => {
    const complexity = service.ComplexityLevel || 'Medium';
    const defaults = { ...DEFAULT_SLA_TARGETS[complexity] };
    setEditTargets(prev => ({ ...prev, [service.Id]: defaults }));
    setDirtyServices(prev => new Set(prev).add(service.Id));
  };

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Loading SLA configuration..." />
      </div>
    );
  }

  const SLA_FIELDS: { key: keyof SLATargets; label: string; short: string }[] = [
    { key: 'LeadToQualified', label: 'Lead to Qualified', short: 'L→Q' },
    { key: 'QualifiedToDiscovery', label: 'Qualified to Discovery', short: 'Q→D' },
    { key: 'DiscoveryToProposal', label: 'Discovery to Proposal', short: 'D→P' },
    { key: 'ProposalToNegotiation', label: 'Proposal to Negotiation', short: 'P→N' },
    { key: 'NegotiationToWon', label: 'Negotiation to Won', short: 'N→W' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <Text className={styles.title}>SLA Configuration</Text>
          <Text className={styles.subtitle}>
            Manage SLA targets per service and view default thresholds by complexity level
          </Text>
        </div>
        <Button
          appearance="subtle"
          icon={<ArrowClockwise24Regular />}
          onClick={loadServices}
          size="small"
        >
          Refresh
        </Button>
      </div>

      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(data.value as SLATab)}
        style={{ borderBottom: '1px solid #e1e1e1' }}
      >
        <Tab value="services">Service SLA Targets</Tab>
        <Tab value="defaults">Default Thresholds</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {/* ================================================================
            Tab 1: Per-Service SLA Targets
            ================================================================ */}
        {activeTab === 'services' && (
          <>
            {services.length === 0 ? (
              <div className={styles.emptyState}>No services found. Create services first in the Services tab.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Service</th>
                    <th className={styles.th}>Complexity</th>
                    {SLA_FIELDS.map(f => (
                      <th key={f.key} className={styles.th} style={{ textAlign: 'center' }}>
                        <Tooltip content={`${f.label} (business days)`} relationship="label">
                          <span>{f.short}</span>
                        </Tooltip>
                      </th>
                    ))}
                    <th className={styles.th} style={{ textAlign: 'center', width: '120px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.filter(s => s.IsActive !== false).map((service) => {
                    const targets = editTargets[service.Id] || {};
                    const isDirty = dirtyServices.has(service.Id);
                    const isSaving = saving === service.Id;

                    return (
                      <tr key={service.Id} className={isDirty ? styles.rowModified : undefined}>
                        <td className={`${styles.td} ${styles.serviceNameCell}`}>
                          {service.Title}
                          {isDirty && <span className={styles.unsavedDot} title="Unsaved changes" />}
                        </td>
                        <td className={styles.td}>
                          <span
                            className={styles.complexityBadge}
                            style={{ backgroundColor: COMPLEXITY_COLORS[service.ComplexityLevel || 'Medium'] }}
                          >
                            {service.ComplexityLevel || 'Medium'}
                          </span>
                        </td>
                        {SLA_FIELDS.map(f => (
                          <td key={f.key} className={`${styles.td} ${styles.inputCell}`} style={{ textAlign: 'center' }}>
                            <Input
                              className={styles.slaInput}
                              type="number"
                              size="small"
                              value={targets[f.key]?.toString() || ''}
                              onChange={(_, d) => handleTargetChange(service.Id, f.key, d.value)}
                              placeholder="—"
                              style={{ textAlign: 'center' }}
                            />
                          </td>
                        ))}
                        <td className={styles.td} style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <Tooltip content="Save SLA targets" relationship="label">
                              <Button
                                appearance="primary"
                                icon={<SaveRegular />}
                                size="small"
                                className={styles.saveBtn}
                                disabled={!isDirty || isSaving}
                                onClick={() => handleSaveService(service)}
                              >
                                {isSaving ? '...' : 'Save'}
                              </Button>
                            </Tooltip>
                            <Tooltip content={`Reset to ${service.ComplexityLevel || 'Medium'} defaults`} relationship="label">
                              <Button
                                appearance="subtle"
                                size="small"
                                onClick={() => handleResetToDefaults(service)}
                              >
                                Reset
                              </Button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* ================================================================
            Tab 2: Default Thresholds by Complexity
            ================================================================ */}
        {activeTab === 'defaults' && (
          <>
            <Text style={{ fontSize: '13px', color: '#616161', display: 'block', marginBottom: '16px' }}>
              These are the built-in default SLA targets applied when a service has no custom targets configured.
              To change defaults for a specific service, switch to the "Service SLA Targets" tab.
            </Text>
            <div className={styles.defaultsGrid}>
              {(['Low', 'Medium', 'High', 'Enterprise'] as ServiceComplexity[]).map(complexity => {
                const targets = DEFAULT_SLA_TARGETS[complexity];
                return (
                  <div key={complexity} className={styles.defaultCard}>
                    <div className={styles.defaultCardHeader}>
                      <Text className={styles.defaultCardTitle}>{complexity} Complexity</Text>
                      <Badge
                        size="small"
                        appearance="filled"
                        style={{ backgroundColor: COMPLEXITY_COLORS[complexity], color: '#fff' }}
                      >
                        {complexity}
                      </Badge>
                    </div>
                    {SLA_FIELDS.map(f => (
                      <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <Text style={{ fontSize: '13px', color: '#424242' }}>{f.label}</Text>
                        <Text style={{ fontSize: '13px', fontWeight: 600, color: DW_COLORS.teal }}>
                          {targets[f.key]} days
                        </Text>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
