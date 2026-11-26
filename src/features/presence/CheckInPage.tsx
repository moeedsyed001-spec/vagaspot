import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

const CAMPUS_OPTIONS = ['On Campus', 'Off Campus', 'Unknown'] as const;
const AVAILABILITY_OPTIONS = ['Free', 'In Class', 'Busy', 'Looking for Friends'] as const;

export function CheckInPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Manual Check-in</h1>
        <p className="text-xs text-[var(--muted)]">
          Where are you hanging out? Campus state, availability, and zone stay separate.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">1. Campus presence</h2>
          <div className="grid grid-cols-3 gap-2">
            {CAMPUS_OPTIONS.map((label) => (
              <Button key={label} variant="secondary" disabled>
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">2. Availability</h2>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABILITY_OPTIONS.map((label) => (
              <Button key={label} variant="secondary" disabled>
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">3. Campus zone & optional note</h2>
          <Link
            to="/check-in/zones"
            className="flex min-h-11 items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm font-medium text-[var(--text)]"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
              <span>Choose COMSATS campus zone (Placeholder)</span>
            </span>
            <span className="text-xs text-[var(--muted)]">Browse</span>
          </Link>

          <input
            type="text"
            maxLength={60}
            disabled
            placeholder="Optional note (max 60 chars, wired in Phase 5)"
            className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] disabled:opacity-60"
          />
        </div>

        <div className="space-y-2 border-t border-[var(--border)] pt-3">
          <p className="text-xs text-[var(--muted)]">
            Availability and zone expire at 6:00 PM PKT or in 2 hours, whichever comes first.
          </p>
          <Button className="w-full" disabled>
            Save Check-in (Phase 5)
          </Button>
        </div>
      </Card>
    </div>
  );
}
