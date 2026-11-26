import type { AvailabilityState, CampusState, PresenceSource } from '../../types/domain';

export type FeedErrorKind = 'offline' | 'paused' | 'error';

export function formatCampusLabel(state: CampusState | null): string {
  switch (state) {
    case 'on_campus':
      return 'On Campus';
    case 'off_campus':
      return 'Off Campus';
    case 'unknown':
    case null:
      return 'Unknown';
  }
}

export function formatAvailabilityLabel(availability: AvailabilityState): string {
  switch (availability) {
    case 'free':
      return 'Free';
    case 'in_class':
      return 'In Class';
    case 'busy':
      return 'Busy';
    case 'looking_for_friends':
      return 'Looking for Friends';
  }
}

export function formatSourceLabel(source: PresenceSource | null): string {
  switch (source) {
    case 'manual':
      return 'Manual check-in';
    case 'geofence':
      return 'Auto campus check';
    case null:
      return 'Unconfirmed';
  }
}

export function formatRelativeTime(isoTimestamp: string, nowMs: number = Date.now()): string {
  const parsedMs = Date.parse(isoTimestamp);
  if (Number.isNaN(parsedMs)) {
    return 'Unknown time';
  }
  const diffSec = Math.max(0, Math.floor((nowMs - parsedMs) / 1000));
  if (diffSec < 60) {
    return 'Just now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `${String(diffMin)} min ago`;
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return `${String(diffHr)} hr ago`;
  }
  const diffDay = Math.floor(diffHr / 24);
  return `${String(diffDay)} d ago`;
}

export function formatAbsoluteTime(isoTimestamp: string): string {
  const parsedMs = Date.parse(isoTimestamp);
  if (Number.isNaN(parsedMs)) {
    return 'Unknown time';
  }
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  }).format(new Date(parsedMs));
}

export function classifyFeedError(error: Error | null, isOnline: boolean): FeedErrorKind {
  if (!isOnline) {
    return 'offline';
  }
  const msg = (error?.message ?? '').toLowerCase();
  if (
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network request failed')
  ) {
    return 'offline';
  }
  if (
    msg.includes('paused') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('quota') ||
    msg.includes('service unavailable')
  ) {
    return 'paused';
  }
  return 'error';
}
