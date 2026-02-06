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
import type { SolutionOverview } from '../../types/Proposal';

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

interface SolutionOverviewEditorProps {
  data: SolutionOverview | null;
  onChange: (data: SolutionOverview) => void;
  readOnly?: boolean;
}

const EMPTY: SolutionOverview = {
  description: '',
  approach: '',
  differentiators: [''],
};

export const SolutionOverviewEditor: React.FC<SolutionOverviewEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const updateField = useCallback(
    <K extends keyof SolutionOverview>(field: K, value: SolutionOverview[K]) => {
      onChange({ ...current, [field]: value });
    },
    [current, onChange],
  );

  const updateDifferentiator = useCallback(
    (index: number, value: string) => {
      const list = [...current.differentiators];
      list[index] = value;
      updateField('differentiators', list);
    },
    [current, updateField],
  );

  const addDifferentiator = useCallback(() => {
    updateField('differentiators', [...current.differentiators, '']);
  }, [current, updateField]);

  const removeDifferentiator = useCallback(
    (index: number) => {
      const list = current.differentiators.filter((_, i) => i !== index);
      updateField('differentiators', list.length > 0 ? list : ['']);
    },
    [current, updateField],
  );

  if (readOnly) {
    return (
      <div className={styles.container}>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Description</Text>
          <Text className={styles.readOnlyText}>
            {current.description || 'Not provided'}
          </Text>
        </div>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Approach</Text>
          <Text className={styles.readOnlyText}>
            {current.approach || 'Not provided'}
          </Text>
        </div>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Differentiators</Text>
          {current.differentiators.filter(Boolean).length > 0 ? (
            <ul className={styles.readOnlyList}>
              {current.differentiators.filter(Boolean).map((item, i) => (
                <li key={i}>
                  <Text className={styles.readOnlyText}>{item}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.readOnlyText}>None specified</Text>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Description</Text>
        <Textarea
          value={current.description}
          onChange={(_, d) => updateField('description', d.value)}
          rows={6}
          resize="vertical"
          placeholder="Describe the proposed solution in detail..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Approach</Text>
        <Textarea
          value={current.approach}
          onChange={(_, d) => updateField('approach', d.value)}
          rows={4}
          resize="vertical"
          placeholder="Describe the implementation approach..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Differentiators</Text>
        {current.differentiators.map((item, index) => (
          <div key={index} className={styles.listItem}>
            <Input
              className={styles.listItemInput}
              value={item}
              onChange={(_, d) => updateDifferentiator(index, d.value)}
              placeholder={`Differentiator ${index + 1}`}
            />
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              size="small"
              onClick={() => removeDifferentiator(index)}
              title="Remove differentiator"
            />
          </div>
        ))}
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<Add16Regular />}
          size="small"
          onClick={() => addDifferentiator()}
        >
          Add Differentiator
        </Button>
      </div>
    </div>
  );
};

export default SolutionOverviewEditor;
