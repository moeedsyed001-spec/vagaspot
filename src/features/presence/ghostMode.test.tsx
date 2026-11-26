import type { User } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { squadFeedQueryKey } from '../feed/useSquadFeed';
import { GhostModeControl } from './GhostModeControl';

const mockRpc = vi.fn();

vi.mock('../../lib/supabase', () => ({
  getSupabaseClient: () => ({
    rpc: mockRpc,
  }),
}));

describe('Phase 6 GhostModeControl', () => {
  it('confirms toggle only after server RPC succeeds and scrubs client feed cache', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    queryClient.setQueryData(squadFeedQueryKey('sq-1'), [
      {
        user_id: 'user-1',
        display_name: 'Moeed',
        avatar_url: null,
        role: 'owner',
        is_ghost: false,
        campus_state: 'on_campus',
        campus_source: 'manual',
        campus_observed_at: new Date().toISOString(),
        availability: 'free',
        availability_expires_at: new Date().toISOString(),
        zone_id: 'library',
        zone_name: 'Library',
        note: 'Quiet area',
        last_updated_at: new Date().toISOString(),
      },
    ]);

    const fakeUser = { id: 'user-1' } as User;

    render(
      <QueryClientProvider client={queryClient}>
        <GhostModeControl squadId="sq-1" userId={fakeUser.id} isGhost={false} />
      </QueryClientProvider>,
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('set_ghost_mode', {
        p_squad_id: 'sq-1',
        p_enabled: true,
      });
    });

    await waitFor(() => {
      const updated = queryClient.getQueryData<Array<{ is_ghost: boolean; zone_id: string | null; campus_state: string | null }>>(
        squadFeedQueryKey('sq-1'),
      );
      expect(updated?.[0]?.is_ghost).toBe(true);
      expect(updated?.[0]?.campus_state).toBeNull();
      expect(updated?.[0]?.zone_id).toBeNull();
    });
  });

  it('reverts toggle and displays error alert if server RPC fails', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Network unavailable' },
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GhostModeControl squadId="sq-1" userId="user-1" isGhost={false} />
      </QueryClientProvider>,
    );

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Sharing state could not be changed/i);
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
