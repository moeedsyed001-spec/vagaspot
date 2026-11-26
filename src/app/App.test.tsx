import type { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../features/auth/authContextValue';
import { squadsQueryKey } from '../features/squads/useSquads';
import { ThemeProvider } from '../hooks/useTheme';
import { AppRoutes } from './routes';

function renderAuthenticatedAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(squadsQueryKey('user-1'), []);
  queryClient.setQueryData(['profile', 'user-1'], null);
  const authValue: AuthContextValue = {
    session: null,
    user: { id: 'user-1', email: 'friend@example.com' } as User,
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

describe('VAGASPOT app shell and routes', () => {
  it('renders the three primary mobile tabs and Squad Feed for signed-in users', async () => {
    renderAuthenticatedAt('/squad');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Squad Feed' })).toBeInTheDocument();
    });
    const mobileNav = screen.getByRole('navigation', { name: 'Primary mobile navigation' });
    expect(mobileNav).toHaveTextContent('Squad');
    expect(mobileNav).toHaveTextContent('Check-in');
    expect(mobileNav).toHaveTextContent('Settings');
  });

  it('renders Check-in, Settings, and Join routes when signed in', async () => {
    const checkIn = renderAuthenticatedAt('/check-in');
    expect(checkIn.getByRole('heading', { name: 'Manual Check-in' })).toBeInTheDocument();
    checkIn.unmount();

    const settings = renderAuthenticatedAt('/settings');
    expect(settings.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    settings.unmount();

    const join = renderAuthenticatedAt('/join/sample-token');
    await waitFor(() => {
      expect(join.getByRole('heading', { name: 'Join squad' })).toBeInTheDocument();
    });
  });
});
