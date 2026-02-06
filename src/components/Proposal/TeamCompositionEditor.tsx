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
import type { TeamComposition, TeamMember } from '../../types/Proposal';

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

interface TeamCompositionEditorProps {
  data: TeamComposition | null;
  onChange: (data: TeamComposition) => void;
  readOnly?: boolean;
}

const EMPTY_MEMBER: TeamMember = {
  role: '',
  name: '',
  responsibility: '',
};

const EMPTY: TeamComposition = {
  members: [{ ...EMPTY_MEMBER }],
};

export const TeamCompositionEditor: React.FC<TeamCompositionEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const updateMember = useCallback(
    (index: number, field: keyof TeamMember, value: string) => {
      const members = [...current.members];
      members[index] = { ...members[index], [field]: value };
      onChange({ ...current, members });
    },
    [current, onChange],
  );

  const addMember = useCallback(() => {
    onChange({
      ...current,
      members: [...current.members, { ...EMPTY_MEMBER }],
    });
  }, [current, onChange]);

  const removeMember = useCallback(
    (index: number) => {
      const members = current.members.filter((_, i) => i !== index);
      onChange({
        ...current,
        members: members.length > 0 ? members : [{ ...EMPTY_MEMBER }],
      });
    },
    [current, onChange],
  );

  if (readOnly) {
    if (current.members.filter((m) => m.name || m.role).length === 0) {
      return (
        <div className={styles.container}>
          <Text className={styles.emptyMessage}>
            No team members specified
          </Text>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Role</th>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Responsibility</th>
            </tr>
          </thead>
          <tbody>
            {current.members
              .filter((m) => m.name || m.role)
              .map((member, i) => (
                <tr key={i}>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>{member.role}</Text>
                  </td>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>{member.name}</Text>
                  </td>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>
                      {member.responsibility}
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
            <th className={styles.th}>Role</th>
            <th className={styles.th}>Name</th>
            <th className={styles.th}>Responsibility</th>
            <th className={styles.th} style={{ width: '40px' }} />
          </tr>
        </thead>
        <tbody>
          {current.members.map((member, index) => (
            <tr key={index}>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={member.role}
                  onChange={(_, d) => updateMember(index, 'role', d.value)}
                  placeholder="e.g. Solution Architect"
                  size="small"
                />
              </td>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={member.name}
                  onChange={(_, d) => updateMember(index, 'name', d.value)}
                  placeholder="Team member name"
                  size="small"
                />
              </td>
              <td className={styles.td}>
                <Input
                  className={styles.cellInput}
                  value={member.responsibility}
                  onChange={(_, d) =>
                    updateMember(index, 'responsibility', d.value)
                  }
                  placeholder="Key responsibility"
                  size="small"
                />
              </td>
              <td className={styles.tdActions}>
                <Button
                  appearance="subtle"
                  icon={<Dismiss16Regular />}
                  size="small"
                  onClick={() => removeMember(index)}
                  title="Remove member"
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
        onClick={addMember}
      >
        Add Team Member
      </Button>
    </div>
  );
};

export default TeamCompositionEditor;
