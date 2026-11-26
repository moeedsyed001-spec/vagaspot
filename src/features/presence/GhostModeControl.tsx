import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/Button';
import { useSetGhostMode } from './usePresence';

interface GhostModeControlProps {
  squadId: string;
  userId: string | undefined;
  isGhost: boolean;
  compact?: boolean;
}

export function GhostModeControl({
  squadId,
  userId,
  isGhost,
  compact = false,
}: GhostModeControlProps) {
  const setGhostMode = useSetGhostMode(squadId, userId);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleToggle = async () => {
    setFeedback(null);
    const nextEnabled = !isGhost;
    try {
      await setGhostMode.mutateAsync(nextEnabled);
      setFeedback(
        nextEnabled
          ? 'Ghost Mode is on — your shared presence fields were cleared.'
          : 'Ghost Mode turned off — check in again when ready to share.',
      );
    } catch {
      // Server state remains authoritative; toggle stays reverted
    }
  };

  if (compact) {
    return (
      <div className="space-y-1.5">
        <Button
          variant={isGhost ? 'primary' : 'secondary'}
          role="switch"
          aria-checked={isGhost}
          disabled={setGhostMode.isPending}
          onClick={() => {
            void handleToggle();
          }}
        >
          {isGhost ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {setGhostMode.isPending
              ? 'Updating…'
              : isGhost
                ? 'Ghost Mode: ON'
                : 'Ghost Mode: OFF'}
          </span>
        </Button>

        {setGhostMode.error ? (
          <p role="alert" className="text-xs text-[var(--danger)]">
            Sharing state could not be changed: {setGhostMode.error.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            {isGhost ? 'Ghost Mode is on' : 'Ghost Mode is off'}
          </p>
          <p className="text-xs text-[var(--muted)]">
            {isGhost
              ? 'Peers (including owners) only see your name and "Presence hidden".'
              : 'Turning Ghost Mode on immediately clears your shared status, spot, and timestamps.'}
          </p>
        </div>

        <Button
          variant={isGhost ? 'primary' : 'secondary'}
          role="switch"
          aria-checked={isGhost}
          disabled={setGhostMode.isPending}
          onClick={() => {
            void handleToggle();
          }}
        >
          {isGhost ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {setGhostMode.isPending
              ? 'Updating…'
              : isGhost
                ? 'Turn Off Ghost Mode'
                : 'Enable Ghost Mode'}
          </span>
        </Button>
      </div>

      {setGhostMode.error ? (
        <p role="alert" className="text-xs text-[var(--danger)]">
          Sharing state could not be changed: {setGhostMode.error.message}
        </p>
      ) : null}

      {feedback && !setGhostMode.error ? (
        <p role="status" className="text-xs text-[var(--success)]">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
