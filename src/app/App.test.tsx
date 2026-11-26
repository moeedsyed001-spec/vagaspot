import type { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../features/auth/authContextValue';
import { ThemeProvider } from '../hooks/useTheme';
import { AppRoutes } from './routes';

function renderAuthenticatedAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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
  it('renders the three primary mobile tabs and Squad Feed placeholder for signed-in users', () => {
    renderAuthenticatedAt('/squad');

    expect(screen.getByRole('heading', { name: 'Squad Feed' })).toBeInTheDocument();
    const mobileNav = screen.getByRole('navigation', { name: 'Primary mobile navigation' });
    expect(mobileNav).toHaveTextContent('Squad');
    expect(mobileNav).toHaveTextContent('Check-in');
    expect(mobileNav).toHaveTextContent('Settings');
  });

  it('renders placeholder screens for Check-in, Settings, and Join routes when signed in', () => {
    const { unmount } = renderAuthenticatedAt('/check-in');
    expect(screen.getByRole('heading', { name: 'Manual Check-in' })).toBeInTheDocument();
    unmount();

    const settings = renderAuthenticatedAt('/settings');
    expect(settings.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    settings.unmount();

    const join = renderAuthenticatedAt('/join/sample-token');
    expect(join.getByRole('heading', { name: 'Join squad' })).toBeInTheDocument();
  });
});
