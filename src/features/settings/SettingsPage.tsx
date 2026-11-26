import { LogOut } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useTheme } from '../../hooks/useTheme';
import { envConfig } from '../../lib/env';
import type { ThemePreference } from '../../types/domain';
import { useAuth } from '../auth/authContextValue';
import { useProfile, useUpdateDisplayName, validateDisplayName } from '../auth/useProfile';
import { NotificationPreferencesCard } from '../notifications/NotificationPreferencesCard';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function getInitials(name: string | undefined): string {
  const cleaned = (name ?? 'Friend').trim();
  if (!cleaned) {
    return 'F';
  }
  const parts = cleaned.split(/\s+/);
  const first = parts[0]?.[0] ?? 'F';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const profileQuery = useProfile(user?.id);
  const updateDisplayName = useUpdateDisplayName(user?.id);

  const [draftName, setDraftName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const profile = profileQuery.data;
  const inputName = draftName ?? profile?.display_name ?? '';

  const handleSaveName = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    setSaveSuccess(false);

    const check = validateDisplayName(inputName);
    if (!check.valid) {
      setValidationError(check.error ?? 'Invalid display name.');
      return;
    }

    try {
      await updateDisplayName.mutateAsync(check.trimmed);
      setDraftName(null);
      setSaveSuccess(true);
    } catch {
      // Mutation error is exposed via updateDisplayName.error
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>
        <p className="text-xs text-[var(--muted)]">
          Profile, appearance, privacy controls, and squad management.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                referrerPolicy="no-referrer"
                className="h-11 w-11 rounded-full border border-[var(--border)] object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-sm font-bold text-[var(--primary)]"
              >
                {getInitials(profile?.display_name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {profileQuery.isLoading ? 'Loading profile…' : (profile?.display_name ?? 'Friend')}
              </p>
              <p className="truncate text-xs text-[var(--muted)]">{user?.email ?? 'Signed in'}</p>
            </div>
          </div>

          <Button
            variant="secondary"
            disabled={signingOut}
            onClick={() => {
              void handleSignOut();
            }}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
          </Button>
        </div>

        <form
          onSubmit={(event) => {
            void handleSaveName(event);
          }}
          className="space-y-2.5 border-t border-[var(--border)] pt-3"
        >
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Display name</span>
            <input
              type="text"
              maxLength={50}
              value={inputName}
              disabled={profileQuery.isLoading || updateDisplayName.isPending}
              onChange={(event) => {
                setDraftName(event.target.value);
                setValidationError(null);
                setSaveSuccess(false);
              }}
              placeholder="Your name visible to your squad"
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] disabled:opacity-60"
            />
          </label>

          {validationError ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {validationError}
            </p>
          ) : null}

          {profileQuery.error ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {profileQuery.error.message}
            </p>
          ) : null}

          {updateDisplayName.error ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {updateDisplayName.error.message}
            </p>
          ) : null}

          {saveSuccess ? (
            <p role="status" className="text-xs text-[var(--success)]">
              Display name updated.
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-[var(--muted)]">1–50 characters. Visible to squadmates.</span>
            <Button
              type="submit"
              disabled={profileQuery.isLoading || updateDisplayName.isPending}
            >
              {updateDisplayName.isPending ? 'Saving…' : 'Save Name'}
            </Button>
          </div>
        </form>
      </Card>

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
        <h2 className="text-base font-semibold">Squad & Account Controls</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/settings/manage"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
          >
            Owner Management
          </Link>
          <Button variant="danger" disabled>
            Delete Account (Server Flow Later)
          </Button>
        </div>
      </Card>

      <Card className="space-y-1.5">
        <h2 className="text-sm font-semibold">Environment Status</h2>
        <p className="text-xs text-[var(--muted)]">
          {envConfig.isConfigured
            ? 'Supabase public environment variables are present.'
            : envConfig.issues.join(' ')}
        </p>
      </Card>
    </div>
  );
}
