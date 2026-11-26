import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';

export function OwnerManagementPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          aria-label="Back to Settings"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Owner Management</h1>
          <p className="text-xs text-[var(--muted)]">
            Generate/revoke single-use invites and manage members (Phase 3). Owners cannot bypass
            Ghost Mode.
          </p>
        </div>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Invitations</h2>
        <Button disabled>Generate Invite Link (Phase 3)</Button>
      </Card>

      <StatePanel
        kind="empty"
        title="Member list unavailable"
        description="Squad members and owner actions will load from Supabase RPCs in Phase 3."
      />
    </div>
  );
}
