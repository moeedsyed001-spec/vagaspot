import type { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/routes';
import { ThemeProvider } from '../../hooks/useTheme';
import type { CampusZone, SquadFeedMember, SquadSummary } from '../../types/domain';
import { AuthContext, type AuthContextValue } from '../auth/authContextValue';
import { squadFeedQueryKey } from '../feed/useSquadFeed';
import { squadsQueryKey } from '../squads/useSquads';
import { campusZonesQueryKey } from './usePresence';

const SAMPLE_ZONES: CampusZone[] = [
  {
    id: 'library',
    name: 'Library',
    category: 'learning',
    display_order: 12,
    is_active: true,
    show_in_quick_list: true,
  },
  {
    id: 'staff-canteen',
    name: 'Staff Canteen',
    category: 'food',
    display_order: 8,
    is_active: true,
    show_in_quick_list: false,
  },
];

function renderPresenceAt(path: string, authConfigured = true) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  const squad: SquadSummary = {
    squad_id: 'sq-1',
    name: 'COMSATS Alpha',
    role: 'owner',
    joined_at: new Date().toISOString(),
    member_count: 1,
  };
  const selfFeed: SquadFeedMember[] = [
    {
      user_id: 'user-1',
      display_name: 'Moeed',
      avatar_url: null,
      role: 'owner',
      is_ghost: false,
      campus_state: 'unknown',
      campus_source: null,
      campus_observed_at: null,
      availability: null,
      availability_expires_at: null,
      zone_id: null,
      zone_name: null,
      note: null,
      last_updated_at: null,
    },
  ];

  queryClient.setQueryData(squadsQueryKey('user-1'), [squad]);
  queryClient.setQueryData(squadFeedQueryKey('sq-1'), selfFeed);
  queryClient.setQueryData(campusZonesQueryKey, SAMPLE_ZONES);

  const authValue: AuthContextValue = {
    session: null,
    user: { id: 'user-1', email: 'friend@example.com' } as User,
    isLoading: false,
    isConfigured: authConfigured,
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

describe('Phase 5 CheckInPage and ZonePickerPage', () => {
  it('renders separate controls and rejects >60 char notes cleanly', () => {
    renderPresenceAt('/check-in');

    expect(screen.getByRole('button', { name: 'On Campus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Off Campus' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Free' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Library' })).toBeInTheDocument();

    const noteInput = screen.getByPlaceholderText(/2nd floor near stairs/i);
    fireEvent.change(noteInput, { target: { value: 'a'.repeat(61) } });
    fireEvent.click(screen.getByRole('button', { name: /Save Spot/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/60 characters or fewer/i);
  });

  it('renders ZonePickerPage with quick locations first and More campus locations accordion', () => {
    renderPresenceAt('/check-in/zones');

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.queryByText('Staff Canteen')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /More campus locations/i }));
    expect(screen.getByText('Staff Canteen')).toBeInTheDocument();
  });
});
