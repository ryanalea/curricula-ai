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
  const [currentView, setCurrentView] = useState('home'); // 'home', 'courses', 'wizard'
  const [currentStep, setCurrentStep] = useState('dashboard');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agentProgressStage, setAgentProgressStage] = useState(1); // 1: Tech, 2: Grounding, 3: Proposals, 4: Structure
  const [activeSidebarNav, setActiveSidebarNav] = useState('create'); // 'create', 'my_courses', 'drafts', 'docs', 'assets', 'templates', 'settings'

  // Greeting Logic
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning, user3';
    if (hr < 17) return 'Good afternoon, user3';
    return 'Good evening, user3';
  };
  const greeting = getGreeting();

  const [promptText, setPromptText] = useState('');
  const [isAgentMode, setIsAgentMode] = useState('agent');
  const [sessionsList, setSessionsList] = useState([]);
  const [showMyCourses, setShowMyCourses] = useState(false);

  const [selectedTopicCategory, setSelectedTopicCategory] = useState('All Categories');

  const trendingTopics = [
    { category: 'Artificial Intelligence', title: 'Generative AI in Education', desc: 'Implement LLMs in classrooms safely and effectively.', prompt: 'Generative AI integration in modern school education systems' },
    { category: 'Artificial Intelligence', title: 'Deep Learning Basics', desc: 'Neural networks, backpropagation, and CNN structures.', prompt: 'Deep learning neural networks and convolutional model designs' },
    { category: 'Data Science', title: 'Data Analysis with Pandas', desc: 'Wrangle, clean, and visualize complex datasets in Python.', prompt: 'Python Pandas data science and wrangling pipelines' },
    { category: 'Data Science', title: 'Statistical Inference', desc: 'Hypothesis testing, confidence intervals, and regression.', prompt: 'Statistical inference and data analysis principles' },
    { category: 'Digital Transformation', title: 'Cloud Computing Migration', desc: 'Shift legacy infrastructure to AWS and Azure securely.', prompt: 'Enterprise cloud computing migration strategies' },
    { category: 'Digital Transformation', title: 'Agile Leadership', desc: 'Modern software delivery frameworks and team dynamics.', prompt: 'Agile project management and engineering leadership' },
    { category: 'Education Technology', title: 'Gamified Learning Design', desc: 'Design interactive rewards and pathways for student retention.', prompt: 'Gamification design for student learning systems' },
    { category: 'Software Engineering', title: 'Go Microservices Architecture', desc: 'Build scalable concurrent backend services in Go.', prompt: 'Go microservices concurrent backend pipeline design' },
    { category: 'Software Engineering', title: 'Next.js 15 Foundations', desc: 'Server components, server actions, and layout routing.', prompt: 'Next.js 15 App router and server actions development' }
  ];

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

  // ── Agent Auto-Workflow Orchestrator ──
  const runAgentPipeline = async (sessId) => {
    try {
      // 1. Technical Foundations completed. Move to Stage 2: Educational Grounding.
      setAgentProgressStage(2);

      // Save Config & Generate proposals
      await fetch(`${API_BASE}/courses/sessions/${sessId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessons_count: 5,
          duration: 60,
          difficulty: 'Beginner',
          target_audience: 'Student',
          subject_context: ''
        })
      });

      const propRes = await fetch(`${API_BASE}/courses/sessions/${sessId}/proposals/generate`, {
        method: 'POST'
      });
      if (!propRes.ok) throw new Error('Failed to generate proposals');
      const propData = await propRes.json();
      setProposals(propData.proposals || []);

      // 2. Grounding is done. Move to Stage 3: Directional Proposals.
      setAgentProgressStage(3);

      // Select proposal (ID 2 is recommended/default)
      const selRes = await fetch(`${API_BASE}/courses/sessions/${sessId}/proposals/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_proposal_id: 2 })
      });
      if (!selRes.ok) throw new Error('Failed to select proposal');
      const selData = await selRes.json();
      setSelectedProposalId(2);
      setPrerequisites(selData.prerequisites || []);
      setBoundaries(selData.out_of_scope || []);
      setLearningOutcomes(selData.learning_outcomes || []);

      // 3. Proposals selected. Move to Stage 4: Curriculum Structure.
      setAgentProgressStage(4);

      // Save structure (using generated structure outline from proposal)
      const structRes = await fetch(`${API_BASE}/courses/sessions/${sessId}/structure/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: selData.structure || [] })
      });
      if (!structRes.ok) throw new Error('Failed to save structure');
      const structData = await structRes.json();
      const newStruct = (structData.structure || []).map(lesson => ({
        ...lesson,
        sections: lesson.sections || defaultSections
      }));
      setStructure(newStruct);
      if (newStruct.length > 0) {
        setSelectedStructureLessonId(newStruct[0].id);
      }

      // 4. Completed all steps. Jump to step 6 (review).
      setCurrentStep('review');
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert('Agent pipeline failed: ' + err.message);
      setCurrentStep('context'); // Fallback to manual if agent fails
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 1: Create Session ──
  const handleStartSession = async (promptVal) => {
    const textToSubmit = promptVal || promptText;
    if (!textToSubmit.trim()) {
      alert('Please enter a course topic/prompt first.');
      return;
    }
    setIsLoading(true);
    setAgentProgressStage(1);
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
        setCurrentView('wizard');
        fetchSessions();

        if (isAgentMode === 'agent') {
          await runAgentPipeline(data.session_id);
        } else {
          setCurrentStep('context');
          setIsLoading(false);
        }
      } else {
        alert('Failed to start session.');
        setIsLoading(false);
      }
    } catch {
      alert('Error contacting API server. Is the backend running?');
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

  const handleAutoSuggestGrounding = async (fieldType, currentList, setter) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_type: fieldType,
          existing_items: currentList.filter(Boolean)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          setter([...currentList, data.suggestion]);
        }
      } else {
        alert('Failed to generate suggestions.');
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
    setCurrentView('wizard');
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
    setCurrentView('home');
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
      {/* ── Top Header Navigation ── */}
      <div className="top-header">
        <div className="header-logo-area" onClick={goToDashboard}>
          <div className="header-logo-mark" style={{ background: 'var(--navy)' }}>
            <img src="/m-logo.png" alt="Maxy" width="36" height="36" style={{ borderRadius: '10px', display: 'block' }} />
          </div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name" style={{ color: 'var(--navy)' }}>Curricula AI</span>
            <span className="sidebar-logo-byline" style={{ color: 'var(--blue)' }}>by Maxy Academy</span>
          </div>
        </div>

        <div className="header-tabs">
          <button 
            className={`header-tab-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => { setCurrentView('home'); setShowMyCourses(false); }}
          >
            Home
          </button>
          <button 
            className={`header-tab-btn ${currentView === 'courses' ? 'active' : ''}`}
            onClick={() => { setCurrentView('courses'); setShowMyCourses(true); fetchSessions(); }}
          >
            Courses
          </button>
        </div>

        <div className="header-actions">
          <button 
            className="header-create-btn"
            onClick={() => { setCurrentView('wizard'); setCurrentStep('dashboard'); setShowMyCourses(false); setSessionId(null); setPromptText(''); setProposals([]); setStructure([]); setCourseData(null); }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Create</span>
          </button>
          <div className="profile-avatar-circle" title="user3">U</div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="main-content" style={{ paddingTop: '90px' }}>

        {/* ── Home Page View ── */}
        {currentView === 'home' && (
          <div className="elice-home-page">
            {/* Hero Section */}
            <div className="elice-hero">
              <h1 className="elice-greeting">{greeting}</h1>
              <p className="elice-subtext">Ready to create something extraordinary today?</p>
            </div>

            {/* Quick Resume Card */}
            {sessionsList.find(s => s.status !== 'completed') ? (() => {
              const activeDraft = sessionsList.find(s => s.status !== 'completed');
              return (
                <div className="quick-resume-container">
                  <div className="quick-resume-card">
                    <div className="quick-resume-content">
                      <span className="quick-resume-label">From where you left off...</span>
                      <h3 className="quick-resume-title">{activeDraft.title || activeDraft.prompt}</h3>
                      <span className="quick-resume-meta">
                        Difficulty: <strong>{activeDraft.difficulty || 'Beginner'}</strong> &middot; Audience: <strong>{activeDraft.audience || 'Student'}</strong> &middot; Step: <strong>{activeDraft.step?.toUpperCase() || 'PROMPT'}</strong>
                      </span>
                    </div>
                    <button className="header-create-btn" onClick={() => handleResumeSession(activeDraft)}>
                      Continue
                    </button>
                  </div>
                </div>
              );
            })() : null}

            {/* Trending Topics Section */}
            <h2 className="elice-section-title">Trending Topics</h2>
            <div className="trending-pills">
              {['All Categories', 'Artificial Intelligence', 'Data Science', 'Digital Transformation', 'Education Technology', 'Software Engineering'].map(cat => (
                <button
                  key={cat}
                  className={`trending-pill ${selectedTopicCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedTopicCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="trending-grid">
              {trendingTopics
                .filter(t => selectedTopicCategory === 'All Categories' || t.category === selectedTopicCategory)
                .map((topic, idx) => (
                  <div key={idx} className="topic-card" onClick={() => {
                    setPromptText(topic.prompt);
                    setCurrentView('wizard');
                    setCurrentStep('dashboard');
                  }}>
                    <div className="topic-card-icon">
                      <IconLayers />
                    </div>
                    <h3 className="topic-card-title">{topic.title}</h3>
                    <p className="topic-card-desc">{topic.desc}</p>
                  </div>
                ))}
            </div>

            {/* Work in Progress Section */}
            {sessionsList.filter(s => s.status !== 'completed').length > 0 && (
              <>
                <h2 className="elice-section-title">Work in Progress</h2>
                <div className="elice-course-grid">
                  {sessionsList.filter(s => s.status !== 'completed').map((sess) => (
                    <div key={sess.session_id} className="elice-course-card" onClick={() => handleResumeSession(sess)}>
                      <div className="card-top">
                        <span className="card-tag">Draft &middot; {sess.step}</span>
                        <h3 className="card-title">{sess.title || sess.prompt}</h3>
                        <p className="card-desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sess.prompt}</p>
                      </div>
                      <div className="card-bottom">
                        <span className="card-time">
                          <IconClock /> Updated recently
                        </span>
                        <button className="ai-pill-btn edit" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); handleResumeSession(sess); }}>
                          Resume
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Recent Activity Section */}
            <h2 className="elice-section-title">Recent Activity</h2>
            {sessionsList.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <p>No recent activity found. Click "Create" to start a new course.</p>
              </div>
            ) : (
              <div className="elice-course-grid">
                {sessionsList.slice(0, 6).map((sess) => (
                  <div key={sess.session_id} className="elice-course-card" onClick={() => handleResumeSession(sess)}>
                    <div className="card-top">
                      <span className="card-tag">{sess.difficulty} &middot; {sess.audience}</span>
                      <h3 className="card-title">{sess.title || sess.prompt}</h3>
                      <p className="card-desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sess.prompt?.slice(0, 100)}{sess.prompt?.length > 100 ? '...' : ''}</p>
                    </div>
                    <div className="card-bottom">
                      <span className="card-time">
                        <IconClock /> Status: {sess.status}
                      </span>
                      <button className="ai-pill-btn edit" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={(e) => { e.stopPropagation(); handleResumeSession(sess); }}>
                        {sess.status === 'completed' ? 'View' : 'Resume'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="elice-footer">
              <span>&copy; {new Date().getFullYear()} Curricula AI. All rights reserved. Powered by Maxy Academy.</span>
              <button className="feedback-btn" onClick={() => alert('Thank you for your feedback!')}>Send Feedback</button>
            </div>
          </div>
        )}

        {/* ── Courses Page View ── */}
        {currentView === 'courses' && (
          <div>
            <div className="header">
              <div>
                <h2>My Courses</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Resume or review your past generation sessions.</p>
              </div>
              <button className="action-btn" onClick={() => { setCurrentView('wizard'); setCurrentStep('dashboard'); setShowMyCourses(false); setSessionId(null); setPromptText(''); setProposals([]); setStructure([]); setCourseData(null); }}>
                <IconPlus /> New Course
              </button>
            </div>

            {sessionsList.length === 0 ? (
              <div className="empty-state">
                <IconBook />
                <h3>No courses yet</h3>
                <p>Start a new course from the Dashboard to see it here.</p>
                <button className="action-btn" onClick={() => { setCurrentView('wizard'); setCurrentStep('dashboard'); }} style={{ marginTop: '20px' }}>
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

            {/* Footer */}
            <div className="elice-footer">
              <span>&copy; {new Date().getFullYear()} Curricula AI. All rights reserved. Powered by Maxy Academy.</span>
              <button className="feedback-btn" onClick={() => alert('Thank you for your feedback!')}>Send Feedback</button>
            </div>
          </div>
        )}

        {/* ── Wizard Flow View ── */}
        {currentView === 'wizard' && (
          <>
            {/* Step Progress Bar */}
            <StepProgressBar currentStep={currentStep} />

            {isLoading && currentStep === 'dashboard' ? (
              <div className="magic-progress-container">
                <div className="floating-magic-box">
                  <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <h1 className="magic-title">Magic in Progress...</h1>
                <p className="magic-subtext">
                  We're orchestrating the complete technical and educational foundations for your course.
                </p>

                <div className="progress-step-list">
                  <div className={`progress-step-item ${agentProgressStage === 1 ? 'active' : ''}`}>
                    <span className="progress-step-name">TECHNICAL FOUNDATIONS</span>
                    <span className={`progress-step-status ${agentProgressStage === 1 ? 'active' : 'pending'}`}>
                      {agentProgressStage === 1 ? <><IconSpinner /> Processing</> : (agentProgressStage > 1 ? 'Completed' : 'Pending')}
                    </span>
                  </div>
                  <div className={`progress-step-item ${agentProgressStage === 2 ? 'active' : ''}`}>
                    <span className="progress-step-name">EDUCATIONAL GROUNDING</span>
                    <span className={`progress-step-status ${agentProgressStage === 2 ? 'active' : 'pending'}`}>
                      {agentProgressStage === 2 ? <><IconSpinner /> Processing</> : (agentProgressStage > 2 ? 'Completed' : 'Pending')}
                    </span>
                  </div>
                  <div className={`progress-step-item ${agentProgressStage === 3 ? 'active' : ''}`}>
                    <span className="progress-step-name">DIRECTIONAL PROPOSALS</span>
                    <span className={`progress-step-status ${agentProgressStage === 3 ? 'active' : 'pending'}`}>
                      {agentProgressStage === 3 ? <><IconSpinner /> Processing</> : (agentProgressStage > 3 ? 'Completed' : 'Pending')}
                    </span>
                  </div>
                  <div className={`progress-step-item ${agentProgressStage === 4 ? 'active' : ''}`}>
                    <span className="progress-step-name">CURRICULUM STRUCTURE</span>
                    <span className={`progress-step-status ${agentProgressStage === 4 ? 'active' : 'pending'}`}>
                      {agentProgressStage === 4 ? <><IconSpinner /> Processing</> : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="elice-footer" style={{ width: '100%', maxWidth: '460px', marginTop: '40px' }}>
                  <span>&copy; {new Date().getFullYear()} Curricula AI. All rights reserved.</span>
                  <button className="feedback-btn" onClick={() => alert('Thank you for your feedback!')}>Send Feedback</button>
                </div>
              </div>
            ) : (
              <>
                {/* ══════════════════════════════════════════════ */}
                {/* STEP 1: DASHBOARD */}
                {/* ══════════════════════════════════════════════ */}
                {currentStep === 'dashboard' && (
              <div>
                {/* Content Type Tabs */}
                <div className="content-type-tabs">
                  <button className="content-type-tab active">Course</button>
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
                      <button className="file-upload-btn" onClick={handleFileUploadClick} disabled={isLoading} title="Upload Reference Document">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>Reference File</span>
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
                    <button className="action-btn" onClick={() => handleStartSession()} disabled={isLoading} title="Start Generation">
                      {isLoading ? <IconSpinner /> : <><span style={{ marginRight: '6px' }}>Start</span><IconArrow /></>}
                    </button>
                  </div>
                </div>

                <h2 style={{ marginTop: '40px', marginBottom: '20px', fontSize: '1.25rem', fontWeight: 800 }}>Try these examples</h2>
                <div className="suggested-grid">
                  {[
                    { title: 'Software Engineering', desc: 'Build scalable concurrent backend systems and concurrent channel structures in Go.', prompt: 'Go Concurrent pipelines and microservice architectural patterns' },
                    { title: 'Artificial Intelligence', desc: 'Introduction to neural networks, backpropagation, and machine learning models.', prompt: 'Machine Learning Essentials with Python' },
                    { title: 'Education Technology', desc: 'Designing interactive gamified learning systems and virtual classroom platforms.', prompt: 'Gamification design for student learning systems' }
                  ].map((card, idx) => (
                    <div key={idx} className="suggested-card" onClick={() => setPromptText(card.prompt)} style={{ cursor: 'pointer' }}>
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
                <h2>Configure your Course</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Provide specific details or guidelines for this course.</p>
              </div>
              <span className="step-chip">Step 2 of 8</span>
            </div>

            {/* Concept Card */}
            <div className="prompt-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '8px' }}>Course Concept</h3>
              <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                "{promptText || 'No concept prompt entered yet.'}"
              </p>
            </div>

            <div className="review-summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px', marginTop: 0 }}>
              {/* Technical Tags & Topics Card */}
              <div className="review-card">
                <div className="review-card-header" style={{ marginBottom: '12px' }}>
                  <h4 className="review-card-title">Technical Tags &amp; Topics</h4>
                </div>
                <div className="review-card-body">
                  <div className="tags-container" style={{ marginBottom: '16px' }}>
                    {techTags.map((tag, idx) => (
                      <span key={idx} className="tag-badge" style={{ margin: '2px' }}>
                        {tag}
                        <span className="tag-close" onClick={() => removeTag(tag)}>×</span>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="prompt-textarea"
                      style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, fontSize: '0.85rem' }}
                      placeholder="+ Add custom tech stack..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={addTag}
                    />
                    <button className="file-upload-btn" onClick={addTag} style={{ fontSize: '0.85rem' }}>+ Add</button>
                  </div>
                </div>
              </div>

              {/* Course Configuration Card */}
              <div className="review-card">
                <div className="review-card-header" style={{ marginBottom: '12px' }}>
                  <h4 className="review-card-title">Course Configuration</h4>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Target Number of Lessons</span>
                    <div className="stepper" style={{ margin: 0 }}>
                      <button onClick={() => setConfigLessons(Math.max(1, configLessons - 1))}>−</button>
                      <span style={{ minWidth: '24px', textAlign: 'center' }}>{configLessons}</span>
                      <button onClick={() => setConfigLessons(configLessons + 1)}>+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Avg. Duration (Min)</span>
                    <select className="prompt-textarea" value={configDuration} onChange={(e) => setConfigDuration(Number(e.target.value))} style={{ minHeight: 'auto', padding: '6px 10px', maxWidth: '120px', marginBottom: 0 }}>
                      <option value="30">30 Min</option>
                      <option value="60">60 Min</option>
                      <option value="90">90 Min</option>
                      <option value="120">120 Min</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Matter Context Card */}
            <div className="prompt-card">
              <h3 style={{ marginBottom: '14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Subject Matter Context</h3>
              <div className="rich-editor-toolbar" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                <button className="toolbar-btn" style={{ fontWeight: 'bold' }}>B</button>
                <button className="toolbar-btn" style={{ fontStyle: 'italic' }}>I</button>
                <button className="toolbar-btn" style={{ textDecoration: 'line-through' }}>S</button>
                <button className="toolbar-btn">H</button>
                <button className="toolbar-btn">x₂</button>
                <button className="toolbar-btn">x²</button>
                <button className="toolbar-btn">”</button>
                <button className="toolbar-btn">• List</button>
                <button className="toolbar-btn">1. List</button>
                <button className="toolbar-btn">Link</button>
                <button className="toolbar-btn">Code</button>
                <button className="toolbar-btn">Table</button>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="file-upload-btn" onClick={() => setCurrentStep('dashboard')}>← Back</button>
                  <button className="file-upload-btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => setCurrentStep('review')}>Jump to Review</button>
                </div>
                <button className="action-btn" onClick={handleGenerateProposals} disabled={isLoading}>
                  {isLoading ? <><IconSpinner /> Generating…</> : <>Save &amp; Continue <IconArrow /></>}
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
                <h2>Ground your Course</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Define the knowledge boundaries and learning objectives.</p>
              </div>
              <span className="step-chip">Step 3 of 8</span>
            </div>

            <div className="review-summary-grid">
              {/* Card 1: Prerequisites */}
              <div className="review-card">
                <div className="review-card-header">
                  <h4 className="review-card-title">What they should know (Prerequisites)</h4>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {prerequisites.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="prompt-textarea"
                        style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1 }}
                        value={item}
                        onChange={(e) => {
                          const updated = [...prerequisites];
                          updated[idx] = e.target.value;
                          setPrerequisites(updated);
                        }}
                      />
                      <button className="icon-btn danger" style={{ padding: '8px' }} onClick={() => {
                        const updated = prerequisites.filter((_, i) => i !== idx);
                        setPrerequisites(updated);
                      }}>
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button className="file-upload-btn" style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center' }} onClick={() => {
                      setPrerequisites([...prerequisites, '']);
                    }}>
                      + Add Item
                    </button>
                    <button className="action-btn" style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', boxShadow: 'none', justifyContent: 'center' }} onClick={() => {
                      handleAutoSuggestGrounding('prerequisites', prerequisites, setPrerequisites);
                    }} disabled={isLoading}>
                      {isLoading ? <IconSpinner /> : '🤖 AI Suggest'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Boundaries */}
              <div className="review-card">
                <div className="review-card-header">
                  <h4 className="review-card-title">Topics they will not be learning about (Boundaries)</h4>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {boundaries.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="prompt-textarea"
                        style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1 }}
                        value={item}
                        onChange={(e) => {
                          const updated = [...boundaries];
                          updated[idx] = e.target.value;
                          setBoundaries(updated);
                        }}
                      />
                      <button className="icon-btn danger" style={{ padding: '8px' }} onClick={() => {
                        const updated = boundaries.filter((_, i) => i !== idx);
                        setBoundaries(updated);
                      }}>
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button className="file-upload-btn" style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center' }} onClick={() => {
                      setBoundaries([...boundaries, '']);
                    }}>
                      + Add Item
                    </button>
                    <button className="action-btn" style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', boxShadow: 'none', justifyContent: 'center' }} onClick={() => {
                      handleAutoSuggestGrounding('boundaries', boundaries, setBoundaries);
                    }} disabled={isLoading}>
                      {isLoading ? <IconSpinner /> : '🤖 AI Suggest'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Learning Outcomes */}
              <div className="review-card" style={{ gridColumn: 'span 2' }}>
                <div className="review-card-header">
                  <h4 className="review-card-title">Learning Outcomes</h4>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {learningOutcomes.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, minWidth: '24px', color: 'var(--blue)' }}>{idx + 1}.</span>
                      <input
                        type="text"
                        className="prompt-textarea"
                        style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1 }}
                        value={item}
                        onChange={(e) => {
                          const updated = [...learningOutcomes];
                          updated[idx] = e.target.value;
                          setLearningOutcomes(updated);
                        }}
                      />
                      <button className="icon-btn danger" style={{ padding: '8px' }} onClick={() => {
                        const updated = learningOutcomes.filter((_, i) => i !== idx);
                        setLearningOutcomes(updated);
                      }}>
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', maxWidth: '400px' }}>
                    <button className="file-upload-btn" style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center' }} onClick={() => {
                      setLearningOutcomes([...learningOutcomes, '']);
                    }}>
                      + Add Item
                    </button>
                    <button className="action-btn" style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', boxShadow: 'none', justifyContent: 'center' }} onClick={() => {
                      handleAutoSuggestGrounding('learning_outcomes', learningOutcomes, setLearningOutcomes);
                    }} disabled={isLoading}>
                      {isLoading ? <IconSpinner /> : '🤖 AI Suggest'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button className="file-upload-btn" onClick={() => setCurrentStep('context')}>← Back</button>
              <button className="action-btn" onClick={handleSaveGrounding} disabled={isLoading}>
                {isLoading ? <><IconSpinner /> Generating Proposals…</> : <>Generate Proposals <IconArrow /></>}
              </button>
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
                <h2>Choose a Direction for your Course</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Select one of the proposed directions to proceed.</p>
              </div>
              <span className="step-chip">Step 4 of 8</span>
            </div>

            <div className="proposal-grid">
              {proposals.map((prop) => {
                const isRec = prop.id === 2;
                const diffList = prop.differentiators ? prop.differentiators.split(',').map(s => s.trim()).filter(Boolean) : [];
                return (
                  <div
                    key={prop.id}
                    className={`proposal-card ${isRec ? 'recommended' : ''} ${selectedProposalId === prop.id ? 'selected' : ''} ${isLoading ? 'disabled' : ''}`}
                    onClick={() => !isLoading && handleSelectProposal(prop.id)}
                    style={{ border: isRec ? '2px solid var(--gold)' : '', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      {isRec && (
                        <span className="tag-badge" style={{ background: 'var(--navy)', color: 'var(--gold)', border: '1.5px solid var(--gold)', fontSize: '0.75rem', padding: '3px 10px', marginBottom: '12px', display: 'inline-block' }}>
                          Recommended
                        </span>
                      )}
                      <h3>{prop.title}</h3>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '20px' }}>
                        {prop.description}
                      </p>

                      {diffList.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--navy)', marginBottom: '8px' }}>
                            Key Differentiating Factors
                          </h4>
                          <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {diffList.map((diff, idx) => (
                              <li key={idx} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isRec ? "var(--gold-deep)" : "var(--navy)"} strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                {diff}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <button
                      className={isRec ? "purple-start-btn" : "file-upload-btn"}
                      style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLoading) handleSelectProposal(prop.id);
                      }}
                    >
                      {isLoading && selectedProposalId === prop.id ? <><IconSpinner /> Selecting…</> : 'Select This Option'}
                    </button>
                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: '30px' }}>
              <button className="file-upload-btn" onClick={() => setCurrentStep('grounding')}>← Back</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 5: STRUCTURE */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'structure' && (
          <div>
            <div className="header">
              <div>
                <h2>Curriculum Structure</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Review and refine the course curriculum blueprint.</p>
              </div>
              <span className="step-chip">Step 5 of 8</span>
            </div>

            <div className="structure-split-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '30px', alignItems: 'start' }}>
              {/* Left Column: Lesson Modules List */}
              <div className="lesson-list-panel" style={{ background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '6px' }}>Course Curriculum Overview</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Approach: <strong style={{ color: 'var(--blue)' }}>{promptText || 'Practical AI and Regulatory Foundations'}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {structure.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={`structure-item ${selectedStructureLessonId === item.id ? 'active' : ''}`}
                      onClick={() => setSelectedStructureLessonId(item.id)}
                      style={{ 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)', 
                        background: selectedStructureLessonId === item.id ? 'var(--blue-light)' : 'var(--surface-2)',
                        border: selectedStructureLessonId === item.id ? '1px solid rgba(72, 107, 245, 0.25)' : '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                        <span style={{ cursor: 'grab', color: 'var(--text-muted)', fontSize: '1.1rem', userSelect: 'none' }} title="Drag to reorder">⋮⋮</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--white)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          {item.order < 10 ? `0${item.order}` : item.order}
                        </span>
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
                          style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 600, 
                            border: 'none', 
                            background: 'transparent', 
                            flex: 1, 
                            color: 'var(--navy)',
                            padding: '4px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <button className="icon-btn" style={{ padding: '4px 6px', fontSize: '0.75rem' }} onClick={() => moveLesson(idx, -1)} title="Move Up">▲</button>
                        <button className="icon-btn" style={{ padding: '4px 6px', fontSize: '0.75rem' }} onClick={() => moveLesson(idx, 1)} title="Move Down">▼</button>
                        <button className="icon-btn danger" style={{ padding: '4px 6px', fontSize: '0.75rem' }} onClick={() => deleteLesson(idx)} title="Delete Lesson"><IconTrash /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className="file-upload-btn" 
                  onClick={addLesson} 
                  style={{ width: '100%', justifyContent: 'center', marginTop: '16px', fontSize: '0.875rem' }}
                >
                  + Add Lesson
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button className="file-upload-btn" onClick={() => setCurrentStep('proposal')}>← Back</button>
                </div>
              </div>

              {/* Right Column: Detailed Section Editor & Role Tabs */}
              <div className="lesson-detail-panel" style={{ background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '4px' }}>Lesson Structure by Role</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Choose which lesson sections are generated and shown for Creator, Educator, and Student.
                  </span>
                </div>

                {selectedStructureLessonId ? (
                  (() => {
                    const lIdx = structure.findIndex(l => l.id === selectedStructureLessonId);
                    const lesson = structure[lIdx];
                    if (!lesson) return null;
                    const sections = lesson.sections?.[activeStructureRole] || [];

                    const roleDetails = {
                      creator: {
                        desc: "Focuses on content depth, technical accuracy, and andragogical alignment for high-quality curriculum design.",
                        label: "Creator View"
                      },
                      student: {
                        desc: "Optimized for learning outcomes, student engagement, and compelling value propositions.",
                        label: "Student View"
                      },
                      educator: {
                        desc: "Designed for seamless facilitation, classroom management, and effective student engagement strategies.",
                        label: "Educator View"
                      }
                    };

                    return (
                      <div>
                        {/* Role Tabs */}
                        <div className="tab-row" style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
                          {['creator', 'student', 'educator'].map(role => (
                            <button
                              key={role}
                              className={`tab-btn ${activeStructureRole === role ? 'active' : ''}`}
                              onClick={() => setActiveStructureRole(role)}
                              style={{ 
                                padding: '10px 16px', 
                                borderBottom: activeStructureRole === role ? '2px solid var(--blue)' : 'none',
                                fontWeight: activeStructureRole === role ? 'bold' : 'normal',
                                color: activeStructureRole === role ? 'var(--blue)' : 'var(--text-secondary)'
                              }}
                            >
                              {roleDetails[role].label}
                            </button>
                          ))}
                        </div>

                        {/* Active Role Description */}
                        <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', borderLeft: '3px solid var(--blue)' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {roleDetails[activeStructureRole].desc}
                          </p>
                        </div>

                        {/* Sections List */}
                        <div className="sections-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {sections.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px 0' }}>No sections added yet.</p>
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
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '12px 16px',
                                  background: 'var(--white)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: 'var(--radius-md)',
                                  gap: '12px'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                  <span style={{ cursor: 'grab', color: 'var(--text-muted)', fontSize: '1.1rem', userSelect: 'none' }} title="Drag to reorder">⋮⋮</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <input
                                        type="text"
                                        value={sec.title}
                                        onChange={(e) => {
                                          const updated = [...structure];
                                          updated[lIdx].sections[activeStructureRole][sIdx].title = e.target.value;
                                          setStructure(updated);
                                        }}
                                        className="structure-title-input"
                                        style={{ fontWeight: 700, fontSize: '0.9rem', border: 'none', background: 'transparent', color: 'var(--navy)', flex: 1, padding: 0 }}
                                      />
                                      {sec.locked && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} title="Core Section">🔒</span>
                                      )}
                                    </div>
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
                                      style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', border: 'none', background: 'transparent', padding: 0 }}
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
                  <h3 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Define a new structural requirement for the {newSectionRole === 'creator' ? 'Creator' : newSectionRole === 'student' ? 'Student' : 'Educator'} view.</h3>
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
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Check everything before the AI starts generating your course.</p>
              </div>
              <span className="step-chip">Step 6 of 8</span>
            </div>

            <div className="review-summary-grid">
              {/* Concept Card */}
              <div className="review-card">
                <div className="review-card-header">
                  <h4 className="review-card-title">
                    <svg width="18" height="18" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                    Course Concept
                  </h4>
                  <button className="ai-pill-btn edit" style={{ fontSize: '0.75rem', padding: '2px 8px' }} onClick={() => {
                    const newConcept = prompt("Edit Course Concept / Prompt:", promptText);
                    if (newConcept !== null) setPromptText(newConcept);
                  }}>Edit</button>
                </div>
                <div className="review-card-body">
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '8px' }}>Course Focus:</p>
                  <p style={{ fontStyle: 'italic' }}>"{promptText || 'Practical AI and Regulatory Foundations'}"</p>
                </div>
              </div>

              {/* Duration & Metadata Card */}
              <div className="review-card">
                <div className="review-card-header">
                  <h4 className="review-card-title">
                    <svg width="18" height="18" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Duration & Metadata
                  </h4>
                </div>
                <div className="review-card-body">
                  <p style={{ marginBottom: '12px' }}>
                    Total: <strong style={{ color: 'var(--navy)' }}>{structure.length} Lesson(s) &times; {configDuration} Minute(s)</strong>
                  </p>
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '6px' }}>Category Tags:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {techTags.length > 0 ? techTags.map(tag => (
                      <span key={tag} className="tag-badge" style={{ margin: 0, fontSize: '0.75rem', padding: '3px 8px' }}>{tag}</span>
                    )) : (
                      ['Healthcare AI', 'Clinical Trial Design', 'Regulatory Compliance'].map(tag => (
                        <span key={tag} className="tag-badge" style={{ margin: 0, fontSize: '0.75rem', padding: '3px 8px' }}>{tag}</span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Curriculum Outline & POV Card */}
              <div className="review-card" style={{ gridColumn: 'span 2' }}>
                <div className="review-card-header">
                  <h4 className="review-card-title">
                    <svg width="18" height="18" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                    Curriculum Structure & POV Personas
                  </h4>
                </div>
                <div className="review-card-body">
                  <p style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: '8px' }}>Generated Outline ({structure.length} Lessons):</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
                    <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {structure.map((item) => (
                        <li key={item.id} style={{ fontWeight: 600 }}>{item.title}</li>
                      ))}
                    </ol>
                    <div className="pov-structures">
                      <div className="pov-role-block">
                        <div className="pov-role-header">
                          <span>🎨 Creator POV</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>8 Sections</span>
                        </div>
                        <div className="pov-sections-pills">
                          {['Overview', 'Learning Outcome', 'Core Content', 'Exercises', 'Quizzes', 'Regulatory Scenario Builder', 'Python Script Repository', 'Ethics Case Curator'].map(s => (
                            <span key={s} className="pov-section-pill">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="pov-role-block">
                        <div className="pov-role-header">
                          <span>📚 Student POV</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>7 Sections</span>
                        </div>
                        <div className="pov-sections-pills">
                          {['Why This Matters', 'What You Will Learn', 'Learning Journey', 'Interactive Practice', 'Regulatory Simulator', 'Self-Assessment', 'Glossary'].map(s => (
                            <span key={s} className="pov-section-pill">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="pov-role-block">
                        <div className="pov-role-header">
                          <span>👩‍🏫 Educator POV</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--blue)' }}>7 Sections</span>
                        </div>
                        <div className="pov-sections-pills">
                          {['Facilitator Guide', 'Engagement Strategies', 'Classroom Management', 'Discussion Questions', 'Grading Rubric', 'Additional Readings', 'Keys & Explanations'].map(s => (
                            <span key={s} className="pov-section-pill">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructional Alignment Card */}
              <div className="review-card" style={{ gridColumn: 'span 2' }}>
                <div className="review-card-header">
                  <h4 className="review-card-title">
                    <svg width="18" height="18" fill="none" stroke="var(--blue)" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Instructional Alignment
                  </h4>
                </div>
                <div className="review-card-body review-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', display: 'grid' }}>
                  <div className="alignment-item">
                    <h5>Prerequisites</h5>
                    <ul>
                      {prerequisites.length > 0 ? prerequisites.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      )) : (
                        <li>Basic understanding of machine learning principles.</li>
                      )}
                    </ul>
                  </div>
                  <div className="alignment-item">
                    <h5>Topics Not Covered (Out of Scope)</h5>
                    <ul>
                      {boundaries.length > 0 ? boundaries.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      )) : (
                        <li>Low-level hardware/GPU optimization scripts.</li>
                      )}
                    </ul>
                  </div>
                  <div className="alignment-item">
                    <h5>Learning Outcomes</h5>
                    <ul>
                      {learningOutcomes.length > 0 ? learningOutcomes.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      )) : (
                        <li>Analyze regulatory compliance matrices.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button className="file-upload-btn" onClick={() => setCurrentStep('structure')}>← Back to Outline</button>
              <button className="purple-start-btn" onClick={handleTriggerGeneration} disabled={isLoading}>
                {isLoading ? <><IconSpinner /> Starting…</> : (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Start Generation
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 7: GENERATING */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'generating' && (
          <div>
            <div className="header">
              <div>
                <h2>AI Pipeline Generation</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Live generation process of your multi-role course content.</p>
              </div>
              <span className="step-chip">Step 7 of 8</span>
            </div>

            {/* Live Status Box */}
            <div className="live-status-box">
              <div className="live-status-header">
                <div className="live-status-title">
                  <IconSpinner />
                  <span>Assembling Course Content...</span>
                </div>
                <div className="live-status-text">
                  {generationStatusText}
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div className="progress-bar-outer" style={{ flex: 1, margin: 0 }}>
                  <div className="progress-bar-inner" style={{ width: `${generationProgress}%` }} />
                </div>
                <span style={{ fontWeight: 700, minWidth: '40px', textAlign: 'right' }}>{generationProgress}%</span>
                <button 
                  className="cancel-gen-btn" 
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel the generation?')) {
                      setCurrentStep('review');
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Workspace Preview Panel */}
            <div className="workspace-preview-panel">
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <span className="tag-badge" style={{ background: 'var(--blue)', color: '#fff', fontSize: '0.75rem', padding: '3px 8px', marginBottom: '8px', display: 'inline-block' }}>
                    PREVIEW WORKSPACE
                  </span>
                  <h3 style={{ color: 'var(--navy)', fontSize: '1.25rem', marginTop: '4px' }}>{promptText || 'Practical AI and Regulatory Foundations'}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {structure.length} Lessons &middot; Est. 12 hours &middot; Created: {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="icon-btn" disabled style={{ opacity: 0.5 }}>◀</button>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lesson Navigator</span>
                  <button className="icon-btn" disabled style={{ opacity: 0.5 }}>▶</button>
                </div>
              </div>

              {/* Workspace Split Layout */}
              <div className="structure-split-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                {/* Left Side: Lessons Navigator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {structure.map((item, idx) => {
                    const threshold = (idx + 1) * (100 / structure.length);
                    const prevThreshold = idx * (100 / structure.length);
                    const isDone = generationProgress >= threshold;
                    const isProcessing = generationProgress >= prevThreshold && generationProgress < threshold;
                    return (
                      <div 
                        key={item.id} 
                        style={{ 
                          padding: '12px', 
                          borderRadius: 'var(--radius-md)', 
                          background: isProcessing ? 'var(--blue-light)' : 'var(--surface-2)',
                          border: isProcessing ? '1px solid rgba(72, 107, 245, 0.25)' : '1px solid var(--border-color)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          opacity: isDone || isProcessing ? 1 : 0.5
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>0{idx + 1}</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.title}</span>
                        </div>
                        <div>
                          {isDone ? (
                            <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>✓ Done</span>
                          ) : isProcessing ? (
                            <span style={{ color: 'var(--blue)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <IconSpinner /> Writing
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right Side: Role Content Preview */}
                <div style={{ background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                  <div className="tab-row" style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
                    <button className="tab-btn active">Creator POV</button>
                    <button className="tab-btn">Student POV</button>
                    <button className="tab-btn">Educator POV</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {['Overview', 'Learning Outcome', 'Core Content'].map((secName, sIdx) => {
                      const isSecDone = generationProgress > (sIdx + 1) * 30;
                      return (
                        <div key={secName} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', background: isSecDone ? 'var(--white)' : 'var(--surface-2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)' }}>{secName}</h4>
                            {isSecDone ? (
                              <span style={{ color: 'var(--accent-green)', fontSize: '0.75rem', fontWeight: 600 }}>Completed</span>
                            ) : (
                              <span className="pulse" style={{ color: 'var(--blue)', fontSize: '0.75rem', fontWeight: 600 }}>Generating...</span>
                            )}
                          </div>
                          {isSecDone ? (
                            <div style={{ height: '32px', background: 'var(--surface-3)', borderRadius: '4px', opacity: 0.5, display: 'flex', alignItems: 'center', paddingLeft: '10px', fontSize: '0.75rem' }}>
                              Content writing completed for this section.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div className="skeleton-bar" style={{ width: '80%', height: '10px' }} />
                              <div className="skeleton-bar" style={{ width: '50%', height: '10px' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 8: GENERATED COURSE */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'generated' && courseData && (
          <div>
            <div className="header" style={{ marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: 'var(--navy)', fontWeight: 800 }}>Your Course is Ready!</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Generation complete. All content units and assets are ready for download.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="action-btn" onClick={goToDashboard}><IconPlus /> New Course</button>
              </div>
            </div>

            <div className="structure-split-layout" style={{ display: 'grid', gridTemplateColumns: '1.1fr 2.5fr', gap: '30px', alignItems: 'start' }}>
              {/* Left Column: Assets Checklist Sidebar */}
              <div className="assets-checklist-sidebar">
                <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '4px' }}>Assets Checklist</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Preview and download generated documents.
                </p>

                <div className="assets-menu-group">
                  <div className="assets-group-title">Creator PDF</div>
                  {courseData.lessons?.map((lesson, idx) => (
                    <button
                      key={`creator-${lesson.id}`}
                      className={`assets-lesson-btn ${activeRole === 'creator' && activeLessonId === lesson.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveRole('creator');
                        setActiveLessonId(lesson.id);
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>L0{idx + 1}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                    </button>
                  ))}
                </div>

                <div className="assets-menu-group">
                  <div className="assets-group-title">Student PDF</div>
                  {courseData.lessons?.map((lesson, idx) => (
                    <button
                      key={`student-${lesson.id}`}
                      className={`assets-lesson-btn ${activeRole === 'student' && activeLessonId === lesson.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveRole('student');
                        setActiveLessonId(lesson.id);
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>L0{idx + 1}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                    </button>
                  ))}
                </div>

                <div className="assets-menu-group">
                  <div className="assets-group-title">Educator PDF</div>
                  {courseData.lessons?.map((lesson, idx) => (
                    <button
                      key={`educator-${lesson.id}`}
                      className={`assets-lesson-btn ${activeRole === 'educator' && activeLessonId === lesson.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveRole('educator');
                        setActiveLessonId(lesson.id);
                      }}
                    >
                      <span style={{ fontWeight: 700 }}>L0{idx + 1}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Document Viewer */}
              <div>
                {/* Document Viewer Toolbar */}
                <div className="viewer-toolbar">
                  <div className="toolbar-zoom-group">
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>Page Indicator: 1 of 11</span>
                    <button className="icon-btn" style={{ padding: '4px 8px' }} title="Zoom Out">−</button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>100%</span>
                    <button className="icon-btn" style={{ padding: '4px 8px' }} title="Zoom In">+</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="file-upload-btn" style={{ fontSize: '0.8rem', padding: '6px 12px', marginBottom: 0 }} onClick={() => alert('Opening search...')} title="Search document">🔍 Search</button>
                    <button className="file-upload-btn" style={{ fontSize: '0.8rem', padding: '6px 12px', marginBottom: 0 }} onClick={() => window.print()} title="Print document">Print</button>
                    <button className="purple-start-btn" style={{ fontSize: '0.8rem', padding: '6px 12px', gap: '4px', boxShadow: 'none' }} onClick={() => { setExportFormat('pdf'); setIsExportModalOpen(true); }} title="Save/Download Document">Download PDF</button>
                  </div>
                </div>

                {/* PDF Paper Canvas */}
                <div className="pdf-paper-canvas" style={{ position: 'relative' }}>
                  {/* PDF Header Watermark */}
                  <div className="pdf-header-watermark">
                    <span>Maxy Academy &middot; Curricula AI</span>
                    <span>{courseData.title || 'Practical AI and Regulatory Foundations'}</span>
                  </div>

                  {/* Document Content */}
                  <div className="pdf-body">
                    {/* Title Header */}
                    <div style={{ marginBottom: '30px' }}>
                      <span style={{ color: 'var(--blue)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {activeRole.toUpperCase()} POV MATERIALS
                      </span>
                      <h1 style={{ fontSize: '1.65rem', color: 'var(--navy)', marginTop: '4px', fontWeight: 800 }}>
                        Lesson {courseData.lessons?.findIndex(l => l.id === activeLessonId) + 1}: {courseData.lessons?.find(l => l.id === activeLessonId)?.title}
                      </h1>
                    </div>

                    <div className="editor-panel" style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none', minHeight: 'auto' }}>
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

            {/* PDF Footer Page */}
            <div className="pdf-footer-page">
              <span>Confidential &middot; For Educational Use Only</span>
              <span>Page {courseData.lessons?.findIndex(l => l.id === activeLessonId) + 1} of {courseData.lessons?.length}</span>
            </div>
          </div>
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
      </>
    )}
      </div>
    </div>
  );
}
