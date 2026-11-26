import type { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/routes';
import { ThemeProvider } from '../../hooks/useTheme';
import type { SquadFeedMember, SquadSummary } from '../../types/domain';
import { AuthContext, type AuthContextValue } from '../auth/authContextValue';
import { squadsQueryKey } from '../squads/useSquads';
import { MemberFeedCard } from './MemberFeedCard';
import { squadFeedQueryKey } from './useSquadFeed';

function renderFeedWithFixtures(squad: SquadSummary, feed: SquadFeedMember[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  queryClient.setQueryData(squadsQueryKey('user-1'), [squad]);
  queryClient.setQueryData(squadFeedQueryKey(squad.squad_id), feed);

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
    <MemoryRouter initialEntries={['/squad']}>
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

describe('Phase 4 MemberFeedCard and SquadFeedPage', () => {
  it('renders Ghost Mode card with name and Presence hidden ONLY', () => {
    const ghostMember: SquadFeedMember = {
      user_id: 'user-2',
      display_name: 'Bilal',
      avatar_url: null,
      role: 'member',
      is_ghost: true,
      campus_state: null,
      campus_source: null,
      campus_observed_at: null,
      availability: null,
      availability_expires_at: null,
      zone_id: null,
      zone_name: null,
      note: null,
      last_updated_at: null,
    };

    render(<MemberFeedCard member={ghostMember} isSelf={false} />);

    expect(screen.getByText('Bilal')).toBeInTheDocument();
    expect(screen.getByText('Presence hidden')).toBeInTheDocument();
    expect(screen.queryByText(/On Campus|Off Campus|Unknown|Last updated|Manual/i)).not.toBeInTheDocument();
  });

  it('renders active campus state, availability, zone, note, and accessible timestamp toggle', () => {
    const activeMember: SquadFeedMember = {
      user_id: 'user-2',
      display_name: 'Ayesha',
      avatar_url: null,
      role: 'owner',
      is_ghost: false,
      campus_state: 'on_campus',
      campus_source: 'manual',
      campus_observed_at: new Date(Date.now() - 8 * 60_000).toISOString(),
      availability: 'free',
      availability_expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
      zone_id: 'library',
      zone_name: 'Library',
      note: '2nd floor quiet table',
      last_updated_at: new Date(Date.now() - 8 * 60_000).toISOString(),
    };

    render(<MemberFeedCard member={activeMember} isSelf={false} />);

    expect(screen.getByText('Ayesha')).toBeInTheDocument();
    expect(screen.getByText('On Campus')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('2nd floor quiet table')).toBeInTheDocument();
    expect(screen.getByText('Manual check-in')).toBeInTheDocument();

    const timeButton = screen.getByRole('button', { name: /Last updated 8 min ago/i });
    fireEvent.click(timeButton);
    expect(timeButton.textContent).not.toContain('Last updated');
  });

  it('renders SquadFeedPage with active squad, live sync header, and Ghost + active peer cards', () => {
    const squad: SquadSummary = {
      squad_id: 'sq-1',
      name: 'COMSATS Alpha',
      role: 'owner',
      joined_at: new Date().toISOString(),
      member_count: 2,
    };

    const feed: SquadFeedMember[] = [
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
      {
        user_id: 'user-2',
        display_name: 'Zain',
        avatar_url: null,
        role: 'member',
        is_ghost: true,
        campus_state: null,
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

    renderFeedWithFixtures(squad, feed);

    expect(screen.getByRole('heading', { name: 'COMSATS Alpha' })).toBeInTheDocument();
    expect(screen.getByText(/Moeed \(You\)/)).toBeInTheDocument();
    expect(screen.getByText('Zain')).toBeInTheDocument();
    expect(screen.getByText('Presence hidden')).toBeInTheDocument();
  });
});
