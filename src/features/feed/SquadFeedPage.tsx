import { Radio, RefreshCw, UserPlus, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import { useAuth } from '../auth/authContextValue';
import { GhostModeControl } from '../presence/GhostModeControl';
import { useMySquads } from '../squads/useSquads';
import { classifyFeedError, formatCampusLabel, formatRelativeTime } from './feedUtils';
import { MemberFeedCard } from './MemberFeedCard';
import { useSquadFeed } from './useSquadFeed';

export function SquadFeedPage() {
  const { user } = useAuth();
  const squadsQuery = useMySquads(user?.id);
  const activeSquad = squadsQuery.data?.[0] ?? null;
  const feedQuery = useSquadFeed(activeSquad?.squad_id, user?.id);

  if (squadsQuery.isLoading) {
    return (
      <StatePanel
        kind="loading"
        title="Loading your squad"
        description="Fetching your squad membership."
      />
    );
  }

  if (squadsQuery.error) {
    const errorKind = classifyFeedError(squadsQuery.error, feedQuery.isOnline);
    return (
      <StatePanel
        kind={errorKind === 'offline' ? 'offline' : 'error'}
        title={
          errorKind === 'offline'
            ? 'You appear to be offline'
            : errorKind === 'paused'
              ? 'Backend paused or unavailable'
              : 'Unable to load squads'
        }
        description={
          errorKind === 'paused'
            ? 'The free backend may be paused after inactivity or temporarily unavailable. Ask the squad owner to check Supabase, or retry shortly.'
            : squadsQuery.error.message
        }
        action={
          <Button
            variant="secondary"
            onClick={() => {
              void squadsQuery.refetch();
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Retry</span>
          </Button>
        }
      />
    );
  }

  if (!activeSquad) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Squad Feed</h1>
          <p className="text-xs text-[var(--muted)]">
            Private, invite-only campus coordination for your friend group.
          </p>
        </div>

        <StatePanel
          kind="empty"
          title="You are not in a squad yet"
          description="Create a private squad and invite friends, or join using a single-use invite link."
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                to="/squads/create"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-fg)]"
              >
                Create Squad
              </Link>
              <Link
                to="/join"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
              >
                Join with Invite
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const members = feedQuery.data ?? [];
  const selfEntry = members.find((m) => m.user_id === user?.id) ?? null;
  const hasAnyActivePresence = members.some(
    (m) =>
      !m.is_ghost &&
      ((m.campus_state !== null && m.campus_state !== 'unknown') ||
        m.availability !== null ||
        m.zone_name !== null),
  );

  const lastSyncedIso =
    feedQuery.dataUpdatedAt > 0 ? new Date(feedQuery.dataUpdatedAt).toISOString() : null;

  const syncLabel = !feedQuery.isOnline
    ? 'Offline — showing last confirmed state'
    : feedQuery.realtimeStatus === 'live'
      ? 'Live updates connected'
      : 'Reconnecting — polling every 60s';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{activeSquad.name}</h1>
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--primary)]">
              {activeSquad.role === 'owner' ? 'Owner' : 'Member'}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)] tabular-nums">
            <span>
              {activeSquad.member_count}{' '}
              {activeSquad.member_count === 1 ? 'member' : 'members'}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              {!feedQuery.isOnline ? (
                <WifiOff className="h-3.5 w-3.5 text-[var(--warning)]" aria-hidden="true" />
              ) : (
                <Radio
                  className={`h-3.5 w-3.5 ${
                    feedQuery.realtimeStatus === 'live'
                      ? 'text-[var(--success)]'
                      : 'text-[var(--warning)]'
                  }`}
                  aria-hidden="true"
                />
              )}
              <span>{syncLabel}</span>
            </span>
            {lastSyncedIso ? (
              <>
                <span>·</span>
                <span>Synced {formatRelativeTime(lastSyncedIso)}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            disabled={feedQuery.isFetching || !feedQuery.isOnline}
            onClick={() => {
              void feedQuery.refetch();
            }}
            aria-label="Refresh squad feed"
          >
            <RefreshCw
              className={`h-4 w-4 ${feedQuery.isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refresh</span>
          </Button>
          {activeSquad.role === 'owner' ? (
            <Link
              to="/settings/manage"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-semibold text-[var(--text)]"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              <span>Invite</span>
            </Link>
          ) : null}
          <Link
            to="/check-in"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-fg)]"
          >
            Check-in
          </Link>
        </div>
      </div>

      {!feedQuery.isOnline ? (
        <Card className="flex items-center justify-between gap-3 border-[var(--warning)]">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-[var(--warning)]">Connection offline</p>
            <p className="text-xs text-[var(--muted)]">
              Presence unavailable offline. Updates cannot be marked live until reconnected.
            </p>
          </div>
          <Link
            to="/status"
            className="shrink-0 text-xs font-semibold text-[var(--primary)] underline underline-offset-2"
          >
            Status details
          </Link>
        </Card>
      ) : null}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Your presence summary</p>
          <p className="text-xs text-[var(--muted)]">
            {selfEntry?.is_ghost
              ? 'Ghost Mode is on — peers only see your name and "Presence hidden".'
              : `Campus: ${formatCampusLabel(selfEntry?.campus_state ?? null)}${
                  selfEntry?.zone_name ? ` · ${selfEntry.zone_name}` : ''
                }`}
          </p>
        </div>
        <GhostModeControl
          squadId={activeSquad.squad_id}
          userId={user?.id}
          isGhost={selfEntry?.is_ghost ?? false}
          compact
        />
      </Card>

      {feedQuery.isLoading ? (
        <StatePanel
          kind="loading"
          title="Loading squad feed"
          description="Fetching latest presence snapshots."
        />
      ) : feedQuery.error ? (
        (() => {
          const kind = classifyFeedError(feedQuery.error, feedQuery.isOnline);
          return (
            <StatePanel
              kind={kind === 'offline' ? 'offline' : 'error'}
              title={
                kind === 'offline'
                  ? 'Connection lost'
                  : kind === 'paused'
                    ? 'Service paused or quota reached'
                    : 'Could not load squad feed'
              }
              description={
                kind === 'paused'
                  ? 'The free Supabase backend may be paused after inactivity. Ask the squad owner to restore it, then retry.'
                  : feedQuery.error.message
              }
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    void feedQuery.refetch();
                  }}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>Retry</span>
                </Button>
              }
            />
          );
        })()
      ) : members.length === 0 ? (
        <StatePanel
          kind="empty"
          title="No members in feed"
          description="Invite a friend from Owner Management to see them here."
        />
      ) : (
        <div className="space-y-3">
          {!hasAnyActivePresence ? (
            <Card className="bg-[var(--surface-2)]">
              <p className="text-xs text-[var(--muted)]">
                No one has checked in yet. Tap Check-in to share your campus spot.
              </p>
            </Card>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <MemberFeedCard
                key={member.user_id}
                member={member}
                isSelf={member.user_id === user?.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
