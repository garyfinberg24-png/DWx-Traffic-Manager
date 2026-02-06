import React, { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Input,
  Text,
} from '@fluentui/react-components';
import { Info16Regular } from '@fluentui/react-icons';
import type { SigningPage } from '../../types/Proposal';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  columnsLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('24px'),
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  columnHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('0', '0', '4px', '0'),
    ...shorthands.borderBottom('2px', 'solid', tokens.colorBrandStroke1),
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
  },
  dateFieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    maxWidth: '250px',
  },
  readOnlyText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
  },
  noteContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  noteIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    marginTop: '2px',
  },
  noteText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '18px',
    fontStyle: 'italic',
  },
});

interface SigningPageEditorProps {
  data: SigningPage | null;
  onChange: (data: SigningPage) => void;
  readOnly?: boolean;
}

const EMPTY: SigningPage = {
  clientSignatory: '',
  clientTitle: '',
  dwSignatory: '',
  dwTitle: '',
  proposedDate: '',
};

export const SigningPageEditor: React.FC<SigningPageEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const updateField = useCallback(
    (field: keyof SigningPage, value: string) => {
      onChange({ ...current, [field]: value });
    },
    [current, onChange],
  );

  if (readOnly) {
    return (
      <div className={styles.container}>
        <div className={styles.columnsLayout}>
          <div className={styles.column}>
            <Text className={styles.columnHeader}>Client</Text>
            <div className={styles.fieldGroup}>
              <Text className={styles.label}>Signatory Name</Text>
              <Text className={styles.readOnlyText}>
                {current.clientSignatory || 'Not specified'}
              </Text>
            </div>
            <div className={styles.fieldGroup}>
              <Text className={styles.label}>Title</Text>
              <Text className={styles.readOnlyText}>
                {current.clientTitle || 'Not specified'}
              </Text>
            </div>
          </div>

          <div className={styles.column}>
            <Text className={styles.columnHeader}>Digital Workplace</Text>
            <div className={styles.fieldGroup}>
              <Text className={styles.label}>Signatory Name</Text>
              <Text className={styles.readOnlyText}>
                {current.dwSignatory || 'Not specified'}
              </Text>
            </div>
            <div className={styles.fieldGroup}>
              <Text className={styles.label}>Title</Text>
              <Text className={styles.readOnlyText}>
                {current.dwTitle || 'Not specified'}
              </Text>
            </div>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Proposed Date</Text>
          <Text className={styles.readOnlyText}>
            {current.proposedDate
              ? new Date(current.proposedDate).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'Not specified'}
          </Text>
        </div>

        <div className={styles.noteContainer}>
          <Info16Regular className={styles.noteIcon} />
          <Text className={styles.noteText}>
            Signatures will be collected on the final printed document.
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.columnsLayout}>
        <div className={styles.column}>
          <Text className={styles.columnHeader}>Client</Text>
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Signatory Name</Text>
            <Input
              value={current.clientSignatory}
              onChange={(_, d) => updateField('clientSignatory', d.value)}
              placeholder="Client signatory full name"
            />
          </div>
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Title</Text>
            <Input
              value={current.clientTitle}
              onChange={(_, d) => updateField('clientTitle', d.value)}
              placeholder="e.g. Chief Technology Officer"
            />
          </div>
        </div>

        <div className={styles.column}>
          <Text className={styles.columnHeader}>Digital Workplace</Text>
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Signatory Name</Text>
            <Input
              value={current.dwSignatory}
              onChange={(_, d) => updateField('dwSignatory', d.value)}
              placeholder="DW signatory full name"
            />
          </div>
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Title</Text>
            <Input
              value={current.dwTitle}
              onChange={(_, d) => updateField('dwTitle', d.value)}
              placeholder="e.g. Head of Digital Workplace"
            />
          </div>
        </div>
      </div>

      <div className={styles.dateFieldGroup}>
        <Text className={styles.label}>Proposed Date</Text>
        <Input
          type="date"
          value={current.proposedDate}
          onChange={(_, d) => updateField('proposedDate', d.value)}
        />
      </div>

      <div className={styles.noteContainer}>
        <Info16Regular className={styles.noteIcon} />
        <Text className={styles.noteText}>
          Signatures will be collected on the final printed document.
        </Text>
      </div>
    </div>
  );
};

export default SigningPageEditor;
