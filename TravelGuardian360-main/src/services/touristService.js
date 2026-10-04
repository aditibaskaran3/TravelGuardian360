import { api } from './api';

export const tripsApi = {
  list: (status) => api.get('/trips', { params: { status } }),
  active: () => api.get('/trips/active'),
  create: (data) => api.post('/trips', data),
  update: (id, data) => api.put(`/trips/${id}`, data),
  remove: (id) => api.del(`/trips/${id}`),
  start: (id) => api.post(`/trips/${id}/start`),
  end: (id) => api.post(`/trips/${id}/end`),
};

export const locationsApi = {
  record: (data) => api.post('/locations', data),
  latest: () => api.get('/locations/latest'),
  history: (limit = 10) => api.get('/locations/history', { params: { limit } }),
  stop: () => api.post('/locations/tracking/stop'),
  geocode: (latitude, longitude) => api.get('/locations/geocode', { params: { lat: latitude, lon: longitude } }),
};

export const contactsApi = {
  list: () => api.get('/emergency-contacts'),
  create: (data) => api.post('/emergency-contacts', data),
  update: (id, data) => api.put(`/emergency-contacts/${id}`, data),
  remove: (id) => api.del(`/emergency-contacts/${id}`),
};

export const familyApi = {
  list: () => api.get('/family'),
  create: (data) => api.post('/family', data),
  update: (id, data) => api.put(`/family/${id}`, data),
  remove: (id) => api.del(`/family/${id}`),
};

function documentFormData({ family_member_id, document_name, document_number, file, removeFile }) {
  const form = new FormData();
  if (family_member_id !== null && family_member_id !== undefined) form.append('family_member_id', String(family_member_id));
  form.append('document_name', document_name || '');
  form.append('document_number', document_number || '');
  if (file) form.append('file', file);
  if (removeFile) form.append('remove_file', 'true');
  return form;
}

export const documentsApi = {
  list: () => api.get('/documents'),
  create: (data) => api.post('/documents', documentFormData(data)),
  update: (id, data) => api.put(`/documents/${id}`, documentFormData(data)),
  remove: (id) => api.del(`/documents/${id}`),
  fetchFile: (id) => api.getBlob(`/documents/${id}/file`),
};

export const medicalApi = {
  get: () => api.get('/medical'),
  save: (data) => api.put('/medical', data),
};

export const sosApi = {
  raise: (data) => api.post('/sos', data),
  current: () => api.get('/sos/current'),
  history: () => api.get('/sos'),
  cancel: (id) => api.put(`/sos/${id}/cancel`),
};

export const zonesApi = {
  list: () => api.get('/safety-zones'),
  status: (latitude, longitude) => api.get('/safety-zones/status', { params: { lat: latitude, lon: longitude } }),
};

export const notificationsApi = {
  list: (limit = 50) => api.get('/notifications', { params: { limit } }),
  unread: () => api.get('/notifications/unread-count'),
  read: (id) => api.put(`/notifications/${id}/read`),
  readAll: () => api.put('/notifications/read-all'),
};

export const touristIdApi = {
  get: () => api.get('/tourist-id/me'),
  update: (data) => api.put('/tourist-id/me', data),
  requestVerification: () => api.post('/tourist-id/me/verification-request'),
};

export const profileApi = {
  get: () => api.get('/users/me'),
  update: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  settings: () => api.get('/users/me/settings'),
  saveSettings: (data) => api.put('/users/me/settings', data),
};

export const travelInfoApi = {
  list: (category) => api.get('/travel-info', { params: { category } }),
};
