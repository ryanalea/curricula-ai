import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const MAXY_AUTH = 'https://api.maxy.academy/api/auth';

export function AuthProvider({ children, onNavigate, toast }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('curricula_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Creator');
  const [authLoading, setAuthLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const requireAuth = (targetView, actionCallback) => {
    if (!currentUser) {
      if (toast?.info) toast.info("Please log in or create an account to access your workspace.");
      if (onNavigate) onNavigate('login');
      return false;
    }
    if (actionCallback) actionCallback();
    else if (targetView && onNavigate) onNavigate(targetView);
    return true;
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = currentUser ? currentUser.name : 'Creator';
    if (hr < 12) return `Good morning, ${name}`;
    if (hr < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  const handleAuthSubmit = async (e, mode) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!authEmail || !authPassword || (mode === 'signup' && !authName)) {
      if (toast?.error) toast.error("Please fill in all required fields.");
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

      const user = data.user || data.data?.user || { email: authEmail, name: authName || authEmail.split('@')[0] };
      const token = data.token || data.access_token || data.data?.token || '';
      const userData = { ...user, token };

      localStorage.setItem('curricula_user', JSON.stringify(userData));
      localStorage.setItem('maxy_token', token);
      localStorage.setItem('curricula_token', token);
      setCurrentUser(userData);
      if (onNavigate) onNavigate('home');
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      if (toast?.success) {
        toast.success(mode === 'login' ? `Welcome back, ${user.name || user.email}! 🎉` : `Account created! Welcome, ${user.name || authName}! 🚀`);
      }
    } catch (err) {
      if (toast?.error) toast.error(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('curricula_user');
    localStorage.removeItem('maxy_token');
    localStorage.removeItem('curricula_token');
    setCurrentUser(null);
    setShowUserDropdown(false);
    if (onNavigate) onNavigate('landing');
    if (toast?.info) toast.info("You have been logged out.");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authEmail,
        setAuthEmail,
        authPassword,
        setAuthPassword,
        showAuthPassword,
        setShowAuthPassword,
        authName,
        setAuthName,
        authRole,
        setAuthRole,
        authLoading,
        showUserDropdown,
        setShowUserDropdown,
        requireAuth,
        getGreeting,
        greeting: getGreeting(),
        handleAuthSubmit,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
