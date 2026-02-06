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
import type { PricingBreakdown, PricingLineItem } from '../../types/Proposal';

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
  numberInput: {
    width: '100px',
  },
  summarySection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: tokens.colorNeutralBackground3,
    maxWidth: '400px',
    alignSelf: 'flex-end',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  summaryLabel: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
  },
  summaryValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  grandTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('8px', '0', '0', '0'),
    ...shorthands.borderTop('2px', 'solid', tokens.colorNeutralStroke1),
  },
  grandTotalLabel: {
    fontSize: '14px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
  },
  grandTotalValue: {
    fontSize: '14px',
    fontWeight: '700',
    color: tokens.colorBrandForeground1,
  },
  summaryInputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap('16px'),
  },
  summaryInput: {
    width: '120px',
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
  rowTotal: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    minWidth: '100px',
    display: 'inline-block',
    textAlign: 'right',
  },
});

interface PricingEditorProps {
  data: PricingBreakdown | null;
  onChange: (data: PricingBreakdown) => void;
  readOnly?: boolean;
}

const EMPTY_LINE_ITEM: PricingLineItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
};

const EMPTY: PricingBreakdown = {
  lineItems: [{ ...EMPTY_LINE_ITEM }],
  subtotal: 0,
  tax: 0,
  discount: 0,
  grandTotal: 0,
};

function formatZAR(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const PricingEditor: React.FC<PricingEditorProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const current = data ?? EMPTY;

  const recalculate = useCallback(
    (
      lineItems: PricingLineItem[],
      tax: number,
      discount: number,
    ): PricingBreakdown => {
      const updatedItems = lineItems.map((item) => ({
        ...item,
        total: (item.quantity || 0) * (item.unitPrice || 0),
      }));
      const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      const grandTotal = subtotal + (tax || 0) - (discount || 0);
      return {
        lineItems: updatedItems,
        subtotal,
        tax: tax || 0,
        discount: discount || 0,
        grandTotal: Math.max(0, grandTotal),
      };
    },
    [],
  );

  const updateLineItem = useCallback(
    (
      index: number,
      field: keyof PricingLineItem,
      value: string | number,
    ) => {
      const lineItems = [...current.lineItems];
      lineItems[index] = { ...lineItems[index], [field]: value };
      onChange(recalculate(lineItems, current.tax, current.discount));
    },
    [current, onChange, recalculate],
  );

  const addRow = useCallback(() => {
    const lineItems = [...current.lineItems, { ...EMPTY_LINE_ITEM }];
    onChange(recalculate(lineItems, current.tax, current.discount));
  }, [current, onChange, recalculate]);

  const removeRow = useCallback(
    (index: number) => {
      const lineItems = current.lineItems.filter((_, i) => i !== index);
      const items =
        lineItems.length > 0 ? lineItems : [{ ...EMPTY_LINE_ITEM }];
      onChange(recalculate(items, current.tax, current.discount));
    },
    [current, onChange, recalculate],
  );

  const updateTax = useCallback(
    (value: number) => {
      onChange(recalculate(current.lineItems, value, current.discount));
    },
    [current, onChange, recalculate],
  );

  const updateDiscount = useCallback(
    (value: number) => {
      onChange(recalculate(current.lineItems, current.tax, value));
    },
    [current, onChange, recalculate],
  );

  // Recalculated values for display
  const calculated = useMemo(
    () => recalculate(current.lineItems, current.tax, current.discount),
    [current, recalculate],
  );

  if (readOnly) {
    if (current.lineItems.filter((li) => li.description).length === 0) {
      return (
        <div className={styles.container}>
          <Text className={styles.emptyMessage}>
            No pricing information specified
          </Text>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Description</th>
              <th className={styles.thRight}>Qty</th>
              <th className={styles.thRight}>Unit Price (ZAR)</th>
              <th className={styles.thRight}>Total</th>
            </tr>
          </thead>
          <tbody>
            {current.lineItems
              .filter((li) => li.description)
              .map((item, i) => (
                <tr key={i}>
                  <td className={styles.td}>
                    <Text className={styles.readOnlyText}>
                      {item.description}
                    </Text>
                  </td>
                  <td className={styles.tdRight}>
                    <Text className={styles.readOnlyText}>
                      {item.quantity}
                    </Text>
                  </td>
                  <td className={styles.tdRight}>
                    <Text className={styles.readOnlyText}>
                      {formatZAR(item.unitPrice)}
                    </Text>
                  </td>
                  <td className={styles.tdRight}>
                    <Text className={styles.readOnlyText}>
                      {formatZAR(item.total)}
                    </Text>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className={styles.summarySection}>
          <div className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>Subtotal</Text>
            <Text className={styles.summaryValue}>
              {formatZAR(calculated.subtotal)}
            </Text>
          </div>
          {calculated.tax > 0 && (
            <div className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>Tax</Text>
              <Text className={styles.summaryValue}>
                {formatZAR(calculated.tax)}
              </Text>
            </div>
          )}
          {calculated.discount > 0 && (
            <div className={styles.summaryRow}>
              <Text className={styles.summaryLabel}>Discount</Text>
              <Text className={styles.summaryValue}>
                -{formatZAR(calculated.discount)}
              </Text>
            </div>
          )}
          <div className={styles.grandTotalRow}>
            <Text className={styles.grandTotalLabel}>Grand Total</Text>
            <Badge appearance="filled" color="brand" size="large">
              {formatZAR(calculated.grandTotal)}
            </Badge>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Description</th>
            <th className={styles.thRight}>Qty</th>
            <th className={styles.thRight}>Unit Price (ZAR)</th>
            <th className={styles.thRight}>Total</th>
            <th className={styles.th} style={{ width: '40px' }} />
          </tr>
        </thead>
        <tbody>
          {current.lineItems.map((item, index) => {
            const rowTotal = (item.quantity || 0) * (item.unitPrice || 0);
            return (
              <tr key={index}>
                <td className={styles.td}>
                  <Input
                    className={styles.cellInput}
                    value={item.description}
                    onChange={(_, d) =>
                      updateLineItem(index, 'description', d.value)
                    }
                    placeholder="Line item description"
                    size="small"
                  />
                </td>
                <td className={styles.tdRight}>
                  <Input
                    className={styles.numberInput}
                    type="number"
                    value={String(item.quantity || '')}
                    onChange={(_, d) =>
                      updateLineItem(
                        index,
                        'quantity',
                        parseFloat(d.value) || 0,
                      )
                    }
                    placeholder="1"
                    size="small"
                  />
                </td>
                <td className={styles.tdRight}>
                  <Input
                    className={styles.numberInput}
                    type="number"
                    value={String(item.unitPrice || '')}
                    onChange={(_, d) =>
                      updateLineItem(
                        index,
                        'unitPrice',
                        parseFloat(d.value) || 0,
                      )
                    }
                    placeholder="0.00"
                    size="small"
                  />
                </td>
                <td className={styles.tdRight}>
                  <Text className={styles.rowTotal}>{formatZAR(rowTotal)}</Text>
                </td>
                <td className={styles.tdActions}>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss16Regular />}
                    size="small"
                    onClick={() => removeRow(index)}
                    title="Remove line item"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Button
        className={styles.addButton}
        appearance="subtle"
        icon={<Add16Regular />}
        size="small"
        onClick={addRow}
      >
        Add Line Item
      </Button>

      <div className={styles.summarySection}>
        <div className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>Subtotal</Text>
          <Text className={styles.summaryValue}>
            {formatZAR(calculated.subtotal)}
          </Text>
        </div>
        <div className={styles.summaryInputRow}>
          <Text className={styles.summaryLabel}>Tax (ZAR)</Text>
          <Input
            className={styles.summaryInput}
            type="number"
            value={String(current.tax || '')}
            onChange={(_, d) => updateTax(parseFloat(d.value) || 0)}
            placeholder="0.00"
            size="small"
          />
        </div>
        <div className={styles.summaryInputRow}>
          <Text className={styles.summaryLabel}>Discount (ZAR)</Text>
          <Input
            className={styles.summaryInput}
            type="number"
            value={String(current.discount || '')}
            onChange={(_, d) => updateDiscount(parseFloat(d.value) || 0)}
            placeholder="0.00"
            size="small"
          />
        </div>
        <div className={styles.grandTotalRow}>
          <Text className={styles.grandTotalLabel}>Grand Total</Text>
          <Badge appearance="filled" color="brand" size="large">
            {formatZAR(calculated.grandTotal)}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default PricingEditor;
