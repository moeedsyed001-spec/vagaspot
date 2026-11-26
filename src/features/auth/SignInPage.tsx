import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/BrandMark';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';

export function SignInPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <Card className="space-y-5">
        <div className="flex items-center gap-3">
          <BrandMark size={36} />
          <div>
            <h1 className="text-xl font-bold tracking-tight">VAGASPOT</h1>
            <p className="text-xs text-[var(--muted)]">Your people. Your campus. Your spot.</p>
          </div>
        </div>

        <p className="text-sm text-[var(--muted)]">
          See whether your invited squad is on campus, where they checked in, and whether they are
          free to meet.
        </p>

        <div className="flex items-start gap-2.5 rounded-[var(--radius-control)] bg-[var(--surface-2)] p-3 text-xs text-[var(--muted)]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" aria-hidden="true" />
          <span>
            Manual-first in MVP. Your location is not continuously tracked, and Ghost Mode hides
            your presence anytime.
          </span>
        </div>

        <div className="space-y-2.5">
          <Button className="w-full" disabled>
            Continue with Google (Phase 2)
          </Button>
          <p className="text-center text-xs text-[var(--muted)]">
            Google OAuth will be connected in Phase 2 after Supabase setup.
          </p>
        </div>

        <div className="flex flex-wrap justify-between gap-2 border-t border-[var(--border)] pt-3 text-xs">
          <Link to="/squad" className="font-medium text-[var(--primary)] underline-offset-2 hover:underline">
            Preview App Shell
          </Link>
          <Link to="/onboarding" className="font-medium text-[var(--primary)] underline-offset-2 hover:underline">
            Preview Squad Setup
          </Link>
        </div>
      </Card>
    </div>
  );
}
