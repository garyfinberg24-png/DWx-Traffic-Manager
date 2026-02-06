/**
 * DWx Traffic Manager - Drafts Tab Content
 * Reads saved form drafts from localStorage and displays DraftCards.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { DraftCard, DraftInfo } from './DraftCard';
import { ConfirmDialog } from '../Common/ConfirmDialog';

const SERVICE_DRAFT_KEY = 'dwx_service_request_draft';
const PRODUCT_DRAFT_KEY = 'dwx_product_request_draft';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '16px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
    border: '1px dashed #d0d0d0',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    color: '#8a8886',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#616161',
    maxWidth: '400px',
  },
});

function parseDraft(key: string, type: 'service' | 'product'): DraftInfo | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);

    if (type === 'service') {
      return {
        type: 'service',
        clientName: data.formData?.clientName || '',
        serviceName: data.selectedService?.Title || '',
        currentStep: data.currentStep ?? 1,
        totalSteps: 6,
        dealValue: data.formData?.dealValue ? Number(data.formData.dealValue) : undefined,
        savedAt: data.savedAt || new Date().toISOString(),
      };
    } else {
      return {
        type: 'product',
        clientName: data.formData?.clientName || '',
        serviceName: data.selectedProduct?.name || '',
        currentStep: data.currentStep ?? 1,
        totalSteps: 4,
        dealValue: undefined,
        savedAt: data.savedAt || new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }
}

interface DraftsTabContentProps {
  onDraftCountChange?: (count: number) => void;
}

export const DraftsTabContent: React.FC<DraftsTabContentProps> = ({ onDraftCountChange }) => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [drafts, setDrafts] = useState<DraftInfo[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DraftInfo | null>(null);

  const loadDrafts = useCallback(() => {
    const result: DraftInfo[] = [];
    const serviceDraft = parseDraft(SERVICE_DRAFT_KEY, 'service');
    if (serviceDraft) result.push(serviceDraft);
    const productDraft = parseDraft(PRODUCT_DRAFT_KEY, 'product');
    if (productDraft) result.push(productDraft);
    setDrafts(result);
    onDraftCountChange?.(result.length);
  }, [onDraftCountChange]);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const handleContinue = (draft: DraftInfo) => {
    if (draft.type === 'service') {
      navigate('/request', { state: { restoreDraft: true } });
    } else {
      navigate('/product-request', { state: { restoreDraft: true } });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const key = deleteTarget.type === 'service' ? SERVICE_DRAFT_KEY : PRODUCT_DRAFT_KEY;
    localStorage.removeItem(key);
    setDeleteTarget(null);
    loadDrafts();
  };

  if (drafts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <SaveRegular className={styles.emptyIcon} />
        <Text className={styles.emptyTitle}>No saved drafts</Text>
        <Text className={styles.emptyText}>
          Use the Save Draft button in request forms to save your progress and continue later.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {drafts.map((draft) => (
          <DraftCard
            key={draft.type}
            draft={draft}
            onContinue={() => handleContinue(draft)}
            onDelete={() => setDeleteTarget(draft)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Draft"
        message={`Are you sure you want to delete this ${deleteTarget?.type === 'service' ? 'service' : 'product'} request draft? This cannot be undone.`}
        confirmLabel="Delete Draft"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
