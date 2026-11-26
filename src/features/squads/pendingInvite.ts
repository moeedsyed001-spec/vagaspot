import type { RedeemInviteStatus } from '../../types/domain';

const PENDING_INVITE_KEY = 'vagaspot.pending_invite';
const PENDING_INVITE_TTL_MS = 30 * 60 * 1000;

interface StoredPendingInvite {
  token: string;
  savedAt: number;
}

function getAvailableStorages(): Storage[] {
  const list: Storage[] = [];
  try {
    list.push(window.sessionStorage);
  } catch {
    // Ignore restricted storage
  }
  try {
    list.push(window.localStorage);
  } catch {
    // Ignore restricted storage
  }
  return list;
}

export function savePendingInviteToken(rawToken: string): void {
  const token = rawToken.trim();
  if (!token) {
    return;
  }
  const payload = JSON.stringify({ token, savedAt: Date.now() } satisfies StoredPendingInvite);
  for (const storage of getAvailableStorages()) {
    try {
      storage.setItem(PENDING_INVITE_KEY, payload);
    } catch {
      // Ignore quota/storage errors
    }
  }
}

export function readPendingInviteToken(): string | null {
  for (const storage of getAvailableStorages()) {
    try {
      const raw = storage.getItem(PENDING_INVITE_KEY);
      if (!raw) {
        continue;
      }
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'token' in parsed &&
        'savedAt' in parsed &&
        typeof (parsed as StoredPendingInvite).token === 'string' &&
        typeof (parsed as StoredPendingInvite).savedAt === 'number'
      ) {
        const entry = parsed as StoredPendingInvite;
        if (Date.now() - entry.savedAt <= PENDING_INVITE_TTL_MS && entry.token.trim().length > 0) {
          return entry.token.trim();
        }
      }
    } catch {
      // Ignore malformed JSON
    }
  }
  clearPendingInviteToken();
  return null;
}

export function clearPendingInviteToken(): void {
  for (const storage of getAvailableStorages()) {
    try {
      storage.removeItem(PENDING_INVITE_KEY);
    } catch {
      // Ignore restricted storage
    }
  }
}

export function extractInviteToken(
  paramToken: string | undefined,
  search: string,
): string | null {
  if (paramToken && paramToken.trim().length > 0) {
    return paramToken.trim();
  }
  const params = new URLSearchParams(search);
  const queryToken = params.get('token');
  if (queryToken && queryToken.trim().length > 0) {
    return queryToken.trim();
  }
  return null;
}

export function buildInviteUrl(
  rawToken: string,
  origin: string = window.location.origin,
): string {
  return `${origin.replace(/\/+$/, '')}/join/${encodeURIComponent(rawToken)}`;
}

export function validateSquadName(raw: string): { valid: boolean; trimmed: string; error?: string } {
  const trimmed = raw.trim();
  if (trimmed.length < 2) {
    return { valid: false, trimmed, error: 'Squad name must be at least 2 characters.' };
  }
  if (trimmed.length > 40) {
    return { valid: false, trimmed, error: 'Squad name must be 40 characters or fewer.' };
  }
  return { valid: true, trimmed };
}

export function formatRedeemError(status: RedeemInviteStatus): string {
  switch (status) {
    case 'expired':
      return 'Invite expired — ask the squad owner for a new one.';
    case 'revoked':
      return 'This invite link was revoked by the squad owner.';
    case 'already_used':
      return 'This single-use invite has already been used.';
    case 'rate_limited':
      return 'Too many failed invite attempts. Please wait a few minutes and try again.';
    case 'invalid':
      return 'That invite token is not valid. Check the link and try again.';
    case 'redeemed':
    case 'already_member':
      return '';
  }
}
