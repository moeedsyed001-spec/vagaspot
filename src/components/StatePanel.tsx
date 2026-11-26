import { AlertTriangle, Inbox, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from './Card';

type StateKind = 'loading' | 'empty' | 'offline' | 'error';

interface StatePanelProps {
  kind: StateKind;
  title: string;
  description: string;
  action?: ReactNode;
}

export function StatePanel({ kind, title, description, action }: StatePanelProps) {
  if (kind === 'loading') {
    return (
      <Card className="space-y-3" aria-busy="true" aria-label={title}>
        <div className="h-5 w-40 rounded bg-[var(--surface-2)]" />
        <div className="h-4 w-full rounded bg-[var(--surface-2)]" />
        <div className="h-4 w-3/4 rounded bg-[var(--surface-2)]" />
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </Card>
    );
  }

  const Icon = kind === 'offline' ? WifiOff : kind === 'error' ? AlertTriangle : Inbox;
  const iconColor =
    kind === 'offline'
      ? 'text-[var(--warning)]'
      : kind === 'error'
        ? 'text-[var(--danger)]'
        : 'text-[var(--primary)]';

  return (
    <Card className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-2.5">
        <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
        <h2 className="text-base font-semibold text-[var(--text)]">{title}</h2>
      </div>
      <p className="text-sm text-[var(--muted)]">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </Card>
  );
}
