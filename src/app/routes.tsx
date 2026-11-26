import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage';
import { ProtectedRoute, PublicOnlyRoute } from '../features/auth/ProtectedRoute';
import { SignInPage } from '../features/auth/SignInPage';
import { ServiceStatusPage } from '../features/feed/ServiceStatusPage';
import { SquadFeedPage } from '../features/feed/SquadFeedPage';
import { CheckInPage } from '../features/presence/CheckInPage';
import { ZonePickerPage } from '../features/presence/ZonePickerPage';
import { OwnerManagementPage } from '../features/settings/OwnerManagementPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { CreateSquadPage } from '../features/squads/CreateSquadPage';
import { JoinSquadPage } from '../features/squads/JoinSquadPage';
import { SquadOnboardingPage } from '../features/squads/SquadOnboardingPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/squad" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/auth" element={<SignInPage />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/status" element={<ServiceStatusPage />} />
      <Route path="/join" element={<JoinSquadPage />} />
      <Route path="/join/:token" element={<JoinSquadPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<SquadOnboardingPage />} />
        <Route path="/squads/create" element={<CreateSquadPage />} />

        <Route element={<AppShell />}>
          <Route path="/squad" element={<SquadFeedPage />} />
          <Route path="/check-in" element={<CheckInPage />} />
          <Route path="/check-in/zones" element={<ZonePickerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/manage" element={<OwnerManagementPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/squad" replace />} />
    </Routes>
  );
}
