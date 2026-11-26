import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { StatePanel } from '../../components/StatePanel';
import { readPendingInviteToken } from '../squads/pendingInvite';
import { useAuth } from './authContextValue';
import { sanitizeReturnPath } from './authRedirect';

interface LocationStateWithFrom {
  from?: { pathname?: string; search?: string };
}

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
        <StatePanel
          kind="loading"
          title="Checking your session"
          description="Restoring your VAGASPOT sign-in status."
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-8">
        <StatePanel
          kind="loading"
          title="Checking your session"
          description="Restoring your VAGASPOT sign-in status."
        />
      </div>
    );
  }

  if (user) {
    if (readPendingInviteToken()) {
      return <Navigate to="/join" replace />;
    }
    const state = location.state as LocationStateWithFrom | null;
    const target = sanitizeReturnPath(
      state?.from ? `${state.from.pathname ?? ''}${state.from.search ?? ''}` : undefined,
      '/squad',
    );
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
