import React, { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Input,
  Textarea,
  Button,
  Text,
} from '@fluentui/react-components';
import { Add16Regular, Dismiss16Regular } from '@fluentui/react-icons';
import { DEFAULT_CHANGE_CONTROL } from '../../types/Proposal';
import type { ChangeControl } from '../../types/Proposal';

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
  listItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  listItemInput: {
    flexGrow: 1,
  },
  readOnlyList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    ...shorthands.padding('0'),
    margin: '0',
    listStylePosition: 'inside',
  },
  readOnlyText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
    whiteSpace: 'pre-wrap',
  },
  addButton: {
    alignSelf: 'flex-start',
  },
});

interface ChangeControlEditorProps {
  data: ChangeControl | null;
  onChange: (data: ChangeControl) => void;
  readOnly?: boolean;
}

export const ChangeControlEditor: React.FC<ChangeControlEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? { ...DEFAULT_CHANGE_CONTROL, approvalLevels: [...DEFAULT_CHANGE_CONTROL.approvalLevels] };

  const updateField = useCallback(
    <K extends keyof ChangeControl>(field: K, value: ChangeControl[K]) => {
      onChange({ ...current, [field]: value });
    },
    [current, onChange],
  );

  const updateApprovalLevel = useCallback(
    (index: number, value: string) => {
      const approvalLevels = [...current.approvalLevels];
      approvalLevels[index] = value;
      updateField('approvalLevels', approvalLevels);
    },
    [current, updateField],
  );

  const addApprovalLevel = useCallback(() => {
    updateField('approvalLevels', [...current.approvalLevels, '']);
  }, [current, updateField]);

  const removeApprovalLevel = useCallback(
    (index: number) => {
      const approvalLevels = current.approvalLevels.filter(
        (_, i) => i !== index,
      );
      updateField(
        'approvalLevels',
        approvalLevels.length > 0 ? approvalLevels : [''],
      );
    },
    [current, updateField],
  );

  if (readOnly) {
    return (
      <div className={styles.container}>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Process</Text>
          <Text className={styles.readOnlyText}>
            {current.process || 'Not specified'}
          </Text>
        </div>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Approval Levels</Text>
          {current.approvalLevels.filter(Boolean).length > 0 ? (
            <ul className={styles.readOnlyList}>
              {current.approvalLevels.filter(Boolean).map((item, i) => (
                <li key={i}>
                  <Text className={styles.readOnlyText}>{item}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.readOnlyText}>Not specified</Text>
          )}
        </div>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Pricing Impact</Text>
          <Text className={styles.readOnlyText}>
            {current.pricingImpact || 'Not specified'}
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Process</Text>
        <Textarea
          value={current.process}
          onChange={(_, d) => updateField('process', d.value)}
          rows={4}
          resize="vertical"
          placeholder="Describe the change control process..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Approval Levels</Text>
        {current.approvalLevels.map((item, index) => (
          <div key={index} className={styles.listItem}>
            <Input
              className={styles.listItemInput}
              value={item}
              onChange={(_, d) => updateApprovalLevel(index, d.value)}
              placeholder={`Approval level ${index + 1}`}
            />
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              size="small"
              onClick={() => removeApprovalLevel(index)}
              title="Remove approval level"
            />
          </div>
        ))}
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<Add16Regular />}
          size="small"
          onClick={addApprovalLevel}
        >
          Add Approval Level
        </Button>
      </div>

      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Pricing Impact</Text>
        <Textarea
          value={current.pricingImpact}
          onChange={(_, d) => updateField('pricingImpact', d.value)}
          rows={3}
          resize="vertical"
          placeholder="Describe how changes affect pricing..."
        />
      </div>
    </div>
  );
};

export default ChangeControlEditor;
