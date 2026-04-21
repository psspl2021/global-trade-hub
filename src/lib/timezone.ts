/**
 * Timezone utilities for global auction system
 */

// Country to default timezone mapping
const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  india: 'Asia/Kolkata', in: 'Asia/Kolkata',
  uae: 'Asia/Dubai', ae: 'Asia/Dubai',
  saudi: 'Asia/Riyadh', sa: 'Asia/Riyadh',
  qatar: 'Asia/Qatar', qa: 'Asia/Qatar',
  kenya: 'Africa/Nairobi', ke: 'Africa/Nairobi',
  nigeria: 'Africa/Lagos', ng: 'Africa/Lagos',
  us: 'America/New_York', usa: 'America/New_York',
  uk: 'Europe/London', gb: 'Europe/London',
  de: 'Europe/Berlin', fr: 'Europe/Paris',
  jp: 'Asia/Tokyo', japan: 'Asia/Tokyo',
  cn: 'Asia/Shanghai', china: 'Asia/Shanghai',
  vn: 'Asia/Ho_Chi_Minh', vietnam: 'Asia/Ho_Chi_Minh',
  sg: 'Asia/Singapore', singapore: 'Asia/Singapore',
  au: 'Australia/Sydney', australia: 'Australia/Sydney',
};

/**
 * Get default timezone for a country
 */
export function getTimezoneForCountry(country: string): string {
  return COUNTRY_TIMEZONE_MAP[country.toLowerCase()] || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert UTC date to local time string for a specific timezone
 */
export function getLocalTime(utcDate: string | Date, timezone: string): string {
  try {
    const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
    return date.toLocaleString('en-US', { 
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return new Date(utcDate).toLocaleString();
  }
}

/**
 * Get timezone abbreviation (e.g., IST, EST, GST)
 */
export function getTimezoneAbbr(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    return parts.find(p => p.type === 'timeZoneName')?.value || timezone;
  } catch {
    return timezone;
  }
}

/**
 * Format auction end time with both buyer and viewer timezones
 */
export function formatAuctionEndTime(
  endTimeUtc: string, 
  buyerTimezone: string, 
  viewerTimezone?: string
): { buyerTime: string; viewerTime?: string; buyerTzAbbr: string; viewerTzAbbr?: string } {
  const buyerTime = getLocalTime(endTimeUtc, buyerTimezone);
  const buyerTzAbbr = getTimezoneAbbr(buyerTimezone);

  if (viewerTimezone && viewerTimezone !== buyerTimezone) {
    return {
      buyerTime,
      viewerTime: getLocalTime(endTimeUtc, viewerTimezone),
      buyerTzAbbr,
      viewerTzAbbr: getTimezoneAbbr(viewerTimezone),
    };
  }

  return { buyerTime, buyerTzAbbr };
}

/**
 * Format a value in the given timezone with locale-friendly defaults.
 * Use everywhere dashboards display dates/times so org_timezone propagates.
 */
export function formatInTz(
  value: string | Date | null | undefined,
  timezone: string = 'Asia/Kolkata',
  opts: Intl.DateTimeFormatOptions = {}
): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      ...opts,
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

export function formatDateTimeInTz(
  value: string | Date | null | undefined,
  timezone: string = 'Asia/Kolkata'
): string {
  return formatInTz(value, timezone, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

