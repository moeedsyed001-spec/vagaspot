import { describe, expect, it } from 'vitest';
import { computeExpectedPktExpiry, isAfterPktCutoff, validateNote } from './expiry';

describe('Phase 5 Asia/Karachi expiry and note validation', () => {
  it('computes 10:00 PKT -> 12:00 PKT (T-BR-01)', () => {
    const t10 = new Date('2026-11-26T10:00:00+05:00');
    const exp = computeExpectedPktExpiry(t10);
    expect(exp?.toISOString()).toBe(new Date('2026-11-26T12:00:00+05:00').toISOString());
    expect(isAfterPktCutoff(t10)).toBe(false);
  });

  it('caps 17:30 PKT at 18:00 PKT (T-BR-02)', () => {
    const t1730 = new Date('2026-11-26T17:30:00+05:00');
    const exp = computeExpectedPktExpiry(t1730);
    expect(exp?.toISOString()).toBe(new Date('2026-11-26T18:00:00+05:00').toISOString());
  });

  it('returns null at 18:15 PKT and reopens at 00:05 PKT (T-BR-03)', () => {
    const t1815 = new Date('2026-11-26T18:15:00+05:00');
    expect(computeExpectedPktExpiry(t1815)).toBeNull();
    expect(isAfterPktCutoff(t1815)).toBe(true);

    const t0005 = new Date('2026-11-27T00:05:00+05:00');
    const exp = computeExpectedPktExpiry(t0005);
    expect(exp?.toISOString()).toBe(new Date('2026-11-27T02:05:00+05:00').toISOString());
    expect(isAfterPktCutoff(t0005)).toBe(false);
  });

  it('validates optional note length <= 60 characters (T-BR-10)', () => {
    expect(validateNote('   ')).toEqual({ valid: true, trimmed: null });
    expect(validateNote('  Library 2nd floor  ')).toEqual({
      valid: true,
      trimmed: 'Library 2nd floor',
    });
    expect(validateNote('a'.repeat(61)).valid).toBe(false);
  });
});
