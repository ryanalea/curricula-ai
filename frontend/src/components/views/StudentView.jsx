import React, { useState, useEffect } from 'react';
import { ContentRenderer } from '../common/ContentRenderer';

export function StudentView({
  activeLessonContent,
  sectionOrder = [],
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
  const DEFAULT_ORDER = [
    { type: 'why_this_matters', title: 'Why This Matters', locked: true },
    { type: 'practice', title: 'Interactive Coding Practice', locked: true },
    { type: 'debugging', title: 'Debugging Pitfalls', locked: true },
    { type: 'ethics', title: 'Ethics & Code Principles', locked: true }
  ];
  const listToRender = sectionOrder && sectionOrder.length > 0 ? sectionOrder : DEFAULT_ORDER;
  const [practiceForm, setPracticeForm] = useState({
    interactive_exercise: '',
    code_block: '',
    checklistText: ''
  });

  useEffect(() => {
    if (editingSection === 'practice') {
      const p = activeLessonContent.practice || {};
      setPracticeForm({
        interactive_exercise: p.interactive_exercise || p.task || p.scenario || '',
        code_block: p.code_block || p.starter_code || '',
        checklistText: Array.isArray(p.checklist) ? p.checklist.join('\n') : ''
      });
    }
  }, [editingSection, activeLessonContent.practice]);

  const handleSavePractice = () => {
    const existing = activeLessonContent.practice || {};
    const updated = {
      ...existing,
      interactive_exercise: practiceForm.interactive_exercise,
      task: practiceForm.interactive_exercise,
      code_block: practiceForm.code_block,
      checklist: practiceForm.checklistText.split('\n').map(s => s.trim()).filter(Boolean)
    };
    handleSaveManualEdit('practice', updated);
  };


  const renderSection = (sec) => {
    const type = sec.type === 'why_matters' ? 'why_this_matters' : sec.type;

    if (type === 'why_this_matters') return (
      <div key="why_this_matters" id="step7-sec-why_this_matters" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>💡 Why This Matters</h3>
          {editingSection === 'why_this_matters' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('why_this_matters', editingText)}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Why This Matters')) return; setEditingSection('why_this_matters'); setEditingText(activeLessonContent.why_this_matters || activeLessonContent.why_matters || ''); }}>Edit</button>)}
        </div>
        {editingSection === 'why_this_matters' ? (<textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />) : (<div className="why-matters-card" style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--gold)', marginBottom: '10px' }}><ContentRenderer text={activeLessonContent.why_this_matters || activeLessonContent.why_matters || 'Understanding this module provides core skills for technical excellence.'} /></div>)}
        {renderAIActionBar && renderAIActionBar('why_this_matters', activeLessonContent.why_this_matters || activeLessonContent.why_matters)}
      </div>
    );

    if (type === 'practice') return (
      <div key="practice" id="step7-sec-practice" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>{activeLessonContent.practice?.content_type === 'markdown' || !activeLessonContent.practice?.code_block ? '📋 Interactive Scenario & Case Study' : '💻 Interactive Coding Sandbox'}</h3>
          {editingSection === 'practice' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={handleSavePractice}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Interactive Sandbox')) return; setEditingSection('practice'); }}>Edit</button>)}
        </div>
        {editingSection === 'practice' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)' }}>Task / Interactive Objective:</label><textarea className="prompt-textarea" style={{ minHeight: '70px', marginTop: '4px' }} value={practiceForm.interactive_exercise} onChange={(e) => setPracticeForm(prev => ({ ...prev, interactive_exercise: e.target.value }))} placeholder="Describe the student task or interactive scenario..." /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)' }}>Starter Code Template:</label><textarea className="prompt-textarea" style={{ minHeight: '100px', fontFamily: 'monospace', fontSize: '0.85rem', marginTop: '4px' }} value={practiceForm.code_block} onChange={(e) => setPracticeForm(prev => ({ ...prev, code_block: e.target.value }))} placeholder="// Starter code..." /></div>
            <div><label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)' }}>Practice Checklist (one item per line):</label><textarea className="prompt-textarea" style={{ minHeight: '80px', marginTop: '4px' }} value={practiceForm.checklistText} onChange={(e) => setPracticeForm(prev => ({ ...prev, checklistText: e.target.value }))} placeholder="Step 1..." /></div>
          </div>
        ) : (
          <>
            {activeLessonContent.practice?.content_type === 'markdown' || !activeLessonContent.practice?.code_block ? (
              <div className="why-matters-card" style={{ background: 'var(--surface-2)', marginBottom: '16px', borderLeft: '4px solid var(--gold)' }}><ContentRenderer text={activeLessonContent.practice?.scenario || activeLessonContent.practice?.interactive_exercise || activeLessonContent.practice?.description || (typeof activeLessonContent.practice === 'string' ? activeLessonContent.practice : 'Read the scenario below and complete the checklist items.')} /></div>
            ) : (
              <pre className="code-block">{activeLessonContent.practice?.code_block || activeLessonContent.practice?.starter_code || '// No starter code template provided'}</pre>
            )}
            <div className="exercise-task" style={{ marginTop: '10px' }}><strong>Task / Objective:</strong> {activeLessonContent.practice?.interactive_exercise || activeLessonContent.practice?.task || 'Complete the interactive exercise below.'}</div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 750, marginTop: '16px' }}>Practice Checklist</h4>
            <ul className="checklist">{(activeLessonContent.practice?.checklist || []).map((item, idx) => (<li key={idx}><span className="check-icon">✓</span>{item}</li>))}</ul>
          </>
        )}
      </div>
    );

    if (type === 'debugging') return (
      <div key="debugging" id="step7-sec-debugging" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Debugging Pitfalls</h3>
          {editingSection === 'debugging' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('debugging', editingText)}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Debugging Pitfalls')) return; setEditingSection('debugging'); setEditingText(activeLessonContent.debugging || ''); }}>Edit</button>)}
        </div>
        {editingSection === 'debugging' ? (<textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />) : (<ContentRenderer text={activeLessonContent.debugging} />)}
        {renderAIActionBar && renderAIActionBar('debugging', activeLessonContent.debugging)}
      </div>
    );

    if (type === 'ethics') return (
      <div key="ethics" id="step7-sec-ethics" className="content-block" style={{ scrollMarginTop: '110px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>Ethics &amp; Code Principles</h3>
          {editingSection === 'ethics' ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('ethics', editingText)}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { if (checkCanEdit && !checkCanEdit('edit Ethics & Principles')) return; setEditingSection('ethics'); setEditingText(activeLessonContent.ethics || ''); }}>Edit</button>)}
        </div>
        {editingSection === 'ethics' ? (<textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />) : (<ContentRenderer text={activeLessonContent.ethics} />)}
        {renderAIActionBar && renderAIActionBar('ethics', activeLessonContent.ethics)}
      </div>
    );

    // Custom unlocked sections
    if (!sec.locked) {
      const rawContent = activeLessonContent[sec.type];
      const secContent = (rawContent && typeof rawContent === 'string' && !rawContent.includes('is not generated yet')) ? rawContent : (typeof rawContent === 'object' && rawContent !== null ? rawContent : `### ${sec.title}\nThis section provides activities for **${sec.title}**.`);
      const isEditing = editingSection === sec.type;
      return (
        <div key={sec.type} id={`step7-sec-${sec.type}`} className="content-block" style={{ scrollMarginTop: '110px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>{sec.title}</h3>
            {isEditing ? (<div style={{ display: 'flex', gap: '8px' }}><button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit(sec.type, editingText)}>Save</button><button className="ai-pill-btn" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }} onClick={() => setEditingSection(null)}>Cancel</button></div>) : (<button className="ai-pill-btn edit" onClick={() => { setEditingSection(sec.type); setEditingText(typeof secContent === 'string' ? secContent : JSON.stringify(secContent, null, 2)); }}>Edit</button>)}
          </div>
          {isEditing ? (<textarea className="prompt-textarea" style={{ minHeight: '150px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />) : (<ContentRenderer text={typeof secContent === 'string' ? secContent : JSON.stringify(secContent, null, 2)} />)}
          {renderAIActionBar && renderAIActionBar(sec.type, secContent)}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {listToRender.map((sec) => <React.Fragment key={sec.type || sec.id}>{renderSection(sec)}</React.Fragment>)}
    </>
  );
}
