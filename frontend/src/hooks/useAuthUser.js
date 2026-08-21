import { useState } from 'react';
import { AuthService } from '../services/authService';

const MAXY_AUTH = 'https://api.maxy.academy/api/v1/auth';

export function useAuthUser({ toast, setCurrentView }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('curricula_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [showAuthModal, setShowAuthModal] = useState(null); // null, 'login', 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Creator');
  const [authLoading, setAuthLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // ── Authentication Route Guard ──
  const requireAuth = (targetView, actionCallback) => {
    if (!currentUser) {
      toast.info("Please log in or create an account to access your workspace.");
      setCurrentView('login');
      return false;
    }
    if (actionCallback) actionCallback();
    else if (targetView) setCurrentView(targetView);
    return true;
  };

  // Greeting Logic
  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = currentUser ? currentUser.name : 'Creator';
    if (hr < 12) return `Good morning, ${name}`;
    if (hr < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };
  const greeting = getGreeting();

  const handleAuthSubmit = async (e, mode) => {
    e.preventDefault();
    if (!authEmail || !authPassword || (mode === 'signup' && !authName)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setAuthLoading(true);
    try {
      const endpoint = mode === 'login' ? `${MAXY_AUTH}/login` : `${MAXY_AUTH}/register`;
      const payload = mode === 'login'
        ? { email: authEmail, password: authPassword, client_app: 'web' }
        : { name: authName, email: authEmail, password: authPassword, client_app: 'web' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Authentication failed.");
      }

      // Maxy API returns {user, token} or similar
      const user = data.user || data.data?.user || { email: authEmail, name: authName || authEmail.split('@')[0] };
      const token = data.token || data.access_token || data.data?.token || '';
      const userData = { ...user, token };

      localStorage.setItem('curricula_user', JSON.stringify(userData));
      localStorage.setItem('maxy_token', token);
      setCurrentUser(userData);
      setCurrentView('home');
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      toast.success(mode === 'login' ? `Welcome back, ${user.name || user.email}! 🎉` : `Account created! Welcome, ${user.name || authName}! 🚀`);
    } catch (err) {
      toast.error(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    currentUser, setCurrentUser,
    showAuthModal, setShowAuthModal,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    showAuthPassword, setShowAuthPassword,
    authName, setAuthName,
    authRole, setAuthRole,
    authLoading, setAuthLoading,
    showUserDropdown, setShowUserDropdown,
    requireAuth,
    greeting,
    handleAuthSubmit,
  };
}
