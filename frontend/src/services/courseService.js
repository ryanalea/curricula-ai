/**
 * Course Service - Encapsulates all Course and Session API interactions
 * Follows OOP/Service Layer encapsulation principles
 */

export const CourseService = {
  /**
   * Fetch all user sessions
   */
  async getSessions(apiBase) {
    const res = await fetch(`${apiBase}/courses/sessions`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return await res.json();
  },

  /**
   * Fetch single session by ID
   */
  async getSession(apiBase, sessionId) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}`);
    if (!res.ok) throw new Error(`Failed to fetch session ${sessionId}`);
    return await res.json();
  },

  /**
   * Delete session by ID
   */
  async deleteSession(apiBase, sessionId) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`Failed to delete session ${sessionId}`);
    return await res.json();
  },

  /**
   * Update session status (draft, completed, archived)
   */
  async updateStatus(apiBase, sessionId, status) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error(`Failed to update status for ${sessionId}`);
    return await res.json();
  },

  /**
   * Start initial wizard session
   */
  async startSession(apiBase, payload) {
    const res = await fetch(`${apiBase}/courses/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to start course session');
    return await res.json();
  },

  /**
   * Upload single grounding file
   */
  async uploadFile(apiBase, sessionId, formData) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return await res.json();
  },

  /**
   * Cancel in-progress generation
   */
  async cancelGeneration(apiBase, sessionId) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}/cancel`, {
      method: 'POST'
    });
    return res.ok;
  },

  /**
   * Fetch edit history records
   */
  async getHistory(apiBase, sessionId) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return await res.json();
  },

  /**
   * Restore specific version history
   */
  async restoreHistory(apiBase, sessionId, historyId) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}/history/${historyId}/restore`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to restore history');
    return await res.json();
  },

  /**
   * Save manual section edit
   */
  async saveManualEdit(apiBase, sessionId, payload) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save edit');
    return await res.json();
  },

  /**
   * Generate PPTX presentation slides for a lesson
   */
  async generateLessonPptx(apiBase, sessionId, lessonId) {
    const res = await fetch(`${apiBase}/courses/sessions/${sessionId}/lessons/${lessonId}/generate-pptx`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to generate slides');
    return await res.json();
  },

  /**
   * Download lesson PPTX presentation
   */
  downloadLessonPptxUrl(apiBase, sessionId, lessonId, format = 'pptx') {
    return `${apiBase}/courses/sessions/${sessionId}/lessons/${lessonId}/pptx?format=${format}&download=true`;
  },

  /**
   * Download course export asset URL
   */
  getExportUrl(apiBase, sessionId, filename, format, role, lessonId = null) {
    let url = `${apiBase}/courses/${sessionId}/export/${filename}?format=${format}&role=${role}`;
    if (lessonId) {
      url += `&lesson_id=${lessonId}`;
    }
    return url;
  }
};
