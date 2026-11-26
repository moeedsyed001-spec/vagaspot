import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppProviders } from './providers';
import { AppRoutes } from './routes';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('VAGASPOT Phase 1 app shell and routes', () => {
  it('renders the three primary mobile tabs and Squad Feed placeholder', () => {
    renderAt('/squad');

    expect(screen.getByRole('heading', { name: 'Squad Feed' })).toBeInTheDocument();
    const mobileNav = screen.getByRole('navigation', { name: 'Primary mobile navigation' });
    expect(mobileNav).toHaveTextContent('Squad');
    expect(mobileNav).toHaveTextContent('Check-in');
    expect(mobileNav).toHaveTextContent('Settings');
  });

  it('renders placeholder screens for Check-in, Settings, Auth, and Join routes', () => {
    const { unmount } = renderAt('/check-in');
    expect(screen.getByRole('heading', { name: 'Manual Check-in' })).toBeInTheDocument();
    unmount();

    const settings = renderAt('/settings');
    expect(settings.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    settings.unmount();

    const auth = renderAt('/auth');
    expect(auth.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    auth.unmount();

    const join = renderAt('/join/sample-token');
    expect(join.getByRole('heading', { name: 'Join squad' })).toBeInTheDocument();
  });
});
