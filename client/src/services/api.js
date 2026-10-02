import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const authApi = {
  verify: (accessCode, selectedUser) => api.post('/auth/verify', { accessCode, selectedUser }),
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data)
};

export const dashboardApi = {
  getStats: () => api.get('/stats')
};

export const semesterApi = {
  getAll: () => api.get('/semesters'),
  create: (data) => api.post('/semesters', data),
  update: (id, data) => api.put(`/semesters/${id}`, data),
  delete: (id) => api.delete(`/semesters/${id}`)
};

export const subjectApi = {
  getAll: (semesterId) => api.get('/subjects', { params: { semesterId } }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`)
};

export const fileApi = {
  getAll: (params) => api.get('/files', { params }),
  upload: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/files/${id}`)
};

export const assignmentApi = {
  getAll: (params) => api.get('/assignments', { params }),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  toggleComplete: (id, user) => api.post(`/assignments/${id}/toggle-complete`, { user })
};

export const announcementApi = {
  getAll: () => api.get('/announcements'),
  create: (data) => api.post('/announcements', data),
  togglePin: (id) => api.put(`/announcements/${id}/pin`),
  delete: (id) => api.delete(`/announcements/${id}`)
};

export const searchApi = {
  globalSearch: (q) => api.get('/search', { params: { q } })
};

export const timetableApi = {
  getTimetable: () => api.get('/timetable')
};

export default api;
