import React from 'react';
import { ContentRenderer } from '../common/ContentRenderer';

export function StudentView({
  activeLessonContent,
  editingSection,
  setEditingSection,
  editingText,
  setEditingText,
  handleSaveManualEdit,
  renderAIActionBar,
  toast,
  renderCustomSections,
  checkCanEdit
}) {
  return (
    <>
      {/* 1. Why This Matters */}
      <div id="step7-sec-why_this_matters" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>💡 Why This Matters</h3>
          {editingSection === 'why_this_matters' ? (
            <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('why_this_matters', editingText)}>Save</button>
          ) : (
            <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Why This Matters')) return; setEditingSection('why_this_matters'); setEditingText(activeLessonContent.why_this_matters || activeLessonContent.why_matters || ''); }}>Edit</button>
          )}
        </div>
        {editingSection === 'why_this_matters' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
        ) : (
          <div className="why-matters-card" style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--gold)', marginBottom: '10px' }}>
            <ContentRenderer text={activeLessonContent.why_this_matters || activeLessonContent.why_matters || 'Understanding this module provides core skills for technical excellence.'} />
          </div>
        )}
        {renderAIActionBar && renderAIActionBar('why_this_matters', activeLessonContent.why_this_matters || activeLessonContent.why_matters)}
      </div>

      {/* 2. Interactive Coding Practice / Sandbox */}
      <div id="step7-sec-practice" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>
            {activeLessonContent.practice?.content_type === 'markdown' || !activeLessonContent.practice?.code_block
              ? '📋 Interactive Scenario & Case Study'
              : '💻 Interactive Coding Sandbox'}
          </h3>
          {editingSection === 'practice' ? (
            <button className="ai-pill-btn edit" onClick={() => {
              try {
                const parsed = JSON.parse(editingText);
                handleSaveManualEdit('practice', parsed);
              } catch (err) {
                if (toast) toast.error("Invalid JSON format. Expected: { code_block: string, interactive_exercise: string, checklist: string[] }");
              }
            }}>Save</button>
          ) : (
            <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Interactive Sandbox')) return; setEditingSection('practice'); setEditingText(JSON.stringify(activeLessonContent.practice || {}, null, 2)); }}>Edit</button>
          )}
        </div>
        {editingSection === 'practice' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
        ) : (
          <>
            {activeLessonContent.practice?.content_type === 'markdown' || !activeLessonContent.practice?.code_block ? (
              <div className="why-matters-card" style={{ background: 'var(--surface-2)', marginBottom: '16px', borderLeft: '4px solid var(--gold)' }}>
                <ContentRenderer text={activeLessonContent.practice?.scenario || activeLessonContent.practice?.interactive_exercise || activeLessonContent.practice?.description || (typeof activeLessonContent.practice === 'string' ? activeLessonContent.practice : 'Read the scenario below and complete the checklist items.')} />
              </div>
            ) : (
              <pre className="code-block">{activeLessonContent.practice?.code_block || activeLessonContent.practice?.starter_code || '// No starter code template provided'}</pre>
            )}
            <div className="exercise-task" style={{ marginTop: '10px' }}>
              <strong>Task / Objective:</strong> {activeLessonContent.practice?.interactive_exercise || activeLessonContent.practice?.task || 'Complete the interactive exercise below.'}
            </div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 750, marginTop: '16px' }}>Practice Checklist</h4>
            <ul className="checklist">
              {(activeLessonContent.practice?.checklist || []).map((item, idx) => (
                <li key={idx}><span className="check-icon">✓</span>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* 3. Debugging Pitfalls */}
      <div id="step7-sec-debugging" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <h3 style={{ marginBottom: '10px' }}>Debugging Pitfalls</h3>
        {editingSection === 'debugging' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
        ) : (
          <ContentRenderer text={activeLessonContent.debugging} />
        )}
        {renderAIActionBar && renderAIActionBar('debugging', activeLessonContent.debugging)}
      </div>

      {/* 4. Ethics & Code Principles */}
      <div id="step7-sec-ethics" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <h3 style={{ marginBottom: '10px' }}>Ethics &amp; Code Principles</h3>
        {editingSection === 'ethics' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
        ) : (
          <ContentRenderer text={activeLessonContent.ethics} />
        )}
        {renderAIActionBar && renderAIActionBar('ethics', activeLessonContent.ethics)}
      </div>

      {/* 5. Custom Sections */}
      {renderCustomSections && renderCustomSections()}
    </>
  );
}
