import React from 'react';
import { useUI } from '../../context/UIContext';

export function ToastContainer() {
  const { toasts, removeToast } = useUI();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type} fade-in`}
          style={{
            background: t.type === 'error' ? '#FEF2F2' : t.type === 'success' ? '#F0FDF4' : t.type === 'warning' ? '#FFFBEB' : '#EFF6FF',
            border: `1px solid ${t.type === 'error' ? '#F87171' : t.type === 'success' ? '#4ADE80' : t.type === 'warning' ? '#FBBF24' : '#60A5FA'}`,
            color: t.type === 'error' ? '#991B1B' : t.type === 'success' ? '#166534' : t.type === 'warning' ? '#92400E' : '#1E40AF',
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.92rem',
            cursor: 'pointer',
            maxWidth: '380px'
          }}
          onClick={() => removeToast(t.id)}
        >
          <span>{t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
