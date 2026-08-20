import { useState, useEffect } from 'react';

const API_BASE = '/api/v1';

export function useCourseExport({ sessionId, currentStep, activeRole, activeLessonId, courseData, setCourseData, toast, checkCanEdit }) {
  // ── PDF Preview ──
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfSearchQuery, setPdfSearchQuery] = useState('');
  const [isPdfSearchOpen, setIsPdfSearchOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (currentStep === 'generated' && sessionId) {
      let fetchUrl = `${API_BASE}/courses/${sessionId}/export?format=pdf&role=${(activeRole || 'creator').toLowerCase()}`;
      if (activeLessonId) {
        fetchUrl += `&lesson_id=${activeLessonId}`;
      }
      fetch(fetchUrl)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch PDF preview blob");
          return res.blob();
        })
        .then(blob => {
          if (isMounted) {
            setPdfBlobUrl(prevUrl => {
              if (prevUrl) URL.revokeObjectURL(prevUrl);
              return URL.createObjectURL(blob);
            });
          }
        })
        .catch(err => console.error("PDF Blob error:", err));
    }
    return () => { isMounted = false; };
  }, [currentStep, sessionId, activeRole, activeLessonId]);

  // ── Export Modal ──
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportRole, setExportRole] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (!courseData) return;
    const title = courseData.title || 'Course_Curriculum';
    const roleText = (activeRole || 'creator').toLowerCase();
    const cleanTitle = title.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_') || 'Course';
    const ext = exportFormat === 'zip' ? 'zip' : exportFormat === 'docx' ? 'docx' : exportFormat === 'html' ? 'html' : exportFormat === 'md' ? 'md' : 'pdf';
    const fileName = `${cleanTitle}_${roleText}.${ext}`;
    setIsExporting(true);

    if (sessionId) {
      let downloadUrl = `${API_BASE}/courses/${sessionId}/export/${fileName}?format=${exportFormat}&role=${roleText}&disposition=attachment`;
      if (activeLessonId && exportFormat !== 'zip') {
        downloadUrl += `&lesson_id=${activeLessonId}`;
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName);
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsExporting(false);
        setIsExportModalOpen(false);
      }, 500);
      return;
    }

    // Local fallback
    const curLesson = courseData.lessons?.find(l => l.id === activeLessonId) || courseData.lessons?.[0];
    const lessonTitle = curLesson?.title || 'Lesson_Content';
    let contentString = `# ${title}\n## ${(activeRole || 'creator').toUpperCase()} POV - ${lessonTitle}\n\n`;
    const curSecs = curLesson?.sections?.[activeRole || 'creator'] || {};

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

    const fileBlob = new Blob([contentString], { type: 'text/plain;charset=utf-8' });
    const blobUrl = window.URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${fileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
    setIsExporting(false);
    setIsExportModalOpen(false);
  };

  // ── Version History ──
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    if (checkCanEdit && !checkCanEdit('view History')) return;
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
    if (checkCanEdit && !checkCanEdit('restore a version')) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/${sessionId}/history/${historyId}/restore`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        let updatedVal;
        try {
          updatedVal = JSON.parse(data.content);
        } catch (e) {
          updatedVal = data.content;
        }
        
        const histItem = historyList.find(h => h.id === historyId);
        if (histItem) {
          const updatedCourse = { ...courseData };
          const lIdx = updatedCourse.lessons.findIndex(l => l.id === histItem.lesson_id);
          if (lIdx !== -1) {
            if (!updatedCourse.lessons[lIdx].sections[histItem.role]) {
              updatedCourse.lessons[lIdx].sections[histItem.role] = {};
            }
            updatedCourse.lessons[lIdx].sections[histItem.role][histItem.section_type] = updatedVal;
            setCourseData(updatedCourse);
            toast.success(`Successfully restored version for: ${histItem.label || histItem.section_type}`);
            setIsHistoryOpen(false);
          }
        }
      } else {
        toast.error("Failed to restore history.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error restoring history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── PPT Generation ──
  const [isPptxPage, setIsPptxPage] = useState(false);
  const [pptxDataByLesson, setPptxDataByLesson] = useState({});
  const [activePptxLessonId, setActivePptxLessonId] = useState(null);
  const [pptxLayout, setPptxLayout] = useState('layout_1');
  const [pptxSlideIndex, setPptxSlideIndex] = useState(0);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pptxBrandColors, setPptxBrandColors] = useState({ primary: '#1a202c', accent: '#d69e2e' });

  const pptxData = activePptxLessonId ? pptxDataByLesson[activePptxLessonId] : null;
  const currentPptxSlides = pptxData?.layouts?.[pptxLayout]?.slides || [];
  const currentPptxSlide = currentPptxSlides[pptxSlideIndex] || null;

  const handleGenerateLessonPptx = async (lessonId) => {
    if (!sessionId) return;
    setPptxLoading(true);
    setActivePptxLessonId(lessonId);
    try {
      const res = await fetch(`${API_BASE}/courses/${sessionId}/pptx/generate/lesson/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_colors: pptxBrandColors })
      });
      if (res.ok) {
        const data = await res.json();
        setPptxDataByLesson(prev => ({ ...prev, [lessonId]: data }));
        setPptxSlideIndex(0);
      } else {
        alert('Failed to generate PPT structure.');
      }
    } catch (err) {
      console.error('PPT generation error:', err);
      alert('Error generating PPT.');
    } finally {
      setPptxLoading(false);
    }
  };

  const handleDownloadLessonPptx = async (lessonId) => {
    if (!sessionId || !pptxDataByLesson[lessonId]) return;
    const data = pptxDataByLesson[lessonId];
    const slidesJson = data.layouts?.[pptxLayout];
    try {
      const res = await fetch(`${API_BASE}/courses/${sessionId}/pptx/download/lesson/${lessonId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: pptxLayout, slides_json: slidesJson, brand_colors: pptxBrandColors })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const lesson = courseData.lessons?.find(l => l.id === lessonId);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(courseData?.title || 'Course').replace(/\s+/g, '_')}_${(lesson?.title || 'Lesson').replace(/\s+/g, '_')}_slides.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download PPT.');
      }
    } catch (err) {
      console.error('PPT download error:', err);
      alert('Error downloading PPT.');
    }
  };

  const handleGeneratePptx = async () => {
    if (!sessionId) return;
    setPptxLoading(true);
    try {
      const res = await fetch(`${API_BASE}/courses/${sessionId}/pptx/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_colors: pptxBrandColors })
      });
      if (res.ok) {
        const data = await res.json();
        setPptxDataByLesson(prev => {
          const next = { ...prev };
          courseData.lessons?.forEach(l => { next[l.id] = data; });
          return next;
        });
        setActivePptxLessonId(courseData.lessons?.[0]?.id);
        setPptxSlideIndex(0);
      } else {
        alert('Failed to generate PPT structure.');
      }
    } catch (err) {
      console.error('PPT generation error:', err);
      alert('Error generating PPT.');
    } finally {
      setPptxLoading(false);
    }
  };

  const handleDownloadPptx = async () => {
    if (!sessionId || !pptxData) return;
    try {
      const res = await fetch(`${API_BASE}/courses/${sessionId}/pptx/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: pptxLayout, slides_json: pptxData, brand_colors: pptxBrandColors })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(courseData?.title || 'Course').replace(/\s+/g, '_')}_slides.pptx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to download PPT.');
      }
    } catch (err) {
      console.error('PPT download error:', err);
      alert('Error downloading PPT.');
    }
  };

  return {
    pdfBlobUrl, pdfZoom, setPdfZoom, pdfSearchQuery, setPdfSearchQuery, isPdfSearchOpen, setIsPdfSearchOpen,
    isExportModalOpen, setIsExportModalOpen, exportFormat, setExportFormat, exportRole, setExportRole, isExporting, handleExport,
    isHistoryOpen, setIsHistoryOpen, historyList, historyLoading, fetchHistory, handleRestoreHistory,
    isPptxPage, setIsPptxPage, pptxDataByLesson, setPptxDataByLesson, activePptxLessonId, setActivePptxLessonId,
    pptxLayout, setPptxLayout, pptxSlideIndex, setPptxSlideIndex, pptxLoading, pptxBrandColors, setPptxBrandColors,
    pptxData, currentPptxSlides, currentPptxSlide,
    handleGenerateLessonPptx, handleDownloadLessonPptx, handleGeneratePptx, handleDownloadPptx
  };
}
