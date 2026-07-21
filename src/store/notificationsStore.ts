/**
 * Notifications store — the app's real-time event feed.
 *
 * Every subsystem (geo-fence, SOS, tracking, safety) reports meaningful events
 * here via `push()`. The notification centre renders `items`, the TopBar bell
 * renders `unreadCount`, and a transient banner watches `latest` to animate an
 * in-app "push". Kept intentionally small and serialisable so it can later be
 * hydrated from / synced to a backend or FCM payload with no shape changes.
 */
import { create } from './createStore';
import type { AppNotification, NotificationInput } from '../features/notifications/types';

// Cap the feed so long sessions don't grow unbounded.
const MAX_ITEMS = 100;

type NotificationsState = {
  items: AppNotification[];
  /** Most recently pushed non-silent notification (drives the banner). */
  latest: AppNotification | null;

  push: (input: NotificationInput) => AppNotification;
  markAllRead: () => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  clearLatest: () => void;
  clearAll: () => void;
};

const randomId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  items: [],
  latest: null,

  push(input) {
    const notification: AppNotification = {
      ...input,
      id: randomId(),
      timestamp: Date.now(),
      read: false,
    };
    set((s) => ({
      items: [notification, ...s.items].slice(0, MAX_ITEMS),
      latest: input.silent ? s.latest : notification,
    }));
    return notification;
  },

  markAllRead() {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) }));
  },

  markRead(id) {
    set((s) => ({ items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  },

  dismiss(id) {
    set((s) => ({ items: s.items.filter((n) => n.id !== id) }));
  },

  clearLatest() {
    set({ latest: null });
  },

  clearAll() {
    set({ items: [], latest: null });
  },
}));

/** Convenience selector: number of unread notifications. */
export const selectUnreadCount = (s: NotificationsState): number =>
  s.items.reduce((count, n) => (n.read ? count : count + 1), 0);

/** Imperative helper so non-React producers (stores) can push without a hook. */
export const notify = (input: NotificationInput): AppNotification =>
  useNotificationsStore.getState().push(input);
