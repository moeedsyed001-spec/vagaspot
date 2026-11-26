import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildInviteUrl,
  clearPendingInviteToken,
  extractInviteToken,
  formatRedeemError,
  readPendingInviteToken,
  savePendingInviteToken,
  validateSquadName,
} from './pendingInvite';

describe('pendingInvite and squad validation helpers', () => {
  beforeEach(() => {
    clearPendingInviteToken();
  });

  it('saves, reads, and clears pre-auth invite tokens cleanly', () => {
    expect(readPendingInviteToken()).toBeNull();
    savePendingInviteToken('  secret-token-1234567890  ');
    expect(readPendingInviteToken()).toBe('secret-token-1234567890');
    clearPendingInviteToken();
    expect(readPendingInviteToken()).toBeNull();
  });

  it('extracts invite token from route param or query string and builds join URL', () => {
    expect(extractInviteToken('abc123', '')).toBe('abc123');
    expect(extractInviteToken(undefined, '?token=xyz789')).toBe('xyz789');
    expect(extractInviteToken(undefined, '')).toBeNull();
    expect(buildInviteUrl('abc/123', 'https://vagaspot.pages.dev/')).toBe(
      'https://vagaspot.pages.dev/join/abc%2F123',
    );
  });

  it('validates squad names (2–40 chars) and formats invite errors', () => {
    expect(validateSquadName(' A ').valid).toBe(false);
    expect(validateSquadName('x'.repeat(41)).valid).toBe(false);
    expect(validateSquadName('  COMSATS Alpha  ')).toEqual({
      valid: true,
      trimmed: 'COMSATS Alpha',
    });
    expect(formatRedeemError('expired')).toContain('expired');
    expect(formatRedeemError('revoked')).toContain('revoked');
    expect(formatRedeemError('already_used')).toContain('already been used');
  });
});
