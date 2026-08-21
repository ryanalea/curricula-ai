import React from 'react';
import { IconLayers, IconClock } from '../components/icons/Icons';
import { trendingTopics } from '../constants/starterPrompts';

export function HomePage({
  greeting,
  sessionsList,
  handleResumeSession,
  selectedTopicCategory,
  setSelectedTopicCategory,
  setPromptText,
  setCurrentView,
  setCurrentStep,
  toast
}) {
  return (
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
        {['All Categories', 'Artificial Intelligence', 'Cybersecurity', 'Data Science', 'Digital Transformation', 'Education Technology', 'Software Engineering'].map(cat => (
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
        <button className="feedback-btn" onClick={() => toast.info('Thank you for your feedback!')}>Send Feedback</button>
      </div>
    </div>
  );
}
