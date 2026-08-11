import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconArrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', display: 'inline-block' }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="spin-smooth" style={{ verticalAlign: 'middle', display: 'inline-block' }}>
    <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
    <path d="M12 2.5a9.5 9.5 0 0 1 9.5 9.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
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
  { key: 'dashboard', label: 'Concept' },
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
  return (
    <div className="step-progress-bar">
      {STEPS.map((step, i) => {
        const isDone = currentIdx > i;
        const isActive = currentIdx === i;
        return (
          <React.Fragment key={step.key}>
            <div className={`step-node ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
              <div className="step-node-circle">
                {isDone ? <IconCheck /> : <span>{i + 1}</span>}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-connector ${isDone ? 'done' : ''}`} />}
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

  // ── Course Library Filters & Pagination ──
  const [libraryFilterTab, setLibraryFilterTab] = useState('all'); // 'all', 'drafts', 'published', 'archived'
  const [librarySearchQuery, setLibrarySearchQuery] = useState('');
  const [librarySelectedTag, setLibrarySelectedTag] = useState('All Tags');
  const [libraryWipPage, setLibraryWipPage] = useState(1);
  const [libraryPubPage, setLibraryPubPage] = useState(1);

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
  const DEFAULT_CANDIDATE_TAGS = [
    "Go (Golang)", "Python", "React Native", "JavaScript", "TypeScript",
    "Microservices", "Concurrency", "Generative AI", "REST APIs", "Docker & Kubernetes",
    "Capstone Projects", "Project-Based Learning", "Experiential Learning",
    "Collaborative Learning", "Industry Partnerships", "Authentic Assessment",
    "AI in Education", "Workplace Simulation", "Constructive Alignment",
    "Team-Based Skills", "Project Management", "Problem-Based Learning"
  ];
  const [techTags, setTechTags] = useState(DEFAULT_CANDIDATE_TAGS.slice(0, 3));
  const [allSuggestedTags, setAllSuggestedTags] = useState(DEFAULT_CANDIDATE_TAGS);
  const [newTag, setNewTag] = useState('');

  const toggleTag = (tag) => {
    if (techTags.includes(tag)) {
      setTechTags(techTags.filter(t => t !== tag));
    } else {
      setTechTags([...techTags, tag]);
    }
  };

  const handleAddCustomTag = (e) => {
    if (e?.key && e.key !== 'Enter') return;
    const trimmed = newTag.trim();
    if (trimmed) {
      if (!allSuggestedTags.includes(trimmed)) {
        setAllSuggestedTags(prev => [...prev, trimmed]);
      }
      if (!techTags.includes(trimmed)) {
        setTechTags(prev => [...prev, trimmed]);
      }
      setNewTag('');
    }
  };
  const [configLessons, setConfigLessons] = useState(5);
  const [configDuration, setConfigDuration] = useState(60);
  const [configDifficulty, setConfigDifficulty] = useState('Beginner');
  const [configAudience, setConfigAudience] = useState('Student');
  const [subjectContext, setSubjectContext] = useState('');
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [hoverGrid, setHoverGrid] = useState({ r: 2, c: 2 });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const contextTextareaRef = useRef(null);

  const insertMarkdown = (prefix, suffix = '') => {
    if (!contextTextareaRef.current) {
      setSubjectContext(prev => prev + prefix + suffix);
      return;
    }
    const textarea = contextTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = subjectContext;
    const selectedText = text.substring(start, end) || 'text';
    const replacement = `${prefix}${selectedText}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setSubjectContext(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 10);
  };

  const applyHeading = (level) => {
    setShowHeadingDropdown(false);
    const hashes = '#'.repeat(level);
    insertMarkdown(`\n${hashes} `, '');
  };

  const insertTable = (rows, cols) => {
    setShowTablePicker(false);
    let tableMd = '\n';
    // Header row
    tableMd += '| ' + Array.from({ length: cols }).map((_, c) => `Header ${c + 1}`).join(' | ') + ' |\n';
    // Separator row
    tableMd += '| ' + Array.from({ length: cols }).map(() => '---').join(' | ') + ' |\n';
    // Body rows
    for (let r = 0; r < rows; r++) {
      tableMd += '| ' + Array.from({ length: cols }).map((_, c) => `Cell ${r + 1}-${c + 1}`).join(' | ') + ' |\n';
    }
    tableMd += '\n';
    insertMarkdown(tableMd, '');
  };

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
  const [activeStructureRole, setActiveStructureRole] = useState('creator');
  const [selectedStructureLessonId, setSelectedStructureLessonId] = useState(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionInstruction, setNewSectionInstruction] = useState('');
  const [newSectionRole, setNewSectionRole] = useState('creator');

  // ── Modals & Popups ──
  const [deleteTargetSession, setDeleteTargetSession] = useState(null);

  // ── Generation ──
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [currentGeneratingLessonIdx, setCurrentGeneratingLessonIdx] = useState(0);

  // ── Generated Course ──
  const [courseData, setCourseData] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeRole, setActiveRole] = useState('creator');
  const [activeSubSection, setActiveSubSection] = useState('overview');
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (currentStep === 'generated' && sessionId) {
      fetch(`${API_BASE}/courses/${sessionId}/export?format=pdf&role=${activeRole.toLowerCase()}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch PDF preview blob");
          return res.blob();
        })
        .then(blob => {
          if (isMounted) {
            const url = URL.createObjectURL(blob);
            setPdfBlobUrl(url);
          }
        })
        .catch(err => console.error("PDF Blob error:", err));
    }
    return () => { isMounted = false; };
  }, [currentStep, sessionId, activeRole]);

  // ── Phase 3: Interactive Course & AI Toolbar ──
  const [sectionLoading, setSectionLoading] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isAIWandOpen, setIsAIWandOpen] = useState(false);
  const [isWandProcessing, setIsWandProcessing] = useState(false);

  // ── Phase 4: Export Hub & Versioning states ──
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('docx');
  const [exportRole, setExportRole] = useState('all');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Phase 2: Structure Details & Inline Editing ──
  const [groundingEditIdx, setGroundingEditIdx] = useState({ type: null, idx: -1 }); // type: 'prereq' | 'boundary' | 'outcome'
  const [groundingEditText, setGroundingEditText] = useState('');

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

  const handleExport = async () => {
    if (!courseData) return;
    const title = courseData.title || 'Course_Curriculum';
    const roleText = activeRole.toLowerCase();

    // 1. Try real API export from FastAPI backend
    if (sessionId) {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/courses/${sessionId}/export?format=${exportFormat}&role=${roleText}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title.replace(/\s+/g, '_')}_${roleText}.${exportFormat === 'markdown' ? 'md' : exportFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setIsExportModalOpen(false);
          return;
        }
      } catch (err) {
        console.error("API export error, falling back to local exporter:", err);
      }
    }

    // 2. Local fallback if offline or no sessionId
    const curLesson = courseData.lessons?.find(l => l.id === activeLessonId) || courseData.lessons?.[0];
    const lessonTitle = curLesson?.title || 'Lesson_Content';
    let contentString = `# ${title}\n## ${activeRole.toUpperCase()} POV - ${lessonTitle}\n\n`;
    const curSecs = curLesson?.sections?.[activeRole] || {};

    Object.entries(curSecs).forEach(([secKey, secVal]) => {
      contentString += `### ${secKey.toUpperCase()}\n`;
      if (typeof secVal === 'string') {
        contentString += `${secVal}\n\n`;
      } else if (Array.isArray(secVal)) {
        secVal.forEach(item => {
          contentString += `- ${typeof item === 'object' ? JSON.stringify(item) : item}\n`;
        });
        contentString += '\n';
      } else {
        contentString += `${JSON.stringify(secVal, null, 2)}\n\n`;
      }
    });

    let mimeType = 'text/plain';
    let fileExt = 'txt';

    if (exportFormat === 'markdown' || exportFormat === 'md') {
      mimeType = 'text/markdown';
      fileExt = 'md';
    } else if (exportFormat === 'html') {
      mimeType = 'text/html';
      fileExt = 'html';
      contentString = `<!DOCTYPE html><html><head><title>${title}</title><style>body{font-family:sans-serif;padding:30px;color:#2D3561;}</style></head><body><pre>${contentString}</pre></body></html>`;
    } else if (exportFormat === 'pdf' || exportFormat === 'docx') {
      mimeType = 'application/octet-stream';
      fileExt = exportFormat;
    }

    const blob = new Blob([contentString], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_${activeRole.toUpperCase()}_${lessonTitle.replace(/\s+/g, '_')}.${fileExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          const loadedTech = data.tech_tags || [];
          setTechTags(loadedTech);
          setAllSuggestedTags(data.all_suggested_tags && data.all_suggested_tags.length > 0 ? data.all_suggested_tags : Array.from(new Set([...loadedTech, ...DEFAULT_CANDIDATE_TAGS])));
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

  // ── Real-Time SSE Stream & Polling generation progress ──
  useEffect(() => {
    if (currentStep !== 'generating' || !sessionId) return;

    let eventSource = null;
    let fallbackInterval = null;

    const handleProgressUpdate = async (data) => {
      if (data.progress !== undefined) setGenerationProgress(data.progress);
      if (data.status_text) setGenerationStatusText(data.status_text);

      try {
        const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
        if (res.ok) {
          const sessData = await res.json();
          if (sessData.lessons && sessData.lessons.length > 0) {
            setCourseData(sessData);
            if (!activeLessonId) setActiveLessonId(sessData.lessons[0].id);
          }
          if (sessData.status === 'completed' || data.status === 'completed') {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            setCourseData(sessData);
            if (sessData.lessons?.length > 0) setActiveLessonId(sessData.lessons[0].id);
            fetchSessions();
          } else if (sessData.status === 'error' || data.status === 'error') {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            alert(sessData.status_text || data.status_text);
            setCurrentStep('review');
          }
        }
      } catch { /* ignore */ }
    };

    try {
      eventSource = new EventSource(`${API_BASE}/courses/sessions/${sessionId}/stream-progress`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleProgressUpdate(data);
        } catch { /* ignore */ }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!fallbackInterval) {
          fallbackInterval = setInterval(async () => {
            try {
              const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
              if (res.ok) {
                const data = await res.json();
                handleProgressUpdate(data);
              }
            } catch { /* ignore */ }
          }, 2000);
        }
      };
    } catch {
      fallbackInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            handleProgressUpdate(data);
          }
        } catch { /* ignore */ }
      }, 2000);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [currentStep, sessionId, activeLessonId, fetchSessions]);

  // ── ScrollSpy for ON THIS PAGE TOC Navigation ──
  useEffect(() => {
    if (currentStep !== 'generating' && currentStep !== 'generated') return;

    const sectionElements = document.querySelectorAll('[id^="step7-sec-"]');
    if (!sectionElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const secId = entry.target.id.replace('step7-sec-', '');
            setActiveSubSection(secId);
          }
        });
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: 0.1 }
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [currentStep, activeRole, currentGeneratingLessonIdx]);

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

      // Fetch latest session data from backend to ensure all state fields (prerequisites, boundaries, learningOutcomes) are synchronized
      const sessRes = await fetch(`${API_BASE}/courses/sessions/${sessId}`);
      if (sessRes.ok) {
        const fullSess = await sessRes.json();
        setPrerequisites(fullSess.prerequisites || []);
        setBoundaries(fullSess.out_of_scope || []);
        setLearningOutcomes(fullSess.learning_outcomes || []);
      }

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
      const newStruct = (selData.structure || []).map(lesson => ({
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
        const loadedTech = data.tech_tags || [];
        setTechTags(loadedTech);
        setAllSuggestedTags(data.all_suggested_tags && data.all_suggested_tags.length > 0 ? data.all_suggested_tags : Array.from(new Set([...loadedTech, ...DEFAULT_CANDIDATE_TAGS])));
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
        setSelectedProposalId(null);
        setStructure([]);
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
        if (proposals.length > 0) {
          const genRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/generate`, {
            method: 'POST',
          });
          if (genRes.ok) {
            const genData = await genRes.json();
            setProposals(genData.proposals || []);
            setSelectedProposalId(null);
            setStructure([]);
          } else {
            alert('Grounding saved, but failed to refresh proposals.');
          }
        }
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

  // ── Specific Button Loading State ──
  const [loadingField, setLoadingField] = useState(null);

  const handleAutoSuggestGrounding = async (fieldType, currentList, setter) => {
    setLoadingField(fieldType);
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
      setLoadingField(null);
    }
  };

  // ── Step 4: Select Proposal ──
  const handleSelectProposal = async (propId) => {
    setSelectedProposalId(propId);
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
        const loadedTech = data.tech_tags || [];
        setTechTags(loadedTech);
        setAllSuggestedTags(data.all_suggested_tags && data.all_suggested_tags.length > 0 ? data.all_suggested_tags : Array.from(new Set([...loadedTech, ...DEFAULT_CANDIDATE_TAGS])));
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

  // ── Sync session state from backend on step navigation (Fix for empty state on Back) ──
  const syncSessionState = useCallback(async (targetSessionId = sessionId) => {
    if (!targetSessionId) return;
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${targetSessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
        if (data.prompt) setPromptText(data.prompt);
        setTechTags(data.tech_tags || []);
        setAllSuggestedTags(data.all_suggested_tags?.length ? data.all_suggested_tags : DEFAULT_CANDIDATE_TAGS);
        if (data.config) {
          if (data.config.lessons_count != null) setConfigLessons(data.config.lessons_count);
          if (data.config.duration != null) setConfigDuration(data.config.duration);
          if (data.config.difficulty) setConfigDifficulty(data.config.difficulty);
          if (data.config.target_audience) setConfigAudience(data.config.target_audience);
          if (data.config.subject_context != null) setSubjectContext(data.config.subject_context);
        }
        if (data.subject_context != null) setSubjectContext(data.subject_context);
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
      }
    } catch (err) {
      console.error("Failed to sync session state:", err);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId && currentStep !== 'generating') {
      syncSessionState(sessionId);
    }
  }, [currentStep, sessionId, syncSessionState]);

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

        {/* ── Courses Page View (Course Library Layout) ── */}
        {currentView === 'courses' && (
          <div className="course-library-container">
            {/* Library Top Header */}
            <div className="library-top-header">
              <div>
                <h1 className="library-title">Course Library</h1>
                <p className="library-subtitle">Manage and organize your course curriculum assets.</p>
              </div>

              <div className="library-header-actions">
                <button className="library-upload-btn playful-card" onClick={() => { setCurrentView('wizard'); setCurrentStep('dashboard'); }}>
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
                                onClick={() => handleResumeSession(sess)}
                                onDoubleClick={() => handleResumeSession(sess)}
                                onTouchEnd={(e) => {
                                  const now = Date.now();
                                  if (window._lastCardTap && (now - window._lastCardTap) < 350) {
                                    handleResumeSession(sess);
                                  }
                                  window._lastCardTap = now;
                                }}
                              >
                                <div className="card-top">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span className="card-tag" style={{ background: '#fef3c7', color: '#b45309' }}>📝 DRAFT</span>
                                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        className="ai-pill-btn" 
                                        style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
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
                                        Publish 🚀
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
                                        Archive 📦
                                      </button>
                                      <button 
                                        className="icon-btn-tool"
                                        title="Delete Draft"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteTargetSession(sess);
                                        }}
                                      >
                                        <IconTrash />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 className="card-title">{sess.title || sess.prompt}</h3>
                                  
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
                                  <button className="action-btn" style={{ width: '100%', justifyContent: 'center', background: 'var(--surface-2)', color: 'var(--navy)', border: '1px solid var(--border-color)' }}>
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
                                onClick={() => handleResumeSession(sess)}
                                onDoubleClick={() => handleResumeSession(sess)}
                                onTouchEnd={(e) => {
                                  const now = Date.now();
                                  if (window._lastCardTap && (now - window._lastCardTap) < 350) {
                                    handleResumeSession(sess);
                                  }
                                  window._lastCardTap = now;
                                }}
                              >
                                <div className="card-top">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span className="card-tag" style={{ background: '#dcfce7', color: '#15803d' }}>✅ PUBLISHED</span>
                                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
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
                                        Archive 📦
                                      </button>
                                      <button 
                                        className="icon-btn-tool" 
                                        title="Delete Course"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDeleteTargetSession(sess);
                                        }}
                                      >
                                        <IconTrash />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 className="card-title">{sess.title || sess.prompt}</h3>

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
                                  <button className="icon-btn-tool" style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', width: '32px', height: '32px' }}>
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
                                onDoubleClick={() => handleResumeSession(sess)}
                                onTouchEnd={(e) => {
                                  const now = Date.now();
                                  if (window._lastCardTap && (now - window._lastCardTap) < 350) {
                                    handleResumeSession(sess);
                                  }
                                  window._lastCardTap = now;
                                }}
                              >
                                <div className="card-top">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span className="card-tag" style={{ background: '#f1f5f9', color: '#475569' }}>📦 ARCHIVED</span>
                                    <div style={{ display: 'flex', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
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
                                        <IconTrash />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 className="card-title">{sess.title || sess.prompt}</h3>
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
        )}

        {/* ── Wizard Flow View ── */}
        {currentView === 'wizard' && (
          <>
            {/* Step Progress Bar */}
            <StepProgressBar currentStep={currentStep} />

            {isLoading && currentStep === 'dashboard' ? (
              <div className="magic-progress-container">
                {/* Playful Floating Sparkles & Star Icon */}
                <div className="magic-orb-container playful-card">
                  <div className="sparkle-orbit">
                    <span className="sparkle-particle p1">✨</span>
                    <span className="sparkle-particle p2">⚡</span>
                    <span className="sparkle-particle p3">🌟</span>
                    <span className="sparkle-particle p4">🔮</span>
                  </div>
                  <div className="magic-icon-star-spin">
                    <svg width="40" height="40" fill="none" stroke="var(--gold)" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                </div>

                <h1 className="magic-title">Crafting Your Curriculum Magic...</h1>
                <p className="magic-subtext">
                  Our AI agents are sculpting technical foundations, learning outcomes, and persona guides in real time!
                </p>

                {/* Animated Steps Container */}
                <div className="progress-step-list">
                  {[
                    { id: 1, name: "TECHNICAL FOUNDATIONS", desc: "Analyzing tech stack, libraries & frameworks" },
                    { id: 2, name: "EDUCATIONAL GROUNDING", desc: "Setting prerequisites & out-of-scope boundaries" },
                    { id: 3, name: "DIRECTIONAL PROPOSALS", desc: "Structuring practical, recommended & advanced tracks" },
                    { id: 4, name: "CURRICULUM OUTLINE", desc: "Building 3-POV persona guides (Creator, Student, Educator)" }
                  ].map((step) => {
                    const isActive = agentProgressStage === step.id;
                    const isCompleted = agentProgressStage > step.id;
                    return (
                      <div 
                        key={step.id} 
                        className={`progress-step-item playful-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div className={`step-badge-number ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}>
                            {isCompleted ? '✓' : step.id}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span className="progress-step-name">{step.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{step.desc}</span>
                          </div>
                        </div>

                        <div className="progress-step-status-wrap">
                          {isActive ? (
                            <span className="status-pill processing">
                              <span className="pulse-dot"></span>
                              Processing...
                            </span>
                          ) : isCompleted ? (
                            <span className="status-pill completed">✓ Done</span>
                          ) : (
                            <span className="status-pill pending">Pending</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Fun Trivia Box */}
                <div className="loading-trivia-card playful-card">
                  <div className="trivia-badge">💡 DID YOU KNOW?</div>
                  <p className="trivia-text">
                    "AI-assisted project-based learning improves knowledge retention by up to <strong>74%</strong> compared to traditional lecture formats!"
                  </p>
                </div>

                <div className="elice-footer" style={{ width: '100%', maxWidth: '460px', marginTop: '30px' }}>
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

            {/* Technical Tags & Topics Card */}
            <div className="tech-tags-card" style={{ marginBottom: '24px' }}>
              <div className="tech-tags-header">
                <div className="tech-tags-title-group">
                  <div className="tech-tags-icon-circle">
                    <IconLayers />
                  </div>
                  <div>
                    <h3 className="tech-tags-title">Technical Tags &amp; Topics</h3>
                    <p className="tech-tags-subtitle">Choose the technologies that will power your project. Showing up to {Math.min(allSuggestedTags.length, 20)} relevant suggestions.</p>
                  </div>
                </div>
                <div className="tech-tags-count-badge">
                  {techTags.length} SELECTED
                </div>
              </div>

              <div className="tech-tags-pills-grid">
                {allSuggestedTags.slice(0, 20).map((tag, idx) => {
                  const isSelected = techTags.includes(tag);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`tech-tag-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="tech-tags-input-container">
                <span className="input-plus-icon">+</span>
                <input
                  type="text"
                  className="tech-tags-custom-input"
                  placeholder="Add custom tech stack..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                />
                {newTag.trim() && (
                  <button 
                    type="button" 
                    className="tech-tags-add-btn" 
                    onClick={handleAddCustomTag}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            {/* Course Configuration Card */}
            <div className="prompt-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Course Configuration</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Target Number of Lessons</span>
                  <div className="stepper" style={{ margin: 0 }}>
                    <button onClick={() => setConfigLessons(Math.max(1, configLessons - 1))}>−</button>
                    <span style={{ minWidth: '24px', textAlign: 'center' }}>{configLessons}</span>
                    <button onClick={() => setConfigLessons(configLessons + 1)}>+</button>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--surface-1)', padding: '12px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Avg. Duration per Lesson (Min)</span>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{configDuration} min</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {[5, 10, 15, 30, 60, 90, 120].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setConfigDuration(p)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: `1px solid ${configDuration === p ? 'var(--gold)' : 'var(--border-color)'}`,
                          background: configDuration === p ? 'var(--gold)' : 'transparent',
                          color: configDuration === p ? '#fff' : 'var(--navy)',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={configDuration}
                      onChange={(e) => setConfigDuration(Math.max(1, Math.min(480, Number(e.target.value) || 0)))}
                      style={{ minHeight: 'auto', padding: '6px 8px', maxWidth: '70px', marginBottom: 0, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Matter Context Card */}
            <div className="prompt-card">
              <h3 style={{ marginBottom: '14px', fontSize: '1.05rem', color: 'var(--navy)' }}>Subject Matter Context</h3>
              
              {/* Rich Editor Toolbar */}
              <div className="rich-editor-container">
                <div className="rich-editor-toolbar">
                  {/* 1. Text Styling */}
                  <div className="toolbar-group">
                    <button type="button" className="editor-tb-btn" title="bold" onClick={() => insertMarkdown('**', '**')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/><path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/></svg>
                    </button>
                    <button type="button" className="editor-tb-btn" title="italic" onClick={() => insertMarkdown('*', '*')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
                    </button>
                    <button type="button" className="editor-tb-btn" title="strikeThrough" onClick={() => insertMarkdown('~~', '~~')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M16 4H9a3 3 0 00-3 3c0 2 2 3 4 3.5m0 0C14 11 17 12 17 15a3.5 3.5 0 01-3.5 3.5H7"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
                    </button>
                  </div>

                  <div className="toolbar-divider" />

                  {/* 2. Headings & Titles */}
                  <div className="toolbar-group" style={{ position: 'relative' }}>
                    <button 
                      type="button" 
                      className={`editor-tb-btn ${showHeadingDropdown ? 'active' : ''}`} 
                      title="title" 
                      onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M4 6v12M12 6v12M4 12h8M20 6v12M16 12h4"/></svg>
                      <span className="dropdown-caret">▾</span>
                    </button>
                    {showHeadingDropdown && (
                      <div className="editor-dropdown-menu">
                        <div className="dropdown-item" onClick={() => applyHeading(1)}>Lv1 Heading (#)</div>
                        <div className="dropdown-item" onClick={() => applyHeading(2)}>Lv2 Heading (##)</div>
                        <div className="dropdown-item" onClick={() => applyHeading(3)}>Lv3 Heading (###)</div>
                        <div className="dropdown-item" onClick={() => applyHeading(4)}>Lv4 Heading (####)</div>
                        <div className="dropdown-item" onClick={() => applyHeading(5)}>Lv5 Heading (#####)</div>
                        <div className="dropdown-item" onClick={() => applyHeading(6)}>Lv6 Heading (######)</div>
                      </div>
                    )}
                  </div>

                  <div className="toolbar-divider" />

                  {/* 3. Advanced Text Formatting */}
                  <div className="toolbar-group">
                    <button type="button" className="editor-tb-btn" title="subscript" onClick={() => insertMarkdown('~', '~')}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>X<sub>2</sub></span>
                    </button>
                    <button type="button" className="editor-tb-btn" title="superscript" onClick={() => insertMarkdown('^', '^')}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>X<sup>2</sup></span>
                    </button>
                    <button type="button" className="editor-tb-btn" title="quote" onClick={() => insertMarkdown('\n> ', '')}>
                      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                    </button>
                  </div>

                  <div className="toolbar-divider" />

                  {/* 4. Lists & Links */}
                  <div className="toolbar-group">
                    <button type="button" className="editor-tb-btn" title="unordered list" onClick={() => insertMarkdown('\n- ', '')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </button>
                    <button type="button" className="editor-tb-btn" title="ordered list" onClick={() => insertMarkdown('\n1. ', '')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                    </button>
                    <button type="button" className="editor-tb-btn" title="link" onClick={() => insertMarkdown('[', '](https://example.com)')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    </button>
                  </div>

                  <div className="toolbar-divider" />

                  {/* 5. Code & Tables */}
                  <div className="toolbar-group" style={{ position: 'relative' }}>
                    <button type="button" className="editor-tb-btn" title="block-level code" onClick={() => insertMarkdown('\n```\n', '\n```\n')}>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                    </button>
                    <button 
                      type="button" 
                      className={`editor-tb-btn ${showTablePicker ? 'active' : ''}`} 
                      title="table" 
                      onClick={() => setShowTablePicker(!showTablePicker)}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
                    </button>

                    {/* Interactive Table Grid Picker */}
                    {showTablePicker && (
                      <div className="table-picker-popup">
                        <div className="table-picker-header">
                          Table Shape Grid ({hoverGrid.r} &times; {hoverGrid.c})
                        </div>
                        <div className="table-grid-matrix">
                          {Array.from({ length: 6 }).map((_, rIdx) => (
                            <div key={rIdx} className="table-grid-row">
                              {Array.from({ length: 6 }).map((_, cIdx) => {
                                const isHighlighted = rIdx < hoverGrid.r && cIdx < hoverGrid.c;
                                return (
                                  <div
                                    key={cIdx}
                                    className={`table-grid-cell ${isHighlighted ? 'active' : ''}`}
                                    onMouseEnter={() => setHoverGrid({ r: rIdx + 1, c: cIdx + 1 })}
                                    onClick={() => insertTable(rIdx + 1, cIdx + 1)}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="toolbar-divider" />

                  {/* 6. View & Navigation */}
                  <div className="toolbar-group">
                    <button 
                      type="button" 
                      className={`editor-tb-btn ${isPreviewMode ? 'active' : ''}`} 
                      title="preview" 
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button 
                      type="button" 
                      className={`editor-tb-btn ${showCatalog ? 'active' : ''}`} 
                      title="catalog" 
                      onClick={() => setShowCatalog(!showCatalog)}
                    >
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>
                    </button>
                  </div>

                  <button 
                    type="button"
                    className="editor-tb-btn file-upload-right-btn" 
                    title="Upload Reference Document"
                    onClick={handleFileUploadClick}
                  >
                    Upload DOCX/PDF 📤
                  </button>
                </div>

                {/* Editor Content Area (Split catalog or preview mode) */}
                <div className="rich-editor-workspace">
                  {showCatalog && (
                    <div className="editor-catalog-sidebar">
                      <div className="catalog-title">Table of Contents</div>
                      {subjectContext.split('\n').filter(l => l.startsWith('#')).length === 0 ? (
                        <div className="catalog-empty">No headings added yet. Use H1-H6 to outline your context.</div>
                      ) : (
                        subjectContext.split('\n').filter(l => l.startsWith('#')).map((hLine, hIdx) => {
                          const level = hLine.match(/^#+/)?.[0].length || 1;
                          const text = hLine.replace(/^#+\s*/, '');
                          return (
                            <div key={hIdx} className={`catalog-item level-${level}`}>
                              {text}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {isPreviewMode ? (
                    <div className="prompt-textarea editor-preview-box">
                      <ContentRenderer text={subjectContext || '*No content to preview yet.*'} />
                    </div>
                  ) : (
                    <textarea
                      ref={contextTextareaRef}
                      className="prompt-textarea"
                      value={subjectContext}
                      onChange={(e) => setSubjectContext(e.target.value)}
                      style={{ minHeight: '220px' }}
                      placeholder="Add any extra context about this subject matter to improve AI quality…"
                    />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="file-upload-btn" onClick={() => {
                    setCurrentStep('dashboard');
                    setSessionId(null);
                    setProposals([]);
                    setStructure([]);
                    setCourseData(null);
                  }}>← Back</button>
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
              {/* Card 1: Prerequisites (Green Accent Theme) */}
              <div className="review-card" style={{ borderTop: '4px solid #10b981', borderRadius: '16px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)' }}>
                <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>PREREQUISITES</span>
                    <h4 className="review-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>What they should know</h4>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>✅</span>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {prerequisites.length === 0 ? (
                    <div style={{ background: '#f0fdf4', border: '1px dashed #a7f3d0', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#166534', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>No prerequisites added yet</p>
                      <p style={{ fontSize: '0.78rem', color: '#15803d', opacity: 0.8 }}>Add basic skills learners need or click <strong>AI Suggest ✨</strong> below!</p>
                    </div>
                  ) : (
                    prerequisites.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>✓</span>
                        <input
                          type="text"
                          className="prompt-textarea"
                          style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#14532d', fontWeight: 600 }}
                          value={item}
                          onChange={(e) => {
                            const updated = [...prerequisites];
                            updated[idx] = e.target.value;
                            setPrerequisites(updated);
                          }}
                          placeholder="e.g. Basic Python programming, Functions"
                        />
                        <button className="icon-btn-tool danger" onClick={() => {
                          const updated = prerequisites.filter((_, i) => i !== idx);
                          setPrerequisites(updated);
                        }}>
                          <IconTrash />
                        </button>
                      </div>
                    ))
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button 
                      className="file-upload-btn" 
                      style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center', borderColor: '#a7f3d0', color: '#047857', background: '#ffffff', fontWeight: 700 }} 
                      onClick={() => setPrerequisites([...prerequisites, ''])}
                    >
                      + Add Item
                    </button>
                    <button 
                      className="action-btn" 
                      style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', fontWeight: 700 }} 
                      onClick={() => handleAutoSuggestGrounding('prerequisites', prerequisites, setPrerequisites)} 
                      disabled={loadingField !== null}
                    >
                      {loadingField === 'prerequisites' ? <><IconSpinner /> Generating…</> : '✨ AI Suggest'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Boundaries (Red Accent Theme) */}
              <div className="review-card" style={{ borderTop: '4px solid #ef4444', borderRadius: '16px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)' }}>
                <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>OUT OF SCOPE</span>
                    <h4 className="review-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>Topics NOT covered</h4>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>⛔</span>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {boundaries.length === 0 ? (
                    <div style={{ background: '#fef2f2', border: '1px dashed #fca5a5', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#991b1b', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>No boundaries defined yet</p>
                      <p style={{ fontSize: '0.78rem', color: '#b91c1c', opacity: 0.8 }}>Define topics excluded to focus learning, or click <strong>AI Suggest ✨</strong>!</p>
                    </div>
                  ) : (
                    boundaries.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>✕</span>
                        <input
                          type="text"
                          className="prompt-textarea"
                          style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1, border: '1px solid #fca5a5', background: '#fef2f2', color: '#7f1d1d', fontWeight: 600 }}
                          value={item}
                          onChange={(e) => {
                            const updated = [...boundaries];
                            updated[idx] = e.target.value;
                            setBoundaries(updated);
                          }}
                          placeholder="e.g. Advanced Django, Mobile App Development"
                        />
                        <button className="icon-btn-tool danger" onClick={() => {
                          const updated = boundaries.filter((_, i) => i !== idx);
                          setBoundaries(updated);
                        }}>
                          <IconTrash />
                        </button>
                      </div>
                    ))
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button 
                      className="file-upload-btn" 
                      style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center', borderColor: '#fca5a5', color: '#b91c1c', background: '#ffffff', fontWeight: 700 }} 
                      onClick={() => setBoundaries([...boundaries, ''])}
                    >
                      + Add Item
                    </button>
                    <button 
                      className="action-btn" 
                      style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', fontWeight: 700 }} 
                      onClick={() => handleAutoSuggestGrounding('boundaries', boundaries, setBoundaries)} 
                      disabled={loadingField !== null}
                    >
                      {loadingField === 'boundaries' ? <><IconSpinner /> Generating…</> : '✨ AI Suggest'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Learning Outcomes (Purple/Indigo Accent Theme) */}
              <div className="review-card" style={{ gridColumn: 'span 2', borderTop: '4px solid #8b5cf6', borderRadius: '16px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.08)' }}>
                <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>TARGET OUTCOMES</span>
                    <h4 className="review-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>What learners will master</h4>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>🎯</span>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {learningOutcomes.length === 0 ? (
                    <div style={{ background: '#faf5ff', border: '1px dashed #ddd6fe', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#581c87', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>No learning outcomes added yet</p>
                      <p style={{ fontSize: '0.78rem', color: '#6b21a8', opacity: 0.8 }}>Add skills learners will achieve or click <strong>AI Suggest ✨</strong> below!</p>
                    </div>
                  ) : (
                    learningOutcomes.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: '#f3e8ff', color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          className="prompt-textarea"
                          style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1, border: '1px solid #c4b5fd', background: '#faf5ff', color: '#3b0764', fontWeight: 600 }}
                          value={item}
                          onChange={(e) => {
                            const updated = [...learningOutcomes];
                            updated[idx] = e.target.value;
                            setLearningOutcomes(updated);
                          }}
                          placeholder="e.g. Build a complete REST API using FastAPI and SQL"
                        />
                        <button className="icon-btn-tool danger" onClick={() => {
                          const updated = learningOutcomes.filter((_, i) => i !== idx);
                          setLearningOutcomes(updated);
                        }}>
                          <IconTrash />
                        </button>
                      </div>
                    ))
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px', maxWidth: '420px' }}>
                    <button 
                      className="file-upload-btn" 
                      style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center', borderColor: '#c4b5fd', color: '#6b21a8', background: '#ffffff', fontWeight: 700 }} 
                      onClick={() => setLearningOutcomes([...learningOutcomes, ''])}
                    >
                      + Add Item
                    </button>
                    <button 
                      className="action-btn" 
                      style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', justifyContent: 'center', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)', fontWeight: 700 }} 
                      onClick={() => handleAutoSuggestGrounding('learning_outcomes', learningOutcomes, setLearningOutcomes)} 
                      disabled={loadingField !== null}
                    >
                      {loadingField === 'learning_outcomes' ? <><IconSpinner /> Generating…</> : '✨ AI Suggest'}
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
                const isSelected = selectedProposalId === prop.id;
                const isThisLoading = isLoading && isSelected;
                const diffList = prop.differentiators ? prop.differentiators.split(',').map(s => s.trim()).filter(Boolean) : [];
                return (
                  <div
                    key={prop.id}
                    className={`proposal-card ${isRec ? 'recommended' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isLoading && handleSelectProposal(prop.id)}
                    style={{ 
                      border: isThisLoading ? '2.5px solid var(--blue)' : isRec ? '2px solid var(--gold)' : isSelected ? '2px solid var(--blue)' : '1px solid var(--border-color)', 
                      boxShadow: isThisLoading ? '0 10px 30px rgba(37, 99, 235, 0.25)' : isRec ? '0 8px 24px rgba(245, 158, 11, 0.15)' : '',
                      display: 'flex', 
                      flexDirection: 'column', 
                      justify: 'space-between',
                      opacity: isLoading && !isSelected ? 0.6 : 1,
                      transition: 'all 0.25s ease',
                      cursor: isLoading ? 'default' : 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        {isRec ? (
                          <span className="tag-badge" style={{ background: 'var(--navy)', color: 'var(--gold)', border: '1.5px solid var(--gold)', fontSize: '0.75rem', padding: '3px 10px', display: 'inline-block' }}>
                            ⭐ Recommended
                          </span>
                        ) : (
                          <span className="tag-badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '3px 10px', display: 'inline-block' }}>
                            Option {prop.id}
                          </span>
                        )}
                        {isSelected && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--blue)', background: 'var(--blue-light)', padding: '2px 8px', borderRadius: '12px' }}>
                            ✓ Selected
                          </span>
                        )}
                      </div>

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
                      className={isThisLoading ? "action-btn" : isRec ? "purple-start-btn" : "file-upload-btn"}
                      style={{ marginTop: '24px', width: '100%', justifyContent: 'center' }}
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLoading) handleSelectProposal(prop.id);
                      }}
                    >
                      {isThisLoading ? <><IconSpinner /> Selecting Option {prop.id}…</> : isSelected ? '✓ Selected Direction' : 'Select This Option'}
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
                        <button className="icon-btn-tool" onClick={() => moveLesson(idx, -1)} title="Move Up">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 15l-6-6-6 6"/></svg>
                        </button>
                        <button className="icon-btn-tool" onClick={() => moveLesson(idx, 1)} title="Move Down">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        <button className="icon-btn-tool danger" onClick={() => deleteLesson(idx)} title="Delete Lesson">
                          <IconTrash />
                        </button>
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
                                    <span className="locked-badge" title="Core Section">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                      Locked
                                    </span>
                                  ) : (
                                    <button 
                                      className="icon-btn-tool danger" 
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

                        {/* Add Custom Section Button */}
                        <button 
                          type="button"
                          className="file-upload-btn" 
                          onClick={() => {
                            setNewSectionRole(activeStructureRole);
                            setIsAddSectionModalOpen(true);
                          }}
                          style={{ width: '100%', justifyContent: 'center', marginTop: '16px', fontSize: '0.85rem' }}
                        >
                          + Add Custom Section
                        </button>
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

            {/* Bottom Actions for Step 5 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <button className="file-upload-btn" onClick={() => setCurrentStep('proposal')}>← Back to Proposals</button>
              <button 
                className="action-btn" 
                onClick={async () => {
                  if (sessionId) {
                    setIsLoading(true);
                    try {
                      await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ structure })
                      });
                    } catch (e) {
                      console.error('Failed to save structure:', e);
                    } finally {
                      setIsLoading(false);
                    }
                  }
                  setCurrentStep('review');
                }} 
                disabled={isLoading}
              >
                {isLoading ? <><IconSpinner /> Saving…</> : <>Save &amp; Continue to Review <IconArrow /></>}
              </button>
            </div>

            {/* Custom Section Add Popup Modal */}
            {isAddSectionModalOpen && (
              <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') { setIsAddSectionModalOpen(false); setNewSectionTitle(''); setNewSectionInstruction(''); } }}>
                <div className="add-section-modal">

                  {/* Header */}
                  <div className="add-section-modal-header">
                    <div>
                      <h2 className="add-section-modal-title">Add Custom Section</h2>
                      <p className="add-section-modal-subtitle">
                        Define a new structural requirement for the{' '}
                        <strong style={{ color: 'var(--gold)', fontWeight: 700 }}>
                          {newSectionRole === 'creator' ? 'CREATOR' : newSectionRole === 'student' ? 'STUDENT' : 'EDUCATOR'}
                        </strong>{' '}view.
                      </p>
                    </div>
                    <button className="modal-close-btn" onClick={() => { setIsAddSectionModalOpen(false); setNewSectionTitle(''); setNewSectionInstruction(''); }}>
                      ✕
                    </button>
                  </div>

                  {/* Target Role selector */}
                  <div className="add-section-modal-role-tabs">
                    {['creator', 'student', 'educator'].map(role => (
                      <button
                        key={role}
                        className={`role-tab-pill ${newSectionRole === role ? 'active' : ''}`}
                        onClick={() => setNewSectionRole(role)}
                      >
                        {role === 'creator' ? '🛠 Creator' : role === 'student' ? '📚 Student' : '🎓 Educator'}
                      </button>
                    ))}
                  </div>

                  {/* Fields */}
                  <div className="add-section-modal-body">
                    <div className="config-item">
                      <label style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Section Title</label>
                      <input
                        type="text"
                        className="modal-input"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        placeholder="e.g. Case Study, Code Review"
                        autoFocus
                      />
                    </div>
                    <div className="config-item" style={{ marginTop: '16px' }}>
                      <label style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem', marginBottom: '8px', display: 'block' }}>Instruction / Description</label>
                      <textarea
                        className="modal-textarea"
                        value={newSectionInstruction}
                        onChange={(e) => setNewSectionInstruction(e.target.value)}
                        placeholder="e.g. To ensure learners understand the performance implications of their architectural choices."
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="add-section-modal-footer">
                    <button
                      className="modal-add-btn"
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
                      Add Section →
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
                    <button className="review-card-edit-btn" onClick={() => {
                      const newConcept = prompt("Edit Course Concept / Prompt:", promptText);
                      if (newConcept !== null) setPromptText(newConcept);
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                  </div>

                  <div className="review-card-v2-body">
                    <div className="concept-hero-box">
                      <h3 className="concept-hero-title">{promptText || 'Rapid Prototyping for Real-World Impact'}</h3>
                      <p className="concept-hero-subtitle">"{promptText ? `Course focus: ${promptText}` : 'apakabar kamu'}"</p>
                    </div>

                    <p className="concept-description-text">
                      This capstone project is anchored in integrative, real-world technology problem-solving—requiring learners to synthesize expertise across AI engineering, software development, and product management. Modeled on authentic industry workflows, learners assume roles such as solution architect, data scientist, or product manager, simulating cross-functional teamwork to address a genuine business or societal need.
                    </p>

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
                    {/* Creator Persona */}
                    <div className="persona-role-box">
                      <div className="persona-role-header">
                        <div className="persona-role-name">
                          <span className="persona-dot purple"></span>
                          <span>CREATOR</span>
                        </div>
                        <span className="persona-count-badge">5 Sections</span>
                      </div>
                      <div className="persona-tags-wrap">
                        <span className="persona-section-tag">PROJECT OVERVIEW</span>
                        <span className="persona-section-tag">ANDRAGOGY MINDSET</span>
                        <span className="persona-section-tag">MARKING RUBRICS</span>
                        <span className="persona-section-tag">CLIENT NEEDS ASSESSMENT TEMPLATES</span>
                        <span className="persona-section-tag">AGILE ITERATION SCRIPTING TOOLS</span>
                      </div>
                    </div>

                    {/* Student Persona */}
                    <div className="persona-role-box">
                      <div className="persona-role-header">
                        <div className="persona-role-name">
                          <span className="persona-dot blue"></span>
                          <span>STUDENT</span>
                        </div>
                        <span className="persona-count-badge">7 Sections</span>
                      </div>
                      <div className="persona-tags-wrap">
                        <span className="persona-section-tag">PROJECT BRIEF</span>
                        <span className="persona-section-tag">TECHNOLOGY STACK</span>
                        <span className="persona-section-tag">FUNCTIONAL REQUIREMENTS</span>
                        <span className="persona-section-tag">NON FUNCTIONAL REQUIREMENTS</span>
                        <span className="persona-section-tag">DELIVERABLES</span>
                        <span className="persona-section-tag">PEER REVIEW FRAMEWORKS</span>
                        <span className="persona-section-tag">STAKEHOLDER PRESENTATION CHECKLISTS</span>
                      </div>
                    </div>

                    {/* Educator Persona */}
                    <div className="persona-role-box">
                      <div className="persona-role-header">
                        <div className="persona-role-name">
                          <span className="persona-dot green"></span>
                          <span>EDUCATOR</span>
                        </div>
                        <span className="persona-count-badge">5 Sections</span>
                      </div>
                      <div className="persona-tags-wrap">
                        <span className="persona-section-tag">FACILITATOR GUIDE</span>
                        <span className="persona-section-tag">ANDRAGOGY IN PRACTICE</span>
                        <span className="persona-section-tag">ENGAGEMENT STRATEGIES</span>
                        <span className="persona-section-tag">INDUSTRY SIMULATION DEBRIEF GUIDES</span>
                        <span className="persona-section-tag">MVP TESTING EVALUATION CRITERIA</span>
                      </div>
                    </div>
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
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* STEP 7: GENERATING */}
        {/* ══════════════════════════════════════════════ */}
        {!showMyCourses && currentStep === 'generating' && (
          <div>
            <div className="header" style={{ alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--navy)' }}>{promptText || 'Rapid Prototyping for Real-World Impact'}</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>Created on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>

              <button 
                className="header-create-btn" 
                style={{ background: 'var(--navy)', color: '#fff', padding: '10px 24px', fontSize: '0.9rem', boxShadow: '0 4px 14px rgba(26, 32, 64, 0.25)' }}
                onClick={() => {
                  if (courseData) {
                    setCurrentStep('generated');
                  } else {
                    // Fetch fresh session data and move to Step 8
                    fetch(`${API_BASE}/courses/sessions/${sessionId}`).then(res => res.json()).then(data => {
                      setCourseData(data);
                      if (data.lessons?.length > 0) setActiveLessonId(data.lessons[0].id);
                      setCurrentStep('generated');
                    });
                  }
                }}
              >
                Proceed to Assets &rarr;
              </button>
            </div>

            {/* Live Progress Banner with Animated Progress Bar */}
            <div className="live-status-box" style={{ marginBottom: '24px', background: 'var(--white)', border: generationProgress >= 100 ? '1.5px solid #86EFAC' : '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '18px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div className="live-status-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="live-status-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, color: 'var(--navy)', fontSize: '0.95rem' }}>
                  {generationProgress >= 100 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#22c55e', color: '#ffffff' }}>
                      <IconCheck />
                    </span>
                  ) : (
                    <IconSpinner />
                  )}
                  <span style={{ color: generationProgress >= 100 ? '#16a34a' : 'var(--navy)' }}>
                    {generationProgress >= 100 ? 'GENERATED:' : 'GENERATING:'}
                  </span>
                  <span style={{ color: generationProgress >= 100 ? '#16a34a' : 'var(--blue)' }}>
                    {generationStatusText || 'Assembling Course Content...'}
                  </span>
                </div>
                {generationProgress < 100 && (
                  <button 
                    className="cancel-gen-btn"
                    style={{ background: 'transparent', border: '1.5px solid #F87171', color: '#EF4444', fontWeight: 700, padding: '4px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel the generation?')) {
                        setCurrentStep('review');
                      }
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              
              <div className="progress-bar-container" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="progress-bar-outer" style={{ flex: 1, height: '10px', background: 'var(--surface-3)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div className="progress-bar-inner" style={{ width: `${generationProgress}%`, height: '100%', background: generationProgress >= 100 ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)' : 'linear-gradient(90deg, var(--navy) 0%, var(--blue) 100%)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: generationProgress >= 100 ? '#16a34a' : 'var(--navy)', minWidth: '42px', textAlign: 'right' }}>{generationProgress}%</span>
              </div>
            </div>

            {/* Main Content Workspace Box */}
            <div style={{ background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              {/* Lesson Carousel Navigator Slider */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--surface-2)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <button 
                  className="library-page-btn playful-card" 
                  style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}
                  onClick={() => setCurrentGeneratingLessonIdx(Math.max(0, currentGeneratingLessonIdx - 1))}
                  disabled={currentGeneratingLessonIdx === 0}
                >
                  ‹
                </button>

                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    LESSON {currentGeneratingLessonIdx + 1} OF {structure.length || 1}
                  </span>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>
                    {(() => {
                      const rawTitle = structure[currentGeneratingLessonIdx]?.title || 'Crafting an Actionable AI Strategy Blueprint';
                      return rawTitle.replace(/^Lesson\s*\d+\s*:\s*/i, '');
                    })()}
                  </h3>
                </div>

                <button 
                  className="library-page-btn playful-card" 
                  style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}
                  onClick={() => setCurrentGeneratingLessonIdx(Math.min((structure.length || 1) - 1, currentGeneratingLessonIdx + 1))}
                  disabled={currentGeneratingLessonIdx >= (structure.length || 1) - 1}
                >
                  ›
                </button>
              </div>

              {/* Role Selector Tabs (CREATOR, STUDENT, EDUCATOR) */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '4px', borderRadius: '9999px', border: '1px solid var(--border-color)', gap: '4px' }}>
                  <button 
                    className={`tab-btn ${activeRole === 'creator' ? 'active' : ''}`}
                    style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => { setActiveRole('creator'); setActiveSubSection('all'); }}
                  >
                    <span>🎨</span> CREATOR
                  </button>
                  <button 
                    className={`tab-btn ${activeRole === 'student' ? 'active' : ''}`}
                    style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => { setActiveRole('student'); setActiveSubSection('all'); }}
                  >
                    <span>🎓</span> STUDENT
                  </button>
                  <button 
                    className={`tab-btn ${activeRole === 'educator' ? 'active' : ''}`}
                    style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => { setActiveRole('educator'); setActiveSubSection('all'); }}
                  >
                    <span>🏫</span> EDUCATOR
                  </button>
                </div>
              </div>

              {/* Workspace Split Layout */}
              <div className="structure-split-layout" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Left Side: ON THIS PAGE Sections Navigator (Table of Contents) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'sticky', top: '90px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>ON THIS PAGE</span>
                  {(() => {
                    const secList = activeRole === 'creator' ? [
                      { id: 'overview', title: 'Lesson Overview' },
                      { id: 'learning_outcomes', title: 'Learning Outcomes' },
                      { id: 'core_content', title: 'Core Technical Material' },
                      { id: 'exercises', title: 'Hands-On Exercises' },
                      { id: 'quizzes', title: 'Assessment Quiz' }
                    ] : activeRole === 'student' ? [
                      { id: 'why_this_matters', title: 'Why This Matters' },
                      { id: 'practice', title: 'Interactive Coding Practice' },
                      { id: 'debugging', title: 'Debugging Pitfalls' },
                      { id: 'ethics', title: 'Ethics & Code Principles' }
                    ] : [
                      { id: 'facilitator_guide', title: 'Facilitator Guide' },
                      { id: 'lesson_plan', title: 'Lesson Plan & Timing' },
                      { id: 'rubric', title: 'Assessment Rubric' },
                      { id: 'discussion_questions', title: 'Discussion Questions' }
                    ];

                    return secList.map((sec) => (
                      <button
                        key={sec.id}
                        className={`filter-nav-item ${activeSubSection === sec.id ? 'active' : ''}`}
                        style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.85rem', transition: 'all 0.2s ease' }}
                        onClick={() => {
                          setActiveSubSection(sec.id);
                          document.getElementById(`step7-sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span>{sec.title}</span>
                        </div>
                      </button>
                    ));
                  })()}
                </div>

                {/* Right Side: Interactive Editable Section Viewer Card (Full Document View) */}
                <div style={{ background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '28px', minHeight: '500px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" fill="none" stroke="var(--navy)" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                        {activeRole === 'creator' ? 'Full Curriculum Specification (Creator View)' : activeRole === 'student' ? 'Student Learning Guide' : 'Educator Facilitator Guide'}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                      <button className="icon-btn-tool" title="AI Wand Action" onClick={() => setIsAIWandOpen(!isAIWandOpen)}>
                        🪄
                      </button>

                      {/* AI Wand Action Menu Popover */}
                      {isAIWandOpen && (
                        <div style={{ position: 'absolute', top: '40px', right: '80px', width: '220px', background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, padding: '8px 0' }}>
                          <div style={{ padding: '6px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-color)' }}>
                            AI WAND ACTIONS
                          </div>
                          {[
                            { action: 'rewrite', label: '✍️ Rewrite & Refine', desc: 'Improve text clarity & flow' },
                            { action: 'expand', label: '📈 Expand Details', desc: 'Add technical examples' },
                            { action: 'simplify', label: '💡 Simplify Concepts', desc: 'Make easier to understand' }
                          ].map(item => (
                            <button
                              key={item.action}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'var(--transition-fast)' }}
                              className="filter-tag-pill"
                              onClick={() => {
                                setIsWandProcessing(true);
                                setTimeout(() => {
                                  setIsWandProcessing(false);
                                  setIsAIWandOpen(false);
                                  alert(`AI Action [${item.label}] completed successfully for this section!`);
                                }, 1200);
                              }}
                            >
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>{item.label}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <button className="icon-btn-tool" title="Version History" onClick={() => { fetchHistory(); setIsHistoryOpen(true); }}>
                        📜
                      </button>
                      <button className="review-card-edit-btn" style={{ fontSize: '0.82rem', padding: '6px 14px' }} onClick={() => setEditingSection(activeSubSection)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Live Rendered Content Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {(() => {
                      const curLesson = courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.[0];
                      const curSecs = curLesson?.sections?.[activeRole] || {};
                      const lessonTitle = curLesson?.title || courseData?.title || 'Machine Learning Essentials';

                      const activeLessonContent = {
                        overview: curSecs.overview || curSecs.project_brief || `This lesson provides a comprehensive overview and practical foundation for ${lessonTitle}. Students will explore core concepts, industry use-cases, and implementation patterns necessary for real-world projects.`,
                        learning_outcomes: curSecs.learning_outcomes?.length > 0 ? curSecs.learning_outcomes : [
                          `Master core concepts and architectural components of ${lessonTitle}.`,
                          `Implement hands-on code examples and workflows using modern industry standards.`,
                          `Apply critical thinking to analyze, debug, and optimize real-world production scenarios.`
                        ],
                        core_content: curSecs.core_content || curSecs.tech_stack || `### 1. Conceptual Foundations\n${lessonTitle} serves as a key pillar in modern systems engineering. By leveraging structured workflows and robust error handling, developers can ensure high performance and maintainability.\n\n### 2. Practical Implementation\nTo implement ${lessonTitle} effectively, engineers must follow clean architecture patterns and best practices. Below is the step-by-step guidance for applying these techniques in production environments.`,
                        exercises: curSecs.exercises?.length > 0 ? curSecs.exercises : [
                          { title: `Building ${lessonTitle} Pipeline`, description: `Implement a basic working prototype for ${lessonTitle} using Python/JavaScript. Verify output correctness with unit tests.`, code_template: `// Exercise 1: ${lessonTitle}\nfunction executeTask() {\n  console.log("Running task for ${lessonTitle}...");\n}` }
                        ],
                        quizzes: curSecs.quizzes || curSecs.quiz || [
                          { question: `What is the primary objective of ${lessonTitle}?`, options: [`To establish a robust, scalable technical workflow`, `To bypass security and data validation`, `To reduce code readability`], answer: `To establish a robust, scalable technical workflow`, explanation: `${lessonTitle} focuses on building reliable, industry-standard systems.` }
                        ],
                        why_this_matters: curSecs.why_this_matters || `Understanding ${lessonTitle} is crucial for career advancement. It bridges theoretical principles with industry-grade implementation strategies.`,
                        practice: curSecs.practice?.code_block ? curSecs.practice : {
                          code_block: `// Interactive Sandbox for ${lessonTitle}\nfunction main() {\n  console.log("Running ${lessonTitle} sandbox...");\n}\nmain();`,
                          interactive_exercise: `Run the sandbox script and extend the function logic for ${lessonTitle}.`,
                          checklist: [`Initialize environment`, `Execute main sandbox function`, `Verify console log output`]
                        },
                        debugging: curSecs.debugging || `### Common Pitfalls & Solutions\n1. **Unhandled Edge Cases:** Validate inputs prior to execution.\n2. **Performance Bottlenecks:** Optimize data structure lookups.`,
                        ethics: curSecs.ethics || `### Code Principles & Ethics\nEnsure user data protection, transparency, and compliance with industry security protocols throughout implementation.`,
                        facilitator_guide: curSecs.facilitator_guide || `### Educator Instructions\nFacilitate an interactive discussion on ${lessonTitle}. Encourage students to participate in pair-programming exercises.`,
                        lesson_plan: curSecs.lesson_plan?.ice_breaker ? curSecs.lesson_plan : {
                          ice_breaker: `Ask students: "What real-world applications of ${lessonTitle} have you encountered?"`,
                          timing: `Lecture & Demo: 20 mins | Pair Lab: 30 mins | Wrap-up & Q&A: 10 mins`
                        },
                        rubric: curSecs.rubric?.length > 0 ? curSecs.rubric : [
                          { criteria: "Implementation", excellent: "Code runs error-free with optimal logic", good: "Code runs with minor style issues", needs_improvement: "Code contains execution errors" },
                          { criteria: "Understanding", excellent: "Demonstrates deep mastery of concepts", good: "Demonstrates basic understanding", needs_improvement: "Lacks core understanding" }
                        ],
                        discussion_questions: curSecs.discussion_questions?.length > 0 ? curSecs.discussion_questions : [
                          `How does ${lessonTitle} improve overall system efficiency?`,
                          `What key trade-offs should be considered when deploying this solution to production?`
                        ]
                      };

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          
                          {/* Creator POV Workspace (Full Document View) */}
                          {activeRole === 'creator' && (
                            <>
                              <div id="step7-sec-overview" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Lesson Overview</h3>
                                  {editingSection === 'overview' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('overview', editingText)}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('overview'); setEditingText(activeLessonContent.overview); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'overview' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.overview} />
                                )}
                              </div>

                              <div id="step7-sec-learning_outcomes" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Learning Outcomes</h3>
                                  {editingSection === 'learning_outcomes' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('learning_outcomes', editingText.split('\n').filter(Boolean))}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('learning_outcomes'); setEditingText(activeLessonContent.learning_outcomes.join('\n')); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'learning_outcomes' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="One outcome per line..." />
                                ) : (
                                  <ul className="outcome-list">
                                    {activeLessonContent.learning_outcomes.map((item, idx) => (
                                      <li key={idx}><span className="outcome-dot" />{item}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div id="step7-sec-core_content" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Core Technical Material</h3>
                                  {editingSection === 'core_content' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('core_content', editingText)}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('core_content'); setEditingText(activeLessonContent.core_content); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'core_content' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '240px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.core_content} />
                                )}
                              </div>

                              <div id="step7-sec-exercises" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Hands-On Exercises</h3>
                                  {editingSection === 'exercises' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('exercises', parsed);
                                      } catch (err) {
                                        alert("Invalid JSON format. Expected array of objects.");
                                      }
                                    }}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('exercises'); setEditingText(JSON.stringify(activeLessonContent.exercises, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'exercises' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {activeLessonContent.exercises.map((ex, idx) => (
                                      <div key={idx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <strong>Exercise {idx + 1}: {ex.title}</strong>
                                        <p style={{ margin: '6px 0', fontSize: '0.9rem' }}>{ex.description}</p>
                                        {ex.code_template && <pre className="code-block" style={{ marginTop: '8px' }}>{ex.code_template}</pre>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div id="step7-sec-quizzes" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Assessment Quiz</h3>
                                  {editingSection === 'quizzes' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('quizzes', parsed);
                                      } catch (err) {
                                        alert("Invalid JSON format. Expected array of objects.");
                                      }
                                    }}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('quizzes'); setEditingText(JSON.stringify(activeLessonContent.quizzes, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'quizzes' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {activeLessonContent.quizzes.map((q, idx) => (
                                      <div key={idx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <strong>Q{idx + 1}: {q.question}</strong>
                                        <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '8px' }}>
                                          {q.options?.map((opt, oIdx) => (
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
                            </>
                          )}

                          {/* Student POV Workspace (Full Document View) */}
                          {activeRole === 'student' && (
                            <>
                              <div id="step7-sec-why_this_matters" className="why-matters-card" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h4 style={{ margin: 0, color: 'var(--navy)' }}>💡 Why This Matters</h4>
                                  {editingSection === 'why_this_matters' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('why_this_matters', editingText)}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('why_this_matters'); setEditingText(activeLessonContent.why_this_matters); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'why_this_matters' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '100px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.why_this_matters} />
                                )}
                              </div>

                              <div id="step7-sec-practice" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Interactive Coding Sandbox</h3>
                                  {editingSection === 'practice' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('practice', parsed);
                                      } catch (err) {
                                        alert("Invalid JSON format. Expected: { code_block: string, interactive_exercise: string, checklist: string[] }");
                                      }
                                    }}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('practice'); setEditingText(JSON.stringify(activeLessonContent.practice, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'practice' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <>
                                    <pre className="code-block">{activeLessonContent.practice?.code_block || '// No code block available'}</pre>
                                    <div className="exercise-task" style={{ marginTop: '10px' }}>
                                      <strong>Task:</strong> {activeLessonContent.practice?.interactive_exercise}
                                    </div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 750, marginTop: '16px' }}>Practice Checklist</h4>
                                    <ul className="checklist">
                                      {activeLessonContent.practice?.checklist?.map((item, idx) => (
                                        <li key={idx}><span className="check-icon">✓</span>{item}</li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                              </div>

                              <div id="step7-sec-debugging" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Debugging Pitfalls</h3>
                                  {editingSection === 'debugging' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('debugging', editingText)}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('debugging'); setEditingText(activeLessonContent.debugging); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'debugging' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.debugging} />
                                )}
                              </div>

                              <div id="step7-sec-ethics" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Ethics &amp; Code Principles</h3>
                                  {editingSection === 'ethics' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('ethics', editingText)}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('ethics'); setEditingText(activeLessonContent.ethics); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'ethics' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.ethics} />
                                )}
                              </div>
                            </>
                          )}

                          {/* Educator POV Workspace (Full Document View) */}
                          {activeRole === 'educator' && (
                            <>
                              <div id="step7-sec-facilitator_guide" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Facilitator Guide</h3>
                                  {editingSection === 'facilitator_guide' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('facilitator_guide', editingText)}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('facilitator_guide'); setEditingText(activeLessonContent.facilitator_guide); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'facilitator_guide' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '150px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.facilitator_guide} />
                                )}
                              </div>

                              <div id="step7-sec-lesson_plan" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Lesson Plan &amp; Timing</h3>
                                  {editingSection === 'lesson_plan' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('lesson_plan', parsed);
                                      } catch (err) {
                                        alert("Invalid JSON format. Expected: { ice_breaker: string, timing: string }");
                                      }
                                    }}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('lesson_plan'); setEditingText(JSON.stringify(activeLessonContent.lesson_plan, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'lesson_plan' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <div className="lesson-plan-grid">
                                    <div className="lesson-plan-card">
                                      <h4>🧊 Ice Breaker</h4>
                                      <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.ice_breaker}</p>
                                    </div>
                                    <div className="lesson-plan-card">
                                      <h4>⏱ Timing Allocation</h4>
                                      <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.timing}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div id="step7-sec-rubric" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Grading Rubric</h3>
                                  {editingSection === 'rubric' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('rubric', parsed);
                                      } catch (err) {
                                        alert("Invalid JSON format. Expected array of objects.");
                                      }
                                    }}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('rubric'); setEditingText(JSON.stringify(activeLessonContent.rubric, null, 2)); }}>Edit</button>
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
                                )}
                              </div>

                              <div id="step7-sec-discussion_questions" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Discussion Questions</h3>
                                  {editingSection === 'discussion_questions' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('discussion_questions', editingText.split('\n').filter(Boolean))}>Save</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('discussion_questions'); setEditingText(activeLessonContent.discussion_questions.join('\n')); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'discussion_questions' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="One question per line..." />
                                ) : (
                                  <ol className="discussion-list">
                                    {activeLessonContent.discussion_questions.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ol>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
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
              {(() => {
                const curLesson = courseData.lessons?.find(l => l.id === activeLessonId) || courseData.lessons?.[0] || {};
                const lessonTitle = curLesson?.title || courseData?.title || 'Machine Learning Essentials';
                const dbSections = curLesson?.sections?.[activeRole] || {};

                const activeLessonContent = {
                  overview: dbSections.overview || dbSections.project_brief || `This lesson provides a comprehensive overview and practical foundation for ${lessonTitle}. Students will explore core concepts, industry use-cases, and implementation patterns necessary for real-world projects.`,
                  learning_outcomes: dbSections.learning_outcomes?.length > 0 ? dbSections.learning_outcomes : [
                    `Master core concepts and architectural components of ${lessonTitle}.`,
                    `Implement hands-on code examples and workflows using modern industry standards.`,
                    `Apply critical thinking to analyze, debug, and optimize real-world production scenarios.`
                  ],
                  core_content: dbSections.core_content || dbSections.tech_stack || `### 1. Conceptual Foundations\n${lessonTitle} serves as a key pillar in modern systems engineering. By leveraging structured workflows and robust error handling, developers can ensure high performance and maintainability.\n\n### 2. Practical Implementation\nTo implement ${lessonTitle} effectively, engineers must follow clean architecture patterns and best practices. Below is the step-by-step guidance for applying these techniques in production environments.`,
                  exercises: dbSections.exercises?.length > 0 ? dbSections.exercises : [
                    { title: `Building ${lessonTitle} Pipeline`, description: `Implement a basic working prototype for ${lessonTitle} using Python/JavaScript. Verify output correctness with unit tests.`, code_template: `// Exercise 1: ${lessonTitle}\nfunction executeTask() {\n  console.log("Running task for ${lessonTitle}...");\n}` }
                  ],
                  quizzes: dbSections.quizzes || dbSections.quiz || [
                    { question: `What is the primary objective of ${lessonTitle}?`, options: [`To establish a robust, scalable technical workflow`, `To bypass security and data validation`, `To reduce code readability`], answer: `To establish a robust, scalable technical workflow`, explanation: `${lessonTitle} focuses on building reliable, industry-standard systems.` }
                  ],
                  why_this_matters: dbSections.why_this_matters || `Understanding ${lessonTitle} is crucial for career advancement. It bridges theoretical principles with industry-grade implementation strategies.`,
                  practice: dbSections.practice?.code_block ? dbSections.practice : {
                    code_block: `// Interactive Sandbox for ${lessonTitle}\nfunction main() {\n  console.log("Running ${lessonTitle} sandbox...");\n}\nmain();`,
                    interactive_exercise: `Run the sandbox script and extend the function logic for ${lessonTitle}.`,
                    checklist: [`Initialize environment`, `Execute main sandbox function`, `Verify console log output`]
                  },
                  debugging: dbSections.debugging || `### Common Pitfalls & Solutions\n1. **Unhandled Edge Cases:** Validate inputs prior to execution.\n2. **Performance Bottlenecks:** Optimize data structure lookups.`,
                  ethics: dbSections.ethics || `### Code Principles & Ethics\nEnsure user data protection, transparency, and compliance with industry security protocols throughout implementation.`,
                  facilitator_guide: dbSections.facilitator_guide || `### Educator Instructions\nFacilitate an interactive discussion on ${lessonTitle}. Encourage students to participate in pair-programming exercises.`,
                  lesson_plan: dbSections.lesson_plan?.ice_breaker ? dbSections.lesson_plan : {
                    ice_breaker: `Ask students: "What real-world applications of ${lessonTitle} have you encountered?"`,
                    timing: `Lecture & Demo: 20 mins | Pair Lab: 30 mins | Wrap-up & Q&A: 10 mins`
                  },
                  rubric: dbSections.rubric?.length > 0 ? dbSections.rubric : [
                    { criteria: "Implementation", excellent: "Code runs error-free with optimal logic", good: "Code runs with minor style issues", needs_improvement: "Code contains execution errors" },
                    { criteria: "Understanding", excellent: "Demonstrates deep mastery of concepts", good: "Demonstrates basic understanding", needs_improvement: "Lacks core understanding" }
                  ],
                  discussion_questions: dbSections.discussion_questions?.length > 0 ? dbSections.discussion_questions : [
                    `How does ${lessonTitle} improve overall system efficiency?`,
                    `What key trade-offs should be considered when deploying this solution to production?`
                  ]
                };

                const currentLessonIndex = courseData.lessons?.findIndex(l => l.id === activeLessonId);
                const lessonNumber = (currentLessonIndex !== undefined && currentLessonIndex !== -1) ? currentLessonIndex + 1 : 1;

                return (
                  <div>
                    {/* Document Viewer Toolbar */}
                    <div className="viewer-toolbar">
                      <div className="toolbar-zoom-group">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>
                          Page {lessonNumber} of {courseData.lessons?.length || 1}
                        </span>
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

                    {/* Real PDF Embed or Paper Canvas Preview */}
                    {sessionId && pdfBlobUrl ? (
                      <div id="internal-document-container" style={{ background: '#525659', borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '12px', border: '1px solid var(--border-color)', borderTop: 'none' }}>
                        <embed
                          id="pdf-embed"
                          type="application/pdf"
                          src={`${pdfBlobUrl}#toolbar=0`}
                          width="100%"
                          height="850px"
                          style={{ border: 'none', borderRadius: '4px', background: '#FFFFFF', display: 'block' }}
                        />
                      </div>
                    ) : (
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
                            Lesson {lessonNumber}: {(curLesson?.title || '').replace(/^Lesson\s*\d+\s*:\s*/i, '')}
                          </h1>
                        </div>

                        <div className="editor-panel" style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none', minHeight: 'auto' }}>


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

                    {/* Static Read Only Exercises */}
                    {activeLessonContent.exercises?.length > 0 && (
                      <div className="content-block">
                        <h3>Hands-On Exercises</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {activeLessonContent.exercises.map((ex, idx) => (
                            <div key={idx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                              <strong style={{ color: 'var(--navy)' }}>Exercise {idx + 1}: {ex.title}</strong>
                              <p style={{ margin: '6px 0', fontSize: '0.9rem' }}>{ex.description}</p>
                              {ex.code_template && <pre className="code-block" style={{ marginTop: '8px' }}>{ex.code_template}</pre>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Static Read Only Quizzes */}
                    {activeLessonContent.quizzes?.length > 0 && (
                      <div className="content-block">
                        <h3>Assessment Quiz</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {activeLessonContent.quizzes.map((q, qIdx) => (
                            <div key={qIdx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                              <strong style={{ color: 'var(--navy)' }}>Q{qIdx + 1}: {q.question}</strong>
                              {q.options?.length > 0 && (
                                <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '8px' }}>
                                  {q.options.map((opt, oIdx) => (
                                    <li key={oIdx} style={{ padding: '4px 0', fontSize: '0.88rem', color: opt === q.answer ? '#059669' : 'var(--text-main)', fontWeight: opt === q.answer ? 700 : 400 }}>
                                      {opt === q.answer ? '✅ ' : '• '}{opt}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
              </div> {/* editor-panel */}
            </div> {/* pdf-body */}

            {/* PDF Footer Page */}
            <div className="pdf-footer-page">
              <span>Confidential &middot; For Educational Use Only</span>
              <span>Page {lessonNumber} of {courseData.lessons?.length || 1}</span>
            </div>
          </div>
                    )}
        </div>
      );
    })()}
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
      {/* Global Delete Confirmation Modal Popup */}
      {deleteTargetSession && (
        <div 
          className="modal-overlay" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999 }}
          onClick={(e) => { if (e.target.className === 'modal-overlay') setDeleteTargetSession(null); }}
        >
          <div 
            style={{ 
              background: '#ffffff', 
              padding: '36px 32px', 
              borderRadius: '24px', 
              maxWidth: '440px', 
              width: '90%', 
              textAlign: 'center', 
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)', 
              border: '1px solid rgba(226, 232, 240, 0.9)' 
            }}
          >
            {/* Sleek Gradient Icon Circle */}
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)' }}>
              <svg width="28" height="28" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px', letterSpacing: '-0.02em' }}>
              Delete Course?
            </h3>
            
            <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
              Are you sure you want to delete this course from your library?
            </p>

            {/* Clean Highlighted Title Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px', marginBottom: '28px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', wordBreak: 'break-word' }}>
                "{deleteTargetSession.title || deleteTargetSession.prompt}"
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button"
                style={{ 
                  flex: 1, 
                  padding: '12px 20px', 
                  borderRadius: '12px', 
                  background: '#ffffff', 
                  color: '#475569', 
                  border: '1px solid #cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setDeleteTargetSession(null)}
              >
                Cancel
              </button>
              <button 
                type="button"
                style={{ 
                  flex: 1, 
                  padding: '12px 20px', 
                  borderRadius: '12px', 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                  color: '#ffffff', 
                  border: 'none', 
                  fontWeight: 700, 
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onClick={async () => {
                  const id = deleteTargetSession.session_id;
                  setDeleteTargetSession(null);
                  await fetch(`${API_BASE}/courses/sessions/${id}`, { method: 'DELETE' });
                  fetchSessions();
                }}
              >
                Delete Course
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
