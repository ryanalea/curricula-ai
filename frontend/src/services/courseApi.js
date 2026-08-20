import { request, API_BASE } from './apiClient';

export const courseApi = {
  // Step 1: Create session & generate initial concept
  generateConcept: (payload) => {
    return request('/courses/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Sessions CRUD
  getSessions: (token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return request('/courses/sessions', { headers });
  },

  getSession: (sessionId) => {
    return request(`/courses/sessions/${sessionId}`);
  },

  deleteSession: (sessionId, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return request(`/courses/sessions/${sessionId}`, {
      method: 'DELETE',
      headers
    });
  },

  // Step 2 & 3: Config & Grounding
  updateConfig: (sessionId, payload) => {
    return request(`/courses/sessions/${sessionId}/config`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  saveGrounding: (sessionId, payload) => {
    return request(`/courses/sessions/${sessionId}/grounding`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  suggestGrounding: (sessionId, payload) => {
    return request(`/courses/sessions/${sessionId}/grounding/suggest`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  refreshGrounding: (sessionId) => {
    return request(`/courses/sessions/${sessionId}/grounding/refresh`, {
      method: 'POST'
    });
  },

  // Step 4 & 5: Proposals & Structure
  generateProposals: (sessionId) => {
    return request(`/courses/sessions/${sessionId}/proposals/generate`, {
      method: 'POST'
    });
  },

  selectProposal: (sessionId, payload) => {
    return request(`/courses/sessions/${sessionId}/proposals/select`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  saveStructure: (sessionId, payload) => {
    return request(`/courses/sessions/${sessionId}/structure/save`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Step 6 & 7: Content Generation
  triggerGeneration: (sessionId) => {
    return request(`/courses/sessions/${sessionId}/content/generate`, {
      method: 'POST'
    });
  },

  // Poll generation progress — reads status/progress from the session record
  getProgress: (sessionId) => {
    return request(`/courses/sessions/${sessionId}`);
  },

  cancelGeneration: (sessionId) => {
    return request(`/courses/sessions/${sessionId}/cancel`, {
      method: 'POST'
    });
  },

  // Lesson actions & saving
  updateSessionContent: (sessionId, payload) => {
    const lessonId = payload.lesson_id;
    return request(`/lessons/${lessonId}/sections/save`, {
      method: 'POST',
      body: JSON.stringify({
        role: payload.role,
        section_type: payload.section_key,
        content: payload.content
      })
    });
  },

  runSectionAction: (lessonId, payload) => {
    return request(`/lessons/${lessonId}/sections/ai-action`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
