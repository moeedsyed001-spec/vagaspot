import type { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/routes';
import { ThemeProvider } from '../../hooks/useTheme';
import { AuthContext, type AuthContextValue } from '../auth/authContextValue';
import { clearPendingInviteToken, readPendingInviteToken } from './pendingInvite';
import { squadsQueryKey } from './useSquads';

function renderWithAuth(path: string, user: User | null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  if (user) {
    queryClient.setQueryData(squadsQueryKey(user.id), []);
  }
  const authValue: AuthContextValue = {
    session: null,
    user,
    isLoading: false,
    isConfigured: true,
    authError: null,
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    clearAuthError: vi.fn(),
  };

  return render(
    <MemoryRouter initialEntries={[path]}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthContext.Provider value={authValue}>
            <AppRoutes />
          </AuthContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('Phase 3 pre-auth invite flow and squad validation', () => {
  beforeEach(() => {
    clearPendingInviteToken();
  });

  it('preserves invite token when unauthenticated user opens /join/:token and redirects to /auth', async () => {
    renderWithAuth('/join/test-128bit-token-value', null);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/accept your squad invitation/i)).toBeInTheDocument();
    expect(readPendingInviteToken()).toBe('test-128bit-token-value');
  });

  it('validates squad name length on CreateSquadPage before submitting', () => {
    const fakeUser = { id: 'user-1', email: 'friend@example.com' } as User;
    renderWithAuth('/squads/create', fakeUser);

    const input = screen.getByPlaceholderText(/COMSATS CS Friends/i);
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Squad/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 2 characters/i);
  });

  it('blocks non-owners from OwnerManagementPage when user has no owned squad', async () => {
    const fakeUser = { id: 'user-1', email: 'friend@example.com' } as User;
    renderWithAuth('/settings/manage', fakeUser);

    await waitFor(() => {
      expect(screen.getByText(/Owner access required/i)).toBeInTheDocument();
    });
  });
});
