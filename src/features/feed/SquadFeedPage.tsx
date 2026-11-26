import { EyeOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import { envConfig } from '../../lib/env';

export function SquadFeedPage() {
  const [previewLoading, setPreviewLoading] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Squad Feed</h1>
          <p className="text-xs text-[var(--muted)] tabular-nums">
            Backend not wired yet — Phase 1 UI scaffold
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setPreviewLoading((prev) => !prev);
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>{previewLoading ? 'Show Empty' : 'Preview Skeleton'}</span>
          </Button>
          <Link
            to="/check-in"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-fg)]"
          >
            Update Spot
          </Link>
        </div>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Your presence summary</p>
          <p className="text-xs text-[var(--muted)]">
            Campus: Unknown · Availability: Unset · Ghost Mode: Ready in Phase 6
          </p>
        </div>
        <Link
          to="/settings"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text)]"
        >
          <EyeOff className="h-4 w-4" aria-hidden="true" />
          <span>Ghost Mode</span>
        </Link>
      </Card>

      {previewLoading ? (
        <StatePanel
          kind="loading"
          title="Loading squad presence"
          description="Skeleton placeholder shown while the live squad feed query is loading."
        />
      ) : (
        <StatePanel
          kind="empty"
          title="No squad members loaded"
          description={
            envConfig.isConfigured
              ? 'Authentication and live feed RPCs will populate real squad cards starting in Phases 2–4.'
              : 'Environment variables are not configured yet. No fake friend presence is displayed.'
          }
          action={
            <div className="flex flex-wrap gap-2">
              <Link
                to="/onboarding"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-3.5 py-2 text-sm font-semibold text-[var(--text)]"
              >
                Create / Join Screen
              </Link>
              <Link
                to="/status"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] px-3.5 py-2 text-sm font-semibold text-[var(--text)]"
              >
                Offline / Error States
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}
