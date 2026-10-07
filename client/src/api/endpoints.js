import api from './axios';

export const AuthAPI = {
  config: () => api.get('/auth/config'),
  checkEmail: (email) => api.post('/auth/check-email', { email }),
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

export const ClubAPI = {
  getAll: () => api.get('/clubs'),
  getOne: (id) => api.get(`/clubs/${id}`),
  create: (data) => api.post('/clubs', data),
  update: (id, data) => api.put(`/clubs/${id}`, data),
  disband: (id) => api.delete(`/clubs/${id}`),
  assignPresident: (id, data) => api.put(`/clubs/${id}/president`, data),
  addCoordinator: (id, data) => api.post(`/clubs/${id}/coordinators`, data),
  removeCoordinator: (id, userId) => api.delete(`/clubs/${id}/coordinators/${userId}`),
  getMembers: (id) => api.get(`/clubs/${id}/members`),
  getTeam: (id) => api.get(`/clubs/${id}/team`),
  lookupTeamUser: (id, email) => api.get(`/clubs/${id}/team/lookup`, { params: { email } }),
  addTeamMember: (id, data) => api.post(`/clubs/${id}/team`, data),
  updateTeamMember: (id, memberId, data) => api.put(`/clubs/${id}/team/${memberId}`, data),
  removeTeamMember: (id, memberId) => api.delete(`/clubs/${id}/team/${memberId}`),
  removeMember: (id, userId) => api.delete(`/clubs/${id}/members/${userId}`),
  requestToJoin: (id, data) => api.post(`/clubs/${id}/join`, data),
  getJoinRequests: (id) => api.get(`/clubs/${id}/join-requests`),
  decideJoinRequest: (requestId, decision) => api.put(`/clubs/join-requests/${requestId}`, { decision }),
  myStatus: () => api.get('/clubs/my/status'),
};

export const EventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  remove: (id) => api.delete(`/events/${id}`),
  participate: (id) => api.post(`/events/${id}/participate`),
  myParticipations: () => api.get('/events/my/participations'),
  tracking: (id) => api.get(`/events/${id}/tracking`),
};

export const NotificationAPI = {
  getAll: () => api.get('/notifications'),
  create: (data) => api.post('/notifications', data),
  remove: (id) => api.delete(`/notifications/${id}`),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const GalleryAPI = {
  getAll: (params) => api.get('/gallery', { params }),
  add: (data) => api.post('/gallery', data),
  remove: (id) => api.delete(`/gallery/${id}`),
};

export const AttendanceAPI = {
  mark: (data) => api.post('/attendance', data),
  markBulk: (data) => api.post('/attendance/bulk', data),
  forEvent: (eventId) => api.get(`/attendance/event/${eventId}`),
};

export const ExportAPI = {
  attendanceCsvUrl: (eventId) => `/export/attendance/${eventId}`,
  participationCsvUrl: (eventId) => `/export/participation/${eventId}`,
  membersCsvUrl: (clubId) => `/export/members/${clubId}`,
};

export const AdminAPI = {
  userDetails: (id) => api.get(`/admin/users/${id}`),
  allowedEmails: (params) => api.get('/admin/allowed-emails', { params }),
  addAllowedEmail: (data) => api.post('/admin/allowed-emails', data),
  deleteAllowedEmail: (id) => api.delete(`/admin/allowed-emails/${id}`),
  importAllowedEmails: (file, mode) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('mode', mode);
    return api.post('/admin/allowed-emails/import', fd);
  },
  stats: () => api.get('/admin/stats'),
  users: (params) => api.get('/admin/users', { params }),
  setUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
};

export const ImageAPI = {
  upload: (formData) => api.post('/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/images/${id}`),
};

export const PublicAPI = {
  stats: () => api.get('/public/stats'),
};

export const AnalyticsAPI = {
  club: (clubId) => api.get(`/analytics/club/${clubId}`),
  overview: () => api.get('/analytics/overview'),
};
