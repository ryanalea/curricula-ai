import React from 'react';

export function DeleteCourseModal({
  deleteTargetSession,
  setDeleteTargetSession,
  API_BASE,
  fetchSessions,
  toast
}) {
  if (!deleteTargetSession) return null;

  const displayTitle = deleteTargetSession.title || deleteTargetSession.prompt || 'Untitled Course';
  const truncatedTitle = displayTitle.length > 120 ? displayTitle.substring(0, 120) + '...' : displayTitle;

  return (
    <div 
      className="modal-overlay" 
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}
      onClick={(e) => { if (e.target.className === 'modal-overlay') setDeleteTargetSession(null); }}
    >
      <div 
        style={{ 
          background: '#ffffff', 
          padding: '36px 32px', 
          borderRadius: '24px', 
          maxWidth: '440px', 
          width: '90%', 
          textAlign: 'center', 
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', 
          border: '1px solid rgba(226, 232, 240, 0.9)' 
        }}
      >
        {/* Sleek Gradient Icon Circle */}
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)' }}>
          <svg width="28" height="28" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.02em' }}>
          Delete Course?
        </h3>
        
        <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
          Are you sure you want to delete this course from your library?
        </p>

        {/* Clean Highlighted Title Card with scroll fallback */}
        <div style={{ 
          background: '#f8fafc', 
          border: '1px solid #e2e8f0', 
          padding: '12px 16px', 
          borderRadius: '12px', 
          marginBottom: '28px', 
          textAlign: 'center',
          maxHeight: '100px',
          overflowY: 'auto'
        }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-word' }}>
            "{truncatedTitle}"
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button"
            style={{ 
              flex: 1, 
              padding: '12px 20px', 
              borderRadius: '12px', 
              background: '#ffffff', 
              color: '#475569', 
              border: '1px solid #cbd5e1',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setDeleteTargetSession(null)}
          >
            Cancel
          </button>
          <button 
            type="button"
            style={{ 
              flex: 1, 
              padding: '12px 20px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
              color: '#ffffff', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
              transition: 'all 0.2s ease'
            }}
            onClick={async () => {
              const id = deleteTargetSession.session_id;
              const courseTitle = deleteTargetSession.title || deleteTargetSession.prompt || 'Course';
              const truncatedName = courseTitle.length > 30 ? courseTitle.substring(0, 30) + '...' : courseTitle;
              setDeleteTargetSession(null);
              try {
                const res = await fetch(`${API_BASE}/courses/sessions/${id}`, { method: 'DELETE' });
                if (res.ok) {
                  if (toast) toast.success(`"${truncatedName}" has been deleted.`);
                } else {
                  if (toast) toast.error("Failed to delete the course.");
                }
              } catch (err) {
                console.error("Delete course error:", err);
                if (toast) toast.error("An error occurred while deleting the course.");
              }
              fetchSessions();
            }}
          >
            Delete Course
          </button>
        </div>
      </div>
    </div>
  );
}
