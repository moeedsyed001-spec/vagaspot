import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatePanel } from '../../components/StatePanel';

export function ZonePickerPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/check-in"
          aria-label="Back to Check-in"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Zone Picker</h1>
          <p className="text-xs text-[var(--muted)]">
            COMSATS Islamabad zone labels will load from `campus_zones` in Phase 5.
          </p>
        </div>
      </div>

      <StatePanel
        kind="empty"
        title="Campus zone list pending database seed"
        description="Student-accessible quick locations will appear first, with secondary spots grouped under More campus locations. Selection does not imply GPS verification."
      />
    </div>
  );
}
