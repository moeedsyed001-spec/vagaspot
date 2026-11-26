import { Check, Copy, Share2 } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../auth/authContextValue';
import { buildInviteUrl, validateSquadName } from './pendingInvite';
import { useCreateInvite, useCreateSquad } from './useSquads';

export function CreateSquadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createSquad = useCreateSquad(user?.id);

  const [name, setName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdSquadId, setCreatedSquadId] = useState<string | null>(null);
  const [createdSquadName, setCreatedSquadName] = useState<string>('');
  const [oneTimeInviteUrl, setOneTimeInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createInvite = useCreateInvite(createdSquadId ?? undefined);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    const check = validateSquadName(name);
    if (!check.valid) {
      setValidationError(check.error ?? 'Invalid squad name.');
      return;
    }

    try {
      const squadId = await createSquad.mutateAsync(check.trimmed);
      setCreatedSquadId(squadId);
      setCreatedSquadName(check.trimmed);
    } catch {
      // Exposed via createSquad.error
    }
  };

  const handleGenerateFirstInvite = async () => {
    try {
      const rawToken = await createInvite.mutateAsync(72);
      setOneTimeInviteUrl(buildInviteUrl(rawToken));
      setCopied(false);
    } catch {
      // Exposed via createInvite.error
    }
  };

  const handleCopy = async () => {
    if (!oneTimeInviteUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(oneTimeInviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!oneTimeInviteUrl || typeof navigator.share !== 'function') {
      return;
    }
    try {
      await navigator.share({
        title: `Join ${createdSquadName} on VAGASPOT`,
        text: 'Use this single-use private invite link to join our squad:',
        url: oneTimeInviteUrl,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  if (createdSquadId) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Squad created</h1>
          <p className="text-sm text-[var(--muted)]">
            <span className="font-semibold text-[var(--text)]">{createdSquadName}</span> is ready.
            Invite a friend with a single-use link (expires in 72 hours).
          </p>
        </div>

        <Card className="space-y-4">
          {oneTimeInviteUrl ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-[var(--warning)]">
                Shown once — copy or share this link now. You can generate another anytime from
                Owner Management.
              </p>
              <input
                type="text"
                readOnly
                aria-label="Generated invite link"
                value={oneTimeInviteUrl}
                className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text)]"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => void handleCopy()} className="flex-1">
                  {copied ? (
                    <Check className="h-4 w-4 text-[var(--success)]" aria-hidden="true" />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </Button>
                {typeof navigator.share === 'function' ? (
                  <Button variant="secondary" onClick={() => void handleShare()}>
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    <span>Share</span>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              disabled={createInvite.isPending}
              onClick={() => void handleGenerateFirstInvite()}
              className="w-full"
            >
              {createInvite.isPending ? 'Generating invite…' : 'Generate Single-Use Invite Link'}
            </Button>
          )}

          {createInvite.error ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {createInvite.error.message}
            </p>
          ) : null}

          <Button
            className="w-full"
            onClick={() => {
              void navigate('/squad', { replace: true });
            }}
          >
            Go to Squad Feed
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create squad</h1>
        <p className="text-sm text-[var(--muted)]">
          Choose a short name (2–40 characters). Squads are private and never publicly listed.
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
            <span className="text-sm font-medium">Squad name</span>
            <input
              type="text"
              maxLength={40}
              value={name}
              disabled={createSquad.isPending}
              onChange={(event) => {
                setName(event.target.value);
                setValidationError(null);
              }}
              placeholder="e.g. COMSATS CS Friends"
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] disabled:opacity-60"
            />
          </label>

          {validationError ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {validationError}
            </p>
          ) : null}

          {createSquad.error ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {createSquad.error.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={createSquad.isPending} className="flex-1">
              {createSquad.isPending ? 'Creating…' : 'Create Squad'}
            </Button>
            <Link
              to="/onboarding"
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
