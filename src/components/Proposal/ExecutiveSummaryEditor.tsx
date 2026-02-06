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
import type { ExecutiveSummary } from '../../types/Proposal';

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

interface ExecutiveSummaryEditorProps {
  data: ExecutiveSummary | null;
  onChange: (data: ExecutiveSummary) => void;
  readOnly?: boolean;
}

const EMPTY: ExecutiveSummary = {
  overview: '',
  objectives: [''],
  successCriteria: [''],
};

export const ExecutiveSummaryEditor: React.FC<ExecutiveSummaryEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const updateField = useCallback(
    <K extends keyof ExecutiveSummary>(field: K, value: ExecutiveSummary[K]) => {
      onChange({ ...current, [field]: value });
    },
    [current, onChange],
  );

  const updateListItem = useCallback(
    (field: 'objectives' | 'successCriteria', index: number, value: string) => {
      const list = [...current[field]];
      list[index] = value;
      updateField(field, list);
    },
    [current, updateField],
  );

  const addListItem = useCallback(
    (field: 'objectives' | 'successCriteria') => {
      updateField(field, [...current[field], '']);
    },
    [current, updateField],
  );

  const removeListItem = useCallback(
    (field: 'objectives' | 'successCriteria', index: number) => {
      const list = current[field].filter((_, i) => i !== index);
      updateField(field, list.length > 0 ? list : ['']);
    },
    [current, updateField],
  );

  if (readOnly) {
    return (
      <div className={styles.container}>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Overview</Text>
          <Text className={styles.readOnlyText}>
            {current.overview || 'Not provided'}
          </Text>
        </div>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Objectives</Text>
          {current.objectives.filter(Boolean).length > 0 ? (
            <ul className={styles.readOnlyList}>
              {current.objectives.filter(Boolean).map((item, i) => (
                <li key={i}>
                  <Text className={styles.readOnlyText}>{item}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.readOnlyText}>None specified</Text>
          )}
        </div>
        <div className={styles.fieldGroup}>
          <Text className={styles.label}>Success Criteria</Text>
          {current.successCriteria.filter(Boolean).length > 0 ? (
            <ul className={styles.readOnlyList}>
              {current.successCriteria.filter(Boolean).map((item, i) => (
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
        <Text className={styles.label}>Overview</Text>
        <Textarea
          value={current.overview}
          onChange={(_, d) => updateField('overview', d.value)}
          rows={4}
          resize="vertical"
          placeholder="Provide a high-level overview of the proposal..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Objectives</Text>
        {current.objectives.map((item, index) => (
          <div key={index} className={styles.listItem}>
            <Input
              className={styles.listItemInput}
              value={item}
              onChange={(_, d) => updateListItem('objectives', index, d.value)}
              placeholder={`Objective ${index + 1}`}
            />
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              size="small"
              onClick={() => removeListItem('objectives', index)}
              title="Remove objective"
            />
          </div>
        ))}
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<Add16Regular />}
          size="small"
          onClick={() => addListItem('objectives')}
        >
          Add Objective
        </Button>
      </div>

      <div className={styles.fieldGroup}>
        <Text className={styles.label}>Success Criteria</Text>
        {current.successCriteria.map((item, index) => (
          <div key={index} className={styles.listItem}>
            <Input
              className={styles.listItemInput}
              value={item}
              onChange={(_, d) =>
                updateListItem('successCriteria', index, d.value)
              }
              placeholder={`Criterion ${index + 1}`}
            />
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              size="small"
              onClick={() => removeListItem('successCriteria', index)}
              title="Remove criterion"
            />
          </div>
        ))}
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<Add16Regular />}
          size="small"
          onClick={() => addListItem('successCriteria')}
        >
          Add Criterion
        </Button>
      </div>
    </div>
  );
};

export default ExecutiveSummaryEditor;
