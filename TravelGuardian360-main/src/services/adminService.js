import { api } from './api';

const opts = (params) => ({ role: 'admin', params });

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard', opts()),

  users: (params) => api.get('/admin/users', opts(params)),
  user: (id) => api.get(`/admin/users/${id}`, opts()),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data, opts()),
  deleteUser: (id) => api.del(`/admin/users/${id}`, opts()),
  emergencyMedical: (id) => api.get(`/admin/users/${id}/emergency-medical`, opts()),

  tourists: (params) => api.get('/admin/tourists', opts(params)),
  verifyRequested: (userIds) => api.post('/admin/tourists/verify-requested', userIds ? { user_ids: userIds } : {}, opts()),
  setVerification: (id, verified) => api.put(`/admin/tourists/${id}/verification`, { verified }, opts()),

  trips: (params) => api.get('/admin/trips', opts(params)),
  locations: (params) => api.get('/admin/locations', opts(params)),

  sosList: (params) => api.get('/admin/sos', opts(params)),
  sos: (id) => api.get(`/admin/sos/${id}`, opts()),
  updateSos: (id, data) => api.put(`/admin/sos/${id}`, data, opts()),

  zones: () => api.get('/admin/safety-zones', opts()),
  createZone: (data) => api.post('/admin/safety-zones', data, opts()),
  updateZone: (id, data) => api.put(`/admin/safety-zones/${id}`, data, opts()),
  deleteZone: (id) => api.del(`/admin/safety-zones/${id}`, opts()),

  notifications: () => api.get('/admin/notifications', opts()),
  createNotification: (data) => api.post('/admin/notifications', data, opts()),
  updateNotification: (id, data) => api.put(`/admin/notifications/${id}`, data, opts()),
  deleteNotification: (id) => api.del(`/admin/notifications/${id}`, opts()),

  auditLogs: () => api.get('/admin/audit-logs', opts()),
  changePassword: (data) => api.put('/admin/password', data, opts()),
};
