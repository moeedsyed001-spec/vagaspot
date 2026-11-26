import { describe, expect, it } from 'vitest';
import {
  classifyFeedError,
  formatAvailabilityLabel,
  formatCampusLabel,
  formatRelativeTime,
  formatSourceLabel,
} from './feedUtils';

describe('feedUtils', () => {
  it('formats campus state, availability, and source labels cleanly', () => {
    expect(formatCampusLabel('on_campus')).toBe('On Campus');
    expect(formatCampusLabel('off_campus')).toBe('Off Campus');
    expect(formatCampusLabel('unknown')).toBe('Unknown');
    expect(formatCampusLabel(null)).toBe('Unknown');

    expect(formatAvailabilityLabel('looking_for_friends')).toBe('Looking for Friends');
    expect(formatSourceLabel('manual')).toBe('Manual check-in');
    expect(formatSourceLabel('geofence')).toBe('Auto campus check');
  });

  it('formats relative time accurately', () => {
    const base = Date.UTC(2026, 10, 26, 10, 0, 0);
    expect(formatRelativeTime(new Date(base - 20_000).toISOString(), base)).toBe('Just now');
    expect(formatRelativeTime(new Date(base - 8 * 60_000).toISOString(), base)).toBe('8 min ago');
    expect(formatRelativeTime(new Date(base - 3 * 3600_000).toISOString(), base)).toBe('3 hr ago');
  });

  it('classifies offline, paused-service, and generic errors', () => {
    expect(classifyFeedError(new Error('anything'), false)).toBe('offline');
    expect(classifyFeedError(new Error('TypeError: Failed to fetch'), true)).toBe('offline');
    expect(classifyFeedError(new Error('503 Service Unavailable (paused)'), true)).toBe('paused');
    expect(classifyFeedError(new Error('RPC permission error'), true)).toBe('error');
  });
});
