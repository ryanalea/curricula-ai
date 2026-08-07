import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconArrow = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);
const IconLayers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
);
const IconGrid = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const IconBook = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
);
const IconSpinner = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" className="spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 010 20" strokeLinecap="round"/></svg>
);
const IconCheck = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
);
const IconPlus = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
);
const IconTrash = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
);
const IconUpload = () => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
);
const IconClock = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const IconUser = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

// ─── Step Progress Bar ────────────────────────────────────────────────────────
const STEPS = [
  { key: 'dashboard', label: 'Prompt' },
  { key: 'context',   label: 'Config' },
  { key: 'grounding', label: 'Grounding' },
  { key: 'proposal',  label: 'Proposals' },
  { key: 'structure', label: 'Outline' },
  { key: 'review',    label: 'Review' },
  { key: 'generating', label: 'Generating' },
  { key: 'generated', label: 'Complete' },
];
const WORKFLOW_STEPS = STEPS.map(s => s.key);

function StepProgressBar({ currentStep }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(currentStep);
  if (currentIdx <= 0) return null;
  return (
    <div className="step-progress-bar">
      {STEPS.slice(1).map((step, i) => {
        const idx = i + 1;
        const isDone = currentIdx > idx;
        const isActive = currentIdx === idx;
        return (
          <React.Fragment key={step.key}>
            <div className={`step-node ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
              <div className="step-node-circle">
                {isDone ? <IconCheck /> : <span>{idx}</span>}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 2 && <div className={`step-connector ${isDone ? 'done' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Markdown-lite renderer ───────────────────────────────────────────────────
function ContentRenderer({ text }) {
  if (!text) return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content available.</p>;
  const lines = String(text).split('\n');
  const elements = [];
  let codeBuffer = [];
  let inCode = false;
  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(<pre key={`code-${i}`} className="code-block">{codeBuffer.join('\n')}</pre>);
        codeBuffer = []; inCode = false;
      } else { inCode = true; }
      return;
    }
    if (inCode) { codeBuffer.push(line); return; }
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="content-h3">{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="content-h2">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="content-h1">{line.slice(2)}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i} className="content-li">{line.slice(2)}</li>);
    } else if (line.trim() === '') {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} className="content-p">{line}</p>);
    }
  });
  return <div className="content-renderer">{elements}</div>;
}

export default function App() {
  // ── Navigation ──
  const [currentStep, setCurrentStep] = useState('dashboard');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── Dashboard ──
  const [promptText, setPromptText] = useState('');
  const [isAgentMode, setIsAgentMode] = useState('agent');
  const [sessionsList, setSessionsList] = useState([]);
  const [showMyCourses, setShowMyCourses] = useState(false);

  const suggestedPrompts = [
    { title: 'Machine Learning Essentials', desc: 'Training models, feature engineering, and neural network basics.', prompt: 'Machine Learning Essentials with Python' },
    { title: 'React Native UI Core', desc: 'Build modular component libraries, responsive view grids, and gesture routing.', prompt: 'React Native Mobile App UI development' },
    { title: 'Modern Go Pipelines', desc: 'Master concurrent channel structures, concurrency patterns, and microservices.', prompt: 'Go Concurrent pipelines and microservice architectural patterns' },
  ];

  // ── Context & Config ──
  const [techTags, setTechTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [configLessons, setConfigLessons] = useState(5);
  const [configDuration, setConfigDuration] = useState(60);
  const [configDifficulty, setConfigDifficulty] = useState('Beginner');
  const [configAudience, setConfigAudience] = useState('Student');
  const [subjectContext, setSubjectContext] = useState('');

  // ── Grounding ──
  const [prerequisites, setPrerequisites] = useState([]);
  const [boundaries, setBoundaries] = useState([]);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [newPrereq, setNewPrereq] = useState('');
  const [newBoundary, setNewBoundary] = useState('');
  const [newOutcome, setNewOutcome] = useState('');

  // ── Proposals ──
  const [proposals, setProposals] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState(null);

  // ── Structure ──
  const [structure, setStructure] = useState([]);

  // ── Generation ──
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');

  // ── Generated Course ──
  const [courseData, setCourseData] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeRole, setActiveRole] = useState('creator');

  // ── Load sessions list ──
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/courses/sessions`);
      if (res.ok) setSessionsList(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Polling generation progress ──
  useEffect(() => {
    let interval = null;
    if (currentStep === 'generating' && sessionId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            setGenerationProgress(data.progress);
            setGenerationStatusText(data.status_text);
            if (data.status === 'completed') {
              clearInterval(interval);
              setCourseData(data);
              if (data.lessons?.length > 0) setActiveLessonId(data.lessons[0].id);
              setCurrentStep('generated');
              fetchSessions();
            } else if (data.status === 'error') {
              clearInterval(interval);
              alert(data.status_text);
              setCurrentStep('review');
            }
          }
        } catch { /* ignore */ }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [currentStep, sessionId, fetchSessions]);

  // ── Step 1: Create Session ──
  const handleStartSession = async (promptVal) => {
    const textToSubmit = promptVal || promptText;
    if (!textToSubmit.trim()) {
      alert('Please enter a course topic/prompt first.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: textToSubmit }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setPromptText(textToSubmit);
        setTechTags(data.tech_tags || []);
        setConfigLessons(data.config?.lessons_count || 5);
        setConfigDuration(data.config?.duration || 60);
        setConfigDifficulty(data.config?.difficulty || 'Beginner');
        setConfigAudience(data.config?.target_audience || 'Student');
        setSubjectContext(data.subject_context || '');
        setCurrentStep('context');
        fetchSessions();
      } else {
        alert('Failed to start session.');
      }
    } catch {
      alert('Error contacting API server. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Save Config & Generate Proposals ──
  const handleGenerateProposals = async () => {
    setIsLoading(true);
    try {
      await fetch(`${API_BASE}/courses/sessions/${sessionId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessons_count: configLessons,
          duration: configDuration,
          difficulty: configDifficulty,
          target_audience: configAudience,
          subject_context: subjectContext,
        }),
      });
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/generate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
        // Fetch fresh session data to populate grounding from AI
        const sessionRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setPrerequisites(sessionData.prerequisites || []);
          setBoundaries(sessionData.out_of_scope || []);
          setLearningOutcomes(sessionData.learning_outcomes || []);
        }
        setCurrentStep('grounding');
      } else {
        alert('Failed to generate proposals.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Save Grounding ──
  const handleSaveGrounding = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tech_tags: techTags,
          prerequisites,
          out_of_scope: boundaries,
          learning_outcomes: learningOutcomes,
          target_audience: configAudience,
        }),
      });
      if (res.ok) {
        setCurrentStep('proposal');
      } else {
        alert('Failed to save grounding data.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 4: Select Proposal ──
  const handleSelectProposal = async (propId) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_proposal_id: propId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedProposalId(propId);
        setStructure(data.structure || []);
        setCurrentStep('structure');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 5: Save Structure ──
  const handleSaveStructure = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: structure }),
      });
      if (res.ok) setCurrentStep('review');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 6: Trigger Generation ──
  const handleTriggerGeneration = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/content/generate`, {
        method: 'POST',
      });
      if (res.ok) {
        setGenerationProgress(5);
        setGenerationStatusText('Preparing generation pipeline...');
        setCurrentStep('generating');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resume a session ──
  const handleResumeSession = async (sess) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sess.session_id}`);
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        setPromptText(data.prompt || '');
        setTechTags(data.tech_tags || []);
        setConfigLessons(data.config?.lessons_count || 5);
        setConfigDuration(data.config?.duration || 60);
        setConfigDifficulty(data.config?.difficulty || 'Beginner');
        setConfigAudience(data.config?.target_audience || 'Student');
        setSubjectContext(data.subject_context || '');
        setPrerequisites(data.prerequisites || []);
        setBoundaries(data.out_of_scope || []);
        setLearningOutcomes(data.learning_outcomes || []);
        setProposals(data.proposals || []);
        setSelectedProposalId(data.selected_proposal_id || null);
        setStructure(data.structure || []);

        if (data.status === 'completed' && data.lessons?.length > 0) {
          setCourseData(data);
          setActiveLessonId(data.lessons[0].id);
          setCurrentStep('generated');
        } else {
          // Resume at appropriate step
          const stepMap = { context: 'context', grounding: 'grounding', proposal: 'proposal', structure: 'structure', review: 'review', generated: 'review' };
          setCurrentStep(stepMap[data.step] || 'context');
        }
        setShowMyCourses(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Structure helpers ──
  const moveLesson = (index, direction) => {
    const updated = [...structure];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    [updated[index], updated[targetIdx]] = [updated[targetIdx], updated[index]];
    updated.forEach((item, idx) => { item.order = idx + 1; });
    setStructure(updated);
  };
  const deleteLesson = (index) => {
    const updated = structure.filter((_, idx) => idx !== index);
    updated.forEach((item, idx) => { item.order = idx + 1; });
    setStructure(updated);
  };
  const duplicateLesson = (index) => {
    const target = structure[index];
    const newItem = { id: Date.now(), title: `${target.title} (Copy)`, order: target.order + 1 };
    const updated = [...structure];
    updated.splice(index + 1, 0, newItem);
    updated.forEach((item, idx) => { item.order = idx + 1; });
    setStructure(updated);
  };
  const addLesson = () => {
    setStructure([...structure, { id: Date.now(), title: 'New Lesson Module', order: structure.length + 1 }]);
  };

  // ── Tag helpers ──
  const addTag = (e) => {
    if (e?.key && e.key !== 'Enter') return;
    if (newTag.trim() && !techTags.includes(newTag.trim())) {
      setTechTags([...techTags, newTag.trim()]);
      setNewTag('');
    }
  };
  const removeTag = (tag) => setTechTags(techTags.filter(t => t !== tag));

  // ── List item helpers ──
  const addListItem = (setter, value, setValue, e) => {
    if (e?.key && e.key !== 'Enter') return;
    if (value.trim()) { setter(prev => [...prev, value.trim()]); setValue(''); }
  };
  const removeListItem = (setter, idx) => setter(prev => prev.filter((_, i) => i !== idx));

  // ── Active lesson content ──
  const activeLessonContent = courseData?.lessons?.find(l => l.id === activeLessonId)?.sections?.[activeRole] || {};

  const goToDashboard = () => {
    setCurrentStep('dashboard');
    setShowMyCourses(false);
    setSessionId(null);
    setPromptText('');
    setProposals([]);
    setStructure([]);
    setCourseData(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">

      {/* ── Sidebar ── */}
      <div className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo-area">
          <div className="sidebar-logo" onClick={goToDashboard}>
            <div className="sidebar-logo-mark">
              <img src="/m-logo.png" alt="Maxy" width="36" height="36" style={{ borderRadius: '10px', display: 'block' }} />
            </div>
            <div className="sidebar-logo-text">
              <span className="sidebar-logo-name">Curricula AI</span>
              <span className="sidebar-logo-byline">by Maxy Academy</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav-links">
          <span className="nav-section-label">Main</span>
          <div
            className={`nav-item ${!showMyCourses && currentStep === 'dashboard' ? 'active' : ''}`}
            onClick={goToDashboard}
          >
            <IconGrid />
            <span>Dashboard</span>
          </div>
          <div
            className={`nav-item ${showMyCourses ? 'active' : ''}`}
            onClick={() => { setShowMyCourses(true); fetchSessions(); }}
          >
            <IconBook />
            <span>My Courses</span>
            {sessionsList.length > 0 && (
              <span className="nav-badge">{sessionsList.length}</span>
            )}
          </div>

          <span className="nav-section-label" style={{ marginTop: '8px' }}>Workspace</span>
          <div className="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Drafts</span>
          </div>
          <div className="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
            <span>Generated Docs</span>
          </div>
          <div className="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>AI Assets</span>
          </div>
          <div className="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span>Templates</span>
          </div>

          <span className="nav-section-label" style={{ marginTop: '8px' }}>Account</span>
          <div className="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span>Settings</span>
          </div>
        </div>

        {/* Session indicator */}
        {sessionId && !showMyCourses && (
          <div className="sidebar-session-info">
            <div className="session-info-label">Active Session</div>
            <div className="session-info-prompt">{promptText?.slice(0, 60)}{promptText?.length > 60 ? '…' : ''}</div>
            <div className="session-steps">
              {STEPS.slice(1).map((step, i) => {
                const idx = i + 1;
                const curIdx = WORKFLOW_STEPS.indexOf(currentStep);
                return (
                  <div
                    key={step.key}
                    className={`session-step-dot ${curIdx > idx ? 'done' : ''} ${curIdx === idx ? 'active' : ''}`}
                    title={step.label}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="main-content">

        {/* ── Step Progress Bar ── */}
        <StepProgressBar currentStep={currentStep} />

        {/* ══════════════════════════════════════════════ */}
        {/* MY COURSES PAGE */}
        {/* ══════════════════════════════════════════════ */}
        {showMyCourses && (
          <div>
            <div className="header">
              <div>
                <h2>My Courses</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Resume or review your past generation sessions.</p>
              </div>
              <button className="action-btn" onClick={goToDashboard}>
                <IconPlus /> New Course
              </button>
            </div>

            {sessionsList.length === 0 ? (
              <div className="empty-state">
                <IconBook />
                <h3>No courses yet</h3>
                <p>Start a new course from the Dashboard to see it here.</p>
                <button className="action-btn" onClick={goToDashboard} style={{ marginTop: '20px' }}>
                  Create First Course <IconArrow />
                </button>
              </div>
            ) : (
              <div className="sessions-grid">
                {sessionsList.map((sess) => (
                  <div key={sess.session_id} className="session-card">
                    <div className="session-card-header">
                      <span className={`session-status-badge ${sess.status}`}>{sess.status}</span>
                      <div className="session-card-meta">
                        <span><IconClock /> {sess.difficulty}</span>
                        <span><IconUser /> {sess.audience}</span>
                      </div>
                    </div>
                    <h3 className="session-card-title">{sess.title || sess.prompt}</h3>
                    <p className="session-card-prompt">{sess.prompt}</p>
                    {sess.status === 'generating' && (
                      <div className="session-mini-progress">
                        <div className="session-mini-bar" style={{ width: `${sess.progress}%` }} />
                      </div>
                    )}
                    <button
                      className="action-btn"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                      onClick={() => handleResumeSession(sess)}
                      disabled={isLoading}
                    >
                      {sess.status === 'completed' ? 'View Course' : 'Resume'} <IconArrow />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 1: DASHBOARD */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'dashboard' && (
          <div>
            <div className="hero-section">
              <div className="hero-eyebrow">
                <span className="hero-eyebrow-dot" />
                AI Course Generator — Powered by Maxy Academy
              </div>
              <h1 className="hero-title">
                Build Courses that <mark>Actually</mark> Teach.
              </h1>
              <p className="hero-subtitle">
                Design multi-role learning experiences using the RTFC instructional pipeline — Creator, Student, and Educator views, all generated by AI.
              </p>
            </div>

            <div className="prompt-card">
              <textarea
                className="prompt-textarea"
                placeholder="Create a course about..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') handleStartSession(); }}
              />
              <div className="prompt-controls">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="file-upload-btn">
                    <IconUpload /> Upload Knowledge Base (PDF, DOCX)
                  </button>
                  <select
                    className="file-upload-btn"
                    value={isAgentMode}
                    onChange={(e) => setIsAgentMode(e.target.value)}
                    style={{ background: 'var(--surface-2)', color: 'var(--navy)' }}
                  >
                    <option value="agent">Agent Planning (Auto Workflow)</option>
                    <option value="outline">Planning Only (Outline Only)</option>
                  </select>
                </div>
                <button className="action-btn" onClick={() => handleStartSession()} disabled={isLoading}>
                  {isLoading ? <><IconSpinner /> Initializing…</> : <>Start Generation <IconArrow /></>}
                </button>
              </div>
            </div>

            <h2 style={{ marginTop: '40px', marginBottom: '24px' }}>Suggested Prompts</h2>
            <div className="suggested-grid">
              {suggestedPrompts.map((card, idx) => (
                <div key={idx} className="suggested-card" onClick={() => !isLoading && handleStartSession(card.prompt)}>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 2: CONTEXT CONFIG */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'context' && (
          <div>
            <div className="header">
              <div>
                <h2>Course Context Config</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Set parameters — we'll use these to generate AI grounding proposals.</p>
              </div>
              <span className="step-chip">Step 1 of 7</span>
            </div>

            <div className="prompt-card">
              <h3 style={{ marginBottom: '20px' }}>Configure Parameters</h3>
              <div className="config-grid">
                <div className="config-item">
                  <label>Number of Lessons</label>
                  <div className="stepper">
                    <button onClick={() => setConfigLessons(Math.max(1, configLessons - 1))}>−</button>
                    <span>{configLessons}</span>
                    <button onClick={() => setConfigLessons(configLessons + 1)}>+</button>
                  </div>
                </div>

                <div className="config-item">
                  <label>Average Duration (Minutes)</label>
                  <select className="prompt-textarea" value={configDuration} onChange={(e) => setConfigDuration(Number(e.target.value))} style={{ minHeight: 'auto', padding: '10px' }}>
                    <option value="30">30 Minutes</option>
                    <option value="60">60 Minutes</option>
                    <option value="90">90 Minutes</option>
                    <option value="120">120 Minutes</option>
                  </select>
                </div>

                <div className="config-item">
                  <label>Difficulty Level</label>
                  <select className="prompt-textarea" value={configDifficulty} onChange={(e) => setConfigDifficulty(e.target.value)} style={{ minHeight: 'auto', padding: '10px' }}>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="config-item">
                  <label>Target Audience</label>
                  <select className="prompt-textarea" value={configAudience} onChange={(e) => setConfigAudience(e.target.value)} style={{ minHeight: 'auto', padding: '10px' }}>
                    <option value="Student">Student</option>
                    <option value="Employee">Employee</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>
              </div>

              <h3 style={{ marginBottom: '12px' }}>Technical Stack Tags</h3>
              <div className="tags-container">
                {techTags.map((tag, idx) => (
                  <span key={idx} className="tag-badge">
                    {tag}
                    <span className="tag-close" onClick={() => removeTag(tag)}>×</span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <input
                  type="text"
                  className="prompt-textarea"
                  style={{ minHeight: 'auto', padding: '10px', maxWidth: '300px', marginBottom: 0 }}
                  placeholder="Add tech tag and press Enter…"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={addTag}
                />
                <button className="file-upload-btn" onClick={addTag}>Add Tag</button>
              </div>

              <h3 style={{ marginBottom: '12px' }}>Subject Matter Context</h3>
              <div className="rich-editor-toolbar">
                <button className="toolbar-btn">B</button>
                <button className="toolbar-btn">I</button>
                <button className="toolbar-btn">List</button>
                <button className="toolbar-btn">Link</button>
              </div>
              <textarea
                className="prompt-textarea"
                value={subjectContext}
                onChange={(e) => setSubjectContext(e.target.value)}
                style={{ minHeight: '180px' }}
                placeholder="Add any extra context about this subject matter to improve AI quality…"
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button className="file-upload-btn" onClick={() => setCurrentStep('dashboard')}>← Back</button>
                <button className="action-btn" onClick={handleGenerateProposals} disabled={isLoading}>
                  {isLoading ? <><IconSpinner /> Generating Grounding…</> : <>Generate Grounding &amp; Proposals <IconArrow /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 3: GROUNDING */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'grounding' && (
          <div>
            <div className="header">
              <div>
                <h2>Define Grounding &amp; Boundaries</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Review and edit the AI-generated grounding parameters for your course.</p>
              </div>
              <span className="step-chip">Step 2 of 7</span>
            </div>

            <div className="prompt-card">
              {[
                { label: 'Prerequisites', items: prerequisites, setter: setPrerequisites, newVal: newPrereq, setNew: setNewPrereq, placeholder: 'Add prerequisite knowledge…' },
                { label: 'Boundaries (Out of Scope)', items: boundaries, setter: setBoundaries, newVal: newBoundary, setNew: setNewBoundary, placeholder: 'Add out-of-scope topic…' },
                { label: 'Learning Outcomes', items: learningOutcomes, setter: setLearningOutcomes, newVal: newOutcome, setNew: setNewOutcome, placeholder: 'Add learning outcome…' },
              ].map(({ label, items, setter, newVal, setNew, placeholder }) => (
                <div key={label} style={{ marginBottom: '32px' }}>
                  <h3 style={{ marginBottom: '14px' }}>{label}</h3>
                  {items.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>None added yet.</p>
                  )}
                  <ul className="grounding-list">
                    {items.map((item, idx) => (
                      <li key={idx} className="grounding-list-item">
                        <span>{item}</span>
                        <button className="icon-btn danger" onClick={() => removeListItem(setter, idx)}><IconTrash /></button>
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="prompt-textarea"
                      style={{ minHeight: 'auto', padding: '10px', marginBottom: 0 }}
                      placeholder={placeholder}
                      value={newVal}
                      onChange={(e) => setNew(e.target.value)}
                      onKeyDown={(e) => addListItem(setter, newVal, setNew, e)}
                    />
                    <button className="file-upload-btn" onClick={() => addListItem(setter, newVal, setNew)}>Add</button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button className="file-upload-btn" onClick={() => setCurrentStep('context')}>← Back</button>
                <button className="action-btn" onClick={handleSaveGrounding} disabled={isLoading}>
                  {isLoading ? <><IconSpinner /> Saving…</> : <>Confirm Grounding &amp; View Proposals <IconArrow /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 4: PROPOSALS */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'proposal' && (
          <div>
            <div className="header">
              <div>
                <h2>Select Course Proposal</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Choose one of the AI-generated curriculum approaches below.</p>
              </div>
              <span className="step-chip">Step 3 of 7</span>
            </div>

            <div className="proposal-grid">
              {proposals.map((prop) => (
                <div
                  key={prop.id}
                  className={`proposal-card ${prop.id === 2 ? 'recommended' : ''} ${selectedProposalId === prop.id ? 'selected' : ''} ${isLoading ? 'disabled' : ''}`}
                  onClick={() => !isLoading && handleSelectProposal(prop.id)}
                >
                  {prop.id === 2 && <span className="badge-badge">Recommended</span>}
                  <h3>{prop.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{prop.description}</p>
                  <div className="proposal-meta">
                    <div><strong>Focus:</strong> {prop.differentiators}</div>
                    <div><strong>Difficulty:</strong> {prop.difficulty}</div>
                    <div><strong>Est. Duration:</strong> {prop.estimated_hours} hrs</div>
                    <div><strong>For:</strong> {prop.target_user}</div>
                  </div>
                  <button
                    className="action-btn"
                    style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
                    disabled={isLoading}
                  >
                    {isLoading && selectedProposalId === prop.id ? <><IconSpinner /> Loading…</> : 'Select This Proposal'}
                  </button>
                </div>
              ))}
            </div>
            <button className="file-upload-btn" onClick={() => setCurrentStep('grounding')}>← Back</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 5: STRUCTURE */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'structure' && (
          <div>
            <div className="header">
              <div>
                <h2>Edit Curriculum Outline</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Reorder, rename, add or remove lesson modules.</p>
              </div>
              <span className="step-chip">Step 4 of 7</span>
            </div>

            <div className="prompt-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <h3>Lesson Module Sequence ({structure.length} lessons)</h3>
                <button className="file-upload-btn" onClick={addLesson}><IconPlus /> Add Lesson</button>
              </div>

              {structure.map((item, idx) => (
                <div key={item.id} className="structure-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1 }}>
                    <span className="structure-order">{item.order}</span>
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...structure];
                        updated[idx].title = e.target.value;
                        setStructure(updated);
                      }}
                      className="structure-title-input"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn" onClick={() => moveLesson(idx, -1)} title="Move Up">▲</button>
                    <button className="icon-btn" onClick={() => moveLesson(idx, 1)} title="Move Down">▼</button>
                    <button className="icon-btn" onClick={() => duplicateLesson(idx)} title="Duplicate" style={{ color: 'var(--accent-orange)' }}>⧉</button>
                    <button className="icon-btn danger" onClick={() => deleteLesson(idx)} title="Delete"><IconTrash /></button>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                <button className="file-upload-btn" onClick={() => setCurrentStep('proposal')}>← Back</button>
                <button className="action-btn" onClick={handleSaveStructure} disabled={isLoading}>
                  {isLoading ? <><IconSpinner /> Saving…</> : <>Proceed to Review <IconArrow /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 6: REVIEW */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'review' && (
          <div>
            <div className="header">
              <div>
                <h2>Final Review</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Confirm everything before starting AI content generation.</p>
              </div>
              <span className="step-chip">Step 5 of 7</span>
            </div>

            <div className="prompt-card">
              <h3 style={{ marginBottom: '20px' }}>Summary Configuration</h3>
              <div className="review-grid">
                <div className="review-item">
                  <span className="review-label">Topic / Prompt</span>
                  <span className="review-value">{promptText}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Audience</span>
                  <span className="review-value">{configAudience}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Difficulty</span>
                  <span className="review-value">{configDifficulty}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Lessons</span>
                  <span className="review-value">{structure.length} modules</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Duration</span>
                  <span className="review-value">{configDuration} min/lesson</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Tech Tags</span>
                  <span className="review-value">{techTags.join(', ') || '—'}</span>
                </div>
              </div>

              <h3 style={{ margin: '28px 0 16px' }}>Course Outline ({structure.length} lessons)</h3>
              <ol className="review-outline">
                {structure.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ol>

              <div className="generation-cta">
                <div>
                  <h4>Ready to Generate</h4>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '0.9rem' }}>
                    The AI pipeline will generate Creator, Student, and Educator content for each of the {structure.length} lessons.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="file-upload-btn" onClick={() => setCurrentStep('structure')}>← Back</button>
                  <button className="action-btn" onClick={handleTriggerGeneration} disabled={isLoading}>
                    {isLoading ? <><IconSpinner /> Starting…</> : <>🚀 Start Core Generation <IconArrow /></>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 7: GENERATING */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'generating' && (
          <div className="progress-container">
            <div className="progress-glow-ring">
              <div className="progress-percent">{generationProgress}%</div>
            </div>
            <h2 className="pulse" style={{ fontSize: '1.75rem', marginTop: '24px' }}>Assembling Course Content…</h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '500px' }}>{generationStatusText}</p>
            <div className="progress-bar-outer" style={{ width: '100%', maxWidth: '560px' }}>
              <div className="progress-bar-inner" style={{ width: `${generationProgress}%` }} />
            </div>
            <div className="generation-roles">
              {['Creator POV', 'Student POV', 'Educator POV'].map((role, i) => (
                <span key={role} className={`role-chip ${generationProgress > (i + 1) * 25 ? 'active' : ''}`}>{role}</span>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 8: GENERATED COURSE */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'generated' && courseData && (
          <div>
            <div className="header">
              <div>
                <h2>{courseData.title || courseData.prompt || 'Generated Course'}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {courseData.lessons?.length} lessons · {configDifficulty} · {configAudience}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="file-upload-btn">Export DOCX</button>
                <button className="file-upload-btn">Export PDF</button>
                <button className="action-btn" onClick={goToDashboard}><IconPlus /> New Course</button>
              </div>
            </div>

            {/* Role Switcher */}
            <div className="tab-row">
              {[
                { id: 'creator', label: '🎨 Creator POV' },
                { id: 'student', label: '📚 Student POV' },
                { id: 'educator', label: '👩‍🏫 Educator POV' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  className={`tab-btn ${activeRole === id ? 'active' : ''}`}
                  onClick={() => setActiveRole(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="course-viewport">
              {/* TOC Sidebar */}
              <div className="toc-sidebar">
                <h4 style={{ marginBottom: '16px', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                  Course Lessons
                </h4>
                {courseData.lessons?.map((lesson, idx) => (
                  <button
                    key={lesson.id}
                    className={`toc-item ${activeLessonId === lesson.id ? 'active' : ''}`}
                    onClick={() => setActiveLessonId(lesson.id)}
                    style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <span className="toc-num">{idx + 1}</span>
                    {lesson.title}
                  </button>
                ))}
              </div>

              {/* Content Panel */}
              <div className="editor-panel">
                <div className="rich-editor-toolbar">
                  <button className="toolbar-btn">B</button>
                  <button className="toolbar-btn">I</button>
                  <button className="toolbar-btn">H1</button>
                  <button className="toolbar-btn">Code</button>
                  <button className="toolbar-btn">Undo</button>
                  <button className="toolbar-btn">Redo</button>
                </div>

                {/* Creator POV */}
                {activeRole === 'creator' && (
                  <div className="content-section">
                    <div className="content-block">
                      <h3>Lesson Overview</h3>
                      <ContentRenderer text={activeLessonContent.overview} />
                    </div>

                    <div className="content-block">
                      <h3>Learning Outcomes</h3>
                      {activeLessonContent.learning_outcomes?.length > 0 ? (
                        <ul className="outcome-list">
                          {activeLessonContent.learning_outcomes.map((item, idx) => (
                            <li key={idx}><span className="outcome-dot" />{item}</li>
                          ))}
                        </ul>
                      ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No outcomes available.</p>}
                    </div>

                    <div className="content-block">
                      <h3>Core Technical Material</h3>
                      <ContentRenderer text={activeLessonContent.core_content} />
                    </div>

                    <div className="content-block">
                      <h3>Assessments &amp; Quizzes</h3>
                      {activeLessonContent.quiz?.length > 0 ? activeLessonContent.quiz.map((q, idx) => (
                        <div key={idx} className="quiz-card">
                          <p className="quiz-question"><strong>Q{idx + 1}: {q.question}</strong></p>
                          <ul className="quiz-options">
                            {q.options?.map((opt, i) => (
                              <li key={i} className={q.answer === opt ? 'correct' : ''}>{opt}</li>
                            ))}
                          </ul>
                          <p className="quiz-explanation"><em>Explanation:</em> {q.explanation}</p>
                        </div>
                      )) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No quiz available.</p>}
                    </div>
                  </div>
                )}

                {/* Student POV */}
                {activeRole === 'student' && (
                  <div className="content-section">
                    <div className="why-matters-card">
                      <h4>💡 Why This Matters</h4>
                      <ContentRenderer text={activeLessonContent.why_this_matters} />
                    </div>

                    <div className="content-block">
                      <h3>Interactive Coding Sandbox</h3>
                      <pre className="code-block">{activeLessonContent.practice?.code_block || '// No code block available'}</pre>
                      <div className="exercise-task">
                        <strong>Task:</strong> {activeLessonContent.practice?.interactive_exercise || 'No exercise available.'}
                      </div>
                    </div>

                    <div className="content-block">
                      <h3>Practice Checklist</h3>
                      {activeLessonContent.practice?.checklist?.length > 0 ? (
                        <ul className="checklist">
                          {activeLessonContent.practice.checklist.map((item, idx) => (
                            <li key={idx}><span className="check-icon">✓</span>{item}</li>
                          ))}
                        </ul>
                      ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No checklist available.</p>}
                    </div>

                    <div className="content-block">
                      <h3>Debugging Pitfalls</h3>
                      <ContentRenderer text={activeLessonContent.debugging} />
                    </div>

                    <div className="content-block">
                      <h3>Ethics &amp; Code Principles</h3>
                      <ContentRenderer text={activeLessonContent.ethics} />
                    </div>
                  </div>
                )}

                {/* Educator POV */}
                {activeRole === 'educator' && (
                  <div className="content-section">
                    <div className="content-block">
                      <h3>Facilitator Guide</h3>
                      <ContentRenderer text={activeLessonContent.facilitator_guide} />
                    </div>

                    <div className="lesson-plan-grid">
                      <div className="lesson-plan-card">
                        <h4>🧊 Ice Breaker</h4>
                        <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.ice_breaker || 'No ice breaker available.'}</p>
                      </div>
                      <div className="lesson-plan-card">
                        <h4>⏱ Timing Allocation</h4>
                        <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.timing || 'No timing available.'}</p>
                      </div>
                    </div>

                    <div className="content-block">
                      <h3>Grading Rubric</h3>
                      {activeLessonContent.rubric?.length > 0 ? (
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
                            {activeLessonContent.rubric.map((row, idx) => (
                              <tr key={idx}>
                                <td>{row.criteria}</td>
                                <td style={{ color: 'var(--accent-green)' }}>{row.excellent}</td>
                                <td style={{ color: 'var(--accent-orange)' }}>{row.good}</td>
                                <td style={{ color: 'var(--accent-red)' }}>{row.needs_improvement}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No rubric available.</p>}
                    </div>

                    <div className="content-block">
                      <h3>Discussion Questions</h3>
                      {activeLessonContent.discussion_questions?.length > 0 ? (
                        <ol className="discussion-list">
                          {activeLessonContent.discussion_questions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ol>
                      ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No discussion questions available.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
