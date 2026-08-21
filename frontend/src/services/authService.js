/**
 * Auth Service - Encapsulates Maxy Authentication & User Profile Management
 * Follows OOP/Service Layer encapsulation principles
 */

const MAXY_AUTH_BASE = 'https://api.maxy.academy/api/v1/auth';

export const AuthService = {
  /**
   * Get stored current user
   */
  getCurrentUser() {
    try {
      const saved = localStorage.getItem('curricula_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  /**
   * Save user session
   */
  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('curricula_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('curricula_user');
    }
  },

  /**
   * Log out user
   */
  logout() {
    localStorage.removeItem('curricula_user');
  },

  /**
   * Submit Login / Register
   */
  async submitAuth(endpoint, payload) {
    try {
      const res = await fetch(`${MAXY_AUTH_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
};
