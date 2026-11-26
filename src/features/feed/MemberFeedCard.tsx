import { CheckCircle2, Clock, Crown, EyeOff, HelpCircle, MapPin, MinusCircle, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { Card } from '../../components/Card';
import type { AvailabilityState, CampusState, SquadFeedMember } from '../../types/domain';
import {
  formatAbsoluteTime,
  formatAvailabilityLabel,
  formatCampusLabel,
  formatRelativeTime,
  formatSourceLabel,
} from './feedUtils';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? 'F';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

function getCampusBadgeMeta(state: CampusState | null) {
  switch (state) {
    case 'on_campus':
      return {
        label: formatCampusLabel(state),
        className: 'text-[var(--success)] border-[var(--success)]',
        Icon: CheckCircle2,
      };
    case 'off_campus':
      return {
        label: formatCampusLabel(state),
        className: 'text-[var(--muted)] border-[var(--border)]',
        Icon: MinusCircle,
      };
    case 'unknown':
    case null:
      return {
        label: formatCampusLabel(state),
        className: 'text-[var(--warning)] border-[var(--warning)]',
        Icon: HelpCircle,
      };
  }
}

function getAvailabilityBadgeMeta(availability: AvailabilityState) {
  switch (availability) {
    case 'free':
      return {
        label: formatAvailabilityLabel(availability),
        className: 'text-[var(--success)] bg-[var(--surface-2)]',
        Icon: Sparkles,
      };
    case 'in_class':
      return {
        label: formatAvailabilityLabel(availability),
        className: 'text-[var(--info)] bg-[var(--surface-2)]',
        Icon: Clock,
      };
    case 'busy':
      return {
        label: formatAvailabilityLabel(availability),
        className: 'text-[var(--warning)] bg-[var(--surface-2)]',
        Icon: MinusCircle,
      };
    case 'looking_for_friends':
      return {
        label: formatAvailabilityLabel(availability),
        className: 'text-[var(--primary)] bg-[var(--surface-2)]',
        Icon: Users,
      };
  }
}

export function MemberFeedCard({
  member,
  isSelf,
}: {
  member: SquadFeedMember;
  isSelf: boolean;
}) {
  const [showExactTime, setShowExactTime] = useState(false);

  const avatar = member.avatar_url ? (
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
  );

  // Ghost Mode: render name/avatar + neutral hidden state ONLY (zero status, zone, source, timestamps)
  if (member.is_ghost) {
    return (
      <Card className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {member.display_name}
              {isSelf ? ' (You)' : ''}
            </p>
            <p className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
              <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Presence hidden</span>
            </p>
          </div>
        </div>

        {member.role === 'owner' ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-semibold text-[var(--primary)]">
            <Crown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Owner</span>
          </span>
        ) : null}
      </Card>
    );
  }

  const campusBadge = getCampusBadgeMeta(member.campus_state);
  const CampusIcon = campusBadge.Icon;
  const availabilityBadge = member.availability
    ? getAvailabilityBadgeMeta(member.availability)
    : null;
  const AvailabilityIcon = availabilityBadge?.Icon ?? null;
  const displayTimestamp = member.campus_observed_at ?? member.last_updated_at;

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {avatar}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold">
                {member.display_name}
                {isSelf ? ' (You)' : ''}
              </p>
              {member.role === 'owner' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
                  <Crown className="h-3 w-3" aria-hidden="true" />
                  <span>Owner</span>
                </span>
              ) : null}
            </div>
            <p className="text-xs text-[var(--muted)]">{formatSourceLabel(member.campus_source)}</p>
          </div>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${campusBadge.className}`}
        >
          <CampusIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{campusBadge.label}</span>
        </span>
      </div>

      {availabilityBadge || member.zone_name || member.note ? (
        <div className="space-y-1.5 border-t border-[var(--border)] pt-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {availabilityBadge && AvailabilityIcon ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${availabilityBadge.className}`}
              >
                <AvailabilityIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{availabilityBadge.label}</span>
              </span>
            ) : null}

            {member.zone_name ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium text-[var(--text)]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                <span>{member.zone_name}</span>
              </span>
            ) : null}
          </div>

          {member.note ? (
            <p className="text-xs text-[var(--muted)]">{member.note}</p>
          ) : null}
        </div>
      ) : null}

      {displayTimestamp ? (
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
          <button
            type="button"
            onClick={() => {
              setShowExactTime((prev) => !prev);
            }}
            title={formatAbsoluteTime(displayTimestamp)}
            className="tabular-nums underline-offset-2 hover:underline"
          >
            {showExactTime
              ? formatAbsoluteTime(displayTimestamp)
              : `Last updated ${formatRelativeTime(displayTimestamp)}`}
          </button>
        </div>
      ) : null}
    </Card>
  );
}
