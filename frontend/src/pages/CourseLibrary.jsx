import React from 'react';
import { IconBook, IconTrash, IconClock } from '../components/icons/Icons';

export function CourseLibrary({
  setCurrentView,
  setCurrentStep,
  librarySearchQuery,
  setLibrarySearchQuery,
  libraryFilterTab,
  setLibraryFilterTab,
  librarySelectedTag,
  setLibrarySelectedTag,
  libraryPubPage,
  setLibraryPubPage,
  sessionsList,
  fetchSessions,
  API_BASE,
  setDeleteTargetSession,
  handleResumeSession,
  resetWizardState
}) {
  return (
    <div className="course-library-container">
      {/* Library Top Header */}
      <div className="library-top-header">
        <div>
          <h1 className="library-title">Course Library</h1>
          <p className="library-subtitle">Manage and organize your course curriculum assets.</p>
        </div>

        <div className="library-header-actions">
          <button className="library-upload-btn playful-card" onClick={() => { if (resetWizardState) resetWizardState(); setCurrentView('wizard'); setCurrentStep('dashboard'); }}>
            <span>+</span> Upload
          </button>
          <div className="library-search-box">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={librarySearchQuery}
              onChange={(e) => { setLibrarySearchQuery(e.target.value); setLibraryPubPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Main Library Split Layout */}
      <div className="library-split-layout">
        {/* Helper for dynamic smart hashtags */}
        {(() => {
          window._getCourseTags = (sess) => {
            if (sess.tech_tags && Array.isArray(sess.tech_tags) && sess.tech_tags.length > 0) {
              return sess.tech_tags.slice(0, 3);
            }
            const text = (sess.title || sess.prompt || '').toLowerCase();
            const tags = [];
            if (text.includes('python')) tags.push('Python');
            if (text.includes('machine learning') || text.includes('ml')) tags.push('Machine Learning');
            if (text.includes('data science') || text.includes('pandas')) tags.push('Data Science');
            if (text.includes('generative') || text.includes('ai')) tags.push('Generative AI');
            if (text.includes('react') || text.includes('native')) tags.push('React Native');
            if (text.includes('go') || text.includes('golang')) tags.push('Go');
            if (text.includes('web') || text.includes('next.js')) tags.push('Web Development');
            if (text.includes('microservices')) tags.push('Microservices');
            if (text.includes('deep learning')) tags.push('Deep Learning');
            if (text.includes('cloud')) tags.push('Cloud Computing');
            if (text.includes('agile')) tags.push('Agile Leadership');

            if (tags.length === 0) {
              const words = (sess.title || sess.prompt || 'AI Course')
                .split(/\s+/)
                .filter(w => w.length > 3 && !['with', 'from', 'into', 'your', 'this', 'that', 'course', 'overview'].includes(w.toLowerCase()))
                .slice(0, 3);
              return words.length > 0 ? words : ['Generative AI', 'PedagogyTrack', 'HandsOnCode'];
            }
            return tags.slice(0, 3);
          };
          return null;
        })()}

        {/* Left Column: Sticky Filters Sidebar */}
        <div className="library-filters-card playful-card" style={{ position: 'sticky', top: '90px' }}>
          <div className="filters-header">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span>Filters</span>
          </div>

          <div className="filters-nav-group">
            <button 
              className={`filter-nav-item ${libraryFilterTab === 'all' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('all'); setLibraryPubPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                <span>All Content</span>
              </div>
              <span className={`filter-count-pill ${libraryFilterTab === 'all' ? 'active' : ''}`}>{sessionsList.filter(s => s.status !== 'archived').length}</span>
            </button>

            <button 
              className={`filter-nav-item ${libraryFilterTab === 'drafts' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('drafts'); setLibraryPubPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>Drafts</span>
              </div>
              <span className="filter-count-pill draft">{sessionsList.filter(s => s.status !== 'completed' && s.status !== 'published' && s.status !== 'archived').length}</span>
            </button>

            <button 
              className={`filter-nav-item ${libraryFilterTab === 'published' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('published'); setLibraryPubPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Published</span>
              </div>
              <span className="filter-count-pill published">{sessionsList.filter(s => (s.status === 'completed' || s.status === 'published') && s.status !== 'archived').length}</span>
            </button>

            <button 
              className={`filter-nav-item ${libraryFilterTab === 'archived' ? 'active' : ''}`}
              onClick={() => { setLibraryFilterTab('archived'); setLibraryPubPage(1); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                <span>Archived</span>
              </div>
              <span className="filter-count-pill archived">{sessionsList.filter(s => s.status === 'archived').length}</span>
            </button>
          </div>

          <div className="filter-tags-section">
            <div className="filter-tags-title">■ TAGS</div>
            <div className="filter-tags-list">
              {(() => {
                const allDynamicTags = Array.from(new Set([
                  'All Tags',
                  ...sessionsList.flatMap(s => (window._getCourseTags ? window._getCourseTags(s) : s.tech_tags || []))
                ]));
                const displayTags = allDynamicTags.length > 1 ? allDynamicTags : ['All Tags', 'Python', 'Machine Learning', 'Generative AI', 'Web Development', 'Go', 'React Native'];
                return displayTags.slice(0, 8).map((t) => (
                  <button 
                    key={t} 
                    className={`filter-tag-pill ${librarySelectedTag === t ? 'active' : ''}`}
                    onClick={() => { setLibrarySelectedTag(t); setLibraryPubPage(1); }}
                  >
                    {t === 'All Tags' ? t : `# ${t}`}
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Filtered Content Area */}
        <div className="library-content-area">
          {(() => {
            // Filter Sessions
            let filteredList = sessionsList.filter((s) => {
              const matchesSearch = !librarySearchQuery || (s.title || s.prompt || '').toLowerCase().includes(librarySearchQuery.toLowerCase());
              const cleanTag = librarySelectedTag.replace('# ', '').trim();
              const courseTags = window._getCourseTags ? window._getCourseTags(s) : (s.tech_tags || []);
              const matchesTag = librarySelectedTag === 'All Tags' || 
                courseTags.includes(cleanTag) ||
                ((s.title || s.prompt || '').toLowerCase().includes(cleanTag.toLowerCase()));
              const matchesTab = 
                libraryFilterTab === 'all' ? s.status !== 'archived' :
                libraryFilterTab === 'drafts' ? s.status !== 'completed' && s.status !== 'published' && s.status !== 'archived' :
                libraryFilterTab === 'published' ? (s.status === 'completed' || s.status === 'published') && s.status !== 'archived' :
                libraryFilterTab === 'archived' ? s.status === 'archived' : true;
              return matchesSearch && matchesTag && matchesTab;
            });

            const wipList = filteredList.filter(s => s.status !== 'completed' && s.status !== 'published' && s.status !== 'archived');
            const pubList = filteredList.filter(s => (s.status === 'completed' || s.status === 'published') && s.status !== 'archived');
            const archivedList = filteredList.filter(s => s.status === 'archived');

            // Pagination for Published (6 cards per page max)
            const CARDS_PER_PAGE = 6;
            const totalPubPages = Math.ceil(pubList.length / CARDS_PER_PAGE) || 1;
            const startIndex = (libraryPubPage - 1) * CARDS_PER_PAGE;
            const paginatedPubList = pubList.slice(startIndex, startIndex + CARDS_PER_PAGE);

            if (filteredList.length === 0 && sessionsList.length > 0) {
              return (
                <div className="empty-state" style={{ background: 'var(--white)', padding: '50px 20px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <IconBook />
                  <h3>No courses match "{libraryFilterTab !== 'all' ? libraryFilterTab : librarySelectedTag !== 'All Tags' ? librarySelectedTag : librarySearchQuery}"</h3>
                  <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>You have {sessionsList.length} saved courses, but none match this tab or filter.</p>
                  <button 
                    className="ai-pill-btn" 
                    style={{ marginTop: '16px', background: 'var(--blue)', color: 'var(--white)' }}
                    onClick={() => { setLibrarySelectedTag('All Tags'); setLibrarySearchQuery(''); setLibraryFilterTab('all'); }}
                  >
                    Reset Filters 🔄
                  </button>
                </div>
              );
            }

            return (
              <>
                {/* 1. WORK IN PROGRESS (DRAFTS) */}
                {(libraryFilterTab === 'all' || libraryFilterTab === 'drafts') && wipList.length > 0 && (
                  <div className="library-section">
                    <div className="library-section-title-wrap" style={{ marginBottom: '14px' }}>
                      <span className="title-vertical-bar gold"></span>
                      <h3 className="library-section-title">WORK IN PROGRESS (DRAFTS - {wipList.length})</h3>
                    </div>

                    <div className="elice-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                      {wipList.map((sess) => (
                        <div 
                          key={sess.session_id} 
                          className="elice-course-card playful-card"
                        >
                          <div className="card-top">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="card-tag" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                  <polyline points="14 2 14 8 20 8"/>
                                  <line x1="9" y1="13" x2="15" y2="13"/>
                                  <line x1="9" y1="17" x2="13" y2="17"/>
                                </svg>
                                DRAFT
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                  className="ai-pill-btn" 
                                  style={{ padding: '3px 8px', fontSize: '0.72rem', background: '#eff6ff', color: 'var(--blue)', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                                  title="Resume course creation"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResumeSession(sess);
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  Resume
                                </button>
                                {sess.progress >= 100 && (
                                  <button 
                                    className="ai-pill-btn" 
                                    style={{ padding: '3px 8px', fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}
                                    title="Publish course"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'completed' })
                                      });
                                      fetchSessions();
                                    }}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    Publish
                                  </button>
                                )}
                                <button 
                                  className="ai-pill-btn" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                  title="Archive course"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'archived' })
                                    });
                                    fetchSessions();
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'3px'}}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> Archive
                                </button>
                                <button 
                                  className="icon-btn-tool"
                                  title="Delete Draft"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTargetSession(sess);
                                  }}
                                >
                                  <IconTrash style={{ pointerEvents: 'none' }} />
                                </button>
                              </div>
                            </div>
                            <h3 
                              className="card-title" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleResumeSession(sess)}
                            >
                              {sess.title || sess.prompt}
                            </h3>
                            
                            {/* Dynamic Tech Hashtags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {(window._getCourseTags ? window._getCourseTags(sess) : ['AI Course']).slice(0, 3).map((tag, tIdx) => (
                                <span key={tIdx} className="persona-section-tag"># {tag}</span>
                              ))}
                            </div>

                            <div style={{ marginTop: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '4px' }}>
                                <span>PROGRESS</span>
                                <span style={{ color: 'var(--blue)' }}>{sess.progress || 15}%</span>
                              </div>
                              <div className="session-mini-progress">
                                <div className="session-mini-bar" style={{ width: `${sess.progress || 15}%`, background: 'var(--navy)' }} />
                              </div>
                            </div>
                          </div>

                          <div className="card-bottom" style={{ marginTop: '16px' }}>
                            <button 
                              className="action-btn" 
                              onClick={() => handleResumeSession(sess)}
                              style={{ width: '100%', justifyContent: 'center', background: 'var(--surface-2)', color: 'var(--navy)', border: '1px solid var(--border-color)' }}
                            >
                              Continue Editing
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. PUBLISHED CURRICULUM */}
                {(libraryFilterTab === 'all' || libraryFilterTab === 'published') && pubList.length > 0 && (
                  <div className="library-section" style={{ marginTop: wipList.length > 0 ? '30px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div className="library-section-title-wrap">
                        <span className="title-vertical-bar blue"></span>
                        <h3 className="library-section-title">PUBLISHED CURRICULUM ({pubList.length})</h3>
                      </div>

                      {/* Dynamic Pagination Controls */}
                      {totalPubPages > 1 && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button 
                            className="library-page-btn"
                            onClick={() => setLibraryPubPage(Math.max(1, libraryPubPage - 1))}
                            disabled={libraryPubPage === 1}
                          >
                            ‹
                          </button>
                          {Array.from({ length: totalPubPages }).map((_, pIdx) => (
                            <button 
                              key={pIdx + 1}
                              className={`library-page-btn ${libraryPubPage === pIdx + 1 ? 'active' : ''}`}
                              onClick={() => setLibraryPubPage(pIdx + 1)}
                            >
                              {pIdx + 1}
                            </button>
                          ))}
                          <button 
                            className="library-page-btn"
                            onClick={() => setLibraryPubPage(Math.min(totalPubPages, libraryPubPage + 1))}
                            disabled={libraryPubPage === totalPubPages}
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="elice-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                      {paginatedPubList.map((sess) => (
                        <div 
                          key={sess.session_id} 
                          className="elice-course-card playful-card" 
                        >
                          <div className="card-top">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="card-tag" style={{ background: '#dcfce7', color: '#15803d' }}>✅ PUBLISHED</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                  className="ai-pill-btn" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                                  title="Move to Drafts"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'draft' })
                                    });
                                    fetchSessions();
                                  }}
                                >
                                  Draft 📝
                                </button>
                                <button 
                                  className="ai-pill-btn" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}
                                  title="Archive course"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'archived' })
                                    });
                                    fetchSessions();
                                  }}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'3px'}}><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg> Archive
                                </button>
                                <button 
                                  className="icon-btn-tool" 
                                  title="Delete Course"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTargetSession(sess);
                                  }}
                                >
                                  <IconTrash style={{ pointerEvents: 'none' }} />
                                </button>
                              </div>
                            </div>
                            <h3 
                              className="card-title" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleResumeSession(sess)}
                            >
                              {sess.title || sess.prompt}
                            </h3>

                            {/* Dynamic Tech Hashtags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {(window._getCourseTags ? window._getCourseTags(sess) : ['AI Course']).slice(0, 3).map((tag, tIdx) => (
                                <span key={tIdx} className="persona-section-tag"># {tag}</span>
                              ))}
                            </div>
                          </div>

                          <div className="card-bottom" style={{ marginTop: '16px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <IconClock /> {sess.updated_at ? new Date(sess.updated_at).toLocaleDateString() : 'Active'}
                            </span>
                            <button 
                              className="icon-btn-tool" 
                              onClick={() => handleResumeSession(sess)}
                              title="Open Course"
                              style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', width: '32px', height: '32px' }}
                            >
                              ↗
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. ARCHIVED CURRICULUM */}
                {(libraryFilterTab === 'all' || libraryFilterTab === 'archived') && archivedList.length > 0 && (
                  <div className="library-section" style={{ marginTop: wipList.length > 0 || pubList.length > 0 ? '30px' : '0' }}>
                    <div className="library-section-title-wrap" style={{ marginBottom: '14px' }}>
                      <span className="title-vertical-bar gold" style={{ background: '#64748b' }}></span>
                      <h3 className="library-section-title">ARCHIVED CURRICULUM ({archivedList.length})</h3>
                    </div>

                    <div className="elice-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                      {archivedList.map((sess) => (
                        <div 
                          key={sess.session_id} 
                          className="elice-course-card playful-card" 
                          style={{ opacity: 0.85 }}
                        >
                          <div className="card-top">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span className="card-tag" style={{ background: '#f1f5f9', color: '#475569' }}>📦 ARCHIVED</span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                  className="ai-pill-btn" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                                  title="Restore to Draft"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetch(`${API_BASE}/courses/sessions/${sess.session_id}/status`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'completed' })
                                    });
                                    fetchSessions();
                                  }}
                                >
                                  Restore ↩️
                                </button>
                                <button 
                                  className="icon-btn-tool" 
                                  title="Delete Permanently"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTargetSession(sess);
                                  }}
                                >
                                  <IconTrash style={{ pointerEvents: 'none' }} />
                                </button>
                              </div>
                            </div>
                            <h3 
                              className="card-title" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleResumeSession(sess)}
                            >
                              {sess.title || sess.prompt}
                            </h3>

                            {/* Dynamic Tech Hashtags */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {(window._getCourseTags ? window._getCourseTags(sess) : ['AI Course']).slice(0, 3).map((tag, tIdx) => (
                                <span key={tIdx} className="persona-section-tag"># {tag}</span>
                              ))}
                            </div>
                          </div>

                          <div className="card-bottom" style={{ marginTop: '16px' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <IconClock /> {sess.updated_at ? new Date(sess.updated_at).toLocaleDateString() : 'Archived'}
                            </span>
                            <button 
                              className="icon-btn-tool" 
                              onClick={() => handleResumeSession(sess)}
                              title="Open Course"
                              style={{ background: 'var(--surface-2)', color: 'var(--navy)', border: 'none', width: '32px', height: '32px' }}
                            >
                              ↗
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

