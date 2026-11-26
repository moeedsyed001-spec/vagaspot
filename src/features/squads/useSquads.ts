import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabase';
import type {
  RedeemInviteResult,
  SquadInviteSummary,
  SquadMember,
  SquadSummary,
} from '../../types/domain';
import { validateSquadName } from './pendingInvite';

export function squadsQueryKey(userId: string | undefined) {
  return ['my-squads', userId ?? 'anonymous'] as const;
}

export function squadMembersQueryKey(squadId: string | undefined) {
  return ['squad-members', squadId ?? 'none'] as const;
}

export function squadInvitesQueryKey(squadId: string | undefined) {
  return ['squad-invites', squadId ?? 'none'] as const;
}

export function useMySquads(userId: string | undefined) {
  return useQuery<SquadSummary[]>({
    queryKey: squadsQueryKey(userId),
    enabled: Boolean(userId),
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('get_my_squads');
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function useSquadMembers(squadId: string | undefined) {
  return useQuery<SquadMember[]>({
    queryKey: squadMembersQueryKey(squadId),
    enabled: Boolean(squadId),
    queryFn: async () => {
      if (!squadId) {
        return [];
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('get_squad_members', {
        p_squad_id: squadId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function useSquadInvites(squadId: string | undefined, enabled: boolean) {
  return useQuery<SquadInviteSummary[]>({
    queryKey: squadInvitesQueryKey(squadId),
    enabled: Boolean(squadId) && enabled,
    queryFn: async () => {
      if (!squadId) {
        return [];
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('list_squad_invites', {
        p_squad_id: squadId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });
}

export function useCreateSquad(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (rawName: string) => {
      const check = validateSquadName(rawName);
      if (!check.valid) {
        throw new Error(check.error ?? 'Invalid squad name.');
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('create_squad', {
        p_name: check.trimmed,
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadsQueryKey(userId) });
    },
  });
}

export function useCreateInvite(squadId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<string, Error, number>({
    mutationFn: async (ttlHours = 72) => {
      if (!squadId) {
        throw new Error('No active squad selected.');
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('create_invite', {
        p_squad_id: squadId,
        p_ttl_hours: ttlHours,
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadInvitesQueryKey(squadId) });
    },
  });
}

export function useRedeemInvite(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<RedeemInviteResult, Error, string>({
    mutationFn: async (rawToken: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('redeem_invite', {
        p_raw_token: rawToken.trim(),
      });
      if (error) {
        throw new Error(error.message);
      }
      const first = data[0];
      if (!first) {
        throw new Error('No response returned from invite redemption.');
      }
      return first;
    },
    onSuccess: async (result) => {
      if (result.status === 'redeemed' || result.status === 'already_member') {
        await queryClient.invalidateQueries({ queryKey: squadsQueryKey(userId) });
        if (result.squad_id) {
          await queryClient.invalidateQueries({
            queryKey: squadMembersQueryKey(result.squad_id),
          });
        }
      }
    },
  });
}

export function useRevokeInvite(squadId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (inviteId: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { error } = await supabase.rpc('revoke_invite', {
        p_invite_id: inviteId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadInvitesQueryKey(squadId) });
    },
  });
}

export function useRemoveMember(squadId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (targetUserId: string) => {
      if (!squadId) {
        throw new Error('No active squad selected.');
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { error } = await supabase.rpc('remove_member', {
        p_squad_id: squadId,
        p_target_user_id: targetUserId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadMembersQueryKey(squadId) });
      await queryClient.invalidateQueries({ queryKey: squadsQueryKey(userId) });
    },
  });
}

export function useLeaveSquad(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (squadId: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { error } = await supabase.rpc('leave_squad', {
        p_squad_id: squadId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return undefined;
    },
    onSuccess: async (_data, squadId) => {
      queryClient.removeQueries({ queryKey: squadMembersQueryKey(squadId) });
      queryClient.removeQueries({ queryKey: squadInvitesQueryKey(squadId) });
      await queryClient.invalidateQueries({ queryKey: squadsQueryKey(userId) });
    },
  });
}

export function useTransferOwnership(squadId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (newOwnerUserId: string) => {
      if (!squadId) {
        throw new Error('No active squad selected.');
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { error } = await supabase.rpc('transfer_ownership', {
        p_squad_id: squadId,
        p_new_owner_user_id: newOwnerUserId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return undefined;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: squadMembersQueryKey(squadId) });
      await queryClient.invalidateQueries({ queryKey: squadsQueryKey(userId) });
    },
  });
}

export function useDeleteSquad(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<undefined, Error, string>({
    mutationFn: async (squadId: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { error } = await supabase.rpc('delete_squad', {
        p_squad_id: squadId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return undefined;
    },
    onSuccess: async (_data, squadId) => {
      queryClient.removeQueries({ queryKey: squadMembersQueryKey(squadId) });
      queryClient.removeQueries({ queryKey: squadInvitesQueryKey(squadId) });
      await queryClient.invalidateQueries({ queryKey: squadsQueryKey(userId) });
    },
  });
}
