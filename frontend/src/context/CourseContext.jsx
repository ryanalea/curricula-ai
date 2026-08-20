import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { courseApi } from '../services/courseApi';
import { exportApi } from '../services/exportApi';

const CourseContext = createContext(null);

export function CourseProvider({ children, toast }) {
  // ── Navigation / Step state ──
  const [currentView, setCurrentView] = useState('landing');
  const [currentStep, setCurrentStep] = useState('dashboard');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agentProgressStage, setAgentProgressStage] = useState(1);
  const [activeSidebarNav, setActiveSidebarNav] = useState('create');

  // ── Prompt & Topics ──
  const [promptText, setPromptText] = useState('');
  const [selectedTopicCategory, setSelectedTopicCategory] = useState('All Categories');

  // ── Config ──
  const [techTags, setTechTags] = useState([]);
  const [allSuggestedTags, setAllSuggestedTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [configLessons, setConfigLessons] = useState(5);
  const [configDuration, setConfigDuration] = useState(60);
  const [configDifficulty, setConfigDifficulty] = useState('Beginner');
  const [configAudience, setConfigAudience] = useState('Student');
  const [subjectContext, setSubjectContext] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

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
  const [lastSavedConfigHash, setLastSavedConfigHash] = useState(null);

  // ── Structure ──
  const [structure, setStructure] = useState([]);
  const [activeStructureRole, setActiveStructureRole] = useState('creator');
  const [selectedStructureLessonId, setSelectedStructureLessonId] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  // ── Generation ──
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [currentGeneratingLessonIdx, setCurrentGeneratingLessonIdx] = useState(0);

  // ── Generated Course ──
  const [courseData, setCourseData] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeRole, setActiveRole] = useState('creator');
  const [openPov, setOpenPov] = useState('creator');

  // ── Sessions & Library ──
  const [sessions, setSessions] = useState([]);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);
  const [showMyCourses, setShowMyCourses] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [libraryPubPage, setLibraryPubPage] = useState(1);

  // ── Editor & Toolbar ──
  const [sectionLoading, setSectionLoading] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isAIWandOpen, setIsAIWandOpen] = useState(false);
  const [isWandProcessing, setIsWandProcessing] = useState(false);
  const [customSectionsByLesson, setCustomSectionsByLesson] = useState({});

  // ── Export Modal ──
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportRole, setExportRole] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // ── PPT Generation ──
  const [isPptxPage, setIsPptxPage] = useState(false);
  const [pptxDataByLesson, setPptxDataByLesson] = useState({});
  const [activePptxLessonId, setActivePptxLessonId] = useState(null);
  const [pptxLayout, setPptxLayout] = useState('layout_1');
  const [pptxSlideIndex, setPptxSlideIndex] = useState(0);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pptxBrandColors, setPptxBrandColors] = useState({ primary: '#1a202c', accent: '#d69e2e' });

  // ── Helper methods ──
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

  const activeFileName = uploadedFileName || pendingFile?.name || (() => {
    if (subjectContext) {
      const match = subjectContext.match(/Context from Uploaded File \(([^)]+)\)/);
      if (match) return match[1];
    }
    return '';
  })();

  const fetchSessions = async (token) => {
    setIsFetchingSessions(true);
    try {
      const data = await courseApi.getSessions(token);
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setIsFetchingSessions(false);
    }
  };

  return (
    <CourseContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentStep,
        setCurrentStep,
        sessionId,
        setSessionId,
        isLoading,
        setIsLoading,
        agentProgressStage,
        setAgentProgressStage,
        activeSidebarNav,
        setActiveSidebarNav,
        promptText,
        setPromptText,
        selectedTopicCategory,
        setSelectedTopicCategory,
        techTags,
        setTechTags,
        allSuggestedTags,
        setAllSuggestedTags,
        newTag,
        setNewTag,
        toggleTag,
        handleAddCustomTag,
        configLessons,
        setConfigLessons,
        configDuration,
        setConfigDuration,
        configDifficulty,
        setConfigDifficulty,
        configAudience,
        setConfigAudience,
        subjectContext,
        setSubjectContext,
        pendingFile,
        setPendingFile,
        uploadedFileName,
        setUploadedFileName,
        activeFileName,
        prerequisites,
        setPrerequisites,
        boundaries,
        setBoundaries,
        learningOutcomes,
        setLearningOutcomes,
        newPrereq,
        setNewPrereq,
        newBoundary,
        setNewBoundary,
        newOutcome,
        setNewOutcome,
        proposals,
        setProposals,
        selectedProposalId,
        setSelectedProposalId,
        lastSavedConfigHash,
        setLastSavedConfigHash,
        structure,
        setStructure,
        activeStructureRole,
        setActiveStructureRole,
        selectedStructureLessonId,
        setSelectedStructureLessonId,
        draggingIdx,
        setDraggingIdx,
        dragOverIdx,
        setDragOverIdx,
        generationProgress,
        setGenerationProgress,
        generationStatusText,
        setGenerationStatusText,
        currentGeneratingLessonIdx,
        setCurrentGeneratingLessonIdx,
        courseData,
        setCourseData,
        activeLessonId,
        setActiveLessonId,
        activeRole,
        setActiveRole,
        openPov,
        setOpenPov,
        sessions,
        setSessions,
        isFetchingSessions,
        fetchSessions,
        showMyCourses,
        setShowMyCourses,
        searchFilter,
        setSearchFilter,
        difficultyFilter,
        setDifficultyFilter,
        libraryPubPage,
        setLibraryPubPage,
        sectionLoading,
        setSectionLoading,
        editingSection,
        setEditingSection,
        editingText,
        setEditingText,
        isAIWandOpen,
        setIsAIWandOpen,
        isWandProcessing,
        setIsWandProcessing,
        customSectionsByLesson,
        setCustomSectionsByLesson,
        isExportModalOpen,
        setIsExportModalOpen,
        exportFormat,
        setExportFormat,
        exportRole,
        setExportRole,
        isExporting,
        setIsExporting,
        isPptxPage,
        setIsPptxPage,
        pptxDataByLesson,
        setPptxDataByLesson,
        activePptxLessonId,
        setActivePptxLessonId,
        pptxLayout,
        setPptxLayout,
        pptxSlideIndex,
        setPptxSlideIndex,
        pptxLoading,
        setPptxLoading,
        pptxBrandColors,
        setPptxBrandColors
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}
