import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token for cross-origin & mobile compatibility
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('studymate_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage restrictions
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to extract clean error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customMessage =
      error.response?.data?.message ||
      (error.response?.data?.errors && error.response.data.errors[0]?.message) ||
      error.message ||
      'An unexpected error occurred. Please try again.';
    error.userMessage = customMessage;
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data).then((res) => res.data),
  login: (data) => apiClient.post('/auth/login', data).then((res) => res.data),
  verifyEmail: (data) => apiClient.post('/auth/verify-email', data).then((res) => res.data),
  resendOtp: (data) => apiClient.post('/auth/resend-otp', data).then((res) => res.data),
  forgotPassword: (data) => apiClient.post('/auth/forgot-password', data).then((res) => res.data),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data).then((res) => res.data),
  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
  getMe: () => apiClient.get('/auth/me').then((res) => res.data),
};

// Groups
export const groupsAPI = {
  getAll: (params) => apiClient.get('/groups', { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/groups/${id}`).then((res) => res.data),
  create: (data) => apiClient.post('/groups', data).then((res) => res.data),
  update: (id, data) => apiClient.patch(`/groups/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/groups/${id}`).then((res) => res.data),
  join: (id, data) => apiClient.post(`/groups/${id}/join`, data).then((res) => res.data),
  leave: (id) => apiClient.post(`/groups/${id}/leave`).then((res) => res.data),
  getMembers: (id) => apiClient.get(`/groups/${id}/members`).then((res) => res.data),
  getJoinRequests: (id) => apiClient.get(`/groups/${id}/requests`).then((res) => res.data),
  handleJoinRequest: (groupId, userId, action) =>
    apiClient.patch(`/groups/${groupId}/requests/${userId}`, { action }).then((res) => res.data),
  getMyGroups: () => apiClient.get('/users/me/groups').then((res) => res.data),
};

// Sessions
export const sessionsAPI = {
  getAll: (params) => apiClient.get('/sessions', { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/sessions/${id}`).then((res) => res.data),
  create: (data) => apiClient.post('/sessions', data).then((res) => res.data),
  update: (id, data) => apiClient.patch(`/sessions/${id}`, data).then((res) => res.data),
  delete: (id) => apiClient.delete(`/sessions/${id}`).then((res) => res.data),
};

// Materials
export const materialsAPI = {
  getAll: (params) => apiClient.get('/materials', { params }).then((res) => res.data),
  getById: (id) => apiClient.get(`/materials/${id}`).then((res) => res.data),
  upload: (formData) =>
    apiClient
      .post('/materials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data),
  delete: (id) => apiClient.delete(`/materials/${id}`).then((res) => res.data),
  getDownloadUrl: (id) => `${API_BASE}/materials/${id}/download`,
};

// Messages
export const messagesAPI = {
  getByGroup: (groupId) => apiClient.get(`/groups/${groupId}/messages`).then((res) => res.data),
  send: (groupId, content, extra = {}) =>
    apiClient.post(`/groups/${groupId}/messages`, { content, ...extra }).then((res) => res.data),
  getConversations: () => apiClient.get('/messages/conversations').then((res) => res.data),
  getDirect: (userId) => apiClient.get(`/messages/direct/${userId}`).then((res) => res.data),
  sendDirect: (userId, data) => apiClient.post(`/messages/direct/${userId}`, data).then((res) => res.data),
  getPeers: (params) => apiClient.get('/messages/peers', { params }).then((res) => res.data),
  react: (messageId, emoji) => apiClient.post(`/messages/${messageId}/reactions`, { emoji }).then((res) => res.data),
  edit: (messageId, content) => apiClient.put(`/messages/${messageId}`, { content }).then((res) => res.data),
  delete: (messageId, deleteType = 'for_me') => apiClient.post(`/messages/${messageId}/delete`, { deleteType }).then((res) => res.data),
  toggleStar: (messageId) => apiClient.post(`/messages/${messageId}/star`).then((res) => res.data),
};

// Users / Settings
export const userAPI = {
  getProfile: () => apiClient.get('/users/me').then((res) => res.data),
  updateProfile: (data) => apiClient.patch('/users/me', data).then((res) => res.data),
  updatePassword: (data) => apiClient.patch('/users/me/password', data).then((res) => res.data),
  getSettings: () => apiClient.get('/users/me/settings').then((res) => res.data),
  updateSettings: (data) => apiClient.patch('/users/me/settings', data).then((res) => res.data),
  deleteAccount: () => apiClient.delete('/users/me/account').then((res) => res.data),
};

// Public Stats
export const statsAPI = {
  getPublicStats: () => apiClient.get('/stats/public').then((res) => res.data),
};

// Student Reports
export const reportAPI = {
  create: (data) => apiClient.post('/reports', data).then((res) => res.data),
};

// Administrator API
export const adminAPI = {
  // Auth
  login: (credentials) => apiClient.post('/admin/auth/login', credentials).then((res) => res.data),
  getMe: () => apiClient.get('/admin/auth/me').then((res) => res.data),
  logout: () => apiClient.post('/admin/auth/logout').then((res) => res.data),

  // Stats
  getStats: (params) => apiClient.get('/admin/stats', { params }).then((res) => res.data),

  // Users
  getUsers: (params) => apiClient.get('/admin/users', { params }).then((res) => res.data),
  getUserDetails: (userId) => apiClient.get(`/admin/users/${userId}`).then((res) => res.data),
  updateUserStatus: (userId, data) => apiClient.patch(`/admin/users/${userId}/status`, data).then((res) => res.data),
  updateUserRole: (userId, data) => apiClient.patch(`/admin/users/${userId}/role`, data).then((res) => res.data),
  updateUserVerification: (userId, data) => apiClient.patch(`/admin/users/${userId}/verification`, data).then((res) => res.data),
  updateUserDetails: (userId, data) => apiClient.patch(`/admin/users/${userId}`, data).then((res) => res.data),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`).then((res) => res.data),

  // Groups
  getGroups: (params) => apiClient.get('/admin/groups', { params }).then((res) => res.data),
  getGroupDetails: (groupId) => apiClient.get(`/admin/groups/${groupId}`).then((res) => res.data),
  updateGroupStatus: (groupId, data) => apiClient.patch(`/admin/groups/${groupId}/status`, data).then((res) => res.data),
  deleteGroup: (groupId) => apiClient.delete(`/admin/groups/${groupId}`).then((res) => res.data),

  // Sessions
  getSessions: (params) => apiClient.get('/admin/sessions', { params }).then((res) => res.data),
  updateSessionStatus: (sessionId, data) => apiClient.patch(`/admin/sessions/${sessionId}/status`, data).then((res) => res.data),
  deleteSession: (sessionId) => apiClient.delete(`/admin/sessions/${sessionId}`).then((res) => res.data),

  // Materials
  getMaterials: (params) => apiClient.get('/admin/materials', { params }).then((res) => res.data),
  updateMaterialStatus: (materialId, data) => apiClient.patch(`/admin/materials/${materialId}/status`, data).then((res) => res.data),
  deleteMaterial: (materialId) => apiClient.delete(`/admin/materials/${materialId}`).then((res) => res.data),
  getDownloadUrl: (materialId) => `${API_BASE}/admin/materials/${materialId}/download`,

  // Messages & Moderation
  getReportedMessages: (params) => apiClient.get('/admin/messages/reported', { params }).then((res) => res.data),
  moderateMessage: (messageId, data) => apiClient.patch(`/admin/messages/${messageId}/moderate`, data).then((res) => res.data),

  // Reports
  getReports: (params) => apiClient.get('/admin/reports', { params }).then((res) => res.data),
  getReportDetails: (reportId) => apiClient.get(`/admin/reports/${reportId}`).then((res) => res.data),
  assignReport: (reportId, data) => apiClient.patch(`/admin/reports/${reportId}/assign`, data).then((res) => res.data),
  updateReportStatus: (reportId, data) => apiClient.patch(`/admin/reports/${reportId}/status`, data).then((res) => res.data),

  // Audit Logs
  getAuditLogs: (params) => apiClient.get('/admin/audit-logs', { params }).then((res) => res.data),

  // Platform Settings
  getSettings: () => apiClient.get('/admin/settings').then((res) => res.data),
  updateSettings: (data) => apiClient.patch('/admin/settings', data).then((res) => res.data),

  // Profile
  getProfile: () => apiClient.get('/admin/profile').then((res) => res.data),
  updateProfile: (data) => apiClient.patch('/admin/profile', data).then((res) => res.data),
  updatePassword: (data) => apiClient.patch('/admin/profile/password', data).then((res) => res.data),
};

// Real-Time Code Executor API
export const executorAPI = {
  run: (data) => apiClient.post('/executor/run', data).then((res) => res.data),
  share: (data) => apiClient.post('/executor/share', data).then((res) => res.data),
};

export default apiClient;
