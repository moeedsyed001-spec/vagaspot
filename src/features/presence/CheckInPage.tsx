import { AlertTriangle, Check, EyeOff, MapPin, RefreshCw, X } from 'lucide-react';
import { useState, type SyntheticEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import type { AvailabilityState, CampusState } from '../../types/domain';
import { useAuth } from '../auth/authContextValue';
import { formatAbsoluteTime } from '../feed/feedUtils';
import { useSquadFeed } from '../feed/useSquadFeed';
import { useMySquads } from '../squads/useSquads';
import { computeExpectedPktExpiry, isAfterPktCutoff, validateNote } from './expiry';
import { useCampusZones, useSetAvailability, useSetCampusState, useSetZone } from './usePresence';

const CAMPUS_OPTIONS: readonly { value: CampusState; label: string }[] = [
  { value: 'on_campus', label: 'On Campus' },
  { value: 'off_campus', label: 'Off Campus' },
  { value: 'unknown', label: 'Unknown' },
];

const AVAILABILITY_OPTIONS: readonly { value: AvailabilityState; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'in_class', label: 'In Class' },
  { value: 'busy', label: 'Busy' },
  { value: 'looking_for_friends', label: 'Looking for Friends' },
];

export function CheckInPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const squadsQuery = useMySquads(user?.id);
  const activeSquad = squadsQuery.data?.[0] ?? null;

  const feedQuery = useSquadFeed(activeSquad?.squad_id, user?.id);
  const zonesQuery = useCampusZones(Boolean(activeSquad));

  const setCampusState = useSetCampusState(activeSquad?.squad_id);
  const setAvailability = useSetAvailability(activeSquad?.squad_id);
  const setZone = useSetZone(activeSquad?.squad_id);

  const [draftZoneId, setDraftZoneId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => Promise<void>) | null>(null);

  if (squadsQuery.isLoading) {
    return (
      <StatePanel
        kind="loading"
        title="Loading check-in"
        description="Checking your active squad."
      />
    );
  }

  if (!activeSquad) {
    return (
      <StatePanel
        kind="empty"
        title="No active squad"
        description="Create or join a squad before sharing your campus check-in."
        action={
          <Link
            to="/onboarding"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-fg)]"
          >
            Create or Join Squad
          </Link>
        }
      />
    );
  }

  const selfEntry = (feedQuery.data ?? []).find((m) => m.user_id === user?.id) ?? null;
  const isGhost = selfEntry?.is_ghost ?? false;
  const zones = zonesQuery.data ?? [];
  const quickZones = zones.filter((z) => z.show_in_quick_list).slice(0, 6);

  const paramZoneId = searchParams.get('zone');
  const selectedZoneId = draftZoneId ?? paramZoneId ?? selfEntry?.zone_id ?? null;
  const selectedZone = zones.find((z) => z.id === selectedZoneId) ?? null;
  const noteValue = draftNote ?? selfEntry?.note ?? '';

  const afterCutoff = isAfterPktCutoff();
  const expectedExpiry = computeExpectedPktExpiry();
  const anyError =
    setCampusState.error?.message ?? setAvailability.error?.message ?? setZone.error?.message ?? null;
  const isSaving =
    setCampusState.isPending || setAvailability.isPending || setZone.isPending;

  const runCampusUpdate = async (state: CampusState) => {
    setSavedFeedback(null);
    setLastFailedAction(null);
    try {
      await setCampusState.mutateAsync(state);
      if (state === 'off_campus') {
        setDraftZoneId(null);
        setDraftNote('');
        if (paramZoneId) {
          setSearchParams({}, { replace: true });
        }
      }
      setSavedFeedback('Campus presence synced.');
    } catch {
      setLastFailedAction(() => () => runCampusUpdate(state));
    }
  };

  const runAvailabilityUpdate = async (next: AvailabilityState | null) => {
    setSavedFeedback(null);
    setLastFailedAction(null);
    try {
      const expiresAt = await setAvailability.mutateAsync(next);
      setSavedFeedback(
        next === null
          ? 'Availability cleared.'
          : expiresAt
            ? `Availability synced (expires ${formatAbsoluteTime(expiresAt)}).`
            : 'Availability synced.',
      );
    } catch {
      setLastFailedAction(() => () => runAvailabilityUpdate(next));
    }
  };

  const runZoneSave = async (zoneId: string | null, note: string | null) => {
    setSavedFeedback(null);
    setNoteError(null);
    setLastFailedAction(null);

    const check = validateNote(note ?? '');
    if (!check.valid) {
      setNoteError(check.error ?? 'Note is too long.');
      return;
    }

    try {
      const expiresAt = await setZone.mutateAsync({ zoneId, note: check.trimmed });
      setDraftZoneId(null);
      setDraftNote(null);
      if (paramZoneId) {
        setSearchParams({}, { replace: true });
      }
      setSavedFeedback(
        zoneId === null && check.trimmed === null
          ? 'Campus spot cleared.'
          : expiresAt
            ? `Campus spot synced (expires ${formatAbsoluteTime(expiresAt)}).`
            : 'Campus spot synced.',
      );
    } catch {
      setLastFailedAction(() => () => runZoneSave(zoneId, note));
    }
  };

  const handleSpotSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runZoneSave(selectedZoneId, noteValue);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Manual Check-in</h1>
        <p className="text-xs text-[var(--muted)]">
          Campus presence, availability, and campus spot are separate controls. No GPS needed.
        </p>
      </div>

      {isGhost ? (
        <Card className="flex items-start gap-2.5 border-[var(--warning)]">
          <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-[var(--warning)]" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold">Ghost Mode is on</p>
            <p className="text-xs text-[var(--muted)]">
              Turn off Ghost Mode in Settings before sharing a campus check-in.
            </p>
          </div>
        </Card>
      ) : null}

      {anyError ? (
        <Card role="alert" className="flex flex-wrap items-center justify-between gap-3 border-[var(--danger)]">
          <div className="flex items-start gap-2 text-xs text-[var(--danger)]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Not synced</p>
              <p>{anyError}</p>
            </div>
          </div>
          {lastFailedAction ? (
            <Button
              variant="secondary"
              disabled={isSaving}
              onClick={() => {
                void lastFailedAction();
              }}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Retry</span>
            </Button>
          ) : null}
        </Card>
      ) : null}

      {savedFeedback ? (
        <Card role="status" className="flex items-center gap-2 border-[var(--success)] py-3 text-xs text-[var(--success)]">
          <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="font-semibold">{savedFeedback}</span>
        </Card>
      ) : null}

      <Card className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">1. Campus presence (8-hour freshness)</h2>
          <div className="grid grid-cols-3 gap-2">
            {CAMPUS_OPTIONS.map((opt) => {
              const active = selfEntry?.campus_state === opt.value;
              return (
                <Button
                  key={opt.value}
                  variant={active ? 'primary' : 'secondary'}
                  disabled={isGhost || isSaving}
                  aria-pressed={active}
                  onClick={() => {
                    void runCampusUpdate(opt.value);
                  }}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--muted)]">
            Setting Off Campus automatically clears active availability, zone, and note.
          </p>
        </div>

        <div className="space-y-2 border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">2. Availability</h2>
            {selfEntry?.availability ? (
              <button
                type="button"
                disabled={isGhost || isSaving}
                onClick={() => {
                  void runAvailabilityUpdate(null);
                }}
                className="text-xs font-medium text-[var(--muted)] underline underline-offset-2 hover:text-[var(--text)]"
              >
                Clear
              </button>
            ) : null}
          </div>

          {afterCutoff ? (
            <p className="rounded-[var(--radius-control)] bg-[var(--surface-2)] p-3 text-xs text-[var(--warning)]">
              Availability and spot check-ins close at 6:00 PM PKT and reopen at 12:00 AM PKT.
              Campus presence (On/Off Campus) can still be updated above.
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            {AVAILABILITY_OPTIONS.map((opt) => {
              const active = selfEntry?.availability === opt.value;
              return (
                <Button
                  key={opt.value}
                  variant={active ? 'primary' : 'secondary'}
                  disabled={isGhost || isSaving || afterCutoff}
                  aria-pressed={active}
                  onClick={() => {
                    void runAvailabilityUpdate(opt.value);
                  }}
                >
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            void handleSpotSubmit(event);
          }}
          className="space-y-3 border-t border-[var(--border)] pt-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">3. Campus spot &amp; optional note</h2>
            {selectedZoneId || noteValue.trim() ? (
              <button
                type="button"
                disabled={isGhost || isSaving}
                onClick={() => {
                  setDraftZoneId(null);
                  setDraftNote('');
                  void runZoneSave(null, null);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] underline underline-offset-2 hover:text-[var(--text)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear spot</span>
              </button>
            ) : null}
          </div>

          <Link
            to="/check-in/zones"
            className="flex min-h-11 items-center justify-between rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm font-medium text-[var(--text)]"
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--primary)]" aria-hidden="true" />
              <span>
                {selectedZone
                  ? selectedZone.name
                  : selfEntry?.zone_name ?? 'Choose COMSATS campus zone'}
              </span>
            </span>
            <span className="text-xs text-[var(--muted)]">Browse all</span>
          </Link>

          {quickZones.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" aria-label="Quick campus spots">
              {quickZones.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    disabled={isGhost || isSaving || afterCutoff}
                    onClick={() => {
                      setDraftZoneId(zone.id);
                    }}
                    className={`min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-fg)]'
                        : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {zone.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          <label className="block space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Optional note (plain text, max 60 chars)</span>
              <span className="tabular-nums">{noteValue.length}/60</span>
            </div>
            <input
              type="text"
              maxLength={65}
              value={noteValue}
              disabled={isGhost || isSaving || afterCutoff}
              onChange={(event) => {
                setDraftNote(event.target.value);
                setNoteError(null);
              }}
              placeholder="e.g. 2nd floor near stairs"
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)] disabled:opacity-60"
            />
          </label>

          {noteError ? (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {noteError}
            </p>
          ) : null}

          <div className="space-y-2 pt-1">
            <p className="text-xs text-[var(--muted)]">
              {expectedExpiry
                ? `Availability and spot share one expiry (around ${formatAbsoluteTime(expectedExpiry.toISOString())}).`
                : 'Availability and spot check-ins reopen at 12:00 AM PKT.'}
            </p>
            <Button
              type="submit"
              className="w-full"
              disabled={isGhost || isSaving || afterCutoff}
            >
              {setZone.isPending ? 'Syncing Spot…' : 'Save Spot'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
