/**
 * DWx Traffic Manager - Request Details Modal
 * Full service request details with stage actions and history
 * Updated design with colored header
 */

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Text,
  Button,
  Input,
  Textarea,
  makeStyles,
  Spinner,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  CalendarLtr24Regular,
  PersonRegular,
  MoneyRegular,
  MailRegular,
  PhoneRegular,
  BuildingRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  DismissRegular,
  ClockRegular,
  DocumentRegular,
  ChatRegular,
  EditRegular,
  SaveRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  ServiceRequest,
  FunnelStage,
  STAGE_TRANSITIONS,
} from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { StageProgressBar } from './StageProgressBar';
import { format } from 'date-fns';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '640px',
    width: '90vw',
    maxHeight: '90vh',
    padding: '0',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#1a5a8a',
    color: 'white',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '2px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  closeButton: {
    minWidth: '36px',
    height: '36px',
    padding: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  stageBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
  },
  progressSection: {
    padding: '16px 24px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e1e1e1',
  },
  content: {
    padding: '0',
    overflowY: 'auto',
    maxHeight: '55vh',
  },
  section: {
    padding: '20px 24px',
    borderBottom: '1px solid #e8e8e8',
  },
  sectionLast: {
    padding: '20px 24px',
    borderBottom: 'none',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1a5a8a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    borderLeft: '3px solid #1a5a8a',
    paddingLeft: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  gridLabel: {
    fontSize: '11px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  gridValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  textBlock: {
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.6',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap',
  },
  stageActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  advanceButton: {
    backgroundColor: '#1a5a8a',
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
  regressButton: {
    backgroundColor: '#616161',
    ':hover': {
      backgroundColor: '#4d4d4d',
    },
  },
  lostButton: {
    backgroundColor: '#d13438',
    ':hover': {
      backgroundColor: '#a52a2d',
    },
  },
  wonButton: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  footer: {
    padding: '16px 24px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #e1e1e1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: '12px',
    color: '#616161',
  },
  interestBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  specialistCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#e8f4fc',
    borderRadius: '8px',
    border: '1px solid #cce4f0',
  },
  specialistIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1a5a8a',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialistInfo: {
    flex: 1,
  },
  specialistName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  specialistRole: {
    fontSize: '12px',
    color: '#616161',
  },
  unassigned: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    color: '#616161',
    fontStyle: 'italic',
    fontSize: '13px',
  },
  timeSlotsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  timeSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '13px',
  },
  confirmedSlot: {
    backgroundColor: '#dff6dd',
    border: '1px solid #107c10',
  },
  cancelButton: {
    minWidth: '80px',
  },
  submitButton: {
    backgroundColor: '#1a5a8a',
    color: 'white',
    fontWeight: '600',
    minWidth: '100px',
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
  editButton: {
    minWidth: '32px',
    height: '28px',
    padding: '0 8px',
  },
  editInput: {
    width: '100%',
  },
  editTextarea: {
    width: '100%',
    minHeight: '80px',
  },
  editActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  saveButton: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  editingIndicator: {
    fontSize: '11px',
    color: '#b45309',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
});

interface RequestDetailsProps {
  request: ServiceRequest;
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdated?: (request: ServiceRequest) => void;
}

export const RequestDetails: React.FC<RequestDetailsProps> = ({
  request,
  isOpen,
  onClose,
  onRequestUpdated,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode state
  const [editingSection, setEditingSection] = useState<'contact' | 'deal' | 'requirements' | 'comments' | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string | number>>({});

  const availableTransitions = STAGE_TRANSITIONS[request.FunnelStage] || [];

  const startEditing = useCallback((section: 'contact' | 'deal' | 'requirements' | 'comments') => {
    const values: Record<string, string | number> = {};
    if (section === 'contact') {
      values.ContactName = request.ContactName || '';
      values.ContactEmail = request.ContactEmail || '';
      values.ContactPhone = request.ContactPhone || '';
      values.Industry = request.Industry || '';
    } else if (section === 'deal') {
      values.DealValue = request.DealValue || 0;
      values.DealProbability = request.DealProbability || 50;
    } else if (section === 'requirements') {
      values.Requirements = request.Requirements || '';
    } else if (section === 'comments') {
      values.Comments = request.Comments || '';
    }
    setEditValues(values);
    setEditingSection(section);
  }, [request]);

  const cancelEditing = useCallback(() => {
    setEditingSection(null);
    setEditValues({});
  }, []);

  const handleSaveEdit = async () => {
    if (!user || !editingSection) return;

    try {
      setSaving(true);

      if (editingSection === 'deal') {
        // Use updateDealInfo for deal values (recalculates WeightedPipeline + notifications)
        const result = await serviceRequestService.updateDealInfo(
          request.Id,
          {
            DealValue: editValues.DealValue as number,
            DealProbability: editValues.DealProbability as number,
          },
          user.email,
          user.displayName
        );

        if (result.success && result.request) {
          showToast('Deal information updated', 'success');
          onRequestUpdated?.(result.request);
        } else {
          throw new Error(result.error || 'Failed to update deal info');
        }
      } else {
        // Use updateRequestFields for contact/requirements/comments
        const updates: Record<string, string> = {};
        for (const [key, value] of Object.entries(editValues)) {
          updates[key] = String(value);
        }

        const result = await serviceRequestService.updateRequestFields(
          request.Id,
          updates,
          user.email,
          user.displayName
        );

        if (result.success && result.request) {
          const sectionLabel = editingSection === 'contact' ? 'Contact information' :
            editingSection === 'requirements' ? 'Requirements' : 'Comments';
          showToast(`${sectionLabel} updated`, 'success');
          onRequestUpdated?.(result.request);
        } else {
          throw new Error(result.error || 'Failed to update');
        }
      }

      setEditingSection(null);
      setEditValues({});
    } catch (err) {
      console.error('Error saving edit:', err);
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isTerminal = request.FunnelStage === 'Won' || request.FunnelStage === 'Lost';

  const formatCurrency = (value?: number): string => {
    if (!value) return 'Not specified';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (dateStr?: string): string => {
    if (!dateStr) return 'Not specified';
    try {
      return format(new Date(dateStr), 'EEE, MMM d, yyyy @ h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const handleStageChange = async (newStage: FunnelStage) => {
    if (!user) return;

    try {
      setUpdating(true);
      const result = await serviceRequestService.updateStage(
        request.Id,
        newStage,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast(`Request moved to ${newStage}`, 'success');
        onRequestUpdated?.(result.request);
      } else {
        throw new Error(result.error || 'Failed to update stage');
      }
    } catch (err) {
      console.error('Error updating stage:', err);
      showToast('Failed to update stage', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getTransitionButton = (stage: FunnelStage) => {
    const currentIndex = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'].indexOf(
      request.FunnelStage
    );
    const targetIndex = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'].indexOf(stage);

    if (stage === 'Won') {
      return (
        <Button
          key={stage}
          className={styles.wonButton}
          appearance="primary"
          icon={<CheckmarkRegular />}
          onClick={() => handleStageChange(stage)}
          disabled={updating}
        >
          Mark as Won
        </Button>
      );
    }

    if (stage === 'Lost') {
      return (
        <Button
          key={stage}
          className={styles.lostButton}
          appearance="primary"
          icon={<DismissRegular />}
          onClick={() => handleStageChange(stage)}
          disabled={updating}
        >
          Mark as Lost
        </Button>
      );
    }

    if (targetIndex > currentIndex) {
      return (
        <Button
          key={stage}
          className={styles.advanceButton}
          appearance="primary"
          icon={<ArrowRightRegular />}
          onClick={() => handleStageChange(stage)}
          disabled={updating}
        >
          Advance to {stage}
        </Button>
      );
    }

    return (
      <Button
        key={stage}
        className={styles.regressButton}
        appearance="secondary"
        onClick={() => handleStageChange(stage)}
        disabled={updating}
      >
        Move back to {stage}
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody style={{ padding: 0 }}>
          {/* Header with colored background */}
          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <DocumentRegular style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div className={styles.headerContent}>
              <Text className={styles.title}>{request.ClientName}</Text>
              <Text className={styles.subtitle}>{request.ServiceName}</Text>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.stageBadge}>{request.FunnelStage}</span>
              <button
                className={styles.closeButton}
                onClick={onClose}
                title="Close"
              >
                <Dismiss24Regular />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressSection}>
            <StageProgressBar currentStage={request.FunnelStage} showLabels />
          </div>

          {/* Content */}
          <DialogContent className={styles.content}>
            {/* Stage Actions */}
            {availableTransitions.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <ArrowRightRegular style={{ width: '14px', height: '14px' }} />
                  Stage Actions
                </div>
                <div className={styles.stageActions}>
                  {updating && <Spinner size="tiny" />}
                  {availableTransitions.map((stage) => getTransitionButton(stage))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PersonRegular style={{ width: '14px', height: '14px' }} />
                Contact Information
                {!isTerminal && editingSection !== 'contact' && (
                  <Button
                    className={styles.editButton}
                    appearance="subtle"
                    icon={<EditRegular />}
                    size="small"
                    onClick={() => startEditing('contact')}
                    title="Edit contact info"
                  />
                )}
                {editingSection === 'contact' && (
                  <span className={styles.editingIndicator}>
                    <EditRegular style={{ width: '12px', height: '12px' }} />
                    Editing
                  </span>
                )}
              </div>
              {editingSection === 'contact' ? (
                <>
                  <div className={styles.grid}>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Contact Name</span>
                      <Input
                        className={styles.editInput}
                        value={String(editValues.ContactName || '')}
                        onChange={(_, data) => setEditValues((prev) => ({ ...prev, ContactName: data.value }))}
                      />
                    </div>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Email</span>
                      <Input
                        className={styles.editInput}
                        type="email"
                        value={String(editValues.ContactEmail || '')}
                        onChange={(_, data) => setEditValues((prev) => ({ ...prev, ContactEmail: data.value }))}
                      />
                    </div>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Phone</span>
                      <Input
                        className={styles.editInput}
                        value={String(editValues.ContactPhone || '')}
                        onChange={(_, data) => setEditValues((prev) => ({ ...prev, ContactPhone: data.value }))}
                      />
                    </div>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Industry</span>
                      <Input
                        className={styles.editInput}
                        value={String(editValues.Industry || '')}
                        onChange={(_, data) => setEditValues((prev) => ({ ...prev, Industry: data.value }))}
                      />
                    </div>
                  </div>
                  <div className={styles.editActions}>
                    <Button
                      className={styles.saveButton}
                      appearance="primary"
                      icon={<SaveRegular />}
                      onClick={handleSaveEdit}
                      disabled={saving}
                      size="small"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      appearance="secondary"
                      onClick={cancelEditing}
                      disabled={saving}
                      size="small"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className={styles.grid}>
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Contact Name</span>
                    <span className={styles.gridValue}>
                      <PersonRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                      {request.ContactName}
                    </span>
                  </div>
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Email</span>
                    <span className={styles.gridValue}>
                      <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                      {request.ContactEmail}
                    </span>
                  </div>
                  {request.ContactPhone && (
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Phone</span>
                      <span className={styles.gridValue}>
                        <PhoneRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                        {request.ContactPhone}
                      </span>
                    </div>
                  )}
                  {request.Industry && (
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Industry</span>
                      <span className={styles.gridValue}>
                        <BuildingRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                        {request.Industry}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Deal Information */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <MoneyRegular style={{ width: '14px', height: '14px' }} />
                Deal Information
                {!isTerminal && editingSection !== 'deal' && (
                  <Button
                    className={styles.editButton}
                    appearance="subtle"
                    icon={<EditRegular />}
                    size="small"
                    onClick={() => startEditing('deal')}
                    title="Edit deal info"
                  />
                )}
                {editingSection === 'deal' && (
                  <span className={styles.editingIndicator}>
                    <EditRegular style={{ width: '12px', height: '12px' }} />
                    Editing
                  </span>
                )}
              </div>
              {editingSection === 'deal' ? (
                <>
                  <div className={styles.grid}>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Interest Level</span>
                      <span
                        className={styles.interestBadge}
                        style={{
                          backgroundColor:
                            request.InterestLevel === 'Hot'
                              ? 'rgba(209, 52, 56, 0.1)'
                              : request.InterestLevel === 'Warm'
                              ? 'rgba(247, 99, 12, 0.1)'
                              : 'rgba(107, 130, 140, 0.1)',
                          color:
                            request.InterestLevel === 'Hot'
                              ? '#d13438'
                              : request.InterestLevel === 'Warm'
                              ? '#f7630c'
                              : '#6b828c',
                        }}
                      >
                        {request.InterestLevel === 'Hot'
                          ? '🔥'
                          : request.InterestLevel === 'Warm'
                          ? '☀️'
                          : '❄️'}{' '}
                        {request.InterestLevel}
                      </span>
                    </div>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Deal Value (ZAR)</span>
                      <Input
                        className={styles.editInput}
                        type="number"
                        value={String(editValues.DealValue || 0)}
                        onChange={(_, data) =>
                          setEditValues((prev) => ({ ...prev, DealValue: Number(data.value) || 0 }))
                        }
                      />
                    </div>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Win Probability (%)</span>
                      <Input
                        className={styles.editInput}
                        type="number"
                        min={0}
                        max={100}
                        value={String(editValues.DealProbability || 50)}
                        onChange={(_, data) => {
                          const val = Math.min(100, Math.max(0, Number(data.value) || 0));
                          setEditValues((prev) => ({ ...prev, DealProbability: val }));
                        }}
                      />
                    </div>
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Weighted Value (auto)</span>
                      <span className={styles.gridValue}>
                        {formatCurrency(
                          ((editValues.DealValue as number) || 0) *
                            (((editValues.DealProbability as number) || 50) / 100)
                        )}
                      </span>
                    </div>
                  </div>
                  <div className={styles.editActions}>
                    <Button
                      className={styles.saveButton}
                      appearance="primary"
                      icon={<SaveRegular />}
                      onClick={handleSaveEdit}
                      disabled={saving}
                      size="small"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      appearance="secondary"
                      onClick={cancelEditing}
                      disabled={saving}
                      size="small"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className={styles.grid}>
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Interest Level</span>
                    <span
                      className={styles.interestBadge}
                      style={{
                        backgroundColor:
                          request.InterestLevel === 'Hot'
                            ? 'rgba(209, 52, 56, 0.1)'
                            : request.InterestLevel === 'Warm'
                            ? 'rgba(247, 99, 12, 0.1)'
                            : 'rgba(107, 130, 140, 0.1)',
                        color:
                          request.InterestLevel === 'Hot'
                            ? '#d13438'
                            : request.InterestLevel === 'Warm'
                            ? '#f7630c'
                            : '#6b828c',
                      }}
                    >
                      {request.InterestLevel === 'Hot'
                        ? '🔥'
                        : request.InterestLevel === 'Warm'
                        ? '☀️'
                        : '❄️'}{' '}
                      {request.InterestLevel}
                    </span>
                  </div>
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Deal Value</span>
                    <span className={styles.gridValue} style={{ color: '#107c10', fontWeight: '600' }}>
                      {formatCurrency(request.DealValue)}
                    </span>
                  </div>
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Win Probability</span>
                    <span className={styles.gridValue}>{request.DealProbability || 50}%</span>
                  </div>
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Weighted Value</span>
                    <span className={styles.gridValue}>
                      {formatCurrency((request.DealValue || 0) * ((request.DealProbability || 50) / 100))}
                    </span>
                  </div>
                  {request.Budget && (
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Client Budget</span>
                      <span className={styles.gridValue}>{request.Budget}</span>
                    </div>
                  )}
                  {request.Timeline && (
                    <div className={styles.gridItem}>
                      <span className={styles.gridLabel}>Client Timeline</span>
                      <span className={styles.gridValue}>{request.Timeline}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assigned Specialist */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PersonRegular style={{ width: '14px', height: '14px' }} />
                Assigned Specialist
              </div>
              {request.AssignedSpecialistName ? (
                <div className={styles.specialistCard}>
                  <div className={styles.specialistIcon}>
                    <PersonRegular style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div className={styles.specialistInfo}>
                    <Text className={styles.specialistName}>{request.AssignedSpecialistName}</Text>
                    <Text className={styles.specialistRole}>
                      {request.AssignedSpecialistRole || 'Specialist'} • {request.AssignedSpecialistEmail}
                    </Text>
                  </div>
                </div>
              ) : (
                <div className={styles.unassigned}>No specialist assigned yet</div>
              )}
            </div>

            {/* Time Slots */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <CalendarLtr24Regular style={{ width: '14px', height: '14px' }} />
                Meeting Schedule
              </div>
              <div className={styles.timeSlotsList}>
                {request.ConfirmedDateTime ? (
                  <div className={`${styles.timeSlot} ${styles.confirmedSlot}`}>
                    <CheckmarkRegular style={{ width: '16px', height: '16px', color: '#107c10' }} />
                    <strong>Confirmed:</strong> {formatDateTime(request.ConfirmedDateTime)}
                  </div>
                ) : (
                  <>
                    <div className={styles.timeSlot}>
                      <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                      Option 1: {formatDateTime(request.ProposedSlot1)}
                    </div>
                    {request.ProposedSlot2 && (
                      <div className={styles.timeSlot}>
                        <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                        Option 2: {formatDateTime(request.ProposedSlot2)}
                      </div>
                    )}
                    {request.ProposedSlot3 && (
                      <div className={styles.timeSlot}>
                        <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                        Option 3: {formatDateTime(request.ProposedSlot3)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Requirements */}
            {(request.Requirements || !isTerminal) && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <DocumentRegular style={{ width: '14px', height: '14px' }} />
                  Requirements
                  {!isTerminal && editingSection !== 'requirements' && (
                    <Button
                      className={styles.editButton}
                      appearance="subtle"
                      icon={<EditRegular />}
                      size="small"
                      onClick={() => startEditing('requirements')}
                      title="Edit requirements"
                    />
                  )}
                  {editingSection === 'requirements' && (
                    <span className={styles.editingIndicator}>
                      <EditRegular style={{ width: '12px', height: '12px' }} />
                      Editing
                    </span>
                  )}
                </div>
                {editingSection === 'requirements' ? (
                  <>
                    <Textarea
                      className={styles.editTextarea}
                      value={String(editValues.Requirements || '')}
                      onChange={(_, data) => setEditValues((prev) => ({ ...prev, Requirements: data.value }))}
                      resize="vertical"
                    />
                    <div className={styles.editActions}>
                      <Button
                        className={styles.saveButton}
                        appearance="primary"
                        icon={<SaveRegular />}
                        onClick={handleSaveEdit}
                        disabled={saving}
                        size="small"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        appearance="secondary"
                        onClick={cancelEditing}
                        disabled={saving}
                        size="small"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  request.Requirements ? (
                    <div className={styles.textBlock}>{request.Requirements}</div>
                  ) : (
                    <div className={styles.unassigned}>No requirements specified</div>
                  )
                )}
              </div>
            )}

            {/* Comments */}
            {(request.Comments || !isTerminal) && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <ChatRegular style={{ width: '14px', height: '14px' }} />
                  Additional Comments
                  {!isTerminal && editingSection !== 'comments' && (
                    <Button
                      className={styles.editButton}
                      appearance="subtle"
                      icon={<EditRegular />}
                      size="small"
                      onClick={() => startEditing('comments')}
                      title="Edit comments"
                    />
                  )}
                  {editingSection === 'comments' && (
                    <span className={styles.editingIndicator}>
                      <EditRegular style={{ width: '12px', height: '12px' }} />
                      Editing
                    </span>
                  )}
                </div>
                {editingSection === 'comments' ? (
                  <>
                    <Textarea
                      className={styles.editTextarea}
                      value={String(editValues.Comments || '')}
                      onChange={(_, data) => setEditValues((prev) => ({ ...prev, Comments: data.value }))}
                      resize="vertical"
                    />
                    <div className={styles.editActions}>
                      <Button
                        className={styles.saveButton}
                        appearance="primary"
                        icon={<SaveRegular />}
                        onClick={handleSaveEdit}
                        disabled={saving}
                        size="small"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        appearance="secondary"
                        onClick={cancelEditing}
                        disabled={saving}
                        size="small"
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  request.Comments ? (
                    <div className={styles.textBlock}>{request.Comments}</div>
                  ) : (
                    <div className={styles.unassigned}>No comments</div>
                  )
                )}
              </div>
            )}

            {/* Win/Loss Reason */}
            {request.WinLossReason && (
              <div className={styles.sectionLast}>
                <div className={styles.sectionHeader}>
                  {request.FunnelStage === 'Won' ? 'Win Reason' : 'Loss Reason'}
                </div>
                <div className={styles.textBlock}>{request.WinLossReason}</div>
              </div>
            )}
          </DialogContent>

          {/* Footer */}
          <div className={styles.footer}>
            <span className={styles.footerLeft}>
              Created {format(new Date(request.Created), 'MMM d, yyyy')} by{' '}
              {request.AccountManagerName}
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                appearance="secondary"
                onClick={onClose}
                className={styles.cancelButton}
              >
                Cancel
              </Button>
              <Button
                className={styles.submitButton}
                appearance="primary"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
