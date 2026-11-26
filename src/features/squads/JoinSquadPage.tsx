import { useEffect, useState, type SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import { useAuth } from '../auth/authContextValue';
import {
  clearPendingInviteToken,
  extractInviteToken,
  formatRedeemError,
  readPendingInviteToken,
  savePendingInviteToken,
} from './pendingInvite';
import { useRedeemInvite } from './useSquads';

export function JoinSquadPage() {
  const { token: paramToken } = useParams<{ token?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const redeemInvite = useRedeemInvite(user?.id);

  const urlToken = extractInviteToken(paramToken, location.search);
  const storedToken = readPendingInviteToken();

  const [manualToken, setManualToken] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const tokenValue = manualToken ?? storedToken ?? urlToken ?? '';

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      if (urlToken) {
        savePendingInviteToken(urlToken);
      }
      void navigate('/auth', { replace: true });
      return;
    }

    // Strip raw invite token from URL & history immediately after capture
    if (urlToken) {
      savePendingInviteToken(urlToken);
      void navigate('/join', { replace: true });
    }
  }, [authLoading, navigate, urlToken, user]);

  if (authLoading || !user) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
        <StatePanel
          kind="loading"
          title="Preparing invitation"
          description="Checking your sign-in status before redeeming the invite."
        />
      </div>
    );
  }

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    const trimmed = tokenValue.trim();
    if (!trimmed) {
      setStatusMessage('Paste an invitation token or open an invite link.');
      return;
    }

    try {
      const result = await redeemInvite.mutateAsync(trimmed);
      if (result.status === 'redeemed' || result.status === 'already_member') {
        clearPendingInviteToken();
        void navigate('/squad', { replace: true });
        return;
      }
      clearPendingInviteToken();
      setManualToken('');
      setStatusMessage(formatRedeemError(result.status));
    } catch {
      // Error surfaced via redeemInvite.error
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Join squad</h1>
        <p className="text-sm text-[var(--muted)]">
          Single-use invite tokens expire automatically after 72 hours by default.
        </p>
      </div>

      <Card className="space-y-4">
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-4"
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Invitation token</span>
            <input
              type="text"
              value={tokenValue}
              disabled={redeemInvite.isPending}
              onChange={(event) => {
                setManualToken(event.target.value);
                setStatusMessage(null);
              }}
              placeholder="Paste invite token"
              autoComplete="off"
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] disabled:opacity-60"
            />
          </label>

          {storedToken && manualToken === null ? (
            <p className="text-xs text-[var(--success)]">
              Invitation detected from your link. Tap Join Squad to accept.
            </p>
          ) : null}

          {statusMessage ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {statusMessage}
            </p>
          ) : null}

          {redeemInvite.error ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {redeemInvite.error.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={redeemInvite.isPending} className="flex-1">
              {redeemInvite.isPending ? 'Joining…' : 'Join Squad'}
            </Button>
            <Link
              to="/onboarding"
              onClick={() => {
                clearPendingInviteToken();
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text)]"
            >
              Back
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
