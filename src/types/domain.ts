export type CampusState = 'on_campus' | 'off_campus' | 'unknown';

export type AvailabilityState = 'free' | 'in_class' | 'busy' | 'looking_for_friends';

export type PresenceSource = 'manual' | 'geofence';

export type ThemePreference = 'system' | 'light' | 'dark';

export type SquadRole = 'owner' | 'member';

export type InviteStatus = 'active' | 'used' | 'expired' | 'revoked';

export type RedeemInviteStatus =
  | 'redeemed'
  | 'already_member'
  | 'invalid'
  | 'expired'
  | 'revoked'
  | 'already_used'
  | 'rate_limited';

export interface UserProfile {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface SquadSummary {
  readonly squad_id: string;
  readonly name: string;
  readonly role: SquadRole;
  readonly joined_at: string;
  readonly member_count: number;
}

export interface SquadMember {
  readonly user_id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly role: SquadRole;
  readonly joined_at: string;
}

export interface SquadInviteSummary {
  readonly id: string;
  readonly created_at: string;
  readonly expires_at: string;
  readonly consumed_at: string | null;
  readonly revoked_at: string | null;
  readonly status: InviteStatus;
}

export interface RedeemInviteResult {
  readonly status: RedeemInviteStatus;
  readonly squad_id: string | null;
  readonly squad_name: string | null;
}

export interface SquadFeedMember {
  readonly user_id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly role: SquadRole;
  readonly is_ghost: boolean;
  readonly campus_state: CampusState | null;
  readonly campus_source: PresenceSource | null;
  readonly campus_observed_at: string | null;
  readonly availability: AvailabilityState | null;
  readonly availability_expires_at: string | null;
  readonly zone_id: string | null;
  readonly zone_name: string | null;
  readonly note: string | null;
  readonly last_updated_at: string | null;
}
