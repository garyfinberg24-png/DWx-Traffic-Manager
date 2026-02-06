import React, { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Textarea,
  Text,
} from '@fluentui/react-components';
import { DEFAULT_TERMS } from '../../types/Proposal';
import type { ProposalTerms } from '../../types/Proposal';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
  },
  readOnlyText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
    whiteSpace: 'pre-wrap',
  },
});

interface TermsEditorProps {
  data: ProposalTerms | null;
  onChange: (data: ProposalTerms) => void;
  readOnly?: boolean;
}

interface TermField {
  key: keyof ProposalTerms;
  label: string;
}

const TERM_FIELDS: TermField[] = [
  { key: 'paymentTerms', label: 'Payment Terms' },
  { key: 'warranty', label: 'Warranty' },
  { key: 'liability', label: 'Liability' },
  { key: 'confidentiality', label: 'Confidentiality' },
  { key: 'ipOwnership', label: 'IP Ownership' },
  { key: 'termination', label: 'Termination' },
];

export const TermsEditor: React.FC<TermsEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? { ...DEFAULT_TERMS };

  const updateField = useCallback(
    (field: keyof ProposalTerms, value: string) => {
      onChange({ ...current, [field]: value });
    },
    [current, onChange],
  );

  if (readOnly) {
    return (
      <div className={styles.container}>
        {TERM_FIELDS.map(({ key, label }) => (
          <div key={key} className={styles.fieldGroup}>
            <Text className={styles.label}>{label}</Text>
            <Text className={styles.readOnlyText}>
              {current[key] || 'Not specified'}
            </Text>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {TERM_FIELDS.map(({ key, label }) => (
        <div key={key} className={styles.fieldGroup}>
          <Text className={styles.label}>{label}</Text>
          <Textarea
            value={current[key]}
            onChange={(_, d) => updateField(key, d.value)}
            rows={3}
            resize="vertical"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      ))}
    </div>
  );
};

export default TermsEditor;
