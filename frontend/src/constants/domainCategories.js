export const TOPIC_CATEGORIES = [
  'All Categories',
  'Artificial Intelligence',
  'Cybersecurity',
  'Data Science',
  'Digital Transformation',
  'Education Technology',
  'Software Engineering'
];

export const STEPS = [
  { key: 'dashboard', label: 'Concept' },
  { key: 'context',   label: 'Config' },
  { key: 'grounding', label: 'Grounding' },
  { key: 'proposal',  label: 'Proposals' },
  { key: 'structure', label: 'Outline' },
  { key: 'review',    label: 'Review' },
  { key: 'generating', label: 'Generating' },
  { key: 'generated', label: 'Complete' },
];

export const WORKFLOW_STEPS = STEPS.map(s => s.key);

export const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Executive'];

export const DURATION_OPTIONS = [
  { label: '30 mins', value: 30 },
  { label: '45 mins', value: 45 },
  { label: '60 mins', value: 60 },
  { label: '90 mins', value: 90 },
  { label: '120 mins', value: 120 }
];
