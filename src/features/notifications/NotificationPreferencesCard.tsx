import { Card } from '../../components/Card';

export function NotificationPreferencesCard() {
  return (
    <Card className="space-y-2">
      <h2 className="text-base font-semibold">Notifications</h2>
      <p className="text-sm text-[var(--muted)]">
        MVP uses the live in-app feed. Optional Android FCM push preferences will be added in
        Release 1.1.
      </p>
    </Card>
  );
}
