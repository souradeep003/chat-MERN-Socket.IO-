import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  searchUsers: (query) => api.get(`/auth/search?q=${query}`),
};

// Conversation APIs
export const conversationAPI = {
  getAll: () => api.get('/conversations'),
  getById: (id) => api.get(`/conversations/${id}`),
  create: (data) => api.post('/conversations', data),
  createGroup: (data) => api.post('/conversations/group', data),
  updateGroup: (id, data) => api.put(`/conversations/group/${id}`, data),
  addMembers: (id, members) => api.post(`/conversations/${id}/members`, { members }),
  removeMember: (id, userId) => api.delete(`/conversations/${id}/members/${userId}`),
  leaveGroup: (id) => api.post(`/conversations/${id}/leave`),
};

// Message APIs
export const messageAPI = {
  getMessages: (conversationId, page = 1) => 
    api.get(`/messages/${conversationId}?page=${page}`),
  send: (data) => api.post('/messages', data),
  edit: (id, content) => api.put(`/messages/${id}`, { content }),
  delete: (id) => api.delete(`/messages/${id}`),
  markAsRead: (conversationId) => api.post(`/messages/${conversationId}/read`),
  addReaction: (id, emoji) => api.post(`/messages/${id}/reaction`, { emoji }),
  removeReaction: (id) => api.delete(`/messages/${id}/reaction`),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;