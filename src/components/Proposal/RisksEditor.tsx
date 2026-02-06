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
import type { ProposalRisk, RiskLevel } from '../../types/Proposal';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  sectionHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('4px', '0'),
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
  selectInput: {
    width: '100%',
    minWidth: '90px',
    height: '30px',
    fontSize: '13px',
    ...shorthands.padding('4px', '8px'),
    ...shorthands.borderRadius('4px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    cursor: 'pointer',
    outline: 'none',
    ':focus': {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
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
  riskBadge: {
    minWidth: '60px',
    textAlign: 'center',
  },
});

interface RisksEditorProps {
  data: { assumptions: string[]; risks: ProposalRisk[] } | null;
  onChange: (data: { assumptions: string[]; risks: ProposalRisk[] }) => void;
  readOnly?: boolean;
}

const EMPTY_RISK: ProposalRisk = {
  risk: '',
  impact: 'Medium',
  mitigation: '',
  likelihood: 'Medium',
};

const EMPTY: { assumptions: string[]; risks: ProposalRisk[] } = {
  assumptions: [''],
  risks: [{ ...EMPTY_RISK }],
};

const RISK_LEVELS: RiskLevel[] = ['High', 'Medium', 'Low'];

function getRiskBadgeColor(level: RiskLevel): 'danger' | 'warning' | 'success' {
  switch (level) {
    case 'High':
      return 'danger';
    case 'Medium':
      return 'warning';
    case 'Low':
      return 'success';
  }
}

export const RisksEditor: React.FC<RisksEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  // Assumption helpers
  const updateAssumption = useCallback(
    (index: number, value: string) => {
      const assumptions = [...current.assumptions];
      assumptions[index] = value;
      onChange({ ...current, assumptions });
    },
    [current, onChange],
  );

  const addAssumption = useCallback(() => {
    onChange({ ...current, assumptions: [...current.assumptions, ''] });
  }, [current, onChange]);

  const removeAssumption = useCallback(
    (index: number) => {
      const assumptions = current.assumptions.filter((_, i) => i !== index);
      onChange({
        ...current,
        assumptions: assumptions.length > 0 ? assumptions : [''],
      });
    },
    [current, onChange],
  );

  // Risk helpers
  const updateRisk = useCallback(
    (index: number, field: keyof ProposalRisk, value: string) => {
      const risks = [...current.risks];
      risks[index] = { ...risks[index], [field]: value };
      onChange({ ...current, risks });
    },
    [current, onChange],
  );

  const addRisk = useCallback(() => {
    onChange({ ...current, risks: [...current.risks, { ...EMPTY_RISK }] });
  }, [current, onChange]);

  const removeRisk = useCallback(
    (index: number) => {
      const risks = current.risks.filter((_, i) => i !== index);
      onChange({
        ...current,
        risks: risks.length > 0 ? risks : [{ ...EMPTY_RISK }],
      });
    },
    [current, onChange],
  );

  if (readOnly) {
    return (
      <div className={styles.container}>
        <div className={styles.section}>
          <Text className={styles.sectionHeader}>Assumptions</Text>
          {current.assumptions.filter(Boolean).length > 0 ? (
            <ul className={styles.readOnlyList}>
              {current.assumptions.filter(Boolean).map((item, i) => (
                <li key={i}>
                  <Text className={styles.readOnlyText}>{item}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.emptyMessage}>
              No assumptions specified
            </Text>
          )}
        </div>

        <div className={styles.section}>
          <Text className={styles.sectionHeader}>Risks</Text>
          {current.risks.filter((r) => r.risk).length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Risk</th>
                  <th className={styles.th}>Impact</th>
                  <th className={styles.th}>Likelihood</th>
                  <th className={styles.th}>Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {current.risks
                  .filter((r) => r.risk)
                  .map((risk, i) => (
                    <tr key={i}>
                      <td className={styles.td}>
                        <Text className={styles.readOnlyText}>{risk.risk}</Text>
                      </td>
                      <td className={styles.td}>
                        <Badge
                          appearance="filled"
                          color={getRiskBadgeColor(risk.impact)}
                          className={styles.riskBadge}
                        >
                          {risk.impact}
                        </Badge>
                      </td>
                      <td className={styles.td}>
                        <Badge
                          appearance="filled"
                          color={getRiskBadgeColor(risk.likelihood)}
                          className={styles.riskBadge}
                        >
                          {risk.likelihood}
                        </Badge>
                      </td>
                      <td className={styles.td}>
                        <Text className={styles.readOnlyText}>
                          {risk.mitigation}
                        </Text>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <Text className={styles.emptyMessage}>No risks identified</Text>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <Text className={styles.sectionHeader}>Assumptions</Text>
        {current.assumptions.map((item, index) => (
          <div key={index} className={styles.listItem}>
            <Input
              className={styles.listItemInput}
              value={item}
              onChange={(_, d) => updateAssumption(index, d.value)}
              placeholder={`Assumption ${index + 1}`}
            />
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              size="small"
              onClick={() => removeAssumption(index)}
              title="Remove assumption"
            />
          </div>
        ))}
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<Add16Regular />}
          size="small"
          onClick={addAssumption}
        >
          Add Assumption
        </Button>
      </div>

      <div className={styles.section}>
        <Text className={styles.sectionHeader}>Risks</Text>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Risk</th>
              <th className={styles.th}>Impact</th>
              <th className={styles.th}>Likelihood</th>
              <th className={styles.th}>Mitigation</th>
              <th className={styles.th} style={{ width: '40px' }} />
            </tr>
          </thead>
          <tbody>
            {current.risks.map((risk, index) => (
              <tr key={index}>
                <td className={styles.td}>
                  <Input
                    className={styles.cellInput}
                    value={risk.risk}
                    onChange={(_, d) => updateRisk(index, 'risk', d.value)}
                    placeholder="Describe the risk"
                    size="small"
                  />
                </td>
                <td className={styles.td}>
                  <select
                    className={styles.selectInput}
                    value={risk.impact}
                    onChange={(e) =>
                      updateRisk(index, 'impact', e.target.value)
                    }
                  >
                    {RISK_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={styles.td}>
                  <select
                    className={styles.selectInput}
                    value={risk.likelihood}
                    onChange={(e) =>
                      updateRisk(index, 'likelihood', e.target.value)
                    }
                  >
                    {RISK_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={styles.td}>
                  <Input
                    className={styles.cellInput}
                    value={risk.mitigation}
                    onChange={(_, d) =>
                      updateRisk(index, 'mitigation', d.value)
                    }
                    placeholder="Mitigation strategy"
                    size="small"
                  />
                </td>
                <td className={styles.tdActions}>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss16Regular />}
                    size="small"
                    onClick={() => removeRisk(index)}
                    title="Remove risk"
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
          onClick={addRisk}
        >
          Add Risk
        </Button>
      </div>
    </div>
  );
};

export default RisksEditor;
