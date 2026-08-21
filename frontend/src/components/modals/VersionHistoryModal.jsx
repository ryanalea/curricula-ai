import React from 'react';
import { IconSpinner } from '../icons/Icons';

export function VersionHistoryModal({
  isHistoryOpen,
  setIsHistoryOpen,
  historyLoading,
  historyList,
  handleRestoreHistory
}) {
  if (!isHistoryOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsHistoryOpen(false)}>
      <div className="add-section-modal" style={{ maxWidth: '480px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--navy)', margin: 0 }}>📜 Version History</h3>
          <button className="icon-btn" onClick={() => setIsHistoryOpen(false)}>✕</button>
        </div>
        {historyLoading ? (
          <div className="empty-state" style={{ minHeight: '200px' }}>
            <IconSpinner />
            <p>Loading history records...</p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="empty-state" style={{ minHeight: '200px' }}>
            <p>No edit history found for this course yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyList.map((h) => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy)' }}>{h.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(h.created_at).toLocaleString()} | {h.role?.toUpperCase()}
                  </div>
                </div>
                <button 
                  className="ai-pill-btn edit" 
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }} 
                  onClick={() => {
                    handleRestoreHistory(h.id);
                    setIsHistoryOpen(false);
                  }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
