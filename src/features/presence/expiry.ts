const PKT_TIMEZONE = 'Asia/Karachi';

export interface PktClockParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

export function getPktClockParts(date: Date = new Date()): PktClockParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: PKT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(date);
  const map = new Map<string, number>();
  for (const part of parts) {
    if (part.type !== 'literal') {
      map.set(part.type, Number(part.value));
    }
  }
  return {
    year: map.get('year') ?? 1970,
    month: map.get('month') ?? 1,
    day: map.get('day') ?? 1,
    hour: map.get('hour') ?? 0,
    minute: map.get('minute') ?? 0,
    second: map.get('second') ?? 0,
  };
}

export function isAfterPktCutoff(date: Date = new Date()): boolean {
  const pkt = getPktClockParts(date);
  return pkt.hour >= 18;
}

/**
 * Pure PKT display helper matching server `compute_pkt_window_expiry`:
 * - Reopens at 00:00 Asia/Karachi
 * - Returns min(now + 2h, 18:00 Asia/Karachi)
 * - Returns null between 18:00 and 23:59:59 Asia/Karachi
 */
export function computeExpectedPktExpiry(date: Date = new Date()): Date | null {
  const pkt = getPktClockParts(date);
  if (pkt.hour >= 18) {
    return null;
  }
  // PKT is fixed UTC+05:00 (no DST)
  const cutoffMs = Date.UTC(pkt.year, pkt.month - 1, pkt.day, 18 - 5, 0, 0, 0);
  const twoHoursMs = date.getTime() + 2 * 60 * 60 * 1000;
  return new Date(Math.min(twoHoursMs, cutoffMs));
}

export function validateNote(raw: string): { valid: boolean; trimmed: string | null; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: true, trimmed: null };
  }
  if (trimmed.length > 60) {
    return { valid: false, trimmed, error: 'Note must be 60 characters or fewer.' };
  }
  return { valid: true, trimmed };
}
