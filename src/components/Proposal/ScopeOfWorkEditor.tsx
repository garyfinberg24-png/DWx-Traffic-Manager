import React, { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Input,
  Button,
  Text,
  Badge,
} from '@fluentui/react-components';
import { Add16Regular, Dismiss16Regular } from '@fluentui/react-icons';
import type { ScopeOfWork, Deliverable } from '../../types/Proposal';

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
  sectionHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('8px', '0', '4px', '0'),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('8px', '8px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  thRight: {
    textAlign: 'right',
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('8px', '8px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  td: {
    ...shorthands.padding('6px', '8px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'top',
  },
  tdRight: {
    ...shorthands.padding('6px', '8px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'top',
    textAlign: 'right',
  },
  tdActions: {
    ...shorthands.padding('6px', '4px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'top',
    width: '40px',
    textAlign: 'center',
  },
  cellInput: {
    width: '100%',
  },
  hoursInput: {
    width: '80px',
  },
  totalRow: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  totalLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  totalValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
  },
  readOnlyText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
  },
  readOnlyList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    ...shorthands.padding('0'),
    margin: '0',
    listStylePosition: 'inside',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  listItemInput: {
    flexGrow: 1,
  },
  addButton: {
    alignSelf: 'flex-start',
  },
  emptyMessage: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    ...shorthands.padding('12px', '0'),
  },
});

interface ScopeOfWorkEditorProps {
  data: ScopeOfWork | null;
  onChange: (data: ScopeOfWork) => void;
  readOnly?: boolean;
}

const EMPTY_DELIVERABLE: Deliverable = {
  title: '',
  description: '',
  hours: 0,
};

const EMPTY: ScopeOfWork = {
  deliverables: [{ ...EMPTY_DELIVERABLE }],
  exclusions: [''],
};

export const ScopeOfWorkEditor: React.FC<ScopeOfWorkEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const totalHours = current.deliverables.reduce(
    (sum, d) => sum + (d.hours || 0),
    0,
  );

  const updateDeliverable = useCallback(
    (index: number, field: keyof Deliverable, value: string | number) => {
      const deliverables = [...current.deliverables];
      deliverables[index] = { ...deliverables[index], [field]: value };
      onChange({ ...current, deliverables });
    },
    [current, onChange],
  );

  const addDeliverable = useCallback(() => {
    onChange({
      ...current,
      deliverables: [...current.deliverables, { ...EMPTY_DELIVERABLE }],
    });
  }, [current, onChange]);

  const removeDeliverable = useCallback(
    (index: number) => {
      const deliverables = current.deliverables.filter((_, i) => i !== index);
      onChange({
        ...current,
        deliverables:
          deliverables.length > 0 ? deliverables : [{ ...EMPTY_DELIVERABLE }],
      });
    },
    [current, onChange],
  );

  const updateExclusion = useCallback(
    (index: number, value: string) => {
      const exclusions = [...current.exclusions];
      exclusions[index] = value;
      onChange({ ...current, exclusions });
    },
    [current, onChange],
  );

  const addExclusion = useCallback(() => {
    onChange({ ...current, exclusions: [...current.exclusions, ''] });
  }, [current, onChange]);

  const removeExclusion = useCallback(
    (index: number) => {
      const exclusions = current.exclusions.filter((_, i) => i !== index);
      onChange({
        ...current,
        exclusions: exclusions.length > 0 ? exclusions : [''],
      });
    },
    [current, onChange],
  );

  if (readOnly) {
    return (
      <div className={styles.container}>
        <div className={styles.fieldGroup}>
          <Text className={styles.sectionHeader}>Deliverables</Text>
          {current.deliverables.filter((d) => d.title).length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Title</th>
                  <th className={styles.th}>Description</th>
                  <th className={styles.thRight}>Est. Hours</th>
                </tr>
              </thead>
              <tbody>
                {current.deliverables
                  .filter((d) => d.title)
                  .map((d, i) => (
                    <tr key={i}>
                      <td className={styles.td}>
                        <Text className={styles.readOnlyText}>{d.title}</Text>
                      </td>
                      <td className={styles.td}>
                        <Text className={styles.readOnlyText}>
                          {d.description}
                        </Text>
                      </td>
                      <td className={styles.tdRight}>
                        <Text className={styles.readOnlyText}>{d.hours}</Text>
                      </td>
                    </tr>
                  ))}
                <tr className={styles.totalRow}>
                  <td className={styles.td} colSpan={2}>
                    <Text className={styles.totalLabel}>Total Hours</Text>
                  </td>
                  <td className={styles.tdRight}>
                    <Badge appearance="filled" color="brand">
                      {totalHours}h
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <Text className={styles.emptyMessage}>
              No deliverables specified
            </Text>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <Text className={styles.sectionHeader}>Exclusions</Text>
          {current.exclusions.filter(Boolean).length > 0 ? (
            <ul className={styles.readOnlyList}>
              {current.exclusions.filter(Boolean).map((item, i) => (
                <li key={i}>
                  <Text className={styles.readOnlyText}>{item}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.emptyMessage}>No exclusions specified</Text>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.fieldGroup}>
        <Text className={styles.sectionHeader}>Deliverables</Text>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Title</th>
              <th className={styles.th}>Description</th>
              <th className={styles.thRight}>Est. Hours</th>
              <th className={styles.th} style={{ width: '40px' }} />
            </tr>
          </thead>
          <tbody>
            {current.deliverables.map((d, index) => (
              <tr key={index}>
                <td className={styles.td}>
                  <Input
                    className={styles.cellInput}
                    value={d.title}
                    onChange={(_, data) =>
                      updateDeliverable(index, 'title', data.value)
                    }
                    placeholder="Deliverable title"
                    size="small"
                  />
                </td>
                <td className={styles.td}>
                  <Input
                    className={styles.cellInput}
                    value={d.description}
                    onChange={(_, data) =>
                      updateDeliverable(index, 'description', data.value)
                    }
                    placeholder="Description"
                    size="small"
                  />
                </td>
                <td className={styles.tdRight}>
                  <Input
                    className={styles.hoursInput}
                    type="number"
                    value={String(d.hours || '')}
                    onChange={(_, data) =>
                      updateDeliverable(
                        index,
                        'hours',
                        parseFloat(data.value) || 0,
                      )
                    }
                    placeholder="0"
                    size="small"
                  />
                </td>
                <td className={styles.tdActions}>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss16Regular />}
                    size="small"
                    onClick={() => removeDeliverable(index)}
                    title="Remove deliverable"
                  />
                </td>
              </tr>
            ))}
            <tr className={styles.totalRow}>
              <td className={styles.td} colSpan={2}>
                <Text className={styles.totalLabel}>Total Hours</Text>
              </td>
              <td className={styles.tdRight}>
                <Badge appearance="filled" color="brand">
                  {totalHours}h
                </Badge>
              </td>
              <td className={styles.tdActions} />
            </tr>
          </tbody>
        </table>
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<Add16Regular />}
          size="small"
          onClick={addDeliverable}
        >
          Add Deliverable
        </Button>
      </div>

      <div className={styles.fieldGroup}>
        <Text className={styles.sectionHeader}>Exclusions</Text>
        {current.exclusions.map((item, index) => (
          <div key={index} className={styles.listItem}>
            <Input
              className={styles.listItemInput}
              value={item}
              onChange={(_, d) => updateExclusion(index, d.value)}
              placeholder={`Exclusion ${index + 1}`}
            />
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              size="small"
              onClick={() => removeExclusion(index)}
              title="Remove exclusion"
            />
          </div>
        ))}
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<Add16Regular />}
          size="small"
          onClick={addExclusion}
        >
          Add Exclusion
        </Button>
      </div>
    </div>
  );
};

export default ScopeOfWorkEditor;
