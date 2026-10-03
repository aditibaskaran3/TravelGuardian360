import { t } from '../i18n';
export const ADMIN_ROUTES = [
  { name: 'AdminDashboard', path: 'admin', title: t('Dashboard'), icon: 'grid' },
  { name: 'AdminUsers', path: 'admin/users', title: t('Users'), icon: 'users' },
  { name: 'AdminTourists', path: 'admin/tourists', title: t('Tourists'), icon: 'user-check' },
  { name: 'AdminTrips', path: 'admin/trips', title: t('Trips'), icon: 'briefcase' },
  { name: 'AdminLocations', path: 'admin/locations', title: t('Live Locations'), icon: 'map-pin' },
  { name: 'AdminSOS', path: 'admin/sos', title: t('SOS & Emergencies'), icon: 'alert-triangle' },
  { name: 'AdminZones', path: 'admin/safety-zones', title: t('Safety Zones'), icon: 'shield' },
  { name: 'AdminNotifications', path: 'admin/notifications', title: t('Notifications'), icon: 'bell' },
  { name: 'AdminSettings', path: 'admin/settings', title: t('Settings'), icon: 'settings' },
];

export const ADMIN_LOGIN_ROUTE = { name: 'AdminLogin', path: 'admin/login' };
