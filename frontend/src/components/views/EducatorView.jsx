import React from 'react';
import { ContentRenderer } from '../common/ContentRenderer';

export function EducatorView({
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
      {/* 1. Facilitator Guide */}
      <div id="step7-sec-facilitator_guide" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <h3 style={{ marginBottom: '10px' }}>Facilitator Guide</h3>
        {editingSection === 'facilitator_guide' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '150px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
        ) : (
          <ContentRenderer text={activeLessonContent.facilitator_guide} />
        )}
        {renderAIActionBar && renderAIActionBar('facilitator_guide', activeLessonContent.facilitator_guide)}
      </div>

      {/* 2. Lesson Plan & Timing */}
      <div id="step7-sec-lesson_plan" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Lesson Plan &amp; Timing</h3>
          {editingSection === 'lesson_plan' ? (
            <button className="ai-pill-btn edit" onClick={() => {
              try {
                const parsed = JSON.parse(editingText);
                handleSaveManualEdit('lesson_plan', parsed);
              } catch (err) {
                if (toast) toast.error("Invalid JSON format. Expected: { ice_breaker: string, timing: string }");
              }
            }}>Save</button>
          ) : (
            <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('mengedit Lesson Plan')) return; setEditingSection('lesson_plan'); setEditingText(JSON.stringify(activeLessonContent.lesson_plan || {}, null, 2)); }}>Edit</button>
          )}
        </div>
        {editingSection === 'lesson_plan' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '120px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
        ) : (
          <div className="lesson-plan-grid">
            <div className="lesson-plan-card">
              <h4>🧊 Ice Breaker</h4>
              <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.ice_breaker || 'No ice breaker prompt defined.'}</p>
            </div>
            <div className="lesson-plan-card">
              <h4>⏱ Timing Allocation</h4>
              <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.timing || '60 mins total duration'}</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Assessment Rubric */}
      <div id="step7-sec-rubric" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Grading Rubric</h3>
          {editingSection === 'rubric' ? (
            <button className="ai-pill-btn edit" onClick={() => {
              try {
                const parsed = JSON.parse(editingText);
                handleSaveManualEdit('rubric', parsed);
              } catch (err) {
                if (toast) toast.error("Invalid JSON format. Expected array of objects.");
              }
            }}>Save</button>
          ) : (
            <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('mengedit Rubric')) return; setEditingSection('rubric'); setEditingText(JSON.stringify(activeLessonContent.rubric || [], null, 2)); }}>Edit</button>
          )}
        </div>
        {editingSection === 'rubric' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '180px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
        ) : (
          <table className="rubric-table">
            <thead>
              <tr>
                <th>Criteria</th>
                <th>Excellent</th>
                <th>Good</th>
                <th>Needs Improvement</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(activeLessonContent.rubric) ? activeLessonContent.rubric : []).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.criteria}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{row.excellent}</td>
                  <td style={{ color: 'var(--accent-orange)' }}>{row.good}</td>
                  <td style={{ color: 'var(--accent-red)' }}>{row.needs_improvement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Teaching Tips */}
      {(activeLessonContent.teaching_tips?.length > 0) && (
        <div id="step7-sec-teaching_tips" className="content-block" style={{ scrollMarginTop: '110px' }}>
          <h3 style={{ marginBottom: '10px' }}>💡 Teaching Tips</h3>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeLessonContent.teaching_tips.map((tip, idx) => (
              <li key={idx} style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Discussion Questions */}
      <div id="step7-sec-discussion_questions" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Discussion Questions</h3>
          {editingSection === 'discussion_questions' ? (
            <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('discussion_questions', editingText.split('\n').filter(Boolean))}>Save</button>
          ) : (
            <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('mengedit Discussion Questions')) return; setEditingSection('discussion_questions'); setEditingText(Array.isArray(activeLessonContent.discussion_questions) ? activeLessonContent.discussion_questions.join('\n') : String(activeLessonContent.discussion_questions || '')); }}>Edit</button>
          )}
        </div>
        {editingSection === 'discussion_questions' ? (
          <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="One question per line..." />
        ) : (
          <ol className="discussion-list">
            {(Array.isArray(activeLessonContent.discussion_questions) ? activeLessonContent.discussion_questions : (typeof activeLessonContent.discussion_questions === 'string' ? [activeLessonContent.discussion_questions] : [])).map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ol>
        )}
      </div>

      {/* 6. Assessment / Homework */}
      {activeLessonContent.assessment && (
        <div id="step7-sec-assessment" className="content-block" style={{ scrollMarginTop: '110px' }}>
          <h3 style={{ marginBottom: '10px' }}>📝 Assessment &amp; Homework</h3>
          <div style={{ padding: '14px 18px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--blue)', fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-main)' }}>
            {activeLessonContent.assessment}
          </div>
        </div>
      )}

      {/* 7. Custom Sections */}
      {renderCustomSections && renderCustomSections()}
    </>
  );
}
