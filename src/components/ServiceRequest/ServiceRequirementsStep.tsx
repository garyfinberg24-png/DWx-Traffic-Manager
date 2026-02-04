/**
 * DWx Traffic Manager - Service Requirements Step
 * Dynamic questionnaire component based on selected service category
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
  Divider,
  Slider,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ServiceRequirementsConfig,
  ServiceQuestion,
} from '../../types/ServiceRequirements';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sectionHeader: {
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  sectionDescription: {
    fontSize: '13px',
    color: '#616161',
    marginTop: '4px',
  },
  questionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  questionDescription: {
    fontSize: '12px',
    color: '#616161',
    marginBottom: '4px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    flexDirection: 'column',
  },
  optionDescription: {
    fontSize: '11px',
    color: '#616161',
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

interface ServiceRequirementsStepProps {
  config: ServiceRequirementsConfig;
  values: Record<string, unknown>;
  onChange: (questionId: string, value: unknown) => void;
  errors?: Record<string, string>;
}

export const ServiceRequirementsStep: React.FC<ServiceRequirementsStepProps> = ({
  config,
  values,
  onChange,
  errors,
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

  return (
    <div className={styles.container}>
      <div className={styles.sectionHeader}>
        <Text className={styles.sectionTitle} block>
          {config.title}
        </Text>
        <Text className={styles.sectionDescription} block>
          {config.subtitle}
        </Text>
      </div>

      {config.sections.map((section, index) => (
        <div key={section.title} className={styles.section}>
          {index > 0 && <Divider />}

          <div className={styles.sectionHeader}>
            <Text weight="semibold" size={400}>
              {section.title}
            </Text>
            {section.description && (
              <Text className={styles.sectionDescription} block>
                {section.description}
              </Text>
            )}
          </div>

          {section.questions.map(renderQuestion)}
        </div>
      ))}
    </div>
  );
};

export default ServiceRequirementsStep;
