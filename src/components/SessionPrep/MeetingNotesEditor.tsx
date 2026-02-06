/**
 * DWx Traffic Manager - Meeting Notes Editor
 * Structured form for capturing post-discovery meeting notes.
 * Defined at MODULE LEVEL (not inside any render function).
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Dropdown,
  Input,
  Option,
  RadioGroup,
  Radio,
  Text,
  Textarea,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  AddRegular,
  DismissRegular,
  SaveRegular,
} from '@fluentui/react-icons';
import { MeetingNotes, DEFAULT_MEETING_NOTES } from '../../types/MeetingNotes';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '16px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '16px',
  },
  sectionHeader: {
    fontSize: '14px',
    fontWeight: '600' as unknown as number,
    marginTop: '0px',
    marginBottom: '4px',
    color: tokens.colorNeutralForeground1,
  },
  meetingInfoRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  },
  meetingInfoField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: '1 1 200px',
  },
  fieldLabel: {
    fontSize: '12px',
    fontWeight: '500' as unknown as number,
    color: tokens.colorNeutralForeground3,
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  listInput: {
    flex: '1',
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: '4px',
  },
  sentimentGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: '16px',
    alignItems: 'center',
  },
  sentimentLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  sentimentDot: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '8px',
  },
});

// ============================================================================
// Duration options
// ============================================================================

const DURATION_OPTIONS = [
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '1 hour',
  '1.5 hours',
  '2 hours',
  '2+ hours',
];

// ============================================================================
// Sentiment colors
// ============================================================================

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: '#4ade80',
  Neutral: '#9ca3af',
  Negative: '#f87171',
};

// ============================================================================
// Component Props
// ============================================================================

interface MeetingNotesEditorProps {
  data: MeetingNotes | null;
  onChange: (notes: MeetingNotes) => void;
  readOnly?: boolean;
  defaultAttendees?: string[];
}

// ============================================================================
// Component (MODULE LEVEL)
// ============================================================================

export const MeetingNotesEditor: React.FC<MeetingNotesEditorProps> = ({
  data,
  onChange,
  readOnly = false,
  defaultAttendees = [],
}) => {
  const styles = useStyles();

  const [notes, setNotes] = useState<MeetingNotes>(() => {
    if (data) return { ...data };
    return {
      ...DEFAULT_MEETING_NOTES,
      attendees: defaultAttendees.length > 0 ? [...defaultAttendees] : [],
    };
  });

  // Sync when data prop changes externally
  useEffect(() => {
    if (data) {
      setNotes({ ...data });
    }
  }, [data]);

  // --- Helpers for list fields ---

  const addListItem = (field: 'keyTakeaways' | 'clientPainPoints' | 'nextSteps' | 'attendees') => {
    setNotes((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeListItem = (field: 'keyTakeaways' | 'clientPainPoints' | 'nextSteps' | 'attendees', index: number) => {
    setNotes((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const updateListItem = (field: 'keyTakeaways' | 'clientPainPoints' | 'nextSteps' | 'attendees', index: number, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  // --- Render a repeater list section ---

  const renderListSection = (
    label: string,
    field: 'keyTakeaways' | 'clientPainPoints' | 'nextSteps' | 'attendees',
    placeholder: string,
  ) => (
    <div className={styles.section}>
      <Text className={styles.sectionHeader}>{label}</Text>
      {notes[field].map((item, index) => (
        <div key={`${field}-${index}`} className={styles.listItem}>
          <Input
            className={styles.listInput}
            value={item}
            onChange={(_e, d) => updateListItem(field, index, d.value)}
            placeholder={placeholder}
            disabled={readOnly}
          />
          {!readOnly && (
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              size="small"
              onClick={() => removeListItem(field, index)}
              aria-label={`Remove ${label.toLowerCase()} item`}
            />
          )}
        </div>
      ))}
      {!readOnly && (
        <Button
          className={styles.addButton}
          appearance="subtle"
          icon={<AddRegular />}
          size="small"
          onClick={() => addListItem(field)}
        >
          Add {label.replace(/s$/, '')}
        </Button>
      )}
    </div>
  );

  // --- Save handler ---

  const handleSave = () => {
    onChange(notes);
  };

  return (
    <div className={styles.container}>
      {/* Meeting Info */}
      <div className={styles.section}>
        <Text className={styles.sectionHeader}>Meeting Info</Text>
        <div className={styles.meetingInfoRow}>
          <div className={styles.meetingInfoField}>
            <Text className={styles.fieldLabel}>Meeting Date</Text>
            <Input
              type="date"
              value={notes.meetingDate}
              onChange={(_e, d) => setNotes((prev) => ({ ...prev, meetingDate: d.value }))}
              disabled={readOnly}
            />
          </div>
          <div className={styles.meetingInfoField}>
            <Text className={styles.fieldLabel}>Duration</Text>
            <Dropdown
              value={notes.duration}
              selectedOptions={notes.duration ? [notes.duration] : []}
              onOptionSelect={(_e, d) =>
                setNotes((prev) => ({ ...prev, duration: d.optionValue as string }))
              }
              disabled={readOnly}
              placeholder="Select duration"
            >
              {DURATION_OPTIONS.map((opt) => (
                <Option key={opt} value={opt}>
                  {opt}
                </Option>
              ))}
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Attendees */}
      {renderListSection('Attendees', 'attendees', 'Attendee name')}

      {/* Overall Sentiment */}
      <div className={styles.section}>
        <Text className={styles.sectionHeader}>Overall Sentiment</Text>
        <RadioGroup
          layout="horizontal"
          value={notes.overallSentiment}
          onChange={(_e, d) =>
            setNotes((prev) => ({
              ...prev,
              overallSentiment: d.value as MeetingNotes['overallSentiment'],
            }))
          }
          disabled={readOnly}
        >
          {(['Positive', 'Neutral', 'Negative'] as const).map((sentiment) => (
            <Radio
              key={sentiment}
              value={sentiment}
              label={
                <span className={styles.sentimentLabel}>
                  <span
                    className={styles.sentimentDot}
                    style={{ backgroundColor: SENTIMENT_COLORS[sentiment] }}
                  />
                  {sentiment}
                </span>
              }
            />
          ))}
        </RadioGroup>
      </div>

      {/* Key Takeaways */}
      {renderListSection('Key Takeaways', 'keyTakeaways', 'Enter a key takeaway')}

      {/* Client Pain Points */}
      {renderListSection('Client Pain Points', 'clientPainPoints', 'Enter a client pain point')}

      {/* Next Steps */}
      {renderListSection('Next Steps', 'nextSteps', 'Enter a next step')}

      {/* Additional Notes */}
      <div className={styles.section}>
        <Text className={styles.sectionHeader}>Additional Notes</Text>
        <Textarea
          value={notes.additionalNotes}
          onChange={(_e, d) => setNotes((prev) => ({ ...prev, additionalNotes: d.value }))}
          rows={4}
          resize="vertical"
          disabled={readOnly}
          placeholder="Any additional meeting notes..."
        />
      </div>

      {/* Save Button */}
      {!readOnly && (
        <div className={styles.footer}>
          <Button
            appearance="primary"
            icon={<SaveRegular />}
            onClick={handleSave}
          >
            Save Notes
          </Button>
        </div>
      )}
    </div>
  );
};
