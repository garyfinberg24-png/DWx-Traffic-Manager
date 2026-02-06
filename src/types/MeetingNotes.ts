/**
 * DWx Traffic Manager - Meeting Notes Types
 * Structured post-discovery meeting notes that feed into AI proposal generation
 */

export type MeetingNoteSentiment = 'Positive' | 'Neutral' | 'Negative';

export interface MeetingNotes {
  keyTakeaways: string[];
  clientPainPoints: string[];
  nextSteps: string[];
  attendees: string[];
  meetingDate: string;
  duration: string;
  overallSentiment: MeetingNoteSentiment;
  additionalNotes: string;
}

export const DEFAULT_MEETING_NOTES: MeetingNotes = {
  keyTakeaways: [],
  clientPainPoints: [],
  nextSteps: [],
  attendees: [],
  meetingDate: '',
  duration: '',
  overallSentiment: 'Neutral',
  additionalNotes: '',
};
