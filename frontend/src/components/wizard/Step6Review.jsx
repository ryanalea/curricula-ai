import React from 'react';
import { IconSpinner } from '../icons/Icons';
import { ContentRenderer } from '../common/ContentRenderer';

export function Step6Review({
  promptText,
  promptExpanded,
  setPromptExpanded,
  activeFileName,
  handleRemoveAttachedFile,
  subjectContext,
  techTags,
  prerequisites,
  boundaries,
  learningOutcomes,
  structure,
  defaultSections,
  handleTriggerGeneration,
  isLoading,
  setCurrentStep
}) {
  return (
    <div>
      <div className="header">
        <div>
          <h2>Final Review</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Check everything before the AI starts generating your course.</p>
        </div>
        <span className="step-chip">Step 6 of 8</span>
      </div>

      <div className="review-summary-grid-v2">
        {/* Left Column: Concept & Instructional Alignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Concept Card */}
          <div className="review-card-v2 playful-card">
            <div className="review-card-v2-header">
              <div className="review-card-v2-title">
                <span className="review-card-v2-icon">✨</span>
                <h4>Concept</h4>
              </div>
              <button className="review-card-edit-btn" onClick={() => setCurrentStep('dashboard')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            </div>

            <div className="review-card-v2-body">
              <div className="concept-hero-box">
                {/* Compact course title — first 7 words of prompt */}
                <h3 className="concept-hero-title" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {(() => {
                    const full = (promptText || 'Rapid Prototyping for Real-World Impact').trim();
                    const words = full.split(/\s+/);
                    return words.slice(0, 7).join(' ') + (words.length > 7 ? '…' : '');
                  })()}
                </h3>

                {/* Collapsible full prompt accordion */}
                {promptText && (
                  <div style={{ marginTop: '10px', background: 'rgba(72,107,245,0.05)', border: '1px solid rgba(72,107,245,0.18)', borderRadius: '10px', overflow: 'hidden' }}>
                    <button
                      onClick={() => setPromptExpanded(v => !v)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer', gap: '8px', color: 'var(--blue)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em' }}
                    >
                      <span>{promptExpanded ? 'Hide Full Prompt' : 'View Original Prompt & Approach'}</span>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ transform: promptExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s ease', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {promptExpanded && (
                      <div style={{ padding: '8px 14px 12px', borderTop: '1px solid rgba(72,107,245,0.18)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic', maxHeight: '180px', overflowY: 'auto' }}>
                        "{promptText}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Attached File Badge if present */}
              {activeFileName && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--blue-light)', borderRadius: '10px', border: '1.5px solid var(--blue)', marginTop: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📄</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.88rem' }}>{activeFileName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--blue)', fontWeight: 600 }}>Attached Reference Document</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAttachedFile}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}
                    title="Remove Attached File"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="concept-description-text" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.65', margin: '14px 0' }}>
                <ContentRenderer text={subjectContext || `This course is engineered to provide comprehensive, hands-on mastery of ${promptText || 'the selected topic'}, covering foundational setup, core architectures, and real-world project implementation.`} />
              </div>

              <div className="concept-tech-pills-row">
                {techTags.length > 0 ? techTags.map(tag => (
                  <span key={tag} className="concept-tech-pill">{tag}</span>
                )) : (
                  ['Capstone Projects', 'Project-Based Learning', 'Experiential Learning'].map(tag => (
                    <span key={tag} className="concept-tech-pill">{tag}</span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Instructional Alignment Card */}
          <div className="review-card-v2 playful-card">
            <div className="review-card-v2-header">
              <div className="review-card-v2-title">
                <span className="review-card-v2-icon">🌐</span>
                <h4>Instructional Alignment</h4>
              </div>
              <button className="review-card-edit-btn" onClick={() => setCurrentStep('grounding')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            </div>

            <div className="review-card-v2-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="alignment-section-group">
                <span className="alignment-section-label">PREREQUISITES</span>
                <ul className="alignment-section-list green">
                  {prerequisites.length > 0 ? prerequisites.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  )) : (
                    <>
                      <li>Can independently scope and plan a tech project</li>
                      <li>Proficient with version control (e.g., Git)</li>
                      <li>Comfortable seeking and incorporating feedback in teams</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="alignment-section-group">
                <span className="alignment-section-label">OUT OF SCOPE &amp; ASSUMPTIONS</span>
                <ul className="alignment-section-list yellow">
                  {boundaries.length > 0 ? boundaries.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  )) : (
                    <>
                      <li>Instruction on core programming languages or frameworks</li>
                      <li>Detailed tutorials on version control systems</li>
                      <li>One-on-one mentorship for project ideation</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="alignment-section-group">
                <span className="alignment-section-label">LEARNING OUTCOMES</span>
                <ul className="alignment-section-list purple">
                  {learningOutcomes.length > 0 ? learningOutcomes.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  )) : (
                    <>
                      <li>Design and present a complete technical project solution</li>
                      <li>Evaluate and iterate project implementations using peer feedback</li>
                      <li>Explain project design decisions and trade-offs to stakeholders</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Milestones & Persona Document Structures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Milestones Card */}
          <div className="review-card-v2 playful-card">
            <div className="review-card-v2-header">
              <div className="review-card-v2-title">
                <span className="review-card-v2-icon">📊</span>
                <h4>Milestones</h4>
              </div>
              <button className="review-card-edit-btn" onClick={() => setCurrentStep('structure')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            </div>

            <div className="review-card-v2-body">
              <span className="alignment-section-label">PROJECT MILESTONES</span>
              <div className="milestones-pill-list" style={{ marginTop: '10px' }}>
                {structure.length > 0 ? structure.map((item, idx) => (
                  <div key={item.id} className="milestone-pill-item">
                    <span className="milestone-code">M{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                    <span className="milestone-title">{item.title}</span>
                  </div>
                )) : (
                  [
                    { code: 'M01', title: 'Designing the Project Solution' },
                    { code: 'M02', title: 'Evaluating Feasibility and Impact' },
                    { code: 'M03', title: 'Analyzing Technical and User Needs' },
                    { code: 'M04', title: 'Applying Agile MVP Development' },
                    { code: 'M05', title: 'Explaining Decisions to Stakeholders' }
                  ].map(m => (
                    <div key={m.code} className="milestone-pill-item">
                      <span className="milestone-code">{m.code}</span>
                      <span className="milestone-title">{m.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Persona Document Structures Card */}
          <div className="review-card-v2 playful-card">
            <div className="review-card-v2-header" style={{ marginBottom: '14px' }}>
              <span className="alignment-section-label">PERSONA DOCUMENT STRUCTURES</span>
            </div>

            <div className="review-card-v2-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['creator', 'student', 'educator'].map(role => {
                const roleSectionsMap = new Map();
                structure.forEach(l => {
                  (l.sections?.[role] || []).forEach(s => {
                    const key = s.type || s.title?.toUpperCase();
                    if (key && !roleSectionsMap.has(key)) {
                      roleSectionsMap.set(key, s);
                    }
                  });
                });
                const secList = Array.from(roleSectionsMap.values());
                const displayList = secList.length > 0 ? secList : (
                  role === 'creator' ? defaultSections.creator :
                  role === 'student' ? defaultSections.student : defaultSections.educator
                );
                const colorClass = role === 'creator' ? 'purple' : role === 'student' ? 'blue' : 'green';

                return (
                  <div key={role} className="persona-role-box">
                    <div className="persona-role-header">
                      <div className="persona-role-name">
                        <span className={`persona-dot ${colorClass}`}></span>
                        <span>{role.toUpperCase()}</span>
                      </div>
                      <span className="persona-count-badge">{displayList.length} Sections</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', fontStyle: 'italic' }}>
                      Applied to all {structure.length} lesson{structure.length > 1 ? 's' : ''} (same structure, per-lesson content)
                    </div>
                    <div className="persona-tags-wrap">
                      {displayList.map(sec => (
                        <span 
                          key={sec.id || sec.title} 
                          className="persona-section-tag"
                          style={!sec.locked ? { border: '1.5px solid var(--gold)', background: '#fff8e6', fontWeight: 700, color: 'var(--navy)' } : {}}
                        >
                          {sec.title.toUpperCase()} {!sec.locked ? '✨ (CUSTOM)' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Big Start Generation Button */}
          <button className="navy-start-generation-btn" onClick={handleTriggerGeneration} disabled={isLoading}>
            {isLoading ? <><IconSpinner /> Starting…</> : (
              <>
                Start Generation
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <button className="file-upload-btn" onClick={() => setCurrentStep('structure')}>← Back to Outline</button>
      </div>
    </div>
  );
}
