import { API_BASE } from './apiClient';

export const exportApi = {
  triggerDirectDownload: ({ sessionId, courseTitle, role, format, lessonId = null }) => {
    if (!sessionId) return;
    const roleText = (role || 'creator').toLowerCase();
    const cleanTitle = (courseTitle || 'Course').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_') || 'Course';
    const ext = format === 'zip' ? 'zip' : format === 'docx' ? 'docx' : format === 'html' ? 'html' : format === 'md' ? 'md' : 'pdf';
    const fileName = `${cleanTitle}_${roleText}.${ext}`;

    let downloadUrl = `${API_BASE}/courses/${sessionId}/export/${fileName}?format=${format}&role=${roleText}&disposition=attachment`;
    if (lessonId && format !== 'zip') {
      downloadUrl += `&lesson_id=${lessonId}`;
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    link.target = '_self';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  downloadPptx: async ({ sessionId, courseTitle }) => {
    const res = await fetch(`${API_BASE}/courses/${sessionId}/pptx/download`, {
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
    });
    if (!res.ok) throw new Error('Failed to download PPTX');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(courseTitle || 'Course').replace(/\s+/g, '_')}_slides.pptx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  downloadLessonPptx: async ({ sessionId, courseTitle, lessonId, lessonTitle }) => {
    const res = await fetch(`${API_BASE}/courses/${sessionId}/pptx/download/lesson/${lessonId}`, {
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }
    });
    if (!res.ok) throw new Error('Failed to download Lesson PPTX');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(courseTitle || 'Course').replace(/\s+/g, '_')}_${(lessonTitle || 'Lesson').replace(/\s+/g, '_')}_slides.pptx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
