/**
 * Real-time notification model.
 *
 * A single in-app notification produced by the live event bridge (geo-fence
 * breaches, SOS activity, tracking state, safety-score changes). These feed the
 * notification centre and the transient in-app banner ("push"-style).
 */

/** Visual + priority tier. `critical` also vibrates the device. */
export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

/** Which subsystem emitted the event — used for grouping/icons. */
export type NotificationSource = 'geofence' | 'sos' | 'tracking' | 'safety' | 'system';

export type AppNotification = {
  id: string;
  timestamp: number;
  source: NotificationSource;
  severity: NotificationSeverity;
  title: string;
  body: string;
  read: boolean;
  /** When true, the event is recorded to the feed but shows no banner. */
  silent?: boolean;
};

/** Fields the producer supplies; the store fills in id/timestamp/read. */
export type NotificationInput = Omit<AppNotification, 'id' | 'timestamp' | 'read'>;
