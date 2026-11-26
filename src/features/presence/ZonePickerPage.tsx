import { ArrowLeft, ChevronDown, ChevronRight, MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import { useCampusZones } from './usePresence';

export function ZonePickerPage() {
  const navigate = useNavigate();
  const zonesQuery = useCampusZones(true);
  const [search, setSearch] = useState('');
  const [showMore, setShowMore] = useState(false);

  const normalized = search.trim().toLowerCase();
  const allZones = zonesQuery.data ?? [];
  const filtered = normalized
    ? allZones.filter(
        (z) =>
          z.name.toLowerCase().includes(normalized) ||
          z.category.toLowerCase().includes(normalized),
      )
    : allZones;

  const quickZones = filtered.filter((z) => z.show_in_quick_list);
  const secondaryZones = filtered.filter((z) => !z.show_in_quick_list);

  const selectZone = (zoneId: string) => {
    void navigate(`/check-in?zone=${encodeURIComponent(zoneId)}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          to="/check-in"
          aria-label="Back to Check-in"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Zone Picker</h1>
          <p className="text-xs text-[var(--muted)]">
            COMSATS Islamabad spots. Manual selection does not imply GPS verification.
          </p>
        </div>
      </div>

      <label className="relative block">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          placeholder="Search campus zones…"
          aria-label="Search campus zones"
          className="min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] py-2 pr-3 pl-9 text-sm text-[var(--text)]"
        />
      </label>

      {zonesQuery.isLoading ? (
        <StatePanel
          kind="loading"
          title="Loading campus zones"
          description="Fetching active COMSATS locations."
        />
      ) : zonesQuery.error ? (
        <StatePanel
          kind="error"
          title="Could not load campus zones"
          description={zonesQuery.error.message}
        />
      ) : filtered.length === 0 ? (
        <StatePanel
          kind="empty"
          title="No matching campus zones"
          description="Try another search term or go back to enter a short note instead."
        />
      ) : (
        <div className="space-y-4">
          {quickZones.length > 0 ? (
            <Card className="space-y-2.5">
              <h2 className="text-sm font-semibold">Quick campus locations</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {quickZones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      selectZone(zone.id);
                    }}
                    className="flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-medium text-[var(--text)] hover:border-[var(--primary)]"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[var(--primary)]" aria-hidden="true" />
                      <span>{zone.name}</span>
                    </span>
                    <span className="text-xs capitalize text-[var(--muted)]">{zone.category}</span>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          {secondaryZones.length > 0 ? (
            <Card className="space-y-2.5">
              <button
                type="button"
                aria-expanded={showMore || normalized.length > 0}
                onClick={() => {
                  setShowMore((prev) => !prev);
                }}
                className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-[var(--text)]"
              >
                <span>More campus locations ({secondaryZones.length})</span>
                {showMore || normalized.length > 0 ? (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              {showMore || normalized.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {secondaryZones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => {
                        selectZone(zone.id);
                      }}
                      className="flex min-h-11 items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-medium text-[var(--text)] hover:border-[var(--primary)]"
                    >
                      <span>{zone.name}</span>
                      <span className="text-xs capitalize text-[var(--muted)]">
                        {zone.category}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}
