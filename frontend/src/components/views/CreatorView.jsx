import React from 'react';
import { ContentRenderer } from '../common/ContentRenderer';

/**
 * Maps a section `type` from the structure schema to the key used in activeLessonContent.
 * The structure uses short type names (e.g. "quiz", "outcomes") while the content object
 * uses full API field names (e.g. "quizzes", "learning_outcomes").
 */
const TYPE_TO_CONTENT_KEY = {
  overview: 'overview',
  outcomes: 'learning_outcomes',
  learning_outcomes: 'learning_outcomes',
  core_content: 'core_content',
  exercises: 'exercises',
  quiz: 'quizzes',
  quizzes: 'quizzes',
};

function SectionOverview({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, renderAIActionBar, checkCanEdit }) {
  return (
    <div id="step7-sec-overview" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <h3 style={{ marginBottom: '10px' }}>Lesson Overview</h3>
      {editingSection === 'overview' ? (
        <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
      ) : (
        <ContentRenderer text={c.overview} />
      )}
      {renderAIActionBar && renderAIActionBar('overview', c.overview)}
    </div>
  );
}

function SectionLearningOutcomes({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, checkCanEdit }) {
  return (
    <div id="step7-sec-learning_outcomes" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Learning Outcomes</h3>
        {editingSection === 'learning_outcomes' ? (
          <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('learning_outcomes', editingText.split('\n').filter(Boolean))}>Save</button>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Learning Outcomes')) return; setEditingSection('learning_outcomes'); setEditingText((c.learning_outcomes || []).join('\n')); }}>Edit</button>
        )}
      </div>
      {editingSection === 'learning_outcomes' ? (
        <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="One outcome per line..." />
      ) : (
        <ul className="outcome-list">
          {(c.learning_outcomes || []).map((item, idx) => (
            <li key={idx}><span className="outcome-dot" />{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SectionCoreContent({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, renderAIActionBar }) {
  return (
    <div id="step7-sec-core_content" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <h3 style={{ marginBottom: '10px' }}>Core Technical Material</h3>
      {editingSection === 'core_content' ? (
        <textarea className="prompt-textarea" style={{ minHeight: '240px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
      ) : (
        <ContentRenderer text={c.core_content} />
      )}
      {renderAIActionBar && renderAIActionBar('core_content', c.core_content)}
    </div>
  );
}

function SectionExercises({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, checkCanEdit, toast }) {
  return (
    <div id="step7-sec-exercises" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Hands-On Exercises</h3>
        {editingSection === 'exercises' ? (
          <button className="ai-pill-btn edit" onClick={() => { try { handleSaveManualEdit('exercises', JSON.parse(editingText)); } catch { if (toast) toast.error('Invalid JSON format.'); } }}>Save</button>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Hands-On Exercises')) return; setEditingSection('exercises'); setEditingText(JSON.stringify(c.exercises || [], null, 2)); }}>Edit</button>
        )}
      </div>
      {editingSection === 'exercises' ? (
        <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(c.exercises || []).map((ex, idx) => {
            const textDesc = ex.instruction || ex.description || (typeof ex === 'string' ? ex : '');
            return (
              <div key={idx} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--navy)' }}>Exercise {idx + 1}: {ex.title || 'Practice Exercise'}</strong>
                  {ex.difficulty && (
                    <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: 700, border: '1px solid #bbf7d0' }}>{ex.difficulty}</span>
                  )}
                </div>
                {textDesc && <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6' }}>{textDesc}</p>}
                {(ex.code_template || ex.code) && <pre className="code-block" style={{ marginTop: '10px' }}>{ex.code_template || ex.code}</pre>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionQuizzes({ c, editingSection, setEditingSection, editingText, setEditingText, handleSaveManualEdit, toast }) {
  return (
    <div id="step7-sec-quizzes" className="content-block" style={{ scrollMarginTop: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0 }}>Assessment Quiz</h3>
        {editingSection === 'quizzes' ? (
          <button className="ai-pill-btn edit" onClick={() => { try { handleSaveManualEdit('quizzes', JSON.parse(editingText)); } catch { if (toast) toast.error('Invalid JSON format.'); } }}>Save</button>
        ) : (
          <button className="ai-pill-btn edit" onClick={() => { setEditingSection('quizzes'); setEditingText(JSON.stringify(c.quizzes || [], null, 2)); }}>Edit</button>
        )}
      </div>
      {editingSection === 'quizzes' ? (
        <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {(Array.isArray(c.quizzes) ? c.quizzes : []).map((q, idx) => (
            <div key={idx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <strong>Q{idx + 1}: {q.question || 'Quiz Question'}</strong>
              <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '8px' }}>
                {(Array.isArray(q.options) ? q.options : (q.choices || [])).map((opt, oIdx) => (
                  <li key={oIdx} style={{ padding: '4px 0', fontSize: '0.88rem', color: opt === q.answer ? '#059669' : 'var(--text-main)', fontWeight: opt === q.answer ? 700 : 400 }}>
                    {opt === q.answer ? '✅ ' : '• '}{opt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Map of section type → render function.
 * These types match both the `structure` section types AND the content keys.
 */
const CREATOR_SECTION_RENDERERS = {
  overview: (props) => <SectionOverview {...props} />,
  outcomes: (props) => <SectionLearningOutcomes {...props} />,
  learning_outcomes: (props) => <SectionLearningOutcomes {...props} />,
  core_content: (props) => <SectionCoreContent {...props} />,
  exercises: (props) => <SectionExercises {...props} />,
  quiz: (props) => <SectionQuizzes {...props} />,
  quizzes: (props) => <SectionQuizzes {...props} />,
};

/**
 * CreatorView — renders Creator sections in the ORDER defined by `sectionOrder`
 * (from Step5 structure). Falls back to default order if sectionOrder is empty.
 */
export function CreatorView({
  activeLessonContent,
  sectionOrder,   // array of { type, title } from structure[lesson].sections.creator
  editingSection,
  setEditingSection,
  editingText,
  setEditingText,
  handleSaveManualEdit,
  renderAIActionBar,
  checkCanEdit,
  toast,
  renderCustomSections
}) {
  // Resolve the render order from sectionOrder prop; fallback to default sequence
  const DEFAULT_ORDER = ['overview', 'outcomes', 'core_content', 'exercises', 'quiz'];
  const orderedTypes = (sectionOrder && sectionOrder.length > 0)
    ? sectionOrder.map(s => s.type)
    : DEFAULT_ORDER;

  const sharedProps = {
    c: activeLessonContent,
    editingSection, setEditingSection,
    editingText, setEditingText,
    handleSaveManualEdit,
    renderAIActionBar,
    checkCanEdit,
    toast
  };

  return (
    <>
      {orderedTypes.map((type) => {
        const renderer = CREATOR_SECTION_RENDERERS[type];
        if (!renderer) return null;
        return (
          <React.Fragment key={type}>
            {renderer(sharedProps)}
          </React.Fragment>
        );
      })}
      {renderCustomSections && renderCustomSections()}
    </>
  );
}
