import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export function JoinSquadPage() {
  const { token } = useParams<{ token?: string }>();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Join squad</h1>
        <p className="text-sm text-[var(--muted)]">
          Single-use invite tokens expire automatically and are redeemed securely in Phase 3.
        </p>
      </div>

      <Card className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Invitation token</span>
          <input
            type="text"
            readOnly
            value={token ? 'Invite token detected (redemption wired in Phase 3)' : ''}
            placeholder="Paste invite token"
            className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button disabled className="flex-1">
            Redeem Invite (Phase 3)
          </Button>
          <Link
            to="/onboarding"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text)]"
          >
            Back
          </Link>
        </div>
      </Card>
    </div>
  );
}
