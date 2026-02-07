/**
 * DWx Traffic Manager - Advanced Filter Panel
 * Multi-criteria collapsible filter panel for list views
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Text,
  Button,
  Dropdown,
  Option,
  Field,
  Input,
  Badge,
  makeStyles,
  Checkbox,
} from '@fluentui/react-components';
import {
  FilterRegular,
  FilterDismissRegular,
  ChevronDownRegular,
  ChevronUpRegular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  container: {
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e1e1e1',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#242424',
  },
  activeFiltersBadge: {
    backgroundColor: DW_COLORS.teal,
    color: 'white',
  },
  content: {
    padding: '16px',
    borderTop: '1px solid #e1e1e1',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  dateRange: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #e1e1e1',
  },
  checkboxGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignSelf: 'flex-end',
    paddingBottom: '6px',
  },
  clearButton: {
    color: '#d13438',
  },
});

// Generic filter value type
export interface FilterValue {
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'checkbox';
  value: string | string[] | boolean | [string | null, string | null] | number | null;
}

// Filter configuration for a single field
export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'checkbox';
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: FilterValue['value'];
}

interface AdvancedFilterPanelProps {
  filters: FilterConfig[];
  values: Record<string, FilterValue['value']>;
  onChange: (key: string, value: FilterValue['value']) => void;
  onClear: () => void;
  onApply?: () => void;
}

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  filters,
  values,
  onChange,
  onClear,
  onApply,
}) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.entries(values).filter(([_, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.length > 0;
      if (Array.isArray(v)) return v.length > 0 && v.some((item) => item !== null);
      if (typeof v === 'boolean') return v === true;
      return false;
    }).length;
  }, [values]);

  const renderFilter = (filter: FilterConfig) => {
    const value = values[filter.key];

    switch (filter.type) {
      case 'text':
        return (
          <Field label={filter.label} key={filter.key}>
            <Input
              placeholder={filter.placeholder || `Filter by ${filter.label.toLowerCase()}...`}
              value={(value as string) || ''}
              onChange={(_, data) => onChange(filter.key, data.value)}
            />
          </Field>
        );

      case 'select':
        return (
          <Field label={filter.label} key={filter.key}>
            <Dropdown
              placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`}
              selectedOptions={value ? [value as string] : []}
              onOptionSelect={(_, data) => onChange(filter.key, data.optionValue || null)}
            >
              <Option value="" text="All">All</Option>
              {filter.options?.map((opt) => (
                <Option key={opt.value} value={opt.value} text={opt.label}>
                  {opt.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
        );

      case 'multiselect':
        return (
          <Field label={filter.label} key={filter.key}>
            <Dropdown
              placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`}
              multiselect
              selectedOptions={(value as string[]) || []}
              onOptionSelect={(_, data) => onChange(filter.key, data.selectedOptions)}
            >
              {filter.options?.map((opt) => (
                <Option key={opt.value} value={opt.value} text={opt.label}>
                  {opt.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
        );

      case 'daterange':
        const dateRange = (value as [string | null, string | null]) || [null, null];
        return (
          <Field label={filter.label} key={filter.key}>
            <div className={styles.dateRange}>
              <Input
                type="date"
                value={dateRange[0] || ''}
                onChange={(_, data) => onChange(filter.key, [data.value || null, dateRange[1]])}
              />
              <Text size={200}>to</Text>
              <Input
                type="date"
                value={dateRange[1] || ''}
                onChange={(_, data) => onChange(filter.key, [dateRange[0], data.value || null])}
              />
            </div>
          </Field>
        );

      case 'number':
        return (
          <Field label={filter.label} key={filter.key}>
            <Input
              type="number"
              placeholder={filter.placeholder || '0'}
              value={value?.toString() || ''}
              onChange={(_, data) => onChange(filter.key, data.value ? Number(data.value) : null)}
            />
          </Field>
        );

      case 'checkbox':
        return (
          <div key={filter.key} className={styles.checkboxGroup}>
            <Checkbox
              label={filter.label}
              checked={value as boolean || false}
              onChange={(_, data) => onChange(filter.key, data.checked)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className={styles.headerLeft}>
          <FilterRegular style={{ width: '18px', height: '18px' }} />
          <Text className={styles.headerTitle}>Advanced Filters</Text>
          {activeFilterCount > 0 && (
            <Badge
              className={styles.activeFiltersBadge}
              appearance="filled"
              size="small"
            >
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUpRegular style={{ width: '18px', height: '18px' }} />
        ) : (
          <ChevronDownRegular style={{ width: '18px', height: '18px' }} />
        )}
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.filterRow}>
            {filters.map(renderFilter)}
          </div>
          <div className={styles.actions}>
            <Button
              appearance="subtle"
              icon={<FilterDismissRegular />}
              className={styles.clearButton}
              onClick={onClear}
              disabled={activeFilterCount === 0}
            >
              Clear All
            </Button>
            {onApply && (
              <Button appearance="primary" onClick={onApply}>
                Apply Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for managing advanced filter state
 */
export function useAdvancedFilters<T extends Record<string, FilterValue['value']>>(
  initialFilters: T
) {
  const [filters, setFilters] = useState<T>(initialFilters);

  const setFilter = useCallback((key: keyof T, value: FilterValue['value']) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([_, v]) => {
      if (v === null || v === undefined) return false;
      if (typeof v === 'string') return v.length > 0;
      if (Array.isArray(v)) return v.length > 0 && v.some((item) => item !== null);
      if (typeof v === 'boolean') return v === true;
      return false;
    });
  }, [filters]);

  return {
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
  };
}
