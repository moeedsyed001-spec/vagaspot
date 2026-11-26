import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { envConfig } from '../../lib/env';
import { useOnlineStatus } from './useSquadFeed';

export function ServiceStatusPage() {
  const isOnline = useOnlineStatus();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Connection &amp; Service Status</h1>
        <p className="text-xs text-[var(--muted)]">
          Network connectivity and free-tier backend status information.
        </p>
      </div>

      <Card className={`space-y-2 ${isOnline ? 'border-[var(--success)]' : 'border-[var(--warning)]'}`}>
        <p
          className={`text-sm font-semibold ${
            isOnline ? 'text-[var(--success)]' : 'text-[var(--warning)]'
          }`}
        >
          {isOnline ? 'Network online' : 'Connection offline'}
        </p>
        <p className="text-sm text-[var(--muted)]">
          {isOnline
            ? 'Your browser reports an active network connection. Presence updates still require an active Supabase session.'
            : 'Presence unavailable while offline. Last confirmed updates are never labeled as live.'}
        </p>
      </Card>

      <Card className="space-y-2 border-[var(--border)]">
        <p className="text-sm font-semibold">Free-tier backend pausing</p>
        <p className="text-sm text-[var(--muted)]">
          VAGASPOT runs on Supabase Free (PKR 0). After ~7 days of low activity, the backend may
          pause automatically until the squad owner restores it in the Supabase dashboard.
        </p>
        <p className="text-xs text-[var(--muted)]">
          Client environment:{' '}
          {envConfig.isConfigured ? 'Configured' : envConfig.issues.join(' ')}
        </p>
      </Card>

      <Link
        to="/squad"
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-fg)]"
      >
        Back to Squad Feed
      </Link>
    </div>
  );
}
