import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const [activeSidebarNav, setActiveSidebarNav] = useState('create'); // 'create', 'my_courses', 'drafts', 'docs', 'assets', 'templates', 'settings'

  // Greeting Logic
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning, Lea';
    if (hr < 17) return 'Good Afternoon, Lea';
    return 'Good Evening, Lea';
  };
  const greeting = getGreeting();

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

  // ── Phase 3: Interactive Course & AI Toolbar ──
  const [sectionLoading, setSectionLoading] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editingText, setEditingText] = useState('');

  // ── Phase 4: Export Hub & Versioning states ──
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('docx');
  const [exportRole, setExportRole] = useState('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Phase 2: Structure Details & Inline Editing ──
  const [selectedStructureLessonId, setSelectedStructureLessonId] = useState(null);
  const [activeStructureRole, setActiveStructureRole] = useState('creator');
  const [groundingEditIdx, setGroundingEditIdx] = useState({ type: null, idx: -1 }); // type: 'prereq' | 'boundary' | 'outcome'
  const [groundingEditText, setGroundingEditText] = useState('');
  
  // Modal for new custom section
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionInstruction, setNewSectionInstruction] = useState('');
  const [newSectionRole, setNewSectionRole] = useState('creator');

  // Default structure outline sections placeholder mapping
  const defaultSections = {
    creator: [
      { id: 'sec-1', type: 'overview', title: 'Overview', locked: true, instruction: 'Write a comprehensive course section overview.' },
      { id: 'sec-2', type: 'outcomes', title: 'Learning Outcomes', locked: true, instruction: 'Define observable student learning outcomes.' },
      { id: 'sec-3', type: 'core_content', title: 'Core Content', locked: true, instruction: 'Draft the main instructional curriculum text.' },
      { id: 'sec-4', type: 'exercises', title: 'Exercises', locked: true, instruction: 'Build hands-on practice exercises.' },
      { id: 'sec-5', type: 'quiz', title: 'Quiz', locked: true, instruction: 'Generate multiple-choice review questions.' }
    ],
    student: [
      { id: 'sec-6', type: 'why_matters', title: 'Why This Matters', locked: true, instruction: 'Explain real-world relevance.' },
      { id: 'sec-7', type: 'journey', title: 'Learning Journey', locked: true, instruction: 'Provide structured walk through tips.' },
      { id: 'sec-8', type: 'practice', title: 'Practice Exercises', locked: true, instruction: 'Create student task items.' },
      { id: 'sec-9', type: 'debugging', title: 'Debugging Tips', locked: true, instruction: 'Common issues and error handling.' },
      { id: 'sec-10', type: 'ethics', title: 'Ethics & Best Practices', locked: true, instruction: 'Provide ethical scope and optimization standards.' }
    ],
    educator: [
      { id: 'sec-11', type: 'facilitator', title: 'Facilitator Guide', locked: true, instruction: 'Provide educator delivery outline.' },
      { id: 'sec-12', type: 'engagement', title: 'Engagement Strategies', locked: true, instruction: 'Suggest classroom interactivity plans.' },
      { id: 'sec-13', type: 'rubric', title: 'Assessment Rubric', locked: true, instruction: 'Provide tabular grading guidelines.' },
      { id: 'sec-14', type: 'assessment', title: 'Assessment Tasks', locked: true, instruction: 'Recommend assessment parameters.' },
      { id: 'sec-15', type: 'teaching_tips', title: 'Teaching Tips', locked: true, instruction: 'Instructor shortcuts.' },
      { id: 'sec-16', type: 'discussion', title: 'Discussion Questions', locked: true, instruction: 'Formulate open questions.' }
    ]
  };

  // ── Phase 3: Interactive Course Content Handlers ──
  const handleAIAction = async (sectionType, action, params = {}) => {
    setSectionLoading(prev => ({ ...prev, [sectionType]: true }));
    try {
      const res = await fetch(`${API_BASE}/lessons/${activeLessonId}/sections/ai-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          section_type: sectionType,
          action,
          params
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedVal = JSON.parse(data.content);
        
        // Update courseData local state
        const updatedCourse = { ...courseData };
        const lIdx = updatedCourse.lessons.findIndex(l => l.id === activeLessonId);
        if (lIdx !== -1) {
          updatedCourse.lessons[lIdx].sections[activeRole][sectionType] = updatedVal;
          setCourseData(updatedCourse);
        }
      } else {
        alert('AI Action failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error running AI Action.');
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  const handleSaveManualEdit = async (sectionType, newContent) => {
    setSectionLoading(prev => ({ ...prev, [sectionType]: true }));
    try {
      const res = await fetch(`${API_BASE}/lessons/${activeLessonId}/sections/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          section_type: sectionType,
          content: newContent
        })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedVal = JSON.parse(data.content);
        
        // Update courseData local state
        const updatedCourse = { ...courseData };
        const lIdx = updatedCourse.lessons.findIndex(l => l.id === activeLessonId);
        if (lIdx !== -1) {
          updatedCourse.lessons[lIdx].sections[activeRole][sectionType] = updatedVal;
          setCourseData(updatedCourse);
        }
        setEditingSection(null);
      } else {
        alert('Failed to save manual edits.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving manual edits.');
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  // ── Phase 4: History & Export Handlers ──
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/${sessionId}/history`);
      if (res.ok) {
        setHistoryList(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRestoreHistory = async (historyId) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history/${historyId}/restore`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        const updatedVal = JSON.parse(data.content);
        
        // Find which lesson, role, and sectionType was restored from historyList
        const histItem = historyList.find(h => h.id === historyId);
        if (histItem) {
          const updatedCourse = { ...courseData };
          const lIdx = updatedCourse.lessons.findIndex(l => l.id === histItem.lesson_id);
          if (lIdx !== -1) {
            updatedCourse.lessons[lIdx].sections[histItem.role][histItem.section_type] = updatedVal;
            setCourseData(updatedCourse);
            alert(`Successfully restored: ${histItem.label}`);
          }
        }
      } else {
        alert("Failed to restore history.");
      }
    } catch (err) {
      console.error(err);
      alert("Error restoring history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExport = () => {
    const url = `${API_BASE}/courses/${sessionId}/export?format=${exportFormat}&role=${exportRole}`;
    window.open(url, '_blank');
    setIsExportModalOpen(false);
  };

  // ── Phase 5: Knowledge Base File Upload Handlers ──
  const fileInputRef = useRef(null);

  const handleFileUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let activeSessId = sessionId;
      if (!activeSessId) {
        const textToSubmit = promptText.trim() || `Course based on ${file.name}`;
        const res = await fetch(`${API_BASE}/courses/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: textToSubmit }),
        });
        if (res.ok) {
          const data = await res.json();
          activeSessId = data.session_id;
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
          alert('Failed to start session for upload.');
          setIsLoading(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${API_BASE}/sessions/${activeSessId}/documents/upload`, {
        method: 'POST',
        body: formData
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        setSubjectContext(uploadData.subject_context);
        alert(`Successfully uploaded and parsed context from: ${file.name}`);
      } else {
        alert('Failed to upload and parse document.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading document.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phase 3: Interactive Rendering Helpers ──
  const renderAIActionBar = (sectionType, currentVal, customSaveHandler = null) => {
    const isLoading = sectionLoading[sectionType];
    const isEditing = editingSection === sectionType;

    return (
      <div className="ai-action-bar" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', marginBottom: '16px', alignItems: 'center' }}>
        {isLoading ? (
          <span className="ai-action-loading" style={{ fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600 }}><IconSpinner /> AI is processing...</span>
        ) : (
          <>
            <button className="ai-pill-btn" onClick={() => handleAIAction(sectionType, 'regenerate')}>🔄 Regenerate</button>
            <button className="ai-pill-btn" onClick={() => handleAIAction(sectionType, 'rewrite')}>✍️ Rewrite</button>
            <button className="ai-pill-btn" onClick={() => handleAIAction(sectionType, 'expand')}>➕ Expand</button>
            <button className="ai-pill-btn" onClick={() => handleAIAction(sectionType, 'shorten')}>➖ Shorten</button>
            <button className="ai-pill-btn" onClick={() => handleAIAction(sectionType, 'simplify')}>💡 Simplify</button>
            <button className="ai-pill-btn" onClick={() => {
              const lang = prompt("Enter target language:", "Indonesian");
              if (lang) handleAIAction(sectionType, 'translate', { target_language: lang });
            }}>🌐 Translate</button>
            
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
                  setEditingSection(sectionType);
                  setEditingText(typeof currentVal === 'string' ? currentVal : JSON.stringify(currentVal, null, 2));
                }}>✏️ Edit</button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderQuizManager = () => {
    const quizzes = activeLessonContent.quiz || [];
    const isLoading = sectionLoading['quiz'];

    const handleUpdateQuizItem = (idx, field, value) => {
      const updated = [...quizzes];
      updated[idx] = { ...updated[idx], [field]: value };
      handleSaveManualEdit('quiz', updated);
    };

    const handleUpdateOption = (qIdx, optIdx, val) => {
      const updated = [...quizzes];
      const newOptions = [...(updated[qIdx].options || [])];
      newOptions[optIdx] = val;
      updated[qIdx] = { ...updated[qIdx], options: newOptions };
      handleSaveManualEdit('quiz', updated);
    };

    const handleDeleteQuizItem = (idx) => {
      const updated = quizzes.filter((_, i) => i !== idx);
      handleSaveManualEdit('quiz', updated);
    };

    const handleAddQuizItem = () => {
      const newQuestion = {
        question: "New Multiple Choice Question",
        options: ["Option A", "Option B", "Option C", "Option D"],
        answer: "Option A",
        explanation: "Explanation of correct option."
      };
      handleSaveManualEdit('quiz', [...quizzes, newQuestion]);
    };

    const handleGenerateMoreQuizzes = async () => {
      setSectionLoading(prev => ({ ...prev, quiz: true }));
      try {
        const res = await fetch(`${API_BASE}/lessons/${activeLessonId}/quiz/generate?count=3`, {
          method: 'POST'
        });
        if (res.ok) {
          // Fetch fresh session data
          const sessRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
          if (sessRes.ok) {
            const sessData = await sessRes.json();
            setCourseData(sessData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSectionLoading(prev => ({ ...prev, quiz: false }));
      }
    };

    return (
      <div className="quiz-manager">
        <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', marginTop: '24px' }}>
          <h3 style={{ margin: 0 }}>Assessments &amp; Quizzes</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ai-pill-btn" onClick={handleAddQuizItem} disabled={isLoading}>➕ Add Question</button>
            <button className="ai-pill-btn" onClick={handleGenerateMoreQuizzes} disabled={isLoading}>
              {isLoading ? <IconSpinner /> : '🤖 Generate More (AI)'}
            </button>
          </div>
        </div>

        {quizzes.length > 0 ? quizzes.map((q, idx) => (
          <div key={idx} className="quiz-card edit-mode" style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px', background: 'var(--surface)' }}>
            <div className="quiz-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ color: 'var(--navy)' }}>Question {idx + 1}</strong>
              <button className="icon-btn danger" onClick={() => handleDeleteQuizItem(idx)} title="Delete Question">
                <IconTrash />
              </button>
            </div>
            <div className="config-item">
              <label>Question Text</label>
              <input
                type="text"
                value={q.question}
                onChange={(e) => handleUpdateQuizItem(idx, 'question', e.target.value)}
                className="prompt-textarea"
                style={{ minHeight: 'auto', padding: '8px' }}
              />
            </div>
            <div className="quiz-options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              {(q.options || ["", "", "", ""]).map((opt, i) => (
                <div key={i} className="config-item" style={{ marginBottom: 0 }}>
                  <label>Option {String.fromCharCode(65 + i)}</label>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleUpdateOption(idx, i, e.target.value)}
                    className="prompt-textarea"
                    style={{ minHeight: 'auto', padding: '8px' }}
                  />
                </div>
              ))}
            </div>
            <div className="config-item" style={{ marginTop: '10px' }}>
              <label>Correct Answer</label>
              <select
                value={q.answer}
                onChange={(e) => handleUpdateQuizItem(idx, 'answer', e.target.value)}
                className="prompt-textarea"
                style={{ minHeight: 'auto', padding: '8px' }}
              >
                {(q.options || []).map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="config-item" style={{ marginTop: '10px' }}>
              <label>Explanation</label>
              <textarea
                value={q.explanation}
                onChange={(e) => handleUpdateQuizItem(idx, 'explanation', e.target.value)}
                className="prompt-textarea"
                style={{ minHeight: '60px', padding: '8px' }}
              />
            </div>
          </div>
        )) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No quiz available.</p>}
      </div>
    );
  };

  const renderExerciseManager = () => {
    const exercises = activeLessonContent.exercises || [];
    const isLoading = sectionLoading['exercises'];

    const handleUpdateExerciseItem = (idx, field, value) => {
      const updated = [...exercises];
      updated[idx] = { ...updated[idx], [field]: value };
      handleSaveManualEdit('exercises', updated);
    };

    const handleDeleteExerciseItem = (idx) => {
      const updated = exercises.filter((_, i) => i !== idx);
      handleSaveManualEdit('exercises', updated);
    };

    const handleAddExerciseItem = () => {
      const newEx = {
        title: "New Practical Exercise",
        instruction: "Describe the tasks/instructions for the student here."
      };
      handleSaveManualEdit('exercises', [...exercises, newEx]);
    };

    const handleGenerateMoreExercises = async () => {
      setSectionLoading(prev => ({ ...prev, exercises: true }));
      try {
        const res = await fetch(`${API_BASE}/lessons/${activeLessonId}/exercises/generate?count=1`, {
          method: 'POST'
        });
        if (res.ok) {
          // Fetch fresh session data
          const sessRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
          if (sessRes.ok) {
            const sessData = await sessRes.json();
            setCourseData(sessData);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSectionLoading(prev => ({ ...prev, exercises: false }));
      }
    };

    return (
      <div className="exercise-manager" style={{ marginTop: '24px' }}>
        <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Practical Exercises</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="ai-pill-btn" onClick={handleAddExerciseItem} disabled={isLoading}>➕ Add Exercise</button>
            <button className="ai-pill-btn" onClick={handleGenerateMoreExercises} disabled={isLoading}>
              {isLoading ? <IconSpinner /> : '🤖 Generate Exercise (AI)'}
            </button>
          </div>
        </div>

        {exercises.length > 0 ? exercises.map((ex, idx) => (
          <div key={idx} className="quiz-card edit-mode" style={{ border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px', background: 'var(--surface)' }}>
            <div className="quiz-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ color: 'var(--navy)' }}>Exercise {idx + 1}</strong>
              <button className="icon-btn danger" onClick={() => handleDeleteExerciseItem(idx)} title="Delete Exercise">
                <IconTrash />
              </button>
            </div>
            <div className="config-item">
              <label>Title</label>
              <input
                type="text"
                value={ex.title}
                onChange={(e) => handleUpdateExerciseItem(idx, 'title', e.target.value)}
                className="prompt-textarea"
                style={{ minHeight: 'auto', padding: '8px' }}
              />
            </div>
            <div className="config-item" style={{ marginTop: '10px' }}>
              <label>Instruction</label>
              <textarea
                value={ex.instruction}
                onChange={(e) => handleUpdateExerciseItem(idx, 'instruction', e.target.value)}
                className="prompt-textarea"
                style={{ minHeight: '80px', padding: '8px' }}
              />
            </div>
          </div>
        )) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No exercise available.</p>}
      </div>
    );
  };

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
        const newStruct = (data.structure || []).map(lesson => ({
          ...lesson,
          sections: lesson.sections || defaultSections
        }));
        setStructure(newStruct);
        if (newStruct.length > 0) {
          setSelectedStructureLessonId(newStruct[0].id);
        }
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
        const newStruct = (data.structure || []).map(lesson => ({
          ...lesson,
          sections: lesson.sections || defaultSections
        }));
        setStructure(newStruct);
        if (newStruct.length > 0) {
          setSelectedStructureLessonId(newStruct[0].id);
        }

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
    const newItem = { 
      id: Date.now(), 
      title: `${target.title} (Copy)`, 
      order: target.order + 1,
      sections: JSON.parse(JSON.stringify(target.sections || defaultSections))
    };
    const updated = [...structure];
    updated.splice(index + 1, 0, newItem);
    updated.forEach((item, idx) => { item.order = idx + 1; });
    setStructure(updated);
  };
  const addLesson = () => {
    const newId = Date.now();
    setStructure([...structure, { 
      id: newId, 
      title: 'New Lesson Module', 
      order: structure.length + 1,
      sections: JSON.parse(JSON.stringify(defaultSections))
    }]);
    if (!selectedStructureLessonId) {
      setSelectedStructureLessonId(newId);
    }
  };

  const moveSection = (lessonId, roleKey, fromIdx, toIdx) => {
    const updated = [...structure];
    const lIdx = updated.findIndex(l => l.id === lessonId);
    if (lIdx === -1) return;
    const sections = [...(updated[lIdx].sections?.[roleKey] || [])];
    if (fromIdx < 0 || toIdx < 0 || fromIdx >= sections.length || toIdx >= sections.length) return;
    const [moved] = sections.splice(fromIdx, 1);
    sections.splice(toIdx, 0, moved);
    updated[lIdx].sections[roleKey] = sections;
    setStructure(updated);
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
            className={`nav-item ${activeSidebarNav === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveSidebarNav('create'); setShowMyCourses(false); goToDashboard(); }}
          >
            <IconGrid />
            <span>Dashboard</span>
          </div>
          <div
            className={`nav-item ${activeSidebarNav === 'my_courses' ? 'active' : ''}`}
            onClick={() => { setActiveSidebarNav('my_courses'); setShowMyCourses(true); fetchSessions(); }}
          >
            <IconBook />
            <span>My Courses</span>
            {sessionsList.length > 0 && (
              <span className="nav-badge">{sessionsList.length}</span>
            )}
          </div>

          <span className="nav-section-label" style={{ marginTop: '8px' }}>Workspace</span>
          <div
            className={`nav-item ${activeSidebarNav === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveSidebarNav('drafts')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Drafts</span>
          </div>
          <div
            className={`nav-item ${activeSidebarNav === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveSidebarNav('docs')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 9l-5 5-5-5M12 12.8V2.5"/></svg>
            <span>Generated Docs</span>
          </div>
          <div
            className={`nav-item ${activeSidebarNav === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveSidebarNav('assets')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>AI Assets</span>
          </div>
          <div
            className={`nav-item ${activeSidebarNav === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveSidebarNav('templates')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <span>Templates</span>
          </div>

          <span className="nav-section-label" style={{ marginTop: '8px' }}>Account</span>
          <div
            className={`nav-item ${activeSidebarNav === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSidebarNav('settings')}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            <span>Settings</span>
          </div>
        </div>

        {/* Session indicator */}
        {sessionId && activeSidebarNav === 'create' && (
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

        {/* Topbar Header */}
        <div className="top-bar">
          <div className="top-bar-search">
            <svg width="16" height="16" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search courses, assets, templates..." />
          </div>
          <div className="top-bar-actions">
            <button className="top-bar-btn" title="Notifications">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span className="top-bar-badge" />
            </button>
            <button className="top-bar-btn" title="Settings" onClick={() => setActiveSidebarNav('settings')}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </button>
            <div className="profile-section">
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)' }}>Lea</span>
              <div className="profile-avatar">L</div>
            </div>
          </div>
        </div>

        {/* ── Route Switcher ── */}
        {activeSidebarNav === 'drafts' || activeSidebarNav === 'docs' || activeSidebarNav === 'assets' || activeSidebarNav === 'templates' || activeSidebarNav === 'settings' ? (
          <div className="coming-soon-page">
            <span className="coming-soon-badge">Coming Soon</span>
            <h2>{activeSidebarNav.charAt(0).toUpperCase() + activeSidebarNav.slice(1).replace('_', ' ')} Workspace</h2>
            <p style={{ color: 'var(--text-secondary)' }}>This module is currently being finalized. Check back soon!</p>
            <button className="action-btn" onClick={() => { setActiveSidebarNav('create'); setShowMyCourses(false); }} style={{ marginTop: '16px' }}>
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
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
                  <button className="action-btn" onClick={() => { setActiveSidebarNav('create'); setShowMyCourses(false); goToDashboard(); }}>
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
              <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '8px' }}>{greeting}</p>
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
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }} 
                    accept=".pdf,.docx,.txt" 
                  />
                  <button className="file-upload-btn" onClick={handleFileUploadClick} disabled={isLoading}>
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
              <div className="rich-editor-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="toolbar-btn">B</button>
                <button className="toolbar-btn">I</button>
                <button className="toolbar-btn">List</button>
                <button className="toolbar-btn">Link</button>
                <button className="toolbar-btn" style={{ marginLeft: 'auto', background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 600, padding: '4px 10px' }} onClick={handleFileUploadClick}>
                  Upload DOCX/PDF 📤
                </button>
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
                    {items.map((item, idx) => {
                      const isEditing = groundingEditIdx.type === label && groundingEditIdx.idx === idx;
                      return (
                        <li key={idx} className="grounding-list-item" style={{ cursor: 'pointer' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                              <input
                                type="text"
                                className="prompt-textarea"
                                style={{ minHeight: 'auto', padding: '6px 12px', marginBottom: 0, flex: 1 }}
                                value={groundingEditText}
                                onChange={(e) => setGroundingEditText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const updated = [...items];
                                    updated[idx] = groundingEditText;
                                    setter(updated);
                                    setGroundingEditIdx({ type: null, idx: -1 });
                                  } else if (e.key === 'Escape') {
                                    setGroundingEditIdx({ type: null, idx: -1 });
                                  }
                                }}
                                autoFocus
                              />
                              <button className="icon-btn" onClick={() => {
                                const updated = [...items];
                                updated[idx] = groundingEditText;
                                setter(updated);
                                setGroundingEditIdx({ type: null, idx: -1 });
                              }}>✓</button>
                            </div>
                          ) : (
                            <span 
                              style={{ flex: 1 }} 
                              onClick={() => {
                                setGroundingEditIdx({ type: label, idx });
                                setGroundingEditText(item);
                              }}
                              title="Click to edit inline"
                            >
                              {item}
                            </span>
                          )}
                          <button className="icon-btn danger" onClick={() => removeListItem(setter, idx)}><IconTrash /></button>
                        </li>
                      );
                    })}
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

            <div className="structure-split-layout">
              {/* Left Column: Lesson Modules List */}
              <div className="lesson-list-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)' }}>Lesson Sequence</h3>
                  <button className="file-upload-btn" onClick={addLesson} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    <IconPlus /> Add
                  </button>
                </div>

                {structure.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`structure-item ${selectedStructureLessonId === item.id ? 'active' : ''}`}
                    onClick={() => setSelectedStructureLessonId(item.id)}
                    style={{ padding: '10px 12px', marginBottom: '8px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <span className="structure-order" style={{ width: '22px', height: '22px', fontSize: '0.7rem' }}>{item.order}</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...structure];
                          updated[idx].title = e.target.value;
                          setStructure(updated);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="structure-title-input"
                        style={{ fontSize: '0.875rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                      <button className="icon-btn" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => moveLesson(idx, -1)}>▲</button>
                      <button className="icon-btn" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => moveLesson(idx, 1)}>▼</button>
                      <button className="icon-btn danger" style={{ padding: '4px 6px', fontSize: '0.7rem' }} onClick={() => deleteLesson(idx)}><IconTrash /></button>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button className="file-upload-btn" onClick={() => setCurrentStep('proposal')}>← Back</button>
                  <button className="action-btn" onClick={handleSaveStructure} disabled={isLoading}>
                    {isLoading ? <><IconSpinner /> Saving…</> : <>Review <IconArrow /></>}
                  </button>
                </div>
              </div>

              {/* Right Column: Detailed Section Editor & Role Tabs */}
              <div className="lesson-detail-panel">
                {selectedStructureLessonId ? (
                  (() => {
                    const lIdx = structure.findIndex(l => l.id === selectedStructureLessonId);
                    const lesson = structure[lIdx];
                    if (!lesson) return null;
                    const sections = lesson.sections?.[activeStructureRole] || [];

                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                          <div>
                            <span className="step-chip" style={{ background: 'var(--gold-light)', color: 'var(--gold)' }}>Lesson {lesson.order}</span>
                            <h3 style={{ marginTop: '8px', fontSize: '1.25rem', color: 'var(--navy)' }}>{lesson.title} Detail Outline</h3>
                          </div>
                          <button className="btn-blue" onClick={() => setIsAddSectionModalOpen(true)}>
                            <IconPlus /> Custom Section
                          </button>
                        </div>

                        {/* Role Tabs inside detail editor */}
                        <div className="tab-row" style={{ marginBottom: '18px' }}>
                          {[
                            { key: 'creator', label: 'Creator Sections' },
                            { key: 'student', label: 'Student Sections' },
                            { key: 'educator', label: 'Educator Sections' }
                          ].map(t => (
                            <button
                              key={t.key}
                              className={`tab-btn ${activeStructureRole === t.key ? 'active' : ''}`}
                              onClick={() => setActiveStructureRole(t.key)}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                          Configure prompts and structure for this role. Drag/Reorder sections to customize AI generation.
                        </p>

                        <div className="sections-container">
                          {sections.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No sections added yet.</p>
                          ) : (
                            sections.map((sec, sIdx) => (
                              <div
                                key={sec.id}
                                className="section-list-item"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', sIdx.toString());
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                                  moveSection(lesson.id, activeStructureRole, fromIdx, sIdx);
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                  <span className="section-drag-handle" title="Drag to reorder">☰</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <input
                                      type="text"
                                      value={sec.title}
                                      onChange={(e) => {
                                        const updated = [...structure];
                                        updated[lIdx].sections[activeStructureRole][sIdx].title = e.target.value;
                                        setStructure(updated);
                                      }}
                                      className="structure-title-input"
                                      style={{ fontWeight: 600, fontSize: '0.9rem' }}
                                    />
                                    <input
                                      type="text"
                                      value={sec.instruction}
                                      onChange={(e) => {
                                        const updated = [...structure];
                                        updated[lIdx].sections[activeStructureRole][sIdx].instruction = e.target.value;
                                        setStructure(updated);
                                      }}
                                      placeholder="AI instructions for this section..."
                                      className="structure-title-input"
                                      style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}
                                    />
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {sec.locked ? (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} title="Core Section">🔒 Locked</span>
                                  ) : (
                                    <button 
                                      className="icon-btn danger" 
                                      onClick={() => {
                                        const updated = [...structure];
                                        updated[lIdx].sections[activeStructureRole] = sections.filter((_, i) => i !== sIdx);
                                        setStructure(updated);
                                      }}
                                    >
                                      <IconTrash />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="empty-state" style={{ minHeight: '400px' }}>
                    <IconLayers />
                    <h3>Select a Lesson Module</h3>
                    <p>Select a lesson from the list on the left to configure its detailed sections.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Section Add Popup Modal */}
            {isAddSectionModalOpen && (
              <div className="modal-overlay">
                <div className="add-section-modal">
                  <h3 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Add Custom Section</h3>
                  <div className="config-item">
                    <label>Section Title</label>
                    <input
                      type="text"
                      className="prompt-textarea"
                      style={{ minHeight: 'auto', padding: '10px' }}
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="e.g. Code Review, Troubleshooting Guide"
                    />
                  </div>
                  <div className="config-item">
                    <label>AI Writing Instruction</label>
                    <textarea
                      className="prompt-textarea"
                      style={{ minHeight: '90px', padding: '10px' }}
                      value={newSectionInstruction}
                      onChange={(e) => setNewSectionInstruction(e.target.value)}
                      placeholder="Instruct the AI what content to generate..."
                    />
                  </div>
                  <div className="config-item">
                    <label>Target Role Tab</label>
                    <select
                      className="prompt-textarea"
                      style={{ minHeight: 'auto', padding: '10px' }}
                      value={newSectionRole}
                      onChange={(e) => setNewSectionRole(e.target.value)}
                    >
                      <option value="creator">Creator POV</option>
                      <option value="student">Student POV</option>
                      <option value="educator">Educator POV</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button className="file-upload-btn" onClick={() => {
                      setIsAddSectionModalOpen(false);
                      setNewSectionTitle('');
                      setNewSectionInstruction('');
                    }}>
                      Cancel
                    </button>
                    <button 
                      className="action-btn"
                      onClick={() => {
                        if (!newSectionTitle.trim()) {
                          alert('Please enter a section title.');
                          return;
                        }
                        const lIdx = structure.findIndex(l => l.id === selectedStructureLessonId);
                        if (lIdx !== -1) {
                          const updated = [...structure];
                          if (!updated[lIdx].sections) {
                            updated[lIdx].sections = JSON.parse(JSON.stringify(defaultSections));
                          }
                          const newSec = {
                            id: `custom-${Date.now()}`,
                            type: `custom-${newSectionTitle.toLowerCase().replace(/ /g, '_')}`,
                            title: newSectionTitle.trim(),
                            instruction: newSectionInstruction.trim() || 'Write curriculum content.',
                            locked: false
                          };
                          updated[lIdx].sections[newSectionRole].push(newSec);
                          setStructure(updated);
                        }
                        setIsAddSectionModalOpen(false);
                        setNewSectionTitle('');
                        setNewSectionInstruction('');
                      }}
                    >
                      Add Section
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                <button className="file-upload-btn" onClick={() => { setExportFormat('docx'); setIsExportModalOpen(true); }}>Export DOCX</button>
                <button className="file-upload-btn" onClick={() => { setExportFormat('pdf'); setIsExportModalOpen(true); }}>Export PDF</button>
                <button className="file-upload-btn" onClick={() => setIsExportModalOpen(true)}>Export Hub 📥</button>
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
                <div className="rich-editor-toolbar" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="toolbar-btn">B</button>
                  <button className="toolbar-btn">I</button>
                  <button className="toolbar-btn">H1</button>
                  <button className="toolbar-btn">Code</button>
                  <button className="toolbar-btn" style={{ marginLeft: 'auto', background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 600, padding: '4px 10px' }} onClick={() => { fetchHistory(); setIsHistoryOpen(true); }}>📜 Version History</button>
                </div>

                {/* Creator POV */}
                {activeRole === 'creator' && (
                  <div className="content-section">
                    <div className="content-block">
                      <h3>Lesson Overview</h3>
                      {renderAIActionBar('overview', activeLessonContent.overview)}
                      {editingSection === 'overview' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '150px', padding: '12px' }}
                        />
                      ) : (
                        <ContentRenderer text={activeLessonContent.overview} />
                      )}
                    </div>

                    <div className="content-block">
                      <h3>Learning Outcomes</h3>
                      {renderAIActionBar('learning_outcomes', activeLessonContent.learning_outcomes, (txt) => {
                        handleSaveManualEdit('learning_outcomes', txt.split('\n').filter(Boolean));
                      })}
                      {editingSection === 'learning_outcomes' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          placeholder="One outcome per line..."
                          style={{ width: '100%', minHeight: '120px', padding: '12px' }}
                        />
                      ) : (
                        activeLessonContent.learning_outcomes?.length > 0 ? (
                          <ul className="outcome-list">
                            {activeLessonContent.learning_outcomes.map((item, idx) => (
                              <li key={idx}><span className="outcome-dot" />{item}</li>
                            ))}
                          </ul>
                        ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No outcomes available.</p>
                      )}
                    </div>

                    <div className="content-block">
                      <h3>Core Technical Material</h3>
                      {renderAIActionBar('core_content', activeLessonContent.core_content)}
                      {editingSection === 'core_content' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '300px', padding: '12px' }}
                        />
                      ) : (
                        <ContentRenderer text={activeLessonContent.core_content} />
                      )}
                    </div>

                    {renderExerciseManager()}
                    {renderQuizManager()}
                  </div>
                )}

                {/* Student POV */}
                {activeRole === 'student' && (
                  <div className="content-section">
                    <div className="why-matters-card">
                      <h4>💡 Why This Matters</h4>
                      {renderAIActionBar('why_this_matters', activeLessonContent.why_this_matters)}
                      {editingSection === 'why_this_matters' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '120px', padding: '12px' }}
                        />
                      ) : (
                        <ContentRenderer text={activeLessonContent.why_this_matters} />
                      )}
                    </div>

                    <div className="content-block">
                      <h3>Interactive Coding Sandbox</h3>
                      {renderAIActionBar('practice', activeLessonContent.practice, (txt) => {
                        try {
                          const parsed = JSON.parse(txt);
                          handleSaveManualEdit('practice', parsed);
                        } catch (err) {
                          alert("Invalid JSON format. Expected: { code_block: string, interactive_exercise: string, checklist: string[] }");
                        }
                      })}
                      {editingSection === 'practice' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '200px', fontFamily: 'monospace', padding: '12px' }}
                        />
                      ) : (
                        <>
                          <pre className="code-block">{activeLessonContent.practice?.code_block || '// No code block available'}</pre>
                          <div className="exercise-task">
                            <strong>Task:</strong> {activeLessonContent.practice?.interactive_exercise || 'No exercise available.'}
                          </div>
                        </>
                      )}
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
                      {renderAIActionBar('debugging', activeLessonContent.debugging)}
                      {editingSection === 'debugging' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '150px', padding: '12px' }}
                        />
                      ) : (
                        <ContentRenderer text={activeLessonContent.debugging} />
                      )}
                    </div>

                    <div className="content-block">
                      <h3>Ethics &amp; Code Principles</h3>
                      {renderAIActionBar('ethics', activeLessonContent.ethics)}
                      {editingSection === 'ethics' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '150px', padding: '12px' }}
                        />
                      ) : (
                        <ContentRenderer text={activeLessonContent.ethics} />
                      )}
                    </div>
                  </div>
                )}

                {/* Educator POV */}
                {activeRole === 'educator' && (
                  <div className="content-section">
                    <div className="content-block">
                      <h3>Facilitator Guide</h3>
                      {renderAIActionBar('facilitator_guide', activeLessonContent.facilitator_guide)}
                      {editingSection === 'facilitator_guide' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '200px', padding: '12px' }}
                        />
                      ) : (
                        <ContentRenderer text={activeLessonContent.facilitator_guide} />
                      )}
                    </div>

                    <div className="lesson-plan-grid">
                      <div className="lesson-plan-card">
                        <h4>🧊 Ice Breaker</h4>
                        {renderAIActionBar('lesson_plan', activeLessonContent.lesson_plan, (txt) => {
                          try {
                            const parsed = JSON.parse(txt);
                            handleSaveManualEdit('lesson_plan', parsed);
                          } catch (err) {
                            alert("Invalid JSON format. Expected: { ice_breaker: string, timing: string }");
                          }
                        })}
                        {editingSection === 'lesson_plan' ? (
                          <textarea
                            className="prompt-textarea"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            style={{ width: '100%', minHeight: '120px', fontFamily: 'monospace', padding: '12px' }}
                          />
                        ) : (
                          <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.ice_breaker || 'No ice breaker available.'}</p>
                        )}
                      </div>
                      <div className="lesson-plan-card">
                        <h4>⏱ Timing Allocation</h4>
                        {editingSection === 'lesson_plan' ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Editing JSON outline above...</span>
                        ) : (
                          <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.timing || 'No timing available.'}</p>
                        )}
                      </div>
                    </div>

                    <div className="content-block">
                      <h3>Grading Rubric</h3>
                      {renderAIActionBar('rubric', activeLessonContent.rubric, (txt) => {
                        try {
                          const parsed = JSON.parse(txt);
                          handleSaveManualEdit('rubric', parsed);
                        } catch (err) {
                          alert("Invalid JSON format. Expected: Array of { criteria: string, excellent: string, good: string, needs_improvement: string }");
                        }
                      })}
                      {editingSection === 'rubric' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          style={{ width: '100%', minHeight: '180px', fontFamily: 'monospace', padding: '12px' }}
                        />
                      ) : (
                        activeLessonContent.rubric?.length > 0 ? (
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
                        ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No rubric available.</p>
                      )}
                    </div>

                    <div className="content-block">
                      <h3>Discussion Questions</h3>
                      {renderAIActionBar('discussion_questions', activeLessonContent.discussion_questions, (txt) => {
                        handleSaveManualEdit('discussion_questions', txt.split('\n').filter(Boolean));
                      })}
                      {editingSection === 'discussion_questions' ? (
                        <textarea
                          className="prompt-textarea"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          placeholder="One question per line..."
                          style={{ width: '100%', minHeight: '120px', padding: '12px' }}
                        />
                      ) : (
                        activeLessonContent.discussion_questions?.length > 0 ? (
                          <ol className="discussion-list">
                            {activeLessonContent.discussion_questions.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ol>
                        ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No discussion questions available.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Export Hub Modal */}
            {isExportModalOpen && (
              <div className="modal-overlay" onClick={() => setIsExportModalOpen(false)}>
                <div className="add-section-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ color: 'var(--navy)', marginBottom: '12px' }}>Export Course Content</h3>
                  <div className="config-item">
                    <label>Export Format</label>
                    <select 
                      className="prompt-textarea"
                      style={{ minHeight: 'auto', padding: '10px' }}
                      value={exportFormat} 
                      onChange={(e) => setExportFormat(e.target.value)}
                    >
                      <option value="docx">Word Document (.docx)</option>
                      <option value="markdown">Markdown (.md)</option>
                      <option value="html">Web Page (.html)</option>
                      <option value="pdf">PDF Document (.pdf)</option>
                      <option value="zip">ZIP (All formats per role)</option>
                    </select>
                  </div>

                  <div className="config-item">
                    <label>Target Audience POV</label>
                    <select 
                      className="prompt-textarea"
                      style={{ minHeight: 'auto', padding: '10px' }}
                      value={exportRole} 
                      disabled={exportFormat === 'zip'}
                      onChange={(e) => setExportRole(e.target.value)}
                    >
                      <option value="all">All Roles (Combined)</option>
                      <option value="creator">Creator POV only</option>
                      <option value="student">Student POV only</option>
                      <option value="educator">Educator POV only</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button className="file-upload-btn" onClick={() => setIsExportModalOpen(false)}>Cancel</button>
                    <button className="action-btn" onClick={handleExport}>📥 Download</button>
                  </div>
                </div>
              </div>
            )}

            {/* Version History Modal */}
            {isHistoryOpen && (
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
            )}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
