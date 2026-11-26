import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';

export function SquadOnboardingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create or join a squad</h1>
        <p className="text-sm text-[var(--muted)]">
          Squads are private and invite-only. There is no public directory.
        </p>
      </div>

      <StatePanel
        kind="empty"
        title="No squad connected yet"
        description="Once authentication and squad RPCs are wired in Phases 2–3, you can start a private squad or redeem an invitation link."
      />

      <Card className="grid gap-3">
        <Link
          to="/squads/create"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-fg)]"
        >
          Create a Squad (Placeholder)
        </Link>
        <Link
          to="/join"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text)]"
        >
          Join with Invite Link (Placeholder)
        </Link>
        <Link
          to="/squad"
          className="text-center text-xs font-medium text-[var(--muted)] underline-offset-2 hover:underline"
        >
          Back to Squad tab
        </Link>
      </Card>
    </div>
  );
}
