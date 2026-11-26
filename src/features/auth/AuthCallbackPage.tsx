import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from '../../components/BrandMark';
import { Card } from '../../components/Card';
import { StatePanel } from '../../components/StatePanel';
import { useAuth } from './authContextValue';
import { readOAuthErrorFromUrl } from './authRedirect';

export function AuthCallbackPage() {
  const { user, isLoading, authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const urlError = readOAuthErrorFromUrl(location.search, location.hash);
  const displayError = urlError ?? authError;

  useEffect(() => {
    if (!isLoading && user && !displayError) {
      void navigate('/squad', { replace: true });
    }
  }, [displayError, isLoading, navigate, user]);

  if (displayError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <StatePanel
          kind="error"
          title="Sign-in did not complete"
          description={displayError}
          action={
            <Link
              to="/auth"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-fg)]"
            >
              Back to Sign In
            </Link>
          }
        />
      </div>
    );
  }

  if (!isLoading && !user) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <StatePanel
          kind="error"
          title="No active sign-in session"
          description="The OAuth callback did not establish a session. Please sign in with Google again."
          action={
            <Link
              to="/auth"
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-fg)]"
            >
              Try Again
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <BrandMark size={32} />
          <div>
            <h1 className="text-lg font-bold">Completing sign-in…</h1>
            <p className="text-xs text-[var(--muted)]">Verifying your Google account with Supabase.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
