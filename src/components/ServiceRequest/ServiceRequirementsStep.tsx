/**
 * DWx Traffic Manager - Service Requirements Step
 * Dynamic questionnaire component based on selected service category
 * Uses V6 two-level pattern: underline tabs for sections + accordion panels for question groups
 */

import React, { useState } from 'react';
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
  TabList,
  Tab,
  SelectTabData,
  SelectTabEvent,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ChevronDownRegular,
  ChevronRightRegular,
  ClipboardTaskListLtr24Regular,
} from '@fluentui/react-icons';
import {
  ServiceRequirementsConfig,
  ServiceQuestion,
} from '../../types/ServiceRequirements';

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
  // Tab navigation
  tabContainer: {
    borderBottom: '1px solid #e0e0e0',
    padding: '0 24px',
    backgroundColor: '#fafafa',
  },
  // Card body with sections
  body: {
    padding: '24px',
  },
  // Accordion styles
  accordion: {
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    marginBottom: '12px',
    transition: 'box-shadow 0.2s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
  },
  accordionLast: {
    marginBottom: '0',
  },
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  accordionHeaderOpen: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    background: 'linear-gradient(135deg, #1a5a8a 0%, #2873a8 100%)',
    color: 'white',
  },
  accordionIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accordionIconClosed: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#e8f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#1a5a8a',
  },
  accordionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  accordionTitle: {
    fontSize: '15px',
    fontWeight: '600',
  },
  accordionDescription: {
    fontSize: '12px',
    opacity: 0.8,
  },
  accordionChevron: {
    flexShrink: 0,
    transition: 'transform 0.2s ease',
  },
  accordionBody: {
    padding: '20px 24px',
    borderTop: '1px solid #e0e0e0',
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
  const [activeTab, setActiveTab] = useState<string>('tab-0');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    'section-0': true, // First section accordion open by default
  });

  const handleTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as string);
    // Open the accordion for the newly selected tab by default
    const tabIndex = data.value as string;
    const sectionKey = `section-${tabIndex.replace('tab-', '')}`;
    setOpenAccordions(prev => ({ ...prev, [sectionKey]: true }));
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

  const getAnsweredCount = (sectionIndex: number): { answered: number; total: number } => {
    const section = config.sections[sectionIndex];
    const visibleQuestions = section.questions.filter(q => shouldShowQuestion(q));
    const answeredQuestions = visibleQuestions.filter(q => {
      const val = values[q.id];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    });
    return { answered: answeredQuestions.length, total: visibleQuestions.length };
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

  const renderSectionContent = (sectionIndex: number) => {
    const section = config.sections[sectionIndex];
    const sectionKey = `section-${sectionIndex}`;
    const isOpen = openAccordions[sectionKey] ?? false;
    const { answered, total } = getAnsweredCount(sectionIndex);

    return (
      <div className={styles.accordion} key={section.title}>
        <div
          className={isOpen ? styles.accordionHeaderOpen : styles.accordionHeader}
          onClick={() => toggleAccordion(sectionKey)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && toggleAccordion(sectionKey)}
        >
          <div className={isOpen ? styles.accordionIcon : styles.accordionIconClosed}>
            <ClipboardTaskListLtr24Regular style={{ width: 18, height: 18 }} />
          </div>
          <div className={styles.accordionInfo}>
            <div className={styles.accordionTitle}>{section.title}</div>
            {section.description && (
              <div className={styles.accordionDescription}>{section.description}</div>
            )}
          </div>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '10px',
            backgroundColor: isOpen
              ? 'rgba(255,255,255,0.2)'
              : answered === total && total > 0
                ? '#dff6dd'
                : answered > 0
                  ? '#e5f6fd'
                  : '#fff4ce',
            color: isOpen
              ? 'white'
              : answered === total && total > 0
                ? '#107c10'
                : answered > 0
                  ? '#0078d4'
                  : '#a4762c',
          }}>
            {answered}/{total}
          </div>
          <div className={styles.accordionChevron}>
            {isOpen ? <ChevronDownRegular /> : <ChevronRightRegular />}
          </div>
        </div>
        {isOpen && (
          <div className={styles.accordionBody}>
            {section.questions.map((question, qIndex) => (
              <div
                key={question.id}
                className={qIndex === section.questions.length - 1 ? styles.questionContainerLast : styles.questionContainer}
              >
                {renderQuestion(question)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // If there's only one section, no tabs needed - just use accordion
  const useTabs = config.sections.length > 1;

  return (
    <div className={styles.card}>
      {/* Blue gradient header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>{config.title}</div>
        <div className={styles.headerSubtitle}>{config.subtitle}</div>
      </div>

      {/* Section tabs (underline style) */}
      {useTabs && (
        <div className={styles.tabContainer}>
          <TabList
            selectedValue={activeTab}
            onTabSelect={handleTabSelect}
            appearance="subtle"
            size="medium"
          >
            {config.sections.map((section, index) => {
              const { answered, total } = getAnsweredCount(index);
              return (
                <Tab key={section.title} value={`tab-${index}`}>
                  {section.title}
                  {total > 0 && (
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '8px',
                      backgroundColor: answered === total ? '#dff6dd' : answered > 0 ? '#e5f6fd' : '#f0f0f0',
                      color: answered === total ? '#107c10' : answered > 0 ? '#0078d4' : '#616161',
                    }}>
                      {answered}/{total}
                    </span>
                  )}
                </Tab>
              );
            })}
          </TabList>
        </div>
      )}

      {/* Card body with section content */}
      <div className={styles.body}>
        {useTabs
          ? renderSectionContent(parseInt(activeTab.replace('tab-', '')))
          : config.sections.map((_, index) => renderSectionContent(index))
        }
      </div>
    </div>
  );
};

export default ServiceRequirementsStep;
