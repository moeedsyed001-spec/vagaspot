import { AlertCircle, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BrandMark } from '../../components/BrandMark';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from './authContextValue';
import { readOAuthErrorFromUrl } from './authRedirect';

export function SignInPage() {
  const { isConfigured, authError, signInWithGoogle, clearAuthError } = useAuth();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const urlError = readOAuthErrorFromUrl(location.search, location.hash);
  const displayError = authError ?? urlError;

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

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

        {displayError ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[var(--radius-control)] border border-[var(--danger)] bg-[var(--surface-2)] p-3 text-xs text-[var(--danger)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="flex-1 space-y-1">
              <p className="font-medium">{displayError}</p>
              {authError ? (
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="underline underline-offset-2"
                >
                  Dismiss
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isConfigured ? (
          <div
            role="status"
            className="rounded-[var(--radius-control)] border border-[var(--warning)] bg-[var(--surface-2)] p-3 text-xs text-[var(--warning)]"
          >
            Supabase environment variables are missing or placeholders. Add `VITE_SUPABASE_URL`
            and `VITE_SUPABASE_ANON_KEY` in `.env.local` to enable Google sign-in.
          </div>
        ) : null}

        <div className="space-y-2.5">
          <Button
            className="w-full"
            disabled={!isConfigured || submitting}
            onClick={() => {
              void handleGoogleSignIn();
            }}
          >
            {submitting ? 'Redirecting to Google…' : 'Continue with Google'}
          </Button>
          <p className="text-center text-xs text-[var(--muted)]">
            Sign in with your invited Google account. No password required.
          </p>
        </div>
      </Card>
    </div>
  );
}
