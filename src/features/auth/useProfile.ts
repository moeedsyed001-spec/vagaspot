import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabase';
import type { UserProfile } from '../../types/domain';

export function validateDisplayName(raw: string): { valid: boolean; trimmed: string; error?: string } {
  const trimmed = raw.trim();
  if (trimmed.length < 1) {
    return { valid: false, trimmed, error: 'Display name cannot be empty.' };
  }
  if (trimmed.length > 50) {
    return { valid: false, trimmed, error: 'Display name must be 50 characters or fewer.' };
  }
  return { valid: true, trimmed };
}

export function profileQueryKey(userId: string | undefined) {
  return ['profile', userId ?? 'anonymous'] as const;
}

export function useProfile(userId: string | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: profileQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) {
        return null;
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }
      if (data) {
        return data;
      }

      // Fallback bootstrap if auth.users row existed prior to trigger setup
      const { data: ensured, error: rpcError } = await supabase.rpc('ensure_my_profile');
      if (rpcError) {
        throw new Error(rpcError.message);
      }

      return ensured[0] ?? null;
    },
  });
}

export function useUpdateDisplayName(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, string>({
    mutationFn: async (rawName: string) => {
      if (!userId) {
        throw new Error('You must be signed in to update your profile.');
      }
      const validation = validateDisplayName(rawName);
      if (!validation.valid) {
        throw new Error(validation.error ?? 'Invalid display name.');
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { data, error } = await supabase.rpc('update_my_profile', {
        p_display_name: validation.trimmed,
      });

      if (error) {
        throw new Error(error.message);
      }

      const updated = data[0];
      if (!updated) {
        throw new Error('Profile update did not return an updated record.');
      }
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(profileQueryKey(userId), updated);
    },
  });
}
