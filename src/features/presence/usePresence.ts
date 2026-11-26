import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabase';
import type { AvailabilityState, CampusState, CampusZone } from '../../types/domain';
import { squadFeedQueryKey } from '../feed/useSquadFeed';
import { validateNote } from './expiry';

export const campusZonesQueryKey = ['campus-zones'] as const;

export function useCampusZones(enabled = true) {
  return useQuery<CampusZone[]>({
    queryKey: campusZonesQueryKey,
    enabled,
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase
        .from('campus_zones')
        .select('id, name, category, display_order, is_active, show_in_quick_list')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function useSetCampusState(squadId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, CampusState>({
    mutationFn: async (state: CampusState) => {
      if (!squadId) {
        throw new Error('Join or create a squad first.');
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { error } = await supabase.rpc('set_my_campus_state', {
        p_squad_id: squadId,
        p_state: state,
      });
      if (error) {
        throw new Error(error.message);
      }
      return undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadFeedQueryKey(squadId) });
    },
  });
}

export function useSetAvailability(squadId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<string | null, Error, AvailabilityState | null>({
    mutationFn: async (availability: AvailabilityState | null) => {
      if (!squadId) {
        throw new Error('Join or create a squad first.');
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('set_my_availability', {
        p_squad_id: squadId,
        p_availability: availability,
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadFeedQueryKey(squadId) });
    },
  });
}

export interface SetZoneInput {
  readonly zoneId: string | null;
  readonly note: string | null;
}

export function useSetZone(squadId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<string | null, Error, SetZoneInput>({
    mutationFn: async ({ zoneId, note }: SetZoneInput) => {
      if (!squadId) {
        throw new Error('Join or create a squad first.');
      }
      const noteCheck = validateNote(note ?? '');
      if (!noteCheck.valid) {
        throw new Error(noteCheck.error ?? 'Note is too long.');
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('set_my_zone', {
        p_squad_id: squadId,
        p_zone_id: zoneId,
        p_note: noteCheck.trimmed,
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadFeedQueryKey(squadId) });
    },
  });
}
