import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useTheme } from '../../hooks/useTheme';
import { envConfig } from '../../lib/env';
import type { ThemePreference } from '../../types/domain';
import { NotificationPreferencesCard } from '../notifications/NotificationPreferencesCard';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>
        <p className="text-xs text-[var(--muted)]">
          Appearance, privacy controls, squad management, and environment diagnostics.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Theme</h2>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Color theme">
          {THEME_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={theme === opt.value ? 'primary' : 'secondary'}
              onClick={() => {
                setTheme(opt.value);
              }}
              aria-pressed={theme === opt.value}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold">Privacy & Ghost Mode</h2>
        <p className="text-sm text-[var(--muted)]">
          Ghost Mode hides your campus presence, availability, zone, source, and timestamps from
          everyone in the squad, including owners. Wired in Phase 6.
        </p>
        <Button variant="secondary" disabled>
          Ghost Mode Toggle (Phase 6)
        </Button>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-base font-semibold">Location & Campus Detection</h2>
        <p className="text-sm text-[var(--muted)]">
          Web supports manual check-in only. Automatic Android campus detection is reserved for
          Release 2 after campus boundary verification.
        </p>
      </Card>

      <NotificationPreferencesCard />

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Account & Squad</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/settings/manage"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
          >
            Owner Management
          </Link>
          <Link
            to="/auth"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
          >
            Sign-in Screen
          </Link>
          <Button variant="danger" disabled>
            Delete Account (Server Flow Later)
          </Button>
        </div>
      </Card>

      <Card className="space-y-1.5">
        <h2 className="text-sm font-semibold">Environment Status (Phase 1 Check)</h2>
        <p className="text-xs text-[var(--muted)]">
          {envConfig.isConfigured
            ? 'Supabase public environment variables are present.'
            : envConfig.issues.join(' ')}
        </p>
      </Card>
    </div>
  );
}
