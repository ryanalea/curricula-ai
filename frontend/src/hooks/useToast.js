import { useState, useCallback, useMemo } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    setToasts(prev => {
      // Prevent duplicate toast if the exact same message and type is already visible
      if (prev.some(t => t.message === message && t.type === type)) {
        return prev;
      }
      const id = Date.now() + Math.random().toString(36).substring(2, 6);
      setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== id));
      }, duration);
      // Keep at most 3 latest toasts
      const updated = [...prev, { id, message, type }];
      return updated.slice(-3);
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useMemo(() => ({
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }), [addToast]);

  return { toasts, addToast, removeToast, toast };
}
