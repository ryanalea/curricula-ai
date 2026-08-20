import React from 'react';
import { IconSpinner } from '../icons/Icons';
import { ContentRenderer } from '../common/ContentRenderer';

export function AIActionBar({ 
  sectionType, 
  currentVal, 
  customSaveHandler = null, 
  sectionLoading, 
  editingSection, 
  setEditingSection, 
  editingText, 
  setEditingText, 
  checkCanEdit, 
  handleAIAction, 
  handleSaveManualEdit 
}) {
  const isLoading = sectionLoading?.[sectionType];
  const isEditing = editingSection === sectionType;

  return (
    <div className="ai-action-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', marginBottom: '16px', alignItems: 'center' }}>
      {isLoading ? (
        <span className="ai-action-loading" style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}><IconSpinner /> AI is processing...</span>
      ) : (
        <>
          <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Regenerate')) return; handleAIAction(sectionType, 'regenerate'); }}>🔄 Regenerate</button>
          <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Rewrite')) return; handleAIAction(sectionType, 'rewrite'); }}>✍️ Rewrite</button>
          <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Expand')) return; handleAIAction(sectionType, 'expand'); }}>➕ Expand</button>
          <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Shorten')) return; handleAIAction(sectionType, 'shorten'); }}>➖ Shorten</button>
          <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Simplify')) return; handleAIAction(sectionType, 'simplify'); }}>💡 Simplify</button>
          
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <>
                <button className="ai-pill-btn save" style={{ background: 'var(--accent-green)', color: '#fff' }} onClick={() => {
                  if (customSaveHandler) {
                    customSaveHandler(editingText);
                  } else {
                    handleSaveManualEdit(sectionType, editingText);
                  }
                }}>💾 Save</button>
                <button className="ai-pill-btn cancel" onClick={() => setEditingSection(null)}>Cancel</button>
              </>
            ) : (
              <button className="ai-pill-btn edit" onClick={() => {
                if (!checkCanEdit('edit this section')) return;
                setEditingSection(sectionType);
                setEditingText(typeof currentVal === 'string' ? currentVal : JSON.stringify(currentVal, null, 2));
              }}>✏️ Edit</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function CustomSectionsList({
  courseData,
  currentGeneratingLessonIdx,
  activeRole,
  structure,
  editingSection,
  setEditingSection,
  editingText,
  setEditingText,
  renderAIActionBar
}) {
  const curLesson = courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.[0];
  const curSecs = curLesson?.sections?.[activeRole] || {};
  const structLesson = structure.find(l => l.id === curLesson?.id || l.title === curLesson?.title);
  const customSecList = structLesson?.sections?.[activeRole]?.filter(s => !s.locked) || [];
  
  return customSecList.map((sec) => {
    const secContent = curSecs[sec.type] || `Content for ${sec.title} is not generated yet.`;
    const isEditing = editingSection === sec.type;
    
    return (
      <div key={sec.type} id={`step7-sec-${sec.type}`} className="content-block" style={{ scrollMarginTop: '110px' }}>
        <h3 style={{ marginBottom: '10px' }}>{sec.title}</h3>
        {isEditing ? (
          <textarea 
            className="prompt-textarea" 
            style={{ minHeight: '150px' }} 
            value={editingText} 
            onChange={(e) => setEditingText(e.target.value)} 
          />
        ) : (
          <ContentRenderer text={typeof secContent === 'string' ? secContent : JSON.stringify(secContent, null, 2)} />
        )}
        {renderAIActionBar(sec.type, secContent)}
      </div>
    );
  });
}
