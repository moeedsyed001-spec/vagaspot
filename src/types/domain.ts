export type CampusState = 'on_campus' | 'off_campus' | 'unknown';

export type AvailabilityState = 'free' | 'in_class' | 'busy' | 'looking_for_friends';

export type PresenceSource = 'manual' | 'geofence';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface UserProfile {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}
