import React, { useState } from 'react';
import { useCourse } from '../context/CourseContext';
import { useUI } from '../context/UIContext';
import { CreatorView } from '../components/views/CreatorView';
import { StudentView } from '../components/views/StudentView';
import { EducatorView } from '../components/views/EducatorView';
import { exportApi } from '../services/exportApi';
import { courseApi } from '../services/courseApi';
import { IconSpinner, IconChevronLeft, IconChevronRight } from '../components/icons/Icons';

export function LessonStudioPage({ onBackToWizard }) {
  const {
    courseData,
    setCourseData,
    sessionId,
    activeLessonId,
    setActiveLessonId,
    activeRole,
    setActiveRole,
    isExportModalOpen,
    setIsExportModalOpen,
    exportFormat,
    setExportFormat,
    exportRole,
    setExportRole,
    isExporting,
    setIsExporting,
    editingSection,
    setEditingSection,
    editingText,
    setEditingText,
    isAIWandOpen,
    setIsAIWandOpen,
    isWandProcessing,
    setIsWandProcessing
  } = useCourse();

  const { toast } = useUI();

  const lessons = courseData?.lessons || [];
  const curLesson = lessons.find(l => l.id === activeLessonId) || lessons[0] || {};
  const currentLessonIndex = lessons.findIndex(l => l.id === activeLessonId);
  const lessonNumber = (currentLessonIndex !== -1) ? currentLessonIndex + 1 : 1;
  const dbSections = curLesson?.sections?.[activeRole] || {};
  const lessonTitle = curLesson?.title || courseData?.title || 'Machine Learning Essentials';

  const activeLessonContent = {
    overview: dbSections.overview || dbSections.project_brief || `This lesson provides a comprehensive overview and practical foundation for ${lessonTitle}.`,
    learning_outcomes: dbSections.learning_outcomes?.length > 0 ? dbSections.learning_outcomes : [
      `Master core concepts and architectural components of ${lessonTitle}.`,
      `Implement hands-on code examples and workflows using modern industry standards.`,
      `Apply critical thinking to analyze, debug, and optimize real-world production scenarios.`
    ],
    core_content: dbSections.core_content || dbSections.tech_stack || `### 1. Conceptual Foundations\n${lessonTitle} serves as a key pillar in modern engineering.`,
    exercises: dbSections.exercises?.length > 0 ? dbSections.exercises : [
      { title: `Building ${lessonTitle} Pipeline`, description: `Implement prototype for ${lessonTitle}.`, code_template: `// Exercise 1: ${lessonTitle}` }
    ],
    quizzes: dbSections.quizzes || dbSections.quiz || [
      { question: `What is the primary objective of ${lessonTitle}?`, options: [`To establish a robust technical workflow`, `To bypass data validation`], answer: `To establish a robust technical workflow` }
    ],
    why_this_matters: dbSections.why_this_matters || `Understanding ${lessonTitle} is crucial for career advancement.`,
    practice: dbSections.practice?.code_block || dbSections.practice?.scenario ? dbSections.practice : {
      code_block: `// Interactive Sandbox for ${lessonTitle}\nconsole.log("Hello ${lessonTitle}");`,
      interactive_exercise: `Run the sandbox script and extend the function logic for ${lessonTitle}.`,
      checklist: [`Initialize environment`, `Execute main sandbox function`, `Verify console log output`]
    },
    debugging: dbSections.debugging || `### Common Pitfalls & Solutions\n1. **Unhandled Edge Cases:** Validate inputs prior to execution.`,
    ethics: dbSections.ethics || `### Code Principles & Ethics\nEnsure user data protection, transparency, and compliance.`,
    facilitator_guide: dbSections.facilitator_guide || `### Educator Instructions\nFacilitate an interactive discussion on ${lessonTitle}.`,
    lesson_plan: dbSections.lesson_plan || {
      ice_breaker: `Ask students: "What real-world applications of ${lessonTitle} have you encountered?"`,
      timing: `Lecture: 20 mins | Pair Lab: 30 mins | Wrap-up: 10 mins`
    },
    rubric: dbSections.rubric?.length > 0 ? dbSections.rubric : [
      { criteria: "Implementation", excellent: "Code runs error-free", good: "Minor style issues", needs_improvement: "Execution errors" }
    ],
    discussion_questions: dbSections.discussion_questions?.length > 0 ? dbSections.discussion_questions : [
      `How does ${lessonTitle} improve overall system efficiency?`
    ]
  };

  const handleSaveManualEdit = async (sectionKey, newContent) => {
    if (!sessionId || !curLesson?.id) return;
    try {
      const updatedLessons = lessons.map(l => {
        if (l.id === curLesson.id) {
          const lSecs = { ...(l.sections || {}) };
          if (!lSecs[activeRole]) lSecs[activeRole] = {};
          lSecs[activeRole][sectionKey] = newContent;
          return { ...l, sections: lSecs };
        }
        return l;
      });

      setCourseData({ ...courseData, lessons: updatedLessons });
      setEditingSection(null);

      await courseApi.updateSessionContent(sessionId, {
        lesson_id: curLesson.id,
        role: activeRole,
        section_key: sectionKey,
        content: newContent
      });
      toast.success("Changes saved successfully! 💾");
    } catch (err) {
      toast.error("Failed to save changes.");
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    try {
      exportApi.triggerDirectDownload({
        sessionId,
        courseTitle: courseData?.title,
        role: exportRole === 'all' ? activeRole : exportRole,
        format: exportFormat,
        lessonId: activeLessonId
      });
      toast.success(`Exporting ${exportFormat.toUpperCase()}... Download starting! 📥`);
      setIsExportModalOpen(false);
    } catch (err) {
      toast.error('Failed to trigger export.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="lesson-studio-page">
      {/* Studio Top Toolbar */}
      <div className="header" style={{ alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="file-upload-btn" onClick={onBackToWizard}>
            ← Back to Wizard
          </button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)', margin: 0 }}>
              {courseData?.title || 'Lesson Studio'}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Lesson {lessonNumber} of {lessons.length} &middot; {curLesson?.title}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="purple-start-btn" 
            style={{ fontSize: '0.86rem', padding: '8px 18px', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)' }}
            onClick={() => setIsExportModalOpen(true)}
          >
            Export Assets 📦
          </button>
        </div>
      </div>

      {/* Role Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '4px', borderRadius: '9999px', border: '1px solid var(--border-color)', gap: '4px' }}>
          <button 
            className={`tab-btn ${activeRole === 'creator' ? 'active' : ''}`}
            style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
            onClick={() => setActiveRole('creator')}
          >
            🎨 CREATOR POV
          </button>
          <button 
            className={`tab-btn ${activeRole === 'student' ? 'active' : ''}`}
            style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
            onClick={() => setActiveRole('student')}
          >
            🎓 STUDENT POV
          </button>
          <button 
            className={`tab-btn ${activeRole === 'educator' ? 'active' : ''}`}
            style={{ borderRadius: '9999px', padding: '8px 20px', fontSize: '0.85rem', fontWeight: 700 }}
            onClick={() => setActiveRole('educator')}
          >
            🏫 EDUCATOR POV
          </button>
        </div>
      </div>

      {/* Lesson Selector Carousel Strip */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
        {lessons.map((l, idx) => (
          <button
            key={l.id}
            className={`trending-pill ${activeLessonId === l.id ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', padding: '6px 14px' }}
            onClick={() => setActiveLessonId(l.id)}
          >
            L{idx + 1}: {l.title?.replace(/^Lesson\s*\d+\s*:\s*/i, '') || `Module ${idx + 1}`}
          </button>
        ))}
      </div>

      {/* 3 Role POV Workspace Component */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
        {activeRole === 'creator' && (
          <CreatorView
            activeLessonContent={activeLessonContent}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            editingText={editingText}
            setEditingText={setEditingText}
            handleSaveManualEdit={handleSaveManualEdit}
          />
        )}
        {activeRole === 'student' && (
          <StudentView
            activeLessonContent={activeLessonContent}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            editingText={editingText}
            setEditingText={setEditingText}
            handleSaveManualEdit={handleSaveManualEdit}
          />
        )}
        {activeRole === 'educator' && (
          <EducatorView
            activeLessonContent={activeLessonContent}
            editingSection={editingSection}
            setEditingSection={setEditingSection}
            editingText={editingText}
            setEditingText={setEditingText}
            handleSaveManualEdit={handleSaveManualEdit}
          />
        )}
      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3>Export Course Package</h3>
              <button className="icon-btn-tool" onClick={() => setIsExportModalOpen(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--navy)' }}>Format</label>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', fontSize: '0.9rem' }}
                >
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="docx">Word Document (.docx)</option>
                  <option value="md">Markdown Package (.md)</option>
                  <option value="html">Interactive Web Page (.html)</option>
                  <option value="zip">Complete Course ZIP (.zip)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--navy)' }}>Role POV Scope</label>
                <select 
                  value={exportRole} 
                  onChange={(e) => setExportRole(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--border-color)', fontSize: '0.9rem' }}
                >
                  <option value="all">Current Active Role ({activeRole.toUpperCase()})</option>
                  <option value="creator">Creator POV only</option>
                  <option value="student">Student POV only</option>
                  <option value="educator">Educator POV only</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="file-upload-btn" onClick={() => setIsExportModalOpen(false)}>Cancel</button>
              <button className="action-btn" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <><IconSpinner /> Exporting…</> : '📥 Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
