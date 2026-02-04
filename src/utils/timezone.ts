import { format, parseISO, isValid, addMinutes } from 'date-fns';

// Default timezone for the demo team (can be configured)
const DEFAULT_TIMEZONE = 'America/New_York';

// Common timezones for dropdown selections
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: -5 },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -8 },
  { value: 'America/Phoenix', label: 'Arizona (MST)', offset: -7 },
  { value: 'America/Anchorage', label: 'Alaska (AKT)', offset: -9 },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)', offset: -10 },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 0 },
  { value: 'Europe/Paris', label: 'Central European (CET)', offset: 1 },
  { value: 'Europe/Berlin', label: 'Berlin (CET)', offset: 1 },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 9 },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 8 },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)', offset: 11 },
  { value: 'UTC', label: 'UTC', offset: 0 },
];

/**
 * Get the user's local timezone
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/**
 * Get the user's local timezone offset in minutes
 */
export function getUserTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}

/**
 * Format a date/time for display in a specific timezone using Intl
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return 'Invalid date';
  }

  try {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    };

    return new Intl.DateTimeFormat('en-US', options || defaultOptions).format(dateObj);
  } catch (error) {
    console.warn('Timezone formatting failed, using local time:', error);
    return format(dateObj, "EEE, MMM d, yyyy 'at' h:mm a");
  }
}

/**
 * Format a date/time for display in the user's local timezone
 */
export function formatLocalTime(
  date: Date | string,
  formatStr: string = "EEE, MMM d, yyyy 'at' h:mm a"
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return 'Invalid date';
  }

  return format(dateObj, formatStr);
}

/**
 * Get the timezone abbreviation for a given timezone
 */
export function getTimezoneAbbr(timezone: string, date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get the current offset from UTC for a timezone in minutes
 */
export function getTimezoneOffsetMinutes(timezone: string, date: Date = new Date()): number {
  try {
    // Create a formatter that gives us the offset
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');

    if (tzPart?.value) {
      // Parse "GMT-05:00" or "GMT+09:00" format
      const match = tzPart.value.match(/GMT([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        const hours = parseInt(match[2], 10);
        const minutes = parseInt(match[3], 10);
        return sign * (hours * 60 + minutes);
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Convert a Date to a different timezone (returns a new Date that displays correctly in that timezone)
 */
export function toTimezone(date: Date | string, timezone: string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  // Get the offset difference
  const localOffset = dateObj.getTimezoneOffset();
  const targetOffset = getTimezoneOffsetMinutes(timezone, dateObj);

  // Calculate the difference and adjust
  const diff = targetOffset + localOffset;
  return addMinutes(dateObj, diff);
}

/**
 * Check if two dates are on the same calendar day in a given timezone
 */
export function isSameDayInTimezone(
  date1: Date | string,
  date2: Date | string,
  timezone: string
): boolean {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;

  return formatter.format(d1) === formatter.format(d2);
}

/**
 * Format a date range for display
 */
export function formatDateRange(
  start: Date | string,
  end: Date | string,
  timezone?: string
): string {
  const tz = timezone || getUserTimezone();
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;

  if (!isValid(startDate) || !isValid(endDate)) {
    return 'Invalid date range';
  }

  const sameDay = isSameDayInTimezone(startDate, endDate, tz);

  if (sameDay) {
    const dateOptions: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
    };
    const timeWithTzOptions: Intl.DateTimeFormatOptions = {
      ...timeOptions,
      timeZoneName: 'short',
    };

    const dateFormatter = new Intl.DateTimeFormat('en-US', dateOptions);
    const timeFormatter = new Intl.DateTimeFormat('en-US', timeOptions);
    const timeTzFormatter = new Intl.DateTimeFormat('en-US', timeWithTzOptions);

    return `${dateFormatter.format(startDate)} at ${timeFormatter.format(startDate)} - ${timeTzFormatter.format(endDate)}`;
  } else {
    const fullOptions: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    const fullWithTzOptions: Intl.DateTimeFormatOptions = {
      ...fullOptions,
      timeZoneName: 'short',
    };

    const formatter = new Intl.DateTimeFormat('en-US', fullOptions);
    const formatterTz = new Intl.DateTimeFormat('en-US', fullWithTzOptions);

    return `${formatter.format(startDate)} - ${formatterTz.format(endDate)}`;
  }
}

/**
 * Check if a time is within business hours in a given timezone
 */
export function isWithinBusinessHours(
  date: Date | string,
  timezone: string,
  startHour: number = 9,
  endHour: number = 17
): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });

  const hour = parseInt(formatter.format(dateObj), 10);
  return hour >= startHour && hour < endHour;
}

/**
 * Get the day of week in a timezone (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeekInTimezone(date: Date | string, timezone: string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });

  const weekday = formatter.format(dateObj);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.indexOf(weekday);
}

/**
 * Check if a date is a weekday in a timezone
 */
export function isWeekdayInTimezone(date: Date | string, timezone: string): boolean {
  const day = getDayOfWeekInTimezone(date, timezone);
  return day >= 1 && day <= 5;
}

/**
 * Format relative timezone info (e.g., "2 hours ahead of you")
 */
export function getRelativeTimezoneInfo(
  timezone: string,
  referenceTimezone?: string
): string {
  const refTz = referenceTimezone || getUserTimezone();
  const now = new Date();

  const targetOffset = getTimezoneOffsetMinutes(timezone, now);
  const refOffset = getTimezoneOffsetMinutes(refTz, now);

  const diffMinutes = targetOffset - refOffset;
  const diffHours = Math.abs(diffMinutes) / 60;

  if (diffMinutes === 0) {
    return 'Same timezone as you';
  }

  const direction = diffMinutes > 0 ? 'ahead of' : 'behind';

  if (diffHours === Math.floor(diffHours)) {
    const hourText = diffHours === 1 ? 'hour' : 'hours';
    return `${Math.floor(diffHours)} ${hourText} ${direction} you`;
  } else {
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);
    if (hours === 0) {
      return `${minutes}m ${direction} you`;
    }
    return `${hours}h ${minutes}m ${direction} you`;
  }
}

/**
 * Create a Date object representing a specific time in a timezone
 * Useful for creating meeting times in a client's timezone
 */
export function createDateInTimezone(
  year: number,
  month: number, // 0-indexed
  day: number,
  hour: number,
  minute: number,
  timezone: string
): Date {
  // Create an ISO string for the target date/time
  const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

  // Get the offset for the target timezone
  const targetDate = new Date(isoString);
  const targetOffset = getTimezoneOffsetMinutes(timezone, targetDate);
  const localOffset = targetDate.getTimezoneOffset();

  // Adjust for the timezone difference
  return addMinutes(targetDate, localOffset + targetOffset);
}

export const timezoneUtils = {
  getUserTimezone,
  getUserTimezoneOffset,
  formatInTimezone,
  formatLocalTime,
  getTimezoneAbbr,
  getTimezoneOffsetMinutes,
  toTimezone,
  isSameDayInTimezone,
  formatDateRange,
  isWithinBusinessHours,
  getDayOfWeekInTimezone,
  isWeekdayInTimezone,
  getRelativeTimezoneInfo,
  createDateInTimezone,
  COMMON_TIMEZONES,
};
