import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { envConfig } from '../../lib/env';
import { getSupabaseClient } from '../../lib/supabase';
import { clearPendingInviteToken } from '../squads/pendingInvite';
import { AuthContext } from './authContextValue';
import { getWebOAuthCallbackUrl } from './authRedirect';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => getSupabaseClient() !== null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    let mounted = true;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) {
          return;
        }
        if (error) {
          setAuthError(error.message);
        }
        setSession(data.session ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setAuthError('Unable to restore your session right now.');
        setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) {
        return;
      }
      setSession(nextSession ?? null);
      if (event === 'SIGNED_OUT') {
        clearPendingInviteToken();
        queryClient.clear();
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [queryClient]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthError('Supabase environment variables are not configured yet.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getWebOAuthCallbackUrl(),
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setAuthError(error.message);
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    clearPendingInviteToken();
    const supabase = getSupabaseClient();
    if (!supabase) {
      setSession(null);
      queryClient.clear();
      return;
    }

    const { error } = await supabase.auth.signOut();
    queryClient.clear();
    setSession(null);
    if (error) {
      setAuthError(error.message);
    }
  }, [queryClient]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        isConfigured: envConfig.isConfigured,
        authError,
        signInWithGoogle,
        signOut,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
