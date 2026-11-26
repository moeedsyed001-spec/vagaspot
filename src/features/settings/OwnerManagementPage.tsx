import { ArrowLeft, Check, Copy, Crown, Share2, Trash2, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import { useAuth } from '../auth/authContextValue';
import { buildInviteUrl } from '../squads/pendingInvite';
import {
  useCreateInvite,
  useDeleteSquad,
  useMySquads,
  useRemoveMember,
  useRevokeInvite,
  useSquadInvites,
  useSquadMembers,
  useTransferOwnership,
} from '../squads/useSquads';

export function OwnerManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const squadsQuery = useMySquads(user?.id);
  const activeSquad = squadsQuery.data?.[0] ?? null;
  const isOwner = activeSquad?.role === 'owner';

  const membersQuery = useSquadMembers(activeSquad?.squad_id);
  const invitesQuery = useSquadInvites(activeSquad?.squad_id, isOwner);
  const createInvite = useCreateInvite(activeSquad?.squad_id);
  const revokeInvite = useRevokeInvite(activeSquad?.squad_id);
  const removeMember = useRemoveMember(activeSquad?.squad_id, user?.id);
  const transferOwnership = useTransferOwnership(activeSquad?.squad_id, user?.id);
  const deleteSquad = useDeleteSquad(user?.id);

  const [ttlHours, setTtlHours] = useState<number>(72);
  const [oneTimeInviteUrl, setOneTimeInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (squadsQuery.isLoading) {
    return (
      <StatePanel
        kind="loading"
        title="Loading owner controls"
        description="Checking squad ownership."
      />
    );
  }

  if (!activeSquad || !isOwner) {
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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Owner Management</h1>
        </div>
        <StatePanel
          kind="error"
          title="Owner access required"
          description="Only the active squad owner can generate invitations or manage members."
        />
      </div>
    );
  }

  const handleGenerateInvite = async () => {
    try {
      const rawToken = await createInvite.mutateAsync(ttlHours);
      setOneTimeInviteUrl(buildInviteUrl(rawToken));
      setCopied(false);
    } catch {
      // Surfaced via createInvite.error
    }
  };

  const handleCopy = async () => {
    if (!oneTimeInviteUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(oneTimeInviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleShare = async () => {
    if (!oneTimeInviteUrl || typeof navigator.share !== 'function') {
      return;
    }
    try {
      await navigator.share({
        title: `Join ${activeSquad.name} on VAGASPOT`,
        text: 'Use this single-use private invite link to join our squad:',
        url: oneTimeInviteUrl,
      });
    } catch {
      // Cancelled
    }
  };

  const handleDeleteSquad = async () => {
    try {
      await deleteSquad.mutateAsync(activeSquad.squad_id);
      void navigate('/onboarding', { replace: true });
    } catch {
      // Surfaced via deleteSquad.error
    }
  };

  const members = membersQuery.data ?? [];
  const invites = invitesQuery.data ?? [];

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
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Manage {activeSquad.name}
          </h1>
          <p className="text-xs text-[var(--muted)]">
            Single-use hashed invites and membership controls. Owners cannot view Ghost Mode data.
          </p>
        </div>
      </div>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Generate single-use invitation</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--muted)]">Expires in</span>
            <select
              value={ttlHours}
              onChange={(event) => {
                setTtlHours(Number(event.target.value));
              }}
              className="min-h-11 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]"
            >
              <option value={24}>24 hours</option>
              <option value={72}>72 hours</option>
              <option value={168}>7 days</option>
            </select>
          </label>
          <Button
            disabled={createInvite.isPending}
            onClick={() => {
              void handleGenerateInvite();
            }}
          >
            {createInvite.isPending ? 'Generating…' : 'Generate Invite Link'}
          </Button>
        </div>

        {createInvite.error ? (
          <p role="alert" className="text-xs text-[var(--danger)]">
            {createInvite.error.message}
          </p>
        ) : null}

        {oneTimeInviteUrl ? (
          <div className="space-y-2 rounded-[var(--radius-control)] border border-[var(--primary)] bg-[var(--surface-2)] p-3">
            <p className="text-xs font-medium text-[var(--warning)]">
              Shown once — copy or share now. Only its SHA-256 hash is stored on the server.
            </p>
            <input
              type="text"
              readOnly
              aria-label="Generated invite link"
              value={oneTimeInviteUrl}
              className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)]"
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => void handleCopy()}>
                {copied ? (
                  <Check className="h-4 w-4 text-[var(--success)]" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </Button>
              {typeof navigator.share === 'function' ? (
                <Button variant="secondary" onClick={() => void handleShare()}>
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  <span>Share</span>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Recent invitations</h2>
        {invitesQuery.isLoading ? (
          <p className="text-xs text-[var(--muted)]">Loading invitations…</p>
        ) : invites.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No invitations created yet.</p>
        ) : (
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold uppercase text-[var(--text)]">
                    {invite.status}
                  </span>
                  <p className="text-[var(--muted)] tabular-nums">
                    Expires {new Date(invite.expires_at).toLocaleString()}
                  </p>
                </div>
                {invite.status === 'active' ? (
                  <Button
                    variant="danger"
                    disabled={revokeInvite.isPending}
                    onClick={() => {
                      void revokeInvite.mutateAsync(invite.id);
                    }}
                  >
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-base font-semibold">Members ({members.length})</h2>
        {removeMember.error ? (
          <p role="alert" className="text-xs text-[var(--danger)]">
            {removeMember.error.message}
          </p>
        ) : null}
        {transferOwnership.error ? (
          <p role="alert" className="text-xs text-[var(--danger)]">
            {transferOwnership.error.message}
          </p>
        ) : null}
        <ul className="space-y-2">
          {members.map((member) => {
            const isSelf = member.user_id === user?.id;
            return (
              <li
                key={member.user_id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {member.display_name}
                    {isSelf ? ' (You)' : ''}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{member.role}</p>
                </div>

                {!isSelf && member.role !== 'owner' ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={transferOwnership.isPending}
                      onClick={() => {
                        void transferOwnership.mutateAsync(member.user_id);
                      }}
                    >
                      <Crown className="h-4 w-4" aria-hidden="true" />
                      <span>Make Owner</span>
                    </Button>
                    <Button
                      variant="danger"
                      disabled={removeMember.isPending}
                      onClick={() => {
                        void removeMember.mutateAsync(member.user_id);
                      }}
                    >
                      <UserMinus className="h-4 w-4" aria-hidden="true" />
                      <span>Remove</span>
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="space-y-3 border-[var(--danger)]">
        <h2 className="text-base font-semibold text-[var(--danger)]">Delete squad</h2>
        <p className="text-xs text-[var(--muted)]">
          Permanently removes this squad, memberships, invites, and presence rows.
        </p>
        {deleteSquad.error ? (
          <p role="alert" className="text-xs text-[var(--danger)]">
            {deleteSquad.error.message}
          </p>
        ) : null}
        {!confirmDelete ? (
          <Button
            variant="danger"
            onClick={() => {
              setConfirmDelete(true);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Delete Squad</span>
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={deleteSquad.isPending}
              onClick={() => {
                void handleDeleteSquad();
              }}
            >
              {deleteSquad.isPending ? 'Deleting…' : 'Confirm Delete Squad'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmDelete(false);
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
