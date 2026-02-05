/**
 * DWx Traffic Manager - Product Requirements Step
 * Dynamic questionnaire component based on selected product type
 * Styled with blue header card design matching standard modals
 */

import React from 'react';
import {
  Text,
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Checkbox,
  RadioGroup,
  Radio,
  makeStyles,
  Slider,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ProductRequirementsConfig,
} from '../../types/ProductRequirements';
import { ServiceQuestion } from '../../types/ServiceRequirements';

const useStyles = makeStyles({
  // Main card container with shadow
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  // Blue gradient header matching standard modal
  header: {
    background: 'linear-gradient(135deg, #1a5a8a 0%, #2873a8 100%)',
    color: 'white',
    padding: '20px 24px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  headerSubtitle: {
    fontSize: '13px',
    opacity: '0.9',
  },
  // Card body with sections
  body: {
    padding: '24px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionLast: {
    marginBottom: '0',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a5a8a',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e0e0e0',
  },
  sectionDescription: {
    fontSize: '13px',
    color: '#616161',
    marginTop: '-12px',
    marginBottom: '16px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '20px 0',
  },
  questionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  questionContainerLast: {
    marginBottom: '0',
  },
  questionDescription: {
    fontSize: '12px',
    color: '#616161',
    marginBottom: '4px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  checkboxLabel: {
    display: 'flex',
    flexDirection: 'column',
  },
  optionDescription: {
    fontSize: '11px',
    color: '#616161',
    marginTop: '2px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  scaleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  scaleLabel: {
    fontSize: '12px',
    color: '#616161',
    minWidth: '80px',
  },
});

interface ProductRequirementsStepProps {
  config: ProductRequirementsConfig;
  values: Record<string, unknown>;
  onChange: (questionId: string, value: unknown) => void;
  errors?: Record<string, string>;
  productName?: string;
}

export const ProductRequirementsStep: React.FC<ProductRequirementsStepProps> = ({
  config,
  values,
  onChange,
  errors,
  productName,
}) => {
  const styles = useStyles();

  const shouldShowQuestion = (question: ServiceQuestion): boolean => {
    if (!question.conditional) return true;

    const { dependsOn, showWhen } = question.conditional;
    const dependentValue = values[dependsOn];

    if (Array.isArray(showWhen)) {
      if (Array.isArray(dependentValue)) {
        return showWhen.some(v => dependentValue.includes(v));
      }
      return showWhen.includes(dependentValue as string);
    }

    return dependentValue === showWhen;
  };

  const renderQuestion = (question: ServiceQuestion) => {
    if (!shouldShowQuestion(question)) return null;

    const value = values[question.id];
    const error = errors?.[question.id];

    switch (question.type) {
      case 'text':
        return (
          <Field
            key={question.id}
            label={question.question}
            required={question.required}
            validationMessage={error}
            hint={question.description}
          >
            <Input
              value={(value as string) || ''}
              onChange={(_, data) => onChange(question.id, data.value)}
              placeholder={question.placeholder}
            />
          </Field>
        );

      case 'textarea':
        return (
          <Field
            key={question.id}
            label={question.question}
            required={question.required}
            validationMessage={error}
            hint={question.description}
          >
            <Textarea
              value={(value as string) || ''}
              onChange={(_, data) => onChange(question.id, data.value)}
              placeholder={question.placeholder}
              resize="vertical"
              style={{ minHeight: '80px' }}
            />
          </Field>
        );

      case 'number':
        return (
          <Field
            key={question.id}
            label={question.question}
            required={question.required}
            validationMessage={error}
            hint={question.description}
          >
            <Input
              type="number"
              value={(value as string) || ''}
              onChange={(_, data) => onChange(question.id, data.value ? parseInt(data.value) : undefined)}
              placeholder={question.placeholder}
              min={question.validation?.min}
              max={question.validation?.max}
            />
          </Field>
        );

      case 'select':
        return (
          <Field
            key={question.id}
            label={question.question}
            required={question.required}
            validationMessage={error}
            hint={question.description}
          >
            <Dropdown
              placeholder={question.placeholder || 'Select an option'}
              value={value ? (question.options?.find(o => o.value === value)?.label || (value as string)) : ''}
              selectedOptions={value ? [value as string] : []}
              onOptionSelect={(_, data) => onChange(question.id, data.optionValue)}
            >
              {question.options?.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>
          </Field>
        );

      case 'multiselect':
        return (
          <div key={question.id} className={styles.questionContainer}>
            <Field
              label={question.question}
              required={question.required}
              validationMessage={error}
              hint={question.description}
            >
              <div className={styles.checkboxGroup}>
                {question.options?.map((option) => {
                  const selectedValues = (value as string[]) || [];
                  const isChecked = selectedValues.includes(option.value);

                  return (
                    <div key={option.value} className={styles.checkboxItem}>
                      <Checkbox
                        checked={isChecked}
                        onChange={(_, data) => {
                          const newValues = data.checked
                            ? [...selectedValues, option.value]
                            : selectedValues.filter((v) => v !== option.value);
                          onChange(question.id, newValues);
                        }}
                        label={
                          <div className={styles.checkboxLabel}>
                            <span>{option.label}</span>
                            {option.description && (
                              <span className={styles.optionDescription}>
                                {option.description}
                              </span>
                            )}
                          </div>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </Field>
          </div>
        );

      case 'radio':
        return (
          <Field
            key={question.id}
            label={question.question}
            required={question.required}
            validationMessage={error}
            hint={question.description}
          >
            <RadioGroup
              value={(value as string) || ''}
              onChange={(_, data) => onChange(question.id, data.value)}
            >
              {question.options?.map((option) => (
                <Radio
                  key={option.value}
                  value={option.value}
                  label={
                    option.description ? (
                      <div className={styles.checkboxLabel}>
                        <span>{option.label}</span>
                        <span className={styles.optionDescription}>
                          {option.description}
                        </span>
                      </div>
                    ) : (
                      option.label
                    )
                  }
                />
              ))}
            </RadioGroup>
          </Field>
        );

      case 'checkbox':
        return (
          <Field
            key={question.id}
            validationMessage={error}
          >
            <Checkbox
              checked={(value as boolean) || false}
              onChange={(_, data) => onChange(question.id, data.checked)}
              label={question.question}
            />
            {question.description && (
              <Text className={styles.questionDescription}>{question.description}</Text>
            )}
          </Field>
        );

      case 'date':
        return (
          <Field
            key={question.id}
            label={question.question}
            required={question.required}
            validationMessage={error}
            hint={question.description}
          >
            <DatePicker
              value={value ? new Date(value as string) : undefined}
              onSelectDate={(date) => onChange(question.id, date?.toISOString())}
              placeholder={question.placeholder || 'Select a date'}
            />
          </Field>
        );

      case 'scale':
        const min = question.validation?.min || 1;
        const max = question.validation?.max || 5;
        return (
          <Field
            key={question.id}
            label={question.question}
            required={question.required}
            validationMessage={error}
            hint={question.description}
          >
            <div className={styles.scaleContainer}>
              <Text className={styles.scaleLabel}>{min}</Text>
              <Slider
                min={min}
                max={max}
                value={(value as number) || min}
                onChange={(_, data) => onChange(question.id, data.value)}
                style={{ flex: 1 }}
              />
              <Text className={styles.scaleLabel}>{max}</Text>
              <Text weight="semibold" style={{ minWidth: '30px', textAlign: 'center' }}>
                {(value as number) || min}
              </Text>
            </div>
          </Field>
        );

      default:
        return null;
    }
  };

  // Build dynamic title based on product name
  const displayTitle = productName
    ? `${productName} - Requirements`
    : config.title;

  return (
    <div className={styles.card}>
      {/* Blue gradient header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>{displayTitle}</div>
        <div className={styles.headerSubtitle}>{config.subtitle}</div>
      </div>

      {/* Card body with sections */}
      <div className={styles.body}>
        {config.sections.map((section, sectionIndex) => (
          <div
            key={section.title}
            className={sectionIndex === config.sections.length - 1 ? styles.sectionLast : styles.section}
          >
            {sectionIndex > 0 && <div className={styles.divider} />}

            <Text className={styles.sectionTitle} block>
              {section.title}
            </Text>
            {section.description && (
              <Text className={styles.sectionDescription} block>
                {section.description}
              </Text>
            )}

            {section.questions.map((question, qIndex) => (
              <div
                key={question.id}
                className={qIndex === section.questions.length - 1 ? styles.questionContainerLast : styles.questionContainer}
              >
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductRequirementsStep;
