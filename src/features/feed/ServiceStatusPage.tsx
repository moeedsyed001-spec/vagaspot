import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export function ServiceStatusPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Offline & Service States</h1>
        <p className="text-xs text-[var(--muted)]">
          Placeholder states for network loss, Realtime disconnect, and Supabase Free pausing.
        </p>
      </div>

      <Card className="space-y-2 border-[var(--warning)]">
        <p className="text-sm font-semibold text-[var(--warning)]">Connection offline (Preview)</p>
        <p className="text-sm text-[var(--muted)]">
          Presence unavailable. Last confirmed updates are not marked live while offline.
        </p>
        <Button variant="secondary" disabled>
          Retry Sync (Phase 4)
        </Button>
      </Card>

      <Card className="space-y-2 border-[var(--danger)]">
        <p className="text-sm font-semibold text-[var(--danger)]">
          Backend paused or quota unavailable (Preview)
        </p>
        <p className="text-sm text-[var(--muted)]">
          The service is temporarily unavailable. Check again shortly or ask the squad maintainer to
          restore the free backend project.
        </p>
        <Link
          to="/squad"
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
        >
          Back to Squad Feed
        </Link>
      </Card>
    </div>
  );
}
