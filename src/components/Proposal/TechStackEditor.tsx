import React, { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Input,
  Button,
  Text,
} from '@fluentui/react-components';
import { Add16Regular, Dismiss16Regular } from '@fluentui/react-icons';
import type { TechnologyStack, TechnologyItem } from '../../types/Proposal';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
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
  td: {
    ...shorthands.padding('6px', '8px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'top',
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
  readOnlyText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
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

interface TechStackEditorProps {
  data: TechnologyStack | null;
  onChange: (data: TechnologyStack) => void;
  readOnly?: boolean;
}

const EMPTY_ITEM: TechnologyItem = {
  name: '',
  role: '',
  justification: '',
};

const EMPTY: TechnologyStack = {
  technologies: [{ ...EMPTY_ITEM }],
};

export const TechStackEditor: React.FC<TechStackEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const updateItem = useCallback(
    (index: number, field: keyof TechnologyItem, value: string) => {
      const technologies = [...current.technologies];
      technologies[index] = { ...technologies[index], [field]: value };
      onChange({ ...current, technologies });
    },
    [current, onChange],
  );

  const addRow = useCallback(() => {
    onChange({
      ...current,
      technologies: [...current.technologies, { ...EMPTY_ITEM }],
    });
  }, [current, onChange]);

  const removeRow = useCallback(
    (index: number) => {
      const technologies = current.technologies.filter((_, i) => i !== index);
      onChange({
        ...current,
        technologies: technologies.length > 0 ? technologies : [{ ...EMPTY_ITEM }],
      });
    },
    [current, onChange],
  );

  if (readOnly) {
    if (current.technologies.filter((t) => t.name).length === 0) {
      return (
        <div className={styles.container}>
          <Text className={styles.emptyMessage}>No technologies specified</Text>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Technology</th>
              <th className={styles.th}>Role in Solution</th>
              <th className={styles.th}>Justification</th>
            </tr>
          </thead>
          <tbody>
            {current.technologies
              .filter((t) => t.name)
              .map((tech, i) => (
                <tr key={i}>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>{tech.name}</Text>
                  </td>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>{tech.role}</Text>
                  </td>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>
                      {tech.justification}
                    </Text>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Technology Name</th>
            <th className={styles.th}>Role in Solution</th>
            <th className={styles.th}>Justification</th>
            <th className={styles.th} style={{ width: '40px' }} />
          </tr>
        </thead>
        <tbody>
          {current.technologies.map((tech, index) => (
            <tr key={index}>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={tech.name}
                  onChange={(_, d) => updateItem(index, 'name', d.value)}
                  placeholder="e.g. SharePoint Online"
                  size="small"
                />
              </td>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={tech.role}
                  onChange={(_, d) => updateItem(index, 'role', d.value)}
                  placeholder="e.g. Content Management"
                  size="small"
                />
              </td>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={tech.justification}
                  onChange={(_, d) =>
                    updateItem(index, 'justification', d.value)
                  }
                  placeholder="Why this technology?"
                  size="small"
                />
              </td>
              <td className={styles.tdActions}>
                <Button
                  appearance="subtle"
                  icon={<Dismiss16Regular />}
                  size="small"
                  onClick={() => removeRow(index)}
                  title="Remove row"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button
        className={styles.addButton}
        appearance="subtle"
        icon={<Add16Regular />}
        size="small"
        onClick={addRow}
      >
        Add Technology
      </Button>
    </div>
  );
};

export default TechStackEditor;
