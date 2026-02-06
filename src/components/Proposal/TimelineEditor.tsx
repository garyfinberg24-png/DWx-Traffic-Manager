import React, { useCallback, useMemo } from 'react';
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
import type { ProposalTimeline, TimelinePhase } from '../../types/Proposal';

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
  thCenter: {
    textAlign: 'center',
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
  tdCenter: {
    ...shorthands.padding('6px', '8px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'top',
    textAlign: 'center',
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
  weekInput: {
    width: '70px',
  },
  totalRow: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  totalLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
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
  milestoneList: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('4px'),
  },
});

interface TimelineEditorProps {
  data: ProposalTimeline | null;
  onChange: (data: ProposalTimeline) => void;
  readOnly?: boolean;
}

const EMPTY_PHASE: TimelinePhase = {
  name: '',
  startWeek: 1,
  endWeek: 1,
  milestones: [],
};

const EMPTY: ProposalTimeline = {
  phases: [{ ...EMPTY_PHASE }],
  totalWeeks: 0,
};

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const totalWeeks = useMemo(() => {
    if (current.phases.length === 0) return 0;
    return Math.max(...current.phases.map((p) => p.endWeek || 0), 0);
  }, [current.phases]);

  const updatePhase = useCallback(
    (index: number, field: keyof TimelinePhase, value: string | number | string[]) => {
      const phases = [...current.phases];
      phases[index] = { ...phases[index], [field]: value };
      const maxEndWeek = Math.max(...phases.map((p) => p.endWeek || 0), 0);
      onChange({ phases, totalWeeks: maxEndWeek });
    },
    [current, onChange],
  );

  const addPhase = useCallback(() => {
    const lastEndWeek =
      current.phases.length > 0
        ? current.phases[current.phases.length - 1].endWeek
        : 0;
    const newPhase: TimelinePhase = {
      name: '',
      startWeek: lastEndWeek + 1,
      endWeek: lastEndWeek + 2,
      milestones: [],
    };
    const phases = [...current.phases, newPhase];
    const maxEndWeek = Math.max(...phases.map((p) => p.endWeek || 0), 0);
    onChange({ phases, totalWeeks: maxEndWeek });
  }, [current, onChange]);

  const removePhase = useCallback(
    (index: number) => {
      const phases = current.phases.filter((_, i) => i !== index);
      const items = phases.length > 0 ? phases : [{ ...EMPTY_PHASE }];
      const maxEndWeek = Math.max(...items.map((p) => p.endWeek || 0), 0);
      onChange({ phases: items, totalWeeks: maxEndWeek });
    },
    [current, onChange],
  );

  const handleMilestonesChange = useCallback(
    (index: number, value: string) => {
      const milestones = value
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);
      updatePhase(index, 'milestones', milestones);
    },
    [updatePhase],
  );

  if (readOnly) {
    if (current.phases.filter((p) => p.name).length === 0) {
      return (
        <div className={styles.container}>
          <Text className={styles.emptyMessage}>No timeline specified</Text>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Phase</th>
              <th className={styles.thCenter}>Start Week</th>
              <th className={styles.thCenter}>End Week</th>
              <th className={styles.th}>Milestones</th>
            </tr>
          </thead>
          <tbody>
            {current.phases
              .filter((p) => p.name)
              .map((phase, i) => (
                <tr key={i}>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>{phase.name}</Text>
                  </td>
                  <td className={styles.tdCenter}>
                    <Text className={styles.readOnlyText}>
                      Week {phase.startWeek}
                    </Text>
                  </td>
                  <td className={styles.tdCenter}>
                    <Text className={styles.readOnlyText}>
                      Week {phase.endWeek}
                    </Text>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.milestoneList}>
                      {phase.milestones.length > 0
                        ? phase.milestones.map((m, mi) => (
                            <Badge
                              key={mi}
                              appearance="outline"
                              size="small"
                            >
                              {m}
                            </Badge>
                          ))
                        : <Text className={styles.readOnlyText}>-</Text>}
                    </div>
                  </td>
                </tr>
              ))}
            <tr className={styles.totalRow}>
              <td className={styles.td}>
                <Text className={styles.totalLabel}>Total Duration</Text>
              </td>
              <td className={styles.tdCenter} colSpan={3}>
                <Badge appearance="filled" color="brand">
                  {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}
                </Badge>
              </td>
            </tr>
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
            <th className={styles.th}>Phase Name</th>
            <th className={styles.thCenter}>Start Week</th>
            <th className={styles.thCenter}>End Week</th>
            <th className={styles.th}>Milestones (comma-separated)</th>
            <th className={styles.th} style={{ width: '40px' }} />
          </tr>
        </thead>
        <tbody>
          {current.phases.map((phase, index) => (
            <tr key={index}>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={phase.name}
                  onChange={(_, d) => updatePhase(index, 'name', d.value)}
                  placeholder="e.g. Discovery"
                  size="small"
                />
              </td>
              <td className={styles.tdCenter}>
                <Input
                  className={styles.weekInput}
                  type="number"
                  value={String(phase.startWeek || '')}
                  onChange={(_, d) =>
                    updatePhase(index, 'startWeek', parseInt(d.value) || 1)
                  }
                  placeholder="1"
                  size="small"
                  min={1}
                />
              </td>
              <td className={styles.tdCenter}>
                <Input
                  className={styles.weekInput}
                  type="number"
                  value={String(phase.endWeek || '')}
                  onChange={(_, d) =>
                    updatePhase(index, 'endWeek', parseInt(d.value) || 1)
                  }
                  placeholder="2"
                  size="small"
                  min={1}
                />
              </td>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={phase.milestones.join(', ')}
                  onChange={(_, d) =>
                    handleMilestonesChange(index, d.value)
                  }
                  placeholder="Milestone 1, Milestone 2"
                  size="small"
                />
              </td>
              <td className={styles.tdActions}>
                <Button
                  appearance="subtle"
                  icon={<Dismiss16Regular />}
                  size="small"
                  onClick={() => removePhase(index)}
                  title="Remove phase"
                />
              </td>
            </tr>
          ))}
          <tr className={styles.totalRow}>
            <td className={styles.td}>
              <Text className={styles.totalLabel}>Total Duration</Text>
            </td>
            <td className={styles.tdCenter} colSpan={3}>
              <Badge appearance="filled" color="brand">
                {totalWeeks} week{totalWeeks !== 1 ? 's' : ''}
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
        onClick={addPhase}
      >
        Add Phase
      </Button>
    </div>
  );
};

export default TimelineEditor;
