import { Crown, EyeOff, RefreshCw, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import { useAuth } from '../auth/authContextValue';
import { useMySquads, useSquadMembers } from '../squads/useSquads';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? 'F';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function SquadFeedPage() {
  const { user } = useAuth();
  const squadsQuery = useMySquads(user?.id);
  const activeSquad = squadsQuery.data?.[0] ?? null;
  const membersQuery = useSquadMembers(activeSquad?.squad_id);

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
    return (
      <StatePanel
        kind="error"
        title="Unable to load squads"
        description={squadsQuery.error.message}
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

  const members = membersQuery.data ?? [];

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
          <p className="text-xs text-[var(--muted)] tabular-nums">
            {activeSquad.member_count}{' '}
            {activeSquad.member_count === 1 ? 'member' : 'members'} · Live presence feed wires in
            Phase 4
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Your presence summary</p>
          <p className="text-xs text-[var(--muted)]">
            Campus: Unknown · Availability &amp; Realtime feed arrive in Phases 4–5
          </p>
        </div>
        <Link
          to="/settings"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          <EyeOff className="h-4 w-4" aria-hidden="true" />
          <span>Settings</span>
        </Link>
      </Card>

      {membersQuery.isLoading ? (
        <StatePanel
          kind="loading"
          title="Loading squad members"
          description="Fetching active members."
        />
      ) : membersQuery.error ? (
        <StatePanel
          kind="error"
          title="Could not load squad members"
          description={membersQuery.error.message}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {members.map((member) => (
            <Card key={member.user_id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.display_name}
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 shrink-0 rounded-full border border-[var(--border)] object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-bold text-[var(--primary)]"
                  >
                    {getInitials(member.display_name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {member.display_name}
                    {member.user_id === user?.id ? ' (You)' : ''}
                  </p>
                  <p className="text-xs text-[var(--muted)]">Status pending Phase 4</p>
                </div>
              </div>

              {member.role === 'owner' ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Owner</span>
                </span>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
