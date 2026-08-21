import { request } from './apiClient';

export const authApi = {
  login: (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  signup: (userData) => {
    return request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getProfile: (token) => {
    return request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
