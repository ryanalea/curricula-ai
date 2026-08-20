/**
 * Default structure outline sections placeholder mapping for the 3 roles
 */

export const defaultSections = {
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

export const mergeSections = (lessonSections) => {
  const baseSections = JSON.parse(JSON.stringify(defaultSections));
  if (!lessonSections) return baseSections;
  
  const merged = {};
  ['creator', 'student', 'educator'].forEach(role => {
    const baseRoleSecs = baseSections[role] || [];
    const inputRoleSecs = lessonSections[role] || [];

    if (!inputRoleSecs.length) {
      merged[role] = baseRoleSecs;
      return;
    }

    const baseTypes = new Set(baseRoleSecs.map(b => b.type));
    const updatedBase = baseRoleSecs.map(b => {
      const match = inputRoleSecs.find(i => i.type === b.type || i.id === b.id);
      return match ? { ...b, ...match } : b;
    });

    const customSecs = inputRoleSecs
      .filter(i => !baseTypes.has(i.type) && !['overview', 'outcomes', 'core_content', 'exercises', 'quiz', 'why_matters', 'journey', 'practice', 'debugging', 'ethics', 'facilitator', 'engagement', 'rubric', 'assessment', 'teaching_tips', 'discussion'].includes(i.type))
      .map((s, idx) => ({
        id: s.id || `custom-gen-${role}-${idx}-${Date.now()}`,
        type: s.type || `custom_${role}_${s.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'section'}`,
        title: s.title || 'Custom Section',
        instruction: s.instruction || 'Write section content.',
        locked: Boolean(s.locked)
      }));

    merged[role] = [...updatedBase, ...customSecs];
  });

  return merged;
};
