import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../../lib/supabase';
import type { SquadFeedMember } from '../../types/domain';
import { squadMembersQueryKey, squadsQueryKey } from '../squads/useSquads';

export type RealtimeConnectionStatus = 'live' | 'connecting' | 'disconnected';

const POLL_FALLBACK_INTERVAL_MS = 60_000;

export function squadFeedQueryKey(squadId: string | undefined) {
  return ['squad-feed', squadId ?? 'none'] as const;
}

export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  );

  useEffect(() => {
    const handleVisibility = () => {
      setIsVisible(document.visibilityState !== 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return isVisible;
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
    };
    const goOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

export function useSquadFeed(squadId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  const isVisible = usePageVisibility();
  const isOnline = useOnlineStatus();

  const query = useQuery<SquadFeedMember[]>({
    queryKey: squadFeedQueryKey(squadId),
    enabled: Boolean(squadId) && isOnline,
    refetchInterval: squadId && isVisible && isOnline ? POLL_FALLBACK_INTERVAL_MS : false,
    refetchOnReconnect: true,
    queryFn: async () => {
      if (!squadId) {
        return [];
      }
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }
      const { data, error } = await supabase.rpc('get_squad_feed', {
        p_squad_id: squadId,
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

  // Refetch authoritative feed when returning to foreground or coming back online
  useEffect(() => {
    if (squadId && isVisible && isOnline) {
      void queryClient.invalidateQueries({ queryKey: squadFeedQueryKey(squadId) });
    }
  }, [isOnline, isVisible, queryClient, squadId]);

  const realtimeStatus = useSquadRealtime(squadId, userId, isVisible && isOnline);

  return {
    ...query,
    isVisible,
    isOnline,
    realtimeStatus,
  };
}

export function useSquadRealtime(
  squadId: string | undefined,
  userId: string | undefined,
  enabled: boolean,
): RealtimeConnectionStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeConnectionStatus>('connecting');
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!squadId || !enabled || !supabase) {
      return;
    }

    const channel = supabase
      .channel(`squad-feed-signal:${squadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'squad_feed_signals',
          filter: `squad_id=eq.${squadId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: squadFeedQueryKey(squadId) });
          void queryClient.invalidateQueries({ queryKey: squadMembersQueryKey(squadId) });
          if (userId) {
            void queryClient.invalidateQueries({ queryKey: squadsQueryKey(userId) });
          }
        },
      )
      .subscribe((subscriptionState) => {
        switch (subscriptionState) {
          case REALTIME_SUBSCRIBE_STATES.SUBSCRIBED:
            setStatus('live');
            break;
          case REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR:
          case REALTIME_SUBSCRIBE_STATES.TIMED_OUT:
          case REALTIME_SUBSCRIBE_STATES.CLOSED:
            setStatus('disconnected');
            break;
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, squadId, supabase, userId]);

  if (!squadId || !enabled || !supabase) {
    return 'disconnected';
  }
  return status;
}
