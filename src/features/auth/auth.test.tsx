import type { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/routes';
import { ThemeProvider } from '../../hooks/useTheme';
import { AuthContext, type AuthContextValue } from './authContextValue';
import { validateDisplayName } from './useProfile';

function makeAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    session: null,
    user: null,
    isLoading: false,
    isConfigured: true,
    authError: null,
    signInWithGoogle: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn().mockResolvedValue(undefined),
    clearAuthError: vi.fn(),
    ...overrides,
  };
}

function renderWithAuth(path: string, authValue: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

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

describe('Phase 2 auth routes and profile validation', () => {
  it('redirects unauthenticated visitors from /squad to /auth', () => {
    renderWithAuth('/squad', makeAuthValue({ user: null }));
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
  });

  it('shows recoverable error message on /auth and invokes signInWithGoogle', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(
      '/auth?error=access_denied',
      makeAuthValue({ signInWithGoogle, isConfigured: true }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/cancelled/i);
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }));
    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    });
  });

  it('allows authenticated users to access protected routes and trigger signOut', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    const fakeUser = { id: 'user-1', email: 'friend@example.com' } as User;

    renderWithAuth('/settings', makeAuthValue({ user: fakeUser, signOut }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('friend@example.com')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Sign out/i }));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  it('validates display name length boundaries (1–50 chars)', () => {
    expect(validateDisplayName('   ').valid).toBe(false);
    expect(validateDisplayName('a'.repeat(51)).valid).toBe(false);
    expect(validateDisplayName('  Moeed  ')).toEqual({ valid: true, trimmed: 'Moeed' });
  });
});
