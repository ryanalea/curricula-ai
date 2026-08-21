import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api/v1';

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
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="15 18 9 12 15 6"/></svg>
);
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}><polyline points="9 18 15 12 9 6"/></svg>
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

function StepProgressBar({ currentStep, onStepClick }) {
  const currentIdx = WORKFLOW_STEPS.indexOf(currentStep);
  const isGenerating = currentStep === 'generating';
  return (
    <div className="step-progress-bar">
      {STEPS.map((step, i) => {
        const isDone = currentIdx > i;
        const isActive = currentIdx === i;
        const canClick = !isGenerating && (isDone || i <= currentIdx);
        return (
          <React.Fragment key={step.key}>
            <div 
              className={`step-node ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
              style={{ cursor: canClick ? 'pointer' : 'default', opacity: isGenerating && !isActive ? 0.5 : 1 }}
              onClick={() => {
                if (canClick && onStepClick && step.key !== 'generating' && step.key !== 'generated') {
                  onStepClick(step.key);
                }
              }}
              title={canClick ? `Go to ${step.label}` : (isGenerating ? 'Editing disabled during generation' : '')}
            >
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
function parseInlineMarkdown(text) {
  if (!text) return '';
  const tokens = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const plainText = text.substring(lastIndex, match.index);
    if (plainText) {
      tokens.push(plainText);
    }
    const matchedToken = match[0];
    if (matchedToken.startsWith('**') && matchedToken.endsWith('**')) {
      tokens.push(<strong key={match.index}>{matchedToken.slice(2, -2)}</strong>);
    } else if (matchedToken.startsWith('*') && matchedToken.endsWith('*')) {
      tokens.push(<em key={match.index}>{matchedToken.slice(1, -1)}</em>);
    } else if (matchedToken.startsWith('`') && matchedToken.endsWith('`')) {
      tokens.push(<code key={match.index} className="inline-code">{matchedToken.slice(1, -1)}</code>);
    } else if (matchedToken.startsWith('[') && matchedToken.includes('](')) {
      const closingBracket = matchedToken.indexOf('](');
      const linkText = matchedToken.slice(1, closingBracket);
      const linkUrl = matchedToken.slice(closingBracket + 2, -1);
      tokens.push(
        <a key={match.index} href={linkUrl} target="_blank" rel="noopener noreferrer" className="content-link">
          {linkText}
        </a>
      );
    } else {
      tokens.push(matchedToken);
    }
    lastIndex = regex.lastIndex;
  }
  const remainingText = text.substring(lastIndex);
  if (remainingText) {
    tokens.push(remainingText);
  }
  return tokens.length > 0 ? tokens : text;
}

function ContentRenderer({ text }) {
  if (!text) return <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No content available.</p>;
  const lines = String(text).split('\n');
  const elements = [];
  let codeBuffer = [];
  let inCode = false;
  let listBuffer = [];

  const flushList = (keyPrefix) => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${keyPrefix}`} className="content-ul">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      flushList(i);
      if (inCode) {
        elements.push(<pre key={`code-${i}`} className="code-block">{codeBuffer.join('\n')}</pre>);
        codeBuffer = []; inCode = false;
      } else { inCode = true; }
      return;
    }
    if (inCode) { codeBuffer.push(line); return; }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listBuffer.push(<li key={`li-${i}`} className="content-li">{parseInlineMarkdown(line.slice(2))}</li>);
    } else {
      flushList(i);
      if (line.startsWith('### ')) {
        elements.push(<h4 key={i} className="content-h3">{parseInlineMarkdown(line.slice(4))}</h4>);
      } else if (line.startsWith('## ')) {
        elements.push(<h3 key={i} className="content-h2">{parseInlineMarkdown(line.slice(3))}</h3>);
      } else if (line.startsWith('# ')) {
        elements.push(<h2 key={i} className="content-h1">{parseInlineMarkdown(line.slice(2))}</h2>);
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
      } else {
        elements.push(<p key={i} className="content-p">{parseInlineMarkdown(line)}</p>);
      }
    }
  });

  flushList('end');

  return <div className="content-renderer">{elements}</div>;
}

// ─── Maxy Auth API ────────────────────────────────────────────────────────────
const MAXY_AUTH = 'https://api.maxy.academy/api/v1/auth';

// ─── Landing Page Component (White-Base Artistic Edition) ─────────────────────
function LandingPage({ onNavigate, requireAuth, onLoginSuccess }) {
  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [typeText, setTypeText] = useState('');
  const typingStrings = [
    '3-POV AI Curriculum Engine',
    'Document-Grounded Learning',
    'Educator × Student × Creator',
    'Export-Ready in 5 Formats',
    'Cinematic Course Architecture'
  ];
  const [currentStringIdx, setCurrentStringIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const sectionRefs = useRef([]);

  // Light-mode particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const palette = [
      [233, 178, 89], // gold
      [79, 70, 229],  // indigo
      [16, 185, 129], // emerald
      [239, 68, 68],  // red
      [139, 92, 246], // purple
    ];
    for (let i = 0; i < 55; i++) {
      const c = palette[Math.floor(Math.random() * palette.length)];
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2.2 + 0.8,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        alpha: Math.random() * 0.4 + 0.12,
        color: c,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha})`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - p.x, dy = particles[j].y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  // Typewriter
  useEffect(() => {
    const str = typingStrings[currentStringIdx];
    let timeout;
    if (!isDeleting && typeText.length < str.length) {
      timeout = setTimeout(() => setTypeText(str.slice(0, typeText.length + 1)), 65);
    } else if (!isDeleting && typeText.length === str.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && typeText.length > 0) {
      timeout = setTimeout(() => setTypeText(str.slice(0, typeText.length - 1)), 32);
    } else {
      setIsDeleting(false);
      setCurrentStringIdx(prev => (prev + 1) % typingStrings.length);
    }
    return () => clearTimeout(timeout);
  }, [typeText, isDeleting, currentStringIdx]);

  // Scroll-reveal
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = sectionRefs.current.indexOf(entry.target);
          if (idx !== -1) setVisibleSections(prev => new Set([...prev, idx]));
        }
      });
    }, { threshold: 0.12 });
    sectionRefs.current.forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addSectionRef = (el, idx) => { sectionRefs.current[idx] = el; };

  const handleMouseMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (rect) {
      const rx = ((e.clientY - rect.top - rect.height / 2) / rect.height) * -8;
      const ry = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 8;
      setTilt({ rx, ry });
    }
    setMousePos({ x: e.clientX, y: e.clientY });
  };
  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 });

  const revealStyle = (idx, delay = 0) => ({
    opacity: visibleSections.has(idx) ? 1 : 0,
    transform: visibleSections.has(idx) ? 'translateY(0px) scale(1)' : 'translateY(50px) scale(0.98)',
    transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`
  });

  const features = [
    { icon: '🤖', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', title: '3-Role Multi-POV Engine', desc: 'Tailored content for Creators, Students & Educators — simultaneously, in one click.' },
    { icon: '📄', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', title: 'Document Grounding', desc: 'Upload PDF, DOCX or TXT. Every generated word anchors to your exact source material.' },
    { icon: '🪄', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', title: 'AI Magic Wand', desc: 'Rewrite, expand, simplify, or generate quiz questions per section — instantly and precisely.' },
    { icon: '📦', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', title: '5-Format Powerhouse Export', desc: 'Beautiful PDF, Word, Markdown, HTML pages, or full ZIP course packages — ready to ship.' },
  ];

  const stats = [
    { num: '10×', label: 'Faster Course Creation', color: '#E9B259' },
    { num: '3', label: 'Synchronized Role POVs', color: '#4F46E5' },
    { num: '5', label: 'Multi-Format Exports', color: '#10B981' },
    { num: '100%', label: 'Document-Aligned Output', color: '#8B5CF6' },
  ];

  return (
    <div
      style={{ position: 'relative', minHeight: '100vh', width: '100%', background: '#FFFFFF', overflow: 'hidden', color: '#1e293b' }}
      onMouseMove={handleMouseMove}
    >
      {/* High-tech Grid Background */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(#1A2040 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.04,
        pointerEvents: 'none'
      }} />

      {/* Cursor spotlight — subtle on white */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(233,178,89,0.12), transparent 60%)`,
        transition: 'background 0.08s ease'
      }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />

      {/* ── Intense Artistic Brand Color Blobs ── */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,178,89,0.3) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1, animation: 'glowPulse 9s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', top: '5%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,32,64,0.15) 0%, transparent 70%)', filter: 'blur(55px)', pointerEvents: 'none', zIndex: 1, animation: 'glowPulse 11s ease-in-out infinite 2s' }} />
      <div style={{ position: 'absolute', top: '35%', left: '35%', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1, animation: 'glowPulse 8s ease-in-out infinite 4s' }} />

      {/* Glassmorphic 3D shapes */}
      <div style={{ position: 'absolute', top: '10%', right: '18%', width: '140px', height: '140px', borderRadius: '32px', background: 'linear-gradient(135deg, rgba(26,32,64,0.05), rgba(233,178,89,0.15))', border: '1px solid rgba(233,178,89,0.3)', backdropFilter: 'blur(8px)', transform: 'rotate(15deg)', animation: 'floatSlow 7s ease-in-out infinite', pointerEvents: 'none', zIndex: 2, boxShadow: '0 20px 40px rgba(26,32,64,0.08)' }} />
      <div style={{ position: 'absolute', top: '25%', left: '8%', width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(139,92,246,0.15))', border: '1px solid rgba(79,70,229,0.2)', backdropFilter: 'blur(10px)', animation: 'floatReverse 9s ease-in-out infinite', pointerEvents: 'none', zIndex: 2, boxShadow: '0 15px 30px rgba(79,70,229,0.1)' }} />
      <div style={{ position: 'absolute', top: '45%', right: '10%', width: '70px', height: '70px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.15))', border: '1px solid rgba(16,185,129,0.2)', backdropFilter: 'blur(6px)', transform: 'rotate(-20deg)', animation: 'floatSlow 6s ease-in-out infinite 1s', pointerEvents: 'none', zIndex: 2 }} />

      {/* ── HERO ── */}
      <div
        ref={heroRef}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '120px 32px 60px 32px', textAlign: 'center' }}
      >
        {/* High Contrast Shimmer Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '10px 24px', borderRadius: '9999px',
          background: '#1A2040', color: '#E9B259',
          fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.15em',
          marginBottom: '32px', border: '1.5px solid rgba(233,178,89,0.5)',
          boxShadow: '0 8px 25px rgba(26,32,64,0.4), 0 0 20px rgba(233,178,89,0.2)',
          textTransform: 'uppercase', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: '-100%', width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(233,178,89,0.4), transparent)', animation: 'shimmerGlow 3s infinite' }} />
          <span style={{ fontSize: '1.1rem' }}>⚡</span> REVOLUTIONARY AI CURRICULUM ARCHITECTURE 2.0
        </div>

        {/* 3D tilt hero content */}
        <div style={{
          transform: `perspective(1200px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: 'transform 0.15s cubic-bezier(0.16,1,0.3,1)',
          transformStyle: 'preserve-3d',
        }}>
          <h1 style={{
            fontSize: 'clamp(3rem, 7vw, 6rem)', fontWeight: 900, lineHeight: 1.05,
            marginBottom: '20px', letterSpacing: '-0.04em', color: '#1A2040'
          }}>
            Transform Any Topic<br />
            <span style={{
              background: 'linear-gradient(135deg, #E9B259 0%, #D97706 25%, #4F46E5 75%, #1A2040 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundSize: '300% 300%', animation: 'gradientShift 8s ease infinite', display: 'inline-block'
            }}>
              into Living Curricula
            </span>
          </h1>

          {/* Typewriter line */}
          <div style={{
            fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)', fontWeight: 800, color: '#475569',
            marginBottom: '24px', minHeight: '2em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}>
            <span style={{ color: '#E9B259', fontWeight: 900, fontSize: '1.8rem', lineHeight: 0 }}>&rsaquo;</span>
            <span style={{ background: '#1A2040', color: '#fff', padding: '4px 12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(26,32,64,0.15)' }}>{typeText}</span>
            <span style={{ display: 'inline-block', width: '3px', height: '1.3em', background: '#E9B259', animation: 'cursorBlink 0.85s ease-in-out infinite', borderRadius: '2px', verticalAlign: 'middle' }} />
          </div>

          <p style={{ fontSize: '1.15rem', color: '#64748B', maxWidth: '680px', margin: '0 auto 48px auto', lineHeight: 1.7, fontWeight: 500 }}>
            Synthesize rich material for <strong style={{ color: '#4F46E5', background: 'rgba(79,70,229,0.1)', padding: '2px 8px', borderRadius: '6px' }}>Creators</strong>,
            hands-on sandboxes for <strong style={{ color: '#059669', background: 'rgba(5,150,105,0.1)', padding: '2px 8px', borderRadius: '6px' }}>Students</strong>,
            and facilitator guides for <strong style={{ color: '#D97706', background: 'rgba(217,119,6,0.1)', padding: '2px 8px', borderRadius: '6px' }}>Educators</strong> — instantly, with extreme precision.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '50px' }}>
          <button
            style={{
              padding: '18px 42px', fontSize: '1.1rem', fontWeight: 900, borderRadius: '16px', cursor: 'pointer', border: 'none',
              background: 'linear-gradient(135deg, #1A2040 0%, #2D3561 100%)',
              color: '#E9B259', boxShadow: '0 12px 35px rgba(26,32,64,0.4)',
              display: 'inline-flex', alignItems: 'center', gap: '12px',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05) translateY(-3px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(26,32,64,0.5)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1) translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(26,32,64,0.4)'; e.currentTarget.style.color = '#E9B259'; }}
            onClick={() => requireAuth('wizard', () => onNavigate('wizard'))}
          >
            <span style={{ fontSize: '1.3rem' }}>🚀</span> Start Building Now
          </button>
          <button
            style={{
              padding: '18px 36px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '16px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.8)', border: '2px solid #E9B259', color: '#1A2040',
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 25px rgba(233,178,89,0.15)',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1A2040'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(26,32,64,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.color = '#1A2040'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(233,178,89,0.15)'; }}
            onClick={() => onNavigate('signup')}
          >
            <span style={{ fontSize: '1.2rem' }}>✦</span> Create Free Account
          </button>
        </div>

        {/* Floating badge pills - high tech glassy style */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '70px' }}>
          {[
            { icon: '⚡', text: 'Instant Document Parsing', cls: 'float-item-1', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#059669' },
            { icon: '🎓', text: '3 Roles Synchronized', cls: 'float-item-2', bg: 'rgba(79,70,229,0.1)', border: 'rgba(79,70,229,0.3)', color: '#4F46E5' },
            { icon: '📦', text: 'PDF · Word · HTML · ZIP', cls: 'float-item-3', bg: 'rgba(233,178,89,0.15)', border: 'rgba(233,178,89,0.4)', color: '#D97706' }
          ].map((b, i) => (
            <div key={i} className={b.cls} style={{
              padding: '10px 22px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem',
              background: b.bg, border: `1.5px solid ${b.border}`, color: b.color,
              display: 'flex', alignItems: 'center', gap: '10px',
              backdropFilter: 'blur(10px)',
              boxShadow: `0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)`
            }}>
              <span style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{b.icon}</span>{b.text}
            </div>
          ))}
        </div>

        {/* ── Studio Preview Frame ── */}
        <div ref={el => addSectionRef(el, 0)} style={{
          ...revealStyle(0),
          borderRadius: '24px', overflow: 'hidden',
          border: '1px solid rgba(26,32,64,0.15)',
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
          boxShadow: '0 30px 100px rgba(26,32,64,0.15), 0 10px 30px rgba(233,178,89,0.05)'
        }}>
          <div style={{ background: '#1A2040', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
              <span key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: c, boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)' }} />
            ))}
            <span style={{ marginLeft: '20px', fontSize: '0.8rem', fontWeight: 800, color: '#E9B259', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ✦ curricula.maxy.ai — Studio Preview
            </span>
          </div>
          <div style={{ padding: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(248,250,252,0.8) 100%)' }}>
            {[
              { role: '👑 CREATOR', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE', title: 'Technical Core & Architecture', desc: 'Deep system diagrams, annotated code patterns, and customizable prompt engineering templates.' },
              { role: '🎯 STUDENT', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', title: 'Interactive Sandbox & Quiz', desc: 'Step-by-step challenges, debugging checklists, reflection prompts, and gamified scoring.' },
              { role: '🎓 EDUCATOR', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', title: 'Facilitator Guide & Rubrics', desc: 'Timed session plans, ice-breaker activities, grading rubrics, and group discussion frameworks.' },
            ].map((card, i) => (
              <div key={i} style={{
                background: '#ffffff', padding: '24px', borderRadius: '16px',
                border: `1.5px solid rgba(26,32,64,0.08)`,
                boxShadow: '0 10px 30px rgba(26,32,64,0.04)',
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)'
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(26,32,64,0.12)'; e.currentTarget.style.borderColor = card.color; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(26,32,64,0.04)'; e.currentTarget.style.borderColor = 'rgba(26,32,64,0.08)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: card.color }} />
                <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', background: card.bg, fontSize: '0.68rem', fontWeight: 900, color: card.color, letterSpacing: '0.12em', marginBottom: '12px' }}>{card.role}</div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#1A2040', margin: '0 0 8px 0', lineHeight: 1.3 }}>{card.title}</h4>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, lineHeight: 1.6, fontWeight: 500 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES SECTION ── */}
      <div style={{ maxWidth: '1200px', margin: '80px auto 0 auto', padding: '0 32px' }}>
        <div ref={el => addSectionRef(el, 1)} style={{ ...revealStyle(1), textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#E9B259', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            ✦ ENGINEERED FOR EXCELLENCE
          </span>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', fontWeight: 900, color: '#0F172A', margin: '10px 0 0 0', lineHeight: 1.15 }}>
            Everything You Need to Build<br />
            <span style={{ background: 'linear-gradient(135deg, #E9B259, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              World-Class Curricula
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
          {features.map((f, i) => (
            <div key={i} ref={el => addSectionRef(el, i + 2)} style={{
              ...revealStyle(i + 2, i * 0.08),
              background: f.bg, border: `1.5px solid ${f.border}`, borderRadius: '20px', padding: '28px 24px',
              boxShadow: '0 4px 20px rgba(15,23,42,0.06)',
              cursor: 'default', transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(15,23,42,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(15,23,42,0.06)'; }}
            >
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: '#fff', border: `1.5px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: '16px', boxShadow: `0 4px 14px rgba(0,0,0,0.06)` }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 9px 0' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div ref={el => addSectionRef(el, 6)} style={{ ...revealStyle(6), maxWidth: '1200px', margin: '80px auto 0 auto', padding: '0 32px' }}>
        <div style={{
          borderRadius: '24px', padding: '44px 32px',
          background: 'linear-gradient(135deg, #1A2040 0%, #2D3561 60%, #4F46E5 100%)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '24px', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(45,53,97,0.25)'
        }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, marginBottom: '6px', color: s.color, textShadow: `0 0 24px ${s.color}88` }}>{s.num}</div>
              <div style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM CTA ── */}
      <div ref={el => addSectionRef(el, 7)} style={{ ...revealStyle(7), maxWidth: '1200px', margin: '80px auto 80px auto', padding: '0 32px', textAlign: 'center' }}>
        <div style={{
          borderRadius: '28px', padding: '64px 32px',
          background: '#FFFFFF', border: '1.5px solid #E2E8F0',
          boxShadow: '0 8px 60px rgba(15,23,42,0.08)',
          position: 'relative', overflow: 'hidden'
        }}>
          {/* Decorative art blobs inside CTA */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,178,89,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 3rem)', fontWeight: 900, color: '#0F172A', margin: '0 0 14px 0', lineHeight: 1.15, position: 'relative', zIndex: 1 }}>
            Ready to Redefine How<br />
            <span style={{ background: 'linear-gradient(135deg, #E9B259, #EF4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Curricula Gets Built?
            </span>
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#64748B', maxWidth: '520px', margin: '0 auto 36px auto', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
            Join top educators, instructional designers, and content creators building next-generation AI learning experiences.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <button
              style={{
                padding: '16px 44px', fontSize: '1.08rem', fontWeight: 900, borderRadius: '14px', cursor: 'pointer', border: 'none',
                background: 'linear-gradient(135deg, #2D3561 0%, #4F46E5 100%)',
                color: '#fff', boxShadow: '0 8px 30px rgba(45,53,97,0.3)',
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 16px 50px rgba(45,53,97,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(45,53,97,0.3)'; }}
              onClick={() => requireAuth('wizard', () => onNavigate('wizard'))}
            >
              🚀 Create Your Course For Free →
            </button>
            <button
              style={{
                padding: '16px 32px', fontSize: '1.05rem', fontWeight: 700, borderRadius: '14px', cursor: 'pointer',
                background: '#fff', border: '2px solid #E2E8F0', color: '#0F172A',
                transition: 'all 0.3s ease', boxShadow: '0 4px 16px rgba(15,23,42,0.06)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#E9B259'; e.currentTarget.style.color = '#D97706'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
              onClick={() => onNavigate('signup')}
            >
              🔑 Sign Up Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



export default function App() {
  // ── Navigation ──
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'home', 'courses', 'wizard', 'login', 'signup'

  const [currentStep, setCurrentStep] = useState('dashboard');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agentProgressStage, setAgentProgressStage] = useState(1); // 1: Tech, 2: Grounding, 3: Proposals, 4: Structure
  const [activeSidebarNav, setActiveSidebarNav] = useState('create'); // 'create', 'my_courses', 'drafts', 'docs', 'assets', 'templates', 'settings'

  // ── Browser History Integration (Fixes Chrome Back / Forward Blank Page Issue) ──
  const isPopStateRef = useRef(false);

  useEffect(() => {
    // Replace initial state on mount if null
    if (!window.history.state) {
      window.history.replaceState({ currentView: 'landing', currentStep: 'dashboard', sessionId: null }, '');
    }

    const handlePopState = (event) => {
      if (event.state) {
        isPopStateRef.current = true;
        if (event.state.currentView) setCurrentView(event.state.currentView);
        if (event.state.currentStep) setCurrentStep(event.state.currentStep);
        if (event.state.sessionId !== undefined) setSessionId(event.state.sessionId);
      } else {
        isPopStateRef.current = true;
        setCurrentView('landing');
        setCurrentStep('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isPopStateRef.current) {
      isPopStateRef.current = false;
      return;
    }
    const stateObj = { currentView, currentStep, sessionId };
    if (
      !window.history.state ||
      window.history.state.currentView !== currentView ||
      window.history.state.currentStep !== currentStep ||
      window.history.state.sessionId !== sessionId
    ) {
      window.history.pushState(stateObj, '', window.location.pathname + window.location.search);
    }
  }, [currentView, currentStep, sessionId]);

  // ── Toast Notification System ──
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  // ── Authentication State ──
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('curricula_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [showAuthModal, setShowAuthModal] = useState(null); // null, 'login', 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Creator');
  const [authLoading, setAuthLoading] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // ── Authentication Route Guard ──
  const requireAuth = (targetView, actionCallback) => {
    if (!currentUser) {
      toast.info("Please log in or create an account to access your workspace.");
      setCurrentView('login');
      return false;
    }
    if (actionCallback) actionCallback();
    else if (targetView) setCurrentView(targetView);
    return true;
  };

  // Greeting Logic
  const getGreeting = () => {
    const hr = new Date().getHours();
    const name = currentUser ? currentUser.name : 'Creator';
    if (hr < 12) return `Good morning, ${name}`;
    if (hr < 17) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };
  const greeting = getGreeting();

  const handleAuthSubmit = async (e, mode) => {
    e.preventDefault();
    if (!authEmail || !authPassword || (mode === 'signup' && !authName)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setAuthLoading(true);
    try {
      const endpoint = mode === 'login' ? `${MAXY_AUTH}/login` : `${MAXY_AUTH}/register`;
      const payload = mode === 'login'
        ? { email: authEmail, password: authPassword, client_app: 'web' }
        : { name: authName, email: authEmail, password: authPassword, client_app: 'web' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Authentication failed.");
      }

      // Maxy API returns {user, token} or similar
      const user = data.user || data.data?.user || { email: authEmail, name: authName || authEmail.split('@')[0] };
      const token = data.token || data.access_token || data.data?.token || '';
      const userData = { ...user, token };

      localStorage.setItem('curricula_user', JSON.stringify(userData));
      localStorage.setItem('maxy_token', token);
      setCurrentUser(userData);
      setCurrentView('home');
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
      toast.success(mode === 'login' ? `Welcome back, ${user.name || user.email}! 🎉` : `Account created! Welcome, ${user.name || authName}! 🚀`);
    } catch (err) {
      toast.error(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };


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
    { category: 'Software Engineering', title: 'Advanced Cloud Architecture', desc: 'Design scalable microservices with Docker, Kubernetes, and Go.', prompt: 'Design a 4-week advanced course on Cloud-Native Microservices Architecture with Go (8 lessons, 2 per week) for senior backend engineers. Use Go (Golang), Docker, Kubernetes, and gRPC. For each lesson provide: title, learning objectives, lecture outline, hands-on coding lab, and a short quiz. Cover concurrent channel structures, distributed tracing, API gateways, circuit breakers, and container orchestration. End with a final project: deploying a resilient, concurrent multi-service backend with gRPC communication on a local Kubernetes cluster, including a rubric and submission checklist.' },
    { category: 'Artificial Intelligence', title: 'AI & Machine Learning', desc: 'Train neural networks and computer vision models using PyTorch.', prompt: 'Design a 3-week intermediate course on Deep Learning and Computer Vision (6 lessons, 2 per week) for data scientists. Use Python, PyTorch, OpenCV, and Jupyter Notebooks. For each lesson provide: title, learning objectives, lecture outline, hands-on Jupyter coding lab, and a short quiz. Cover backpropagation, convolutional neural networks (CNNs), transfer learning, and object detection frameworks like YOLO. End with a final project: building and training a custom CNN image classifier for autonomous vehicle sign recognition.' },
    { category: 'Cybersecurity', title: 'Offensive Cybersecurity', desc: 'Master penetration testing, exploit development, and network defense.', prompt: 'Design a 2-week intensive course on Offensive Cybersecurity and Penetration Testing (4 lessons) for security analysts. Use Kali Linux, Metasploit, Wireshark, and Python scripting. For each lesson provide: title, learning objectives, lecture outline, hands-on ethical hacking lab, and a short quiz. Cover network reconnaissance, vulnerability scanning, privilege escalation, and crafting custom Python exploits. End with a final project: conducting a simulated penetration test on a vulnerable lab environment and writing a professional security audit report.' },
    { category: 'Artificial Intelligence', title: 'Generative AI in Education', desc: 'Implement LLMs in classrooms safely and effectively.', prompt: 'Design a 4-week advanced course on Generative AI Integration in Modern School Education Systems (8 lessons) for school administrators and curriculum designers. Use ChatGPT, Midjourney, and LMS plugins. Cover AI ethics, prompt engineering for educators, student assessment automation, and plagiarism detection. For each lesson provide: title, learning objectives, lecture outline, hands-on lab on prompt design, and a short quiz. End with a final project: creating a fully AI-assisted school curriculum blueprint.' },
    { category: 'Data Science', title: 'Data Analysis with Pandas', desc: 'Wrangle, clean, and visualize complex datasets in Python.', prompt: 'Design a 2-week practical course on Data Analysis and Wrangling with Python Pandas (4 lessons) for business analysts. Use Python, Pandas, Matplotlib, and Jupyter. Cover data cleaning, merging dataframes, handling missing values, and time-series analysis. For each lesson provide: title, learning objectives, lecture outline, hands-on lab with real CSV datasets, and a short quiz. End with a final project: performing exploratory data analysis (EDA) on a messy financial dataset to extract actionable business insights.' },
    { category: 'Digital Transformation', title: 'Cloud Computing Migration', desc: 'Shift legacy infrastructure to AWS and Azure securely.', prompt: 'Design a 4-week enterprise course on Cloud Computing Migration Strategies (8 lessons) for IT infrastructure managers and solutions architects. Use AWS Migration Hub, Azure Migrate, and Docker. Cover on-premise assessment, lift-and-shift vs refactoring, security compliance, and cost optimization. For each lesson provide: title, learning objectives, lecture outline, hands-on lab simulating a server migration, and a short quiz. End with a final project: architecting a comprehensive migration plan for a legacy monolithic application to a highly available cloud environment.' },
    { category: 'Digital Transformation', title: 'Agile Leadership', desc: 'Modern software delivery frameworks and team dynamics.', prompt: 'Design a 2-week advanced course on Agile Project Management and Engineering Leadership (4 lessons) for engineering managers and scrum masters. Use Jira, Confluence, and Miro. Cover servant leadership, sprint planning, resolving team conflicts, and measuring velocity metrics. For each lesson provide: title, learning objectives, lecture outline, hands-on roleplay scenario lab, and a short quiz. End with a final project: developing an Agile transformation roadmap for a dysfunctional engineering team.' },
    { category: 'Education Technology', title: 'Gamified Learning Design', desc: 'Design interactive rewards and pathways for student retention.', prompt: 'Design a 3-week creative course on Gamification Design for Student Learning Systems (6 lessons) for educational technologists and UI/UX designers. Use Figma, Kahoot, and Unity (basic). Cover motivation theory, points/badges/leaderboards (PBL), narrative design, and adaptive difficulty. For each lesson provide: title, learning objectives, lecture outline, hands-on lab prototyping a gamified UI, and a short quiz. End with a final project: designing a gamified learning pathway prototype for a middle-school science app.' },
    { category: 'Software Engineering', title: 'Next.js 15 Foundations', desc: 'Server components, server actions, and layout routing.', prompt: 'Design a 2-week modern web course on Next.js 15 App Router and Server Actions Development (4 lessons) for frontend React developers. Use Next.js 15, React 19, TailwindCSS, and Vercel. Cover server components, server actions, nested layouts, data fetching, and caching strategies. For each lesson provide: title, learning objectives, lecture outline, hands-on lab building a dynamic route, and a short quiz. End with a final project: building a full-stack e-commerce storefront with server actions for cart mutations and seamless optimistic UI updates.' }
  ];

  const suggestedPrompts = [
    { title: 'AI Software Pipeline', desc: 'Design a 2-week intermediate course on Agentic SDLC Pipelines (4 lessons) for engineers.', prompt: 'Design a 2-week intermediate course on Agentic Software Development Life Cycle (SDLC) Pipelines (4 lessons, 2 per week) for software engineers and QA specialists interested in AI-driven automation. Use AI orchestration tools, pipeline automation frameworks, and quality metrics analysis techniques. For each lesson provide: title, learning objectives, lecture outline, hands-on lab, and a short quiz. Cover multi-agent systems, specification enrichment, continuous integration, and evaluation metrics like Cohen’s kappa. End with a final project: build an autonomous SDLC pipeline prototype using open-source AI agents, with a rubric and submission checklist.' },
    { title: 'Pediatric Gene Expression', desc: 'Design a 2-week intermediate biomedical research course (4 lessons) for researchers.', prompt: 'Design a 2-week intermediate biomedical research course on Pediatric Cellular Mapping and Gene Expression Research (4 lessons, 2 per week) for biomedical researchers and bioinformaticians. Use genomics databases, bioinformatics tools, AI analytics platforms, and data curation software. For each lesson provide: title, learning objectives, lecture outline, hands-on lab analyzing pediatric gene expression data, and a short quiz. Cover genomics, bioinformatics, data curation, AI analytics, interdisciplinary collaboration, and precision medicine. End with a final project: creating a pediatric gene expression analysis report using real datasets and AI tools, with rubric and submission checklist.' },
    { title: 'Microlearning Design', desc: 'Design a 2-week intermediate Retention-Focused Microlearning Design course (4 lessons).', prompt: 'Design a 2-week intermediate Retention-Focused Microlearning Design course (4 lessons, 2 per week) for instructional designers and L&D specialists. Use AI content generation tools like ChatGPT, adaptive learning platforms such as EdApp, and learning analytics software like Watershed. For each lesson provide: title, learning objectives, lecture outline, hands-on lab creating retrieval-based micro-lessons, and a short quiz. Cover cognitive science principles, retrieval practice, spaced repetition, adaptive scheduling, and engagement mechanics. End with a final project: develop an AI-powered microlearning module with spaced retrieval practice, including a rubric and submission checklist.' },
  ];

  // ── Context & Config ──
  const DEFAULT_CANDIDATE_TAGS = [];
  const [techTags, setTechTags] = useState([]);
  const [allSuggestedTags, setAllSuggestedTags] = useState([]);
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
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  // Computes active attached file name from state or subjectContext header
  const activeFileName = uploadedFileName || pendingFile?.name || (() => {
    if (subjectContext) {
      const match = subjectContext.match(/Context from Uploaded File \(([^)]+)\)/);
      if (match) return match[1];
    }
    return '';
  })();

  const handleRemoveAttachedFile = async () => {
    setPendingFile(null);
    setUploadedFileName('');
    if (sessionId) {
      try {
        await fetch(`${API_BASE}/sessions/${sessionId}/documents`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete document from session:', err);
      }
    }
  };
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
  const [lastSavedConfigHash, setLastSavedConfigHash] = useState(null);

  // ── Structure ──
  const [structure, setStructure] = useState([]);
  const [activeStructureRole, setActiveStructureRole] = useState('creator');
  const [selectedStructureLessonId, setSelectedStructureLessonId] = useState(null);
  const [draggingIdx, setDraggingIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionInstruction, setNewSectionInstruction] = useState('');
  const [newSectionRole, setNewSectionRole] = useState('creator');

  // ── Modals & Popups ──
  const [deleteTargetSession, setDeleteTargetSession] = useState(null);

  // ── Prompt Dropdown States ──
  const [isPromptExpandedStep5, setIsPromptExpandedStep5] = useState(false);
  const [isPromptExpandedStep6, setIsPromptExpandedStep6] = useState(false);
  const [isPromptExpandedStep7, setIsPromptExpandedStep7] = useState(false);

  // ── Generation ──
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [currentGeneratingLessonIdx, setCurrentGeneratingLessonIdx] = useState(0);

  // ── Generated Course ──
  const [courseData, setCourseData] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeRole, setActiveRole] = useState('creator');
  const [openPov, setOpenPov] = useState('creator');
  const [activeSubSection, setActiveSubSection] = useState('overview');
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfSearchQuery, setPdfSearchQuery] = useState('');
  const [isPdfSearchOpen, setIsPdfSearchOpen] = useState(false);

  // ── PPT Generation ──
  const [isPptxPage, setIsPptxPage] = useState(false);
  const [pptxDataByLesson, setPptxDataByLesson] = useState({});
  const [activePptxLessonId, setActivePptxLessonId] = useState(null);
  const [pptxLayout, setPptxLayout] = useState('layout_1');
  const [pptxSlideIndex, setPptxSlideIndex] = useState(0);
  const [pptxLoading, setPptxLoading] = useState(false);
  const [pptxBrandColors, setPptxBrandColors] = useState({ primary: '#1a202c', accent: '#d69e2e' });

  // Helper to get current lesson's PPT data
  const pptxData = activePptxLessonId ? pptxDataByLesson[activePptxLessonId] : null;
  const currentPptxSlides = pptxData?.layouts?.[pptxLayout]?.slides || [];
  const currentPptxSlide = currentPptxSlides[pptxSlideIndex] || null;

  useEffect(() => {
    let isMounted = true;
    if (currentStep === 'generated' && sessionId) {
      let fetchUrl = `${API_BASE}/courses/${sessionId}/export?format=pdf&role=${activeRole.toLowerCase()}`;
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

  // ── Phase 3: Interactive Course & AI Toolbar ──
  const [sectionLoading, setSectionLoading] = useState({});
  const [editingSection, setEditingSection] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isAIWandOpen, setIsAIWandOpen] = useState(false);
  const [isWandProcessing, setIsWandProcessing] = useState(false);

  // ── Phase 4: Export Hub & Versioning states ──
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
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

  const mergeSections = (lessonSections) => {
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
        toast.error('AI Action failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error running AI Action.');
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  const handleSaveManualEdit = async (sectionType, newContent) => {
    const curLesson = courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.find(l => l.id === activeLessonId) || courseData?.lessons?.[0];
    const targetLessonId = curLesson?.id || activeLessonId;
    if (!targetLessonId) {
      toast.error('Target lesson tidak ditemukan.');
      return;
    }
    setSectionLoading(prev => ({ ...prev, [sectionType]: true }));
    try {
      const res = await fetch(`${API_BASE}/lessons/${targetLessonId}/sections/save`, {
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
        let updatedVal;
        try {
          updatedVal = JSON.parse(data.content);
        } catch {
          updatedVal = data.content;
        }
        
        // Update courseData local state
        const updatedCourse = { ...courseData };
        if (!updatedCourse.lessons) updatedCourse.lessons = [];
        const lIdx = updatedCourse.lessons.findIndex(l => l.id === targetLessonId);
        if (lIdx !== -1) {
          if (!updatedCourse.lessons[lIdx].sections) updatedCourse.lessons[lIdx].sections = {};
          if (!updatedCourse.lessons[lIdx].sections[activeRole]) updatedCourse.lessons[lIdx].sections[activeRole] = {};
          updatedCourse.lessons[lIdx].sections[activeRole][sectionType] = updatedVal;
          setCourseData(updatedCourse);
        }
        setEditingSection(null);
        setEditingText('');
        toast.success(`Perubahan ${sectionType.replace(/_/g, ' ')} berhasil disimpan!`, 3000);
      } else {
        toast.error('Gagal menyimpan perubahan materi.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saat menyimpan perubahan materi.');
    } finally {
      setSectionLoading(prev => ({ ...prev, [sectionType]: false }));
    }
  };

  // Helper to check if editing/AI actions are allowed during generation
  const checkCanEdit = (actionName = 'Edit') => {
    if (generationProgress < 100) {
      toast.warning(`Generating: Harap tunggu sampai proses pembuatan materi selesai (100%) sebelum melakukan ${actionName}.`);
      return false;
    }
    return true;
  };

  // ── Phase 4: History & Export Handlers ──
  const fetchHistory = async () => {
    if (!checkCanEdit('melihat History')) return;
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
    if (!checkCanEdit('Restore History')) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history/${historyId}/restore`, {
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
        
        // Find which lesson, role, and sectionType was restored from historyList
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

  const handleExport = () => {
    if (!courseData) return;
    const title = courseData.title || 'Course_Curriculum';
    const roleText = activeRole.toLowerCase();
    const cleanTitle = title.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_') || 'Course';
    const ext = exportFormat === 'zip' ? 'zip' : exportFormat === 'docx' ? 'docx' : exportFormat === 'html' ? 'html' : exportFormat === 'md' ? 'md' : 'pdf';
    const fileName = `${cleanTitle}_${roleText}.${ext}`;
    setIsExporting(true);

    if (sessionId) {
      let downloadUrl = `${API_BASE}/courses/${sessionId}/export/${fileName}?format=${exportFormat}&role=${roleText}&disposition=attachment`;
      if (activeLessonId && exportFormat !== 'zip') {
        downloadUrl += `&lesson_id=${activeLessonId}`;
      }
      
      // Direct native browser HTTP download bypasses Windows/Edge Blob URL sandbox restriction
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

    // Local fallback if offline or no sessionId
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

  // ── PPT Generation Handlers (per-lesson) ──
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

  // Keep old handlers for backward compat (if needed)
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
        // Store for all lessons (backward compat)
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

  // ── Phase 5: Knowledge Base File Upload Handlers ──
  const fileInputRef = useRef(null);

  const handleFileUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Called when file is picked on home screen — just store it, don't navigate yet
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (activeFileName) {
      const confirmReplace = window.confirm(`Replacing attached document "${activeFileName}" with "${file.name}". Continue?`);
      if (!confirmReplace) {
        event.target.value = '';
        return;
      }
    }
    setPendingFile(file);
    setUploadedFileName(file.name);
    // Reset input so the same file can be re-selected if needed
    event.target.value = '';
  };

  // Called when a session already exists (wizard context step) — upload immediately
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (uploadedFileName) {
      const confirmReplace = window.confirm(`Replacing attached document "${uploadedFileName}" with "${file.name}". Continue?`);
      if (!confirmReplace) {
        event.target.value = '';
        return;
      }
    }

    setIsLoading(true);
    try {
      if (!sessionId) return;
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API_BASE}/sessions/${sessionId}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        setUploadedFileName(uploadData.filename || file.name);
        toast.success(`Successfully uploaded reference document: ${file.name}`);
      } else {
        toast.error('Failed to upload document.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error uploading document.');
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  // Upload pending file (from home screen) to an already-created session
  const uploadPendingFile = async (sessId) => {
    if (!pendingFile || !sessId) return;
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      const uploadRes = await fetch(`${API_BASE}/sessions/${sessId}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        setSubjectContext(uploadData.subject_context);
        setUploadedFileName(uploadData.filename || pendingFile.name);
      }
    } catch (err) {
      console.error('Failed to upload pending file:', err);
    } finally {
      setPendingFile(null);
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
            <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Regenerate')) return; handleAIAction(sectionType, 'regenerate'); }}>🔄 Regenerate</button>
            <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Rewrite')) return; handleAIAction(sectionType, 'rewrite'); }}>✍️ Rewrite</button>
            <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Expand')) return; handleAIAction(sectionType, 'expand'); }}>➕ Expand</button>
            <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Shorten')) return; handleAIAction(sectionType, 'shorten'); }}>➖ Shorten</button>
            <button className="ai-pill-btn" onClick={() => { if (!checkCanEdit('AI Simplify')) return; handleAIAction(sectionType, 'simplify'); }}>💡 Simplify</button>
            
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
                  if (!checkCanEdit('mengedit bagian ini')) return;
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

  const renderCustomSections = () => {
    const curLesson = courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.[0];
    const curSecs = curLesson?.sections?.[activeRole] || {};
    
    // Find the custom sections from the structure state
    const structLesson = structure.find(l => l.id === curLesson?.id || l.title === curLesson?.title);
    const customSecList = structLesson?.sections?.[activeRole]?.filter(s => !s.locked) || [];
    
    return customSecList.map((sec) => {
      const secContent = curSecs[sec.type] || `Content for ${sec.title} is not generated yet.`;
      const isEditing = editingSection === sec.type;
      
      return (
        <div key={sec.type} id={`step7-sec-${sec.type}`} className="content-block" style={{ scrollMarginTop: '110px' }}>
          <h3 style={{ marginBottom: '10px' }}>{sec.title}</h3>
          {isEditing ? (
            <textarea 
              className="prompt-textarea" 
              style={{ minHeight: '150px' }} 
              value={editingText} 
              onChange={(e) => setEditingText(e.target.value)} 
            />
          ) : (
            <ContentRenderer text={typeof secContent === 'string' ? secContent : JSON.stringify(secContent, null, 2)} />
          )}
          {renderAIActionBar(sec.type, secContent)}
        </div>
      );
    });
  };

  const renderQuizManager = () => {
    const quizzes = activeLessonContent.quizzes || [];
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
          if (sessData.status === 'completed' || data.status === 'completed' || sessData.step === 'generated') {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            setCourseData(sessData);
            if (sessData.lessons?.length > 0) setActiveLessonId(sessData.lessons[0].id);
            setGenerationProgress(100);
            setGenerationStatusText('Generation completed! Review and edit your content below.');
            toast.success("Generation completed! Review & edit your course material below, or click 'Proceed to Assets' when ready.");
            fetchSessions();
          } else if (sessData.status === 'error' || data.status === 'error') {
            if (eventSource) eventSource.close();
            if (fallbackInterval) clearInterval(fallbackInterval);
            toast.error(sessData.status_text || data.status_text);
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
    const handleScrollSpy = () => {
      const sectionElements = Array.from(document.querySelectorAll('[id^="step7-sec-"]'));
      if (!sectionElements.length) return;

      const scrollPos = window.scrollY + 220;
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const el = sectionElements[i];
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (scrollPos >= top) {
          const secId = el.id.replace('step7-sec-', '');
          setActiveSubSection(secId);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    handleScrollSpy();

    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [currentStep, activeRole, currentGeneratingLessonIdx]);

  // ── IntersectionObserver for Section Titles Animation ──
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.2 }
    );

    const titleElements = document.querySelectorAll('.elice-section-title');
    titleElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [currentView, currentStep, showMyCourses]);


  // ── Agent Auto-Workflow Orchestrator ──
  const runAgentPipeline = async (sessId, sessionObj) => {
    try {
      // 1. Technical Foundations completed. Move to Stage 2: Educational Grounding.
      setAgentProgressStage(2);

      const subjCtx = sessionObj?.subject_context || subjectContext || '';
      const numLessons = sessionObj?.config?.lessons_count || configLessons || 5;
      const durMins = sessionObj?.config?.duration || configDuration || 60;
      const diffLvl = sessionObj?.config?.difficulty || configDifficulty || 'Beginner';
      const audTarget = sessionObj?.config?.target_audience || configAudience || 'Student';

      // Save Config & Generate proposals
      await fetch(`${API_BASE}/courses/sessions/${sessId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessons_count: numLessons,
          duration: durMins,
          difficulty: diffLvl,
          target_audience: audTarget,
          subject_context: subjCtx,
          tech_tags: techTags
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
        sections: mergeSections(lesson.sections)
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
      toast.error('Agent pipeline failed: ' + err.message);
      setCurrentStep('context'); // Fallback to manual if agent fails
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 1: Create Session ──
  const handleStartSession = async (promptVal) => {
    const textToSubmit = promptVal || promptText;
    if (!textToSubmit.trim()) {
      toast.warning('Please enter a course topic/prompt first.');
      return;
    }
    setIsLoading(true);
    setAgentProgressStage(1);
    // Reset old session state to prevent state leaking between courses
    setProposals([]);
    setSelectedProposalId(null);
    setStructure([]);
    setCourseData(null);
    setPrerequisites([]);
    setBoundaries([]);
    setLearningOutcomes([]);
    setUploadedFileName('');
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
        setAllSuggestedTags(data.all_suggested_tags || loadedTech);
        setConfigLessons(data.config?.lessons_count || 5);
        setConfigDuration(data.config?.duration || 60);
        setConfigDifficulty(data.config?.difficulty || 'Beginner');
        setConfigAudience(data.config?.target_audience || 'Student');
        setSubjectContext(data.subject_context || '');
        const initialConfigHash = JSON.stringify({
          techTags: loadedTech,
          configDifficulty: data.config?.difficulty || 'Beginner',
          configAudience: data.config?.target_audience || 'Student',
          configLessons: data.config?.lessons_count || 5,
          configDuration: data.config?.duration || 60,
          subjectContext: data.subject_context || '',
        });
        setLastSavedConfigHash(initialConfigHash);
        setCurrentView('wizard');
        fetchSessions();

        // If a file was attached on home screen, upload it now after session is created
        await uploadPendingFile(data.session_id);

        if (isAgentMode === 'agent') {
          await runAgentPipeline(data.session_id, data);
        } else {
          setCurrentStep('context');
          setIsLoading(false);
        }
      } else {
        toast.error('Failed to start session.');
        setIsLoading(false);
      }
    } catch {
      toast.error('Error contacting API server. Is the backend running?');
      setIsLoading(false);
    }
  };

  // ── Step 2: Save Config & Proceed to Grounding (Auto-updates Step 3 when Config changes) ──
  const handleGenerateProposals = async () => {
    setIsLoading(true);
    const currentConfigHash = JSON.stringify({
      techTags,
      configDifficulty,
      configAudience,
      configLessons,
      configDuration,
      subjectContext,
    });

    try {
      if (sessionId) {
        await fetch(`${API_BASE}/courses/sessions/${sessionId}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessons_count: configLessons,
            duration: configDuration,
            difficulty: configDifficulty,
            target_audience: configAudience,
            subject_context: subjectContext,
            tech_tags: techTags,
          }),
        });

        // If user CHANGED anything in Step 2, refresh Grounding in Step 3 to match the new config!
        if (lastSavedConfigHash !== null && lastSavedConfigHash !== currentConfigHash) {
          const refreshRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding/refresh`, {
            method: 'POST'
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            setPrerequisites(refreshData.prerequisites || []);
            setBoundaries(refreshData.out_of_scope || []);
            setLearningOutcomes(refreshData.learning_outcomes || []);
            // Invalidate downstream proposals so they match the newly updated config
            setProposals([]);
            setStructure([]);
            setSelectedProposalId(null);
          }
        }
      }
      setLastSavedConfigHash(currentConfigHash);
      setCurrentStep('grounding');
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Save Grounding & Proceed to Proposals ──
  const handleSaveGrounding = async () => {
    setIsLoading(true);
    try {
      if (sessionId) {
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
        if (!res.ok) {
          console.warn('Failed to save grounding data to backend.');
        }
      }

      // If proposals haven't been generated yet, generate them once
      if (proposals.length === 0 && sessionId) {
        const genRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/generate`, {
          method: 'POST',
        });
        if (genRes.ok) {
          const genData = await genRes.json();
          setProposals(genData.proposals || []);
        } else {
          toast.warning('Grounding saved, but failed to generate proposals.');
        }
      }
      setCurrentStep('proposal');
    } catch (err) {
      console.error('Error saving grounding:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Specific Button Loading State ──
  const [loadingField, setLoadingField] = useState(null);

  // ── Step 3 AI Auto-Suggest for Grounding Fields ──
  const handleAutoSuggestGrounding = async (field, currentList, setter) => {
    setLoadingField(field);
    try {
      const res = await fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_type: field,
          existing_items: (currentList || []).filter(Boolean)
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          const newList = [...currentList, data.suggestion];
          setter(newList);
          if (sessionId) {
            fetch(`${API_BASE}/courses/sessions/${sessionId}/grounding`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tech_tags: techTags,
                prerequisites: field === 'prerequisites' ? newList : prerequisites,
                out_of_scope: field === 'out_of_scope' ? newList : boundaries,
                learning_outcomes: field === 'learning_outcomes' ? newList : learningOutcomes,
                target_audience: configAudience,
              })
            }).catch(err => console.warn('Auto-save grounding notice:', err));
          }
        }
      } else {
        toast.error('Failed to generate suggestions.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingField(null);
    }
  };

  // ── Step 4: Select Proposal ──
  const handleSelectProposal = async (propId) => {
    // If this proposal is already selected and structure has already been customized, preserve the structure!
    if (selectedProposalId === propId && structure.length > 0) {
      setCurrentStep('structure');
      return;
    }
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
          sections: mergeSections(lesson.sections)
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
      if (sessionId && structure && structure.length > 0) {
        // Guarantee latest structure and custom sections are saved in DB before generation begins
        await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessons: structure })
        }).catch(err => console.warn('Pre-generation structure save notice:', err));
      }
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

  // ── Jump to Review background setup ──
  const handleJumpToReview = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      // 1. Save Config
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

      // 2. Generate Proposals
      const propRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/generate`, {
        method: 'POST',
      });
      if (!propRes.ok) throw new Error('Failed to generate proposals');
      const propData = await propRes.json();
      const firstProposalId = propData.proposals?.[0]?.id || 1;

      // 3. Select Proposal & Generate Structure
      const selRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/proposals/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_proposal_id: firstProposalId })
      });
      if (!selRes.ok) throw new Error('Failed to select proposal');
      const selData = await selRes.json();

      // 4. Save Structure
      const structRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons: selData.structure || [] })
      });
      if (!structRes.ok) throw new Error('Failed to save structure');

      // Fetch fresh session details to local state
      const sessRes = await fetch(`${API_BASE}/courses/sessions/${sessionId}`);
      if (sessRes.ok) {
        const fullSess = await sessRes.json();
        setPrerequisites(fullSess.prerequisites || []);
        setBoundaries(fullSess.out_of_scope || []);
        setLearningOutcomes(fullSess.learning_outcomes || []);
        setProposals(fullSess.proposals || []);
        setSelectedProposalId(fullSess.selected_proposal_id);
        const newStruct = (fullSess.structure || []).map(lesson => ({
          ...lesson,
          sections: mergeSections(lesson.sections)
        }));
        setStructure(newStruct);
      }

      setCurrentStep('review');
    } catch (err) {
      console.error(err);
      alert('Failed to quickly prepare review: ' + err.message);
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
        setUploadedFileName(data.document_filename || '');
        setPrerequisites(data.prerequisites || []);
        setBoundaries(data.out_of_scope || []);
        setLearningOutcomes(data.learning_outcomes || []);
        setProposals(data.proposals || []);
        setSelectedProposalId(data.selected_proposal_id || null);
        const newStruct = (data.structure || []).map(lesson => ({
          ...lesson,
          sections: mergeSections(lesson.sections)
        }));
        setStructure(newStruct);
        if (newStruct.length > 0) {
          setSelectedStructureLessonId(newStruct[0].id);
        }
        if (data.pptx_by_lesson) {
          setPptxDataByLesson(data.pptx_by_lesson);
        }
        setLastSavedConfigHash(JSON.stringify({
          techTags: loadedTech,
          configDifficulty: data.config?.difficulty || 'Beginner',
          configAudience: data.config?.target_audience || 'Student',
          configLessons: data.config?.lessons_count || 5,
          configDuration: data.config?.duration || 60,
          subjectContext: data.subject_context || '',
        }));

        if (data.status === 'completed' && data.lessons?.length > 0) {
          setCourseData(data);
          setActiveLessonId(data.lessons[0].id);
          setCurrentStep('generated');
        } else if (data.status === 'generating' || data.status === 'queued') {
          setGenerationProgress(data.progress || 5);
          setGenerationStatusText(data.status_text || 'Resuming generation...');
          setCurrentStep('generating');
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
          sections: mergeSections(lesson.sections)
        }));
        setStructure(newStruct);
        if (data.pptx_by_lesson) {
          setPptxDataByLesson(data.pptx_by_lesson);
        }
      }
    } catch (err) {
      console.error("Failed to sync session state:", err);
    }
  }, [sessionId]);



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
      sections: JSON.parse(JSON.stringify(mergeSections(target.sections)))
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
      {/* Floating Toast Notification Container (Positioned safely below navbar) */}
      <div className="toast-container" style={{ position: 'fixed', top: '85px', right: '24px', zIndex: 99999, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.type}`} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => removeToast(t.id)}>
            <span style={{ fontSize: '1.1rem' }}>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={currentStep === 'dashboard' ? handleFileSelect : handleFileUpload} 
        style={{ display: 'none' }} 
        accept=".pdf,.docx,.txt" 
      />
      {/* ── Top Header Navigation ── */}
      <div className="top-header">
        <div className="header-logo-area" onClick={() => currentUser ? setCurrentView('home') : setCurrentView('landing')} style={{ cursor: 'pointer' }}>
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
            className={`header-tab-btn ${currentView === 'landing' ? 'active' : ''}`}
            onClick={() => setCurrentView('landing')}
          >
            Overview
          </button>
          <button 
            className={`header-tab-btn ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => requireAuth('home', () => { setCurrentView('home'); setShowMyCourses(false); })}
          >
            Home
          </button>
          <button 
            className={`header-tab-btn ${currentView === 'courses' ? 'active' : ''}`}
            onClick={() => requireAuth('courses', () => { setCurrentView('courses'); setShowMyCourses(true); fetchSessions(); })}
          >
            Courses
          </button>
        </div>

        <div className="header-actions">
          <button 
            className="header-create-btn"
            onClick={() => requireAuth('wizard', () => { setCurrentView('wizard'); setCurrentStep('dashboard'); setShowMyCourses(false); setSessionId(null); setPromptText(''); setProposals([]); setStructure([]); setCourseData(null); setUploadedFileName(''); setPendingFile(null); setSubjectContext(''); })}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Create</span>
          </button>

          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <div 
                className="profile-avatar-circle" 
                style={{ cursor: 'pointer', background: 'var(--navy)', color: 'var(--gold)', fontWeight: 800, border: '2px solid var(--gold)' }} 
                title={currentUser.name}
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {showUserDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '48px', background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', boxShadow: 'var(--shadow-lg)', minWidth: '220px', zIndex: 9999 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--navy)', marginBottom: '2px' }}>{currentUser.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{currentUser.email}</div>
                  <div style={{ fontSize: '0.72rem', background: '#F1F5F9', color: 'var(--blue)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: 700, marginBottom: '10px' }}>
                    Role: {currentUser.role || 'Creator'}
                  </div>
                  <div style={{ height: '1px', background: 'var(--border-color)', marginBottom: '10px' }} />
                  <button 
                    style={{ width: '100%', padding: '7px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: 'var(--radius-sm)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                    onClick={() => {
                      localStorage.removeItem('curricula_user');
                      setCurrentUser(null);
                      setShowUserDropdown(false);
                      setCurrentView('landing');
                      toast.info("Logged out successfully.");
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.86rem', fontWeight: 800, borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
              onClick={() => setCurrentView('login')}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div
        key={currentView}
        className={`main-content page-transition ${currentView === 'landing' ? 'landing-mode' : ''}`}
      >


        {/* ── Cinematic Landing Page ── */}
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={(view) => {
              if (view === 'wizard') { setCurrentView('wizard'); setCurrentStep('dashboard'); setSessionId(null); setProposals([]); setStructure([]); setCourseData(null); }
              else setCurrentView(view);
            }}
            requireAuth={requireAuth}
          />
        )}



        {/* ── Standalone Login & Sign Up Split Page View ── */}
        {(currentView === 'login' || currentView === 'signup') && (
          <div style={{ minHeight: 'calc(100vh - 110px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 20px', background: 'var(--surface-1)' }}>
            <div style={{ width: '100%', maxWidth: '960px', background: 'var(--white)', borderRadius: '28px', border: '1.5px solid var(--border-color)', boxShadow: '0 20px 40px rgba(15,23,42,0.08)', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
              
              {/* Left Brand Showcase Banner */}
              <div style={{ background: 'linear-gradient(135deg, #1A2040 0%, #2D3561 60%, #111827 100%)', padding: '48px 40px', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,178,89,0.2) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />
                
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.15)', marginBottom: '32px' }}>
                    <img src="/m-logo.png" alt="Maxy" width="26" height="26" style={{ borderRadius: '6px' }} />
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#E9B259', letterSpacing: '0.05em' }}>MAXY CURRICULA AI</span>
                  </div>

                  <h2 style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: '16px', color: '#FFFFFF' }}>
                    {currentView === 'login' ? 'Welcome Back to Your Course Studio' : 'Transform Any Topic into World-Class AI Curricula'}
                  </h2>
                  
                  <p style={{ fontSize: '0.94rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: '32px' }}>
                    Generate multi-POV educational materials, exercises, sandbox quizzes, and facilitator guides in seconds.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(233,178,89,0.2)', color: '#E9B259', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>
                      <span>3-Role Content Engine (Creator, Student, Educator)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(233,178,89,0.2)', color: '#E9B259', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>
                      <span>PDF, Word, Markdown & HTML Full Export</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(233,178,89,0.2)', color: '#E9B259', fontSize: '0.75rem', fontWeight: 900 }}>✓</span>
                      <span>Document Grounding (PDF / DOCX / TXT)</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', padding: '16px 20px', borderRadius: '16px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                  "Engineered for top educators and content creators to build structured curriculum at 10x speed."
                </div>
              </div>

              {/* Right Form Column */}
              <div style={{ padding: '44px 38px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                
                {/* View Switcher Tabs */}
                <div style={{ display: 'flex', background: 'var(--surface-2)', padding: '4px', borderRadius: 'var(--radius-lg)', marginBottom: '30px', border: '1px solid var(--border-color)' }}>
                  <button 
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 'var(--radius-md)', background: currentView === 'login' ? 'var(--white)' : 'transparent', color: currentView === 'login' ? 'var(--navy)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: currentView === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s ease' }}
                    onClick={() => setCurrentView('login')}
                  >
                    Sign In
                  </button>
                  <button 
                    style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 'var(--radius-md)', background: currentView === 'signup' ? 'var(--white)' : 'transparent', color: currentView === 'signup' ? 'var(--navy)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', boxShadow: currentView === 'signup' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', transition: 'all 0.2s ease' }}
                    onClick={() => setCurrentView('signup')}
                  >
                    Create Account
                  </button>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy)', margin: '0 0 6px 0' }}>
                    {currentView === 'login' ? 'Log In to Workspace' : 'Get Started for Free'}
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
                    {currentView === 'login' ? 'Enter your credentials to access your AI course projects.' : 'Fill in your details below to set up your creator profile.'}
                  </p>
                </div>

                <form onSubmit={(e) => handleAuthSubmit(e, currentView)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {currentView === 'signup' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Full Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Alex Morgan"
                        value={authName}
                        onChange={e => setAuthName(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showAuthPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px 42px 12px 16px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' }}
                        required
                      />
                      <button 
                        type="button"
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
                        onClick={() => setShowAuthPassword(!showAuthPassword)}
                        title={showAuthPassword ? "Hide password" : "Show password"}
                      >
                        {showAuthPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {currentView === 'signup' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '6px' }}>Primary Role</label>
                      <select 
                        value={authRole}
                        onChange={e => setAuthRole(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.92rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                      >
                        <option value="Creator">Content Creator</option>
                        <option value="Educator">Educator / Teacher</option>
                        <option value="Student">Student / Learner</option>
                      </select>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="btn-navy"
                    disabled={authLoading}
                    style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.98rem', cursor: 'pointer', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-md)' }}
                  >
                    {authLoading ? <IconSpinner /> : (currentView === 'login' ? 'Sign In to Workspace' : 'Create Account')}
                  </button>
                </form>

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  <button 
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setCurrentView('landing')}
                  >
                    ← Back to Home
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

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
                              >
                                <div className="card-top">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span className="card-tag" style={{ background: '#fef3c7', color: '#b45309' }}>📝 DRAFT</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
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
                                        <IconTrash style={{ pointerEvents: 'none' }} />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 
                                    className="card-title" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleResumeSession(sess)}
                                  >
                                    {sess.title || sess.prompt}
                                  </h3>
                                  
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
                                  <button 
                                    className="action-btn" 
                                    onClick={() => handleResumeSession(sess)}
                                    style={{ width: '100%', justifyContent: 'center', background: 'var(--surface-2)', color: 'var(--navy)', border: '1px solid var(--border-color)' }}
                                  >
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
                              >
                                <div className="card-top">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span className="card-tag" style={{ background: '#dcfce7', color: '#15803d' }}>✅ PUBLISHED</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
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
                                        <IconTrash style={{ pointerEvents: 'none' }} />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 
                                    className="card-title" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleResumeSession(sess)}
                                  >
                                    {sess.title || sess.prompt}
                                  </h3>

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
                                  <button 
                                    className="icon-btn-tool" 
                                    onClick={() => handleResumeSession(sess)}
                                    title="Open Course"
                                    style={{ background: 'var(--blue-light)', color: 'var(--blue)', border: 'none', width: '32px', height: '32px' }}
                                  >
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
                              >
                                <div className="card-top">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span className="card-tag" style={{ background: '#f1f5f9', color: '#475569' }}>📦 ARCHIVED</span>
                                    <div style={{ display: 'flex', gap: '4px' }}>
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
                                        <IconTrash style={{ pointerEvents: 'none' }} />
                                      </button>
                                    </div>
                                  </div>
                                  <h3 
                                    className="card-title" 
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleResumeSession(sess)}
                                  >
                                    {sess.title || sess.prompt}
                                  </h3>
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
            <StepProgressBar currentStep={currentStep} onStepClick={(stepKey) => setCurrentStep(stepKey)} />

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
                  <button className="feedback-btn" onClick={() => toast.info('Thank you for your feedback!')}>Send Feedback</button>
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
                      <button className="file-upload-btn" onClick={handleFileUploadClick} disabled={isLoading} title="Upload 1 Reference Document (DOCX, PDF, TXT)">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span>Reference File</span>
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }} title="Maximum 1 reference document allowed per course">(Max 1 file • DOCX/PDF/TXT)</span>
                      <select
                        className="file-upload-btn"
                        value={isAgentMode}
                        onChange={(e) => setIsAgentMode(e.target.value)}
                        style={{ background: 'var(--surface-2)', color: '#475569' }}
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

                {/* File badge — rendered OUTSIDE prompt-card to avoid :active CSS transform interfering with click */}
                {pendingFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-20px', marginBottom: '16px', padding: '8px 14px', background: 'var(--blue-light)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--blue)', fontWeight: 600, border: '1.5px solid var(--blue)', boxShadow: '0 2px 8px rgba(59,130,246,0.1)' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setPendingFile(null)}
                      style={{ flexShrink: 0, background: 'var(--blue)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 }}
                      title="Remove file"
                    >✕</button>
                  </div>
                )}

                <h2 style={{ marginTop: '40px', marginBottom: '20px', fontSize: '1.25rem', fontWeight: 800 }}>Try these examples</h2>
                
                <div className="trending-pills" style={{ marginBottom: '20px' }}>
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

                <div className="suggested-grid">
                  {trendingTopics
                    .filter(t => selectedTopicCategory === 'All Categories' || t.category === selectedTopicCategory)
                    .map((card, idx) => (
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
                {(() => {
                  const displayTags = Array.from(new Set([
                    ...techTags,
                    ...allSuggestedTags.filter(t => !techTags.includes(t)).slice(0, 20)
                  ]));
                  return displayTags.map((tag, idx) => {
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
                  });
                })()}
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
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {typeof configDuration === 'number' ? configDuration : (parseInt(String(configDuration).replace(/\D+/g, ''), 10) || 30)} min
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {[5, 10, 15, 30, 60, 90, 120].map(p => {
                      const curNum = typeof configDuration === 'number' ? configDuration : (parseInt(String(configDuration).replace(/\D+/g, ''), 10) || 30);
                      return (
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
                            border: `1px solid ${curNum === p ? 'var(--gold)' : 'var(--border-color)'}`,
                            background: curNum === p ? 'var(--gold)' : 'transparent',
                            color: curNum === p ? '#fff' : 'var(--navy)',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <input
                      type="number"
                      min="1"
                      max="480"
                      value={typeof configDuration === 'number' ? configDuration : (parseInt(String(configDuration).replace(/\D+/g, ''), 10) || 30)}
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

              {/* Attached Reference File Badge */}
              {activeFileName && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--blue-light)', borderRadius: '10px', border: '1.5px solid var(--blue)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>📄</span>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.92rem' }}>{activeFileName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--blue)', fontWeight: 600 }}>Attached Reference Document</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveAttachedFile}
                    style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 2px 6px rgba(239,68,68,0.35)' }}
                    title="Remove Attached File"
                  >
                    ✕
                  </button>
                </div>
              )}

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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>(Max 1 document)</span>
                        <button 
                          type="button"
                          className="editor-tb-btn file-upload-right-btn" 
                          title="Upload Reference Document (Max 1 file)"
                          onClick={handleFileUploadClick}
                        >
                          Upload DOCX/PDF 📤
                        </button>
                      </div>
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
            </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="file-upload-btn" onClick={() => setCurrentStep('dashboard')}>← Back</button>
                  <button className="file-upload-btn" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={handleJumpToReview} disabled={isLoading}>Jump to Review</button>
                </div>
                <button className="action-btn" onClick={handleGenerateProposals} disabled={isLoading}>
                  {isLoading ? <><IconSpinner /> Generating…</> : <>Save &amp; Continue <IconArrow /></>}
                </button>
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

              {/* Card 3: Learning Outcomes (Brand Gold Accent Theme) */}
              <div className="review-card" style={{ gridColumn: 'span 2', borderTop: '4px solid #E9B259', borderRadius: '16px', boxShadow: '0 4px 12px rgba(233, 178, 89, 0.12)' }}>
                <div className="review-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em' }}>TARGET OUTCOMES</span>
                    <h4 className="review-card-title" style={{ margin: 0, fontSize: '0.98rem' }}>What learners will master</h4>
                  </div>
                  <span style={{ fontSize: '1.2rem' }}>🎯</span>
                </div>
                <div className="review-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {learningOutcomes.length === 0 ? (
                    <div style={{ background: '#FFFDF7', border: '1px dashed #FDE68A', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#78350F', fontSize: '0.85rem' }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>No learning outcomes added yet</p>
                      <p style={{ fontSize: '0.78rem', color: '#92400E', opacity: 0.8 }}>Add skills learners will achieve or click <strong>AI Suggest ✨</strong> below!</p>
                    </div>
                  ) : (
                    learningOutcomes.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ minWidth: '26px', height: '26px', borderRadius: '50%', background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0 }}>
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          className="prompt-textarea"
                          style={{ minHeight: 'auto', padding: '8px 12px', marginBottom: 0, flex: 1, border: '1px solid #FCD34D', background: '#FFFDF7', color: '#2D3561', fontWeight: 600 }}
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
                      style={{ fontSize: '0.85rem', flex: 1, justifyContent: 'center', borderColor: '#FCD34D', color: '#92400E', background: '#ffffff', fontWeight: 700 }} 
                      onClick={() => setLearningOutcomes([...learningOutcomes, ''])}
                    >
                      + Add Item
                    </button>
                    <button 
                      className="action-btn" 
                      style={{ fontSize: '0.85rem', flex: 1, padding: '8px 12px', justifyContent: 'center', background: 'linear-gradient(135deg, #E9B259 0%, #D9A046 100%)', color: '#2D3561', border: 'none', boxShadow: '0 4px 12px rgba(233, 178, 89, 0.28)', fontWeight: 800 }} 
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
                      justifyContent: 'space-between',
                      opacity: isLoading && !isSelected ? 0.6 : 1,
                      transform: isSelected ? 'scale(1.01)' : 'none',
                      transition: 'all 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '4px' }}>Course Curriculum Overview</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Focus: <strong style={{ color: 'var(--blue)' }}>{proposals.find(p => p.id === selectedProposalId)?.title || 'Practical AI and Regulatory Foundations'}</strong>
                      </div>
                    </div>
                    {promptText && (
                      <button
                        type="button"
                        onClick={() => setIsPromptExpandedStep5(!isPromptExpandedStep5)}
                        style={{
                          background: isPromptExpandedStep5 ? 'var(--blue-light)' : 'var(--surface-2)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          color: 'var(--blue)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                        title={isPromptExpandedStep5 ? 'Collapse prompt details' : 'Expand full prompt'}
                      >
                        <span>📝 Prompt</span>
                        <span style={{ fontSize: '0.65rem', transform: isPromptExpandedStep5 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>▼</span>
                      </button>
                    )}
                  </div>

                  {isPromptExpandedStep5 && promptText && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: '180px', overflowY: 'auto' }}>
                      <strong style={{ color: 'var(--navy)', display: 'block', marginBottom: '2px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Initial User Prompt:</strong>
                      {promptText}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {structure.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className={`structure-item ${selectedStructureLessonId === item.id ? 'active' : ''}`}
                      onClick={() => setSelectedStructureLessonId(item.id)}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', idx.toString());
                        setDraggingIdx(idx);
                      }}
                      onDragEnd={() => {
                        setDraggingIdx(null);
                        setDragOverIdx(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggingIdx !== null && draggingIdx !== idx) {
                          setDragOverIdx(idx);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
                        if (fromIdx === idx) return;
                        const updated = [...structure];
                        const [moved] = updated.splice(fromIdx, 1);
                        updated.splice(idx, 0, moved);
                        updated.forEach((lesson, oIdx) => { lesson.order = oIdx + 1; });
                        setStructure(updated);
                        setDraggingIdx(null);
                        setDragOverIdx(null);
                      }}
                      style={{ 
                        padding: '12px', 
                        borderRadius: 'var(--radius-md)', 
                        background: draggingIdx === idx 
                          ? 'rgba(72, 107, 245, 0.05)' 
                          : dragOverIdx === idx 
                            ? 'var(--blue-light)' 
                            : selectedStructureLessonId === item.id 
                              ? 'var(--blue-light)' 
                              : 'var(--surface-2)',
                        border: draggingIdx === idx 
                          ? '2px dashed var(--blue)' 
                          : dragOverIdx === idx 
                            ? '2.2px solid var(--blue)' 
                            : selectedStructureLessonId === item.id 
                              ? '1px solid rgba(72, 107, 245, 0.25)' 
                              : '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: draggingIdx !== null ? 'grabbing' : 'pointer',
                        opacity: draggingIdx === idx ? 0.45 : 1,
                        transform: draggingIdx === idx 
                          ? 'scale(0.95)' 
                          : dragOverIdx === idx 
                            ? 'translateY(-2px) scale(1.02)' 
                            : 'none',
                        boxShadow: dragOverIdx === idx 
                          ? '0 6px 16px rgba(72, 107, 245, 0.12)' 
                          : 'none',
                        transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)'
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
                      await fetch(`${API_BASE}/courses/sessions/${sessionId}/structure/save`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lessons: structure })
                      });
                    } catch (e) {
                      toast.error('Failed to save structure');
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
                          toast.warning('Please enter a section title.');
                          return;
                        }
                        const cleanType = `custom_${newSectionTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '')}_${Date.now().toString().slice(-4)}`;
                        const newSec = {
                          id: `custom-${Date.now()}`,
                          type: cleanType,
                          title: newSectionTitle.trim(),
                          instruction: newSectionInstruction.trim() || 'Write curriculum content.',
                          locked: false
                        };
                        const updated = structure.map((lesson) => {
                          const lSecs = lesson.sections ? JSON.parse(JSON.stringify(lesson.sections)) : JSON.parse(JSON.stringify(defaultSections));
                          if (!lSecs[newSectionRole]) {
                            lSecs[newSectionRole] = [];
                          }
                          lSecs[newSectionRole].push({ ...newSec });
                          return { ...lesson, sections: lSecs };
                        });
                        setStructure(updated);
                        setIsAddSectionModalOpen(false);
                        setNewSectionTitle('');
                        setNewSectionInstruction('');
                        toast.success('Custom section added!');
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
                    <button className="review-card-edit-btn" onClick={() => setCurrentStep('dashboard')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                  </div>

                  <div className="review-card-v2-body">
                    <div className="concept-hero-box">
                      <h3 className="concept-hero-title">{proposals.find(p => p.id === selectedProposalId)?.title || 'Rapid Prototyping for Real-World Impact'}</h3>
                      <p className="concept-hero-subtitle">"{proposals.find(p => p.id === selectedProposalId)?.description || (promptText ? (promptText.length > 120 ? promptText.slice(0, 120) + '...' : promptText) : 'Comprehensive Course Concept')}"</p>
                    </div>

                    {/* Collapsible Prompt Dropdown */}
                    {promptText && (
                      <div style={{ marginTop: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', overflow: 'hidden' }}>
                        <button
                          type="button"
                          onClick={() => setIsPromptExpandedStep6(!isPromptExpandedStep6)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--navy)',
                            fontWeight: 700,
                            fontSize: '0.84rem'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>✨</span>
                            <span>View Original Input Prompt</span>
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', transform: isPromptExpandedStep6 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>▼</span>
                        </button>
                        {isPromptExpandedStep6 && (
                          <div style={{ padding: '0 14px 14px 14px', borderTop: '1px solid var(--border-color)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto' }}>
                            <p style={{ margin: '8px 0 0 0' }}>{promptText}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attached File Badge if present */}
                    {activeFileName && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--blue-light)', borderRadius: '10px', border: '1.5px solid var(--blue)', marginTop: '12px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.2rem' }}>📄</span>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.88rem' }}>{activeFileName}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--blue)', fontWeight: 600 }}>Attached Reference Document</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveAttachedFile}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}
                          title="Remove Attached File"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="concept-description-text" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.65', margin: '14px 0' }}>
                      <ContentRenderer text={subjectContext || `This course is engineered to provide comprehensive, hands-on mastery of ${promptText || 'the selected topic'}, covering foundational setup, core architectures, and real-world project implementation.`} />
                    </div>

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
                    {['creator', 'student', 'educator'].map(role => {
                      const roleSectionsMap = new Map();
                      structure.forEach(l => {
                        (l.sections?.[role] || []).forEach(s => {
                          const key = s.type || s.title?.toUpperCase();
                          if (key && !roleSectionsMap.has(key)) {
                            roleSectionsMap.set(key, s);
                          }
                        });
                      });
                      const secList = Array.from(roleSectionsMap.values());
                      const displayList = secList.length > 0 ? secList : (
                        role === 'creator' ? defaultSections.creator :
                        role === 'student' ? defaultSections.student : defaultSections.educator
                      );
                      const colorClass = role === 'creator' ? 'purple' : role === 'student' ? 'blue' : 'green';

                      return (
                        <div key={role} className="persona-role-box">
                          <div className="persona-role-header">
                            <div className="persona-role-name">
                              <span className={`persona-dot ${colorClass}`}></span>
                              <span>{role.toUpperCase()}</span>
                            </div>
                            <span className="persona-count-badge">{displayList.length} Sections</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px', fontStyle: 'italic' }}>
                            Applied to all {structure.length} lesson{structure.length > 1 ? 's' : ''} (same structure, per-lesson content)
                          </div>
                          <div className="persona-tags-wrap">
                            {displayList.map(sec => (
                              <span 
                                key={sec.id || sec.title} 
                                className="persona-section-tag"
                                style={!sec.locked ? { border: '1.5px solid var(--gold)', background: '#fff8e6', fontWeight: 700, color: 'var(--navy)' } : {}}
                              >
                                {sec.title.toUpperCase()} {!sec.locked ? '✨ (CUSTOM)' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
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
                <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--navy)', lineHeight: 1.3 }}>{proposals.find(p => p.id === selectedProposalId)?.title || (promptText ? (promptText.length > 70 ? promptText.slice(0, 70) + '...' : promptText) : 'Rapid Prototyping for Real-World Impact')}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>Created on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  {promptText && (
                    <button
                      type="button"
                      onClick={() => setIsPromptExpandedStep7(!isPromptExpandedStep7)}
                      style={{
                        background: isPromptExpandedStep7 ? 'var(--blue-light)' : 'var(--surface-2)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '2px 10px',
                        fontSize: '0.76rem',
                        color: 'var(--blue)',
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title={isPromptExpandedStep7 ? 'Hide prompt details' : 'Show full prompt details'}
                    >
                      <span>📝 Prompt Details</span>
                      <span style={{ fontSize: '0.65rem', transform: isPromptExpandedStep7 ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>▼</span>
                    </button>
                  )}
                </div>
                {isPromptExpandedStep7 && promptText && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', background: 'var(--white)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '750px', boxShadow: 'var(--shadow-sm)' }}>
                    <strong style={{ color: 'var(--navy)', display: 'block', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Original Course Prompt:</strong>
                    {promptText}
                  </div>
                )}
              </div>

              {generationProgress >= 100 && (
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
              )}
            </div>

            {/* Live Progress Banner with Animated Progress Bar */}
            <div className="live-status-box" style={{ marginBottom: '24px', background: 'var(--white)', border: generationProgress >= 100 ? '1.5px solid #86EFAC' : '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '18px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div className="live-status-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
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
                    onClick={async () => {
                      if (confirm('Are you sure you want to cancel the generation?')) {
                        try {
                          await fetch(`${API_BASE}/courses/sessions/${sessionId}/cancel`, { method: 'POST' });
                        } catch (e) {
                          console.error("Cancel API call error:", e);
                        }
                        setGenerationProgress(0);
                        setCurrentStep('review');
                        toast.info("Generation canceled. Returned to Step 6 Review.");
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

              {/* Patient Reassurance Notice Banner (Simple & Concise Notice) */}
              {generationProgress < 100 && (
                <div style={{ marginTop: '14px', padding: '10px 16px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#92400E', fontWeight: 600 }}>
                  <span style={{ fontSize: '1.05rem' }}>⏳</span>
                  <span>
                    <strong>Note:</strong> AI course generation is in progress. Please wait patiently while we build your curriculum.
                  </span>
                </div>
              )}
            </div>

            {/* Main Content Workspace Box */}
            <div style={{ background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
              {/* Lesson Carousel Navigator Slider */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--surface-2)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
                <button 
                  className="library-page-btn playful-card" 
                  style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  onClick={() => {
                    const targetIdx = Math.max(0, currentGeneratingLessonIdx - 1);
                    setCurrentGeneratingLessonIdx(targetIdx);
                    if (courseData?.lessons?.[targetIdx]) {
                      setActiveLessonId(courseData.lessons[targetIdx].id);
                    }
                  }}
                  disabled={currentGeneratingLessonIdx === 0}
                  title="Previous Lesson"
                >
                  <IconChevronLeft />
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
                  style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                  onClick={() => {
                    const targetIdx = Math.min((structure.length || 1) - 1, currentGeneratingLessonIdx + 1);
                    setCurrentGeneratingLessonIdx(targetIdx);
                    if (courseData?.lessons?.[targetIdx]) {
                      setActiveLessonId(courseData.lessons[targetIdx].id);
                    }
                  }}
                  disabled={currentGeneratingLessonIdx >= (structure.length || 1) - 1}
                  title="Next Lesson"
                >
                  <IconChevronRight />
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
                    const baseList = activeRole === 'creator' ? [
                      { id: 'overview', title: 'Ringkasan Pelajaran' },
                      { id: 'learning_outcomes', title: 'Capaian Pembelajaran' },
                      { id: 'core_content', title: 'Materi Pokok' },
                      { id: 'exercises', title: 'Latihan Praktik' },
                      { id: 'quizzes', title: 'Kuis & Asesmen' }
                    ] : activeRole === 'student' ? [
                      { id: 'why_this_matters', title: 'Urgensi Materi' },
                      { id: 'learning_journey', title: 'Alur Belajar' },
                      { id: 'practice', title: 'Studi Kasus & Praktik' },
                      { id: 'debugging', title: 'Kendala Umum & Solusi' },
                      { id: 'ethics', title: 'Etika & Standar' }
                    ] : [
                      { id: 'facilitator_guide', title: 'Panduan Fasilitator' },
                      { id: 'lesson_plan', title: 'Rencana Sesi & Waktu' },
                      { id: 'rubric', title: 'Rubrik Penilaian' },
                      { id: 'discussion_questions', title: 'Pertanyaan Diskusi' }
                    ];

                    const curTocLesson = courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.[0];
                    const structTocLesson = structure.find(l => l.id === curTocLesson?.id || l.title === curTocLesson?.title) || structure[currentGeneratingLessonIdx] || structure[0];
                    const customList = (structTocLesson?.sections?.[activeRole] || [])
                      .filter(s => !s.locked)
                      .map(s => ({ id: s.type, title: s.title }));

                    const secList = [...baseList, ...customList];

                    return secList.map((sec) => (
                      <button
                        key={sec.id}
                        className={`filter-nav-item ${activeSubSection === sec.id ? 'active' : ''}`}
                        style={{ textAlign: 'left', padding: '10px 14px', fontSize: '0.85rem', transition: 'all 0.2s ease' }}
                        onClick={() => {
                          setActiveSubSection(sec.id);
                          const el = document.getElementById(`step7-sec-${sec.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
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
                        {activeRole === 'creator' ? 'Dokumen Induk Kurikulum (Creator View)' : activeRole === 'student' ? 'Panduan & Modul Belajar Siswa (Student View)' : 'Panduan Fasilitator & Mentor (Educator View)'}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
                      <button className="icon-btn-tool" title="AI Wand Action" onClick={() => { if (!checkCanEdit('menggunakan AI Rewrite')) return; setIsAIWandOpen(!isAIWandOpen); }}>
                        🪄
                      </button>

                      {/* AI Wand Action Menu Popover */}
                      {isAIWandOpen && (
                        <div style={{ position: 'absolute', top: '40px', right: '40px', width: '220px', background: 'var(--white)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', zIndex: 100, padding: '8px 0' }}>
                          <div style={{ padding: '6px 12px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-color)' }}>
                            AI WAND ACTIONS
                          </div>
                          {[
                            { action: 'rewrite', label: '✍️ Rewrite & Refine', desc: 'Perbaiki kalimat & bahasa' },
                            { action: 'expand', label: '📈 Expand Details', desc: 'Perdalam contoh & studi kasus' },
                            { action: 'simplify', label: '💡 Simplify Concepts', desc: 'Permudah pemahaman konsep' }
                          ].map(item => (
                            <button
                              key={item.action}
                              style={{ width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', transition: 'var(--transition-fast)' }}
                              className="filter-tag-pill"
                              onClick={() => {
                                if (!checkCanEdit('menggunakan AI Rewrite')) return;
                                setIsWandProcessing(true);
                                setTimeout(() => {
                                  setIsWandProcessing(false);
                                  setIsAIWandOpen(false);
                                  toast.success(`Aksi AI [${item.label}] berhasil dijalankan!`);
                                }, 1200);
                              }}
                            >
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>{item.label}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.desc}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <button className="icon-btn-tool" title="Version History" onClick={() => { if (!checkCanEdit('melihat History')) return; fetchHistory(); setIsHistoryOpen(true); }}>
                        📜
                      </button>
                    </div>
                  </div>

                  {/* Live Rendered Content Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {(() => {
                      const curLesson = courseData?.lessons?.[currentGeneratingLessonIdx] || courseData?.lessons?.[0];
                      const curSecs = curLesson?.sections?.[activeRole] || {};
                      const lessonTitle = curLesson?.title || structure[currentGeneratingLessonIdx]?.title || courseData?.title || 'Modul Pembelajaran';

                      const activeLessonContent = {
                        overview: curSecs.overview || curSecs.project_brief || `Modul ini memberikan pemahaman mendalam dan penerapan nyata untuk ${lessonTitle}. Peserta didik akan mempelajari konsep pokok, contoh studi kasus industri, dan panduan praktik mandiri.`,
                        learning_outcomes: curSecs.learning_outcomes?.length > 0 ? curSecs.learning_outcomes : [
                          `Menguasai konsep fundamental dan komponen utama dalam ${lessonTitle}.`,
                          `Mempraktikkan alur kerja terstruktur sesuai standar mutu terbaik.`,
                          `Mengevaluasi dan mengatasi kendala implementasi pada skenario nyata.`
                        ],
                        core_content: curSecs.core_content || curSecs.tech_stack || `### 1. Landasan Konseptual\n${lessonTitle} menjadi pilar penting dalam penguasaan keahlian ini. Melalui penerapan alur kerja yang disiplin dan terstruktur, peserta dapat mencapai hasil yang optimal dan konsisten.\n\n### 2. Panduan Langkah Praktis\nUntuk mengimplementasikan ${lessonTitle} secara efektif, ikuti tahapan sistematis dan standar operasional yang telah disusun berikut ini.`,
                        exercises: curSecs.exercises?.length > 0 ? curSecs.exercises : [
                          { title: `Latihan Praktik ${lessonTitle}`, description: `Lakukan eksplorasi mandiri langkah demi langkah untuk ${lessonTitle}. Catat hasil pengamatan dan evaluasi kesesuaian output.`, instruction: `Lakukan eksplorasi mandiri langkah demi langkah untuk ${lessonTitle}. Catat hasil pengamatan dan evaluasi kesesuaian output.` }
                        ],
                        quizzes: curSecs.quizzes || curSecs.quiz || [
                          { question: `Apa tujuan esensial dari pembelajaran ${lessonTitle}?`, options: [`Membangun kompetensi praktis yang aplikatif`, `Menghindari proses evaluasi mutu`, `Mengurangi efisiensi pengerjaan`], answer: `Membangun kompetensi praktis yang aplikatif`, explanation: `${lessonTitle} berfokus pada penguasaan keterampilan nyata yang dapat diterapkan langsung.` }
                        ],
                        why_this_matters: curSecs.why_this_matters || `Memahami ${lessonTitle} sangat esensial karena menjadi fondasi utama dalam memecahkan permasalahan nyata dan meningkatkan kualitas hasil akhir.`,
                        learning_journey: curSecs.learning_journey || `1. Pahami konsep dasar dan terminologi kunci dari ${lessonTitle}.\n2. Ikuti demonstrasi langkah demi langkah sesuai panduan materi pokok.\n3. Kerjakan latihan praktik mandiri dan evaluasi hasil pengerjaan.`,
                        practice: curSecs.practice?.interactive_exercise || curSecs.practice?.code_block || curSecs.practice?.scenario ? curSecs.practice : {
                          content_type: 'markdown',
                          scenario: `Studi Kasus Pembelajaran: Terapkan metode ${lessonTitle} pada skenario simulasi nyata berikut ini.`,
                          interactive_exercise: `Terapkan langkah-langkah kerja untuk menyelesaikan studi kasus ${lessonTitle} dengan teliti.`,
                          checklist: [`Siapkan alat dan bahan pendukung`, `Eksekusi langkah demi langkah secara berurutan`, `Lakukan pengecekan mutu hasil akhir`]
                        },
                        debugging: curSecs.debugging || `### Kendala Umum & Solusi\n1. **Ketidaktelitian Takaran / Parameter:** Selalu lakukan verifikasi ulang pada setiap tahapan awal.\n2. **Penyimpangan Alur Kerja:** Ikuti panduan terstandar untuk menjaga konsistensi mutu.`,
                        ethics: curSecs.ethics || `### Standar Mutu, Etika & Kebersihan\nTerapkan prinsip integritas, kehati-hatian, keselamatan kerja, dan standar higienitas tertinggi sepanjang proses pengerjaan.`,
                        facilitator_guide: curSecs.facilitator_guide || `### Panduan Fasilitasi\nAwali kelas dengan memicu diskusi aktif mengenai tantangan seputar ${lessonTitle}. Berikan ruang bagi peserta untuk mempraktikkan materi secara langsung.`,
                        lesson_plan: curSecs.lesson_plan?.timing ? curSecs.lesson_plan : {
                          ice_breaker: `Ajukan pertanyaan pemantik: "Pernahkah Anda menemui kendala saat menerapkan ${lessonTitle} sebelumnya?"`,
                          timing: `Pengantar & Konsep: 10 menit | Praktik & Simulasi: 35 menit | Tanya Jawab & Refleksi: 15 menit`
                        },
                        rubric: curSecs.rubric?.length > 0 ? curSecs.rubric : [
                          { criteria: "Ketepatan Eksekusi", excellent: "Langkah pengerjaan sempurna dan teliti", good: "Pengerjaan baik dengan evaluasi kecil", needs_improvement: "Perlu bimbingan ulang pada langkah dasar" },
                          { criteria: "Pemahaman Konsep", excellent: "Mampu menjelaskan alasan di balik setiap langkah", good: "Memahami alur secara umum", needs_improvement: "Belum memahami tujuan langkah kerja" }
                        ],
                        discussion_questions: curSecs.discussion_questions?.length > 0 ? curSecs.discussion_questions : [
                          `Bagaimana teknik dalam ${lessonTitle} ini dapat disesuaikan untuk kebutuhan skala yang lebih besar?`,
                          `Faktor apa yang paling krusial untuk menjaga konsistensi mutu hasil?`
                        ]
                      };

                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                          
                          {/* 🎨 CREATOR POV WORKSPACE */}
                          {activeRole === 'creator' && (
                            <>
                              <div id="step7-sec-overview" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Ringkasan Pelajaran (Lesson Overview)</h3>
                                  {editingSection === 'overview' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('overview', editingText)}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Overview')) return; setEditingSection('overview'); setEditingText(activeLessonContent.overview); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'overview' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.overview} />
                                )}
                                {renderAIActionBar('overview', activeLessonContent.overview)}
                              </div>

                              <div id="step7-sec-learning_outcomes" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Capaian Pembelajaran (Learning Outcomes)</h3>
                                  {editingSection === 'learning_outcomes' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('learning_outcomes', editingText.split('\n').filter(Boolean))}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Learning Outcomes')) return; setEditingSection('learning_outcomes'); setEditingText((activeLessonContent.learning_outcomes || []).join('\n')); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'learning_outcomes' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="Satu capaian per baris..." />
                                ) : (
                                  <ul className="outcome-list">
                                    {(activeLessonContent.learning_outcomes || []).map((item, idx) => (
                                      <li key={idx}><span className="outcome-dot" />{item}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>

                              <div id="step7-sec-core_content" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Materi Pokok (Core Technical Material)</h3>
                                  {editingSection === 'core_content' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('core_content', editingText)}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Core Content')) return; setEditingSection('core_content'); setEditingText(activeLessonContent.core_content); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'core_content' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '240px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.core_content} />
                                )}
                                {renderAIActionBar('core_content', activeLessonContent.core_content)}
                              </div>

                              <div id="step7-sec-exercises" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Latihan Praktik (Hands-On Exercises)</h3>
                                  {editingSection === 'exercises' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('exercises', parsed);
                                      } catch (err) {
                                        toast.error("Format JSON tidak valid.");
                                      }
                                    }}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Latihan')) return; setEditingSection('exercises'); setEditingText(JSON.stringify(activeLessonContent.exercises, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'exercises' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {(activeLessonContent.exercises || []).map((ex, idx) => {
                                      const textDesc = ex.instruction || ex.description || (typeof ex === 'string' ? ex : '');
                                      return (
                                        <div key={idx} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <strong style={{ fontSize: '0.98rem', color: 'var(--navy)' }}>Latihan {idx + 1}: {ex.title || 'Latihan Mandiri'}</strong>
                                            {ex.difficulty && (
                                              <span style={{ fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: 700, border: '1px solid #bbf7d0' }}>
                                                {ex.difficulty}
                                              </span>
                                            )}
                                          </div>
                                          {textDesc && <p style={{ margin: '6px 0', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.6' }}>{textDesc}</p>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              <div id="step7-sec-quizzes" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Kuis &amp; Asesmen (Assessment Quiz)</h3>
                                  {editingSection === 'quizzes' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('quizzes', parsed);
                                      } catch (err) {
                                        toast.error("Format JSON tidak valid.");
                                      }
                                    }}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('quizzes'); setEditingText(JSON.stringify(activeLessonContent.quizzes, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'quizzes' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {(Array.isArray(activeLessonContent.quizzes) ? activeLessonContent.quizzes : []).map((q, idx) => (
                                      <div key={idx} style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                        <strong>Soal {idx + 1}: {q.question || 'Pertanyaan Kuis'}</strong>
                                        <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '8px' }}>
                                          {(Array.isArray(q.options) ? q.options : (q.choices || [])).map((opt, oIdx) => (
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
                              {renderCustomSections()}
                            </>
                          )}

                          {/* 🎓 STUDENT POV WORKSPACE */}
                          {activeRole === 'student' && (
                            <>
                              <div id="step7-sec-why_this_matters" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Urgensi Materi (Why This Matters)</h3>
                                  {editingSection === 'why_this_matters' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('why_this_matters', editingText)}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Bagian Ini')) return; setEditingSection('why_this_matters'); setEditingText(activeLessonContent.why_this_matters); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'why_this_matters' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <div className="why-matters-card" style={{ background: 'var(--surface-2)', borderLeft: '4px solid var(--gold)', padding: '16px' }}>
                                    <ContentRenderer text={activeLessonContent.why_this_matters} />
                                  </div>
                                )}
                                {renderAIActionBar('why_this_matters', activeLessonContent.why_this_matters)}
                              </div>

                              <div id="step7-sec-learning_journey" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Alur Belajar Siswa (Learning Journey)</h3>
                                  {editingSection === 'learning_journey' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('learning_journey', editingText)}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Alur Belajar')) return; setEditingSection('learning_journey'); setEditingText(activeLessonContent.learning_journey); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'learning_journey' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '140px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.learning_journey} />
                                )}
                                {renderAIActionBar('learning_journey', activeLessonContent.learning_journey)}
                              </div>

                              <div id="step7-sec-practice" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>
                                    {activeLessonContent.practice?.content_type === 'code' ? '💻 Simulasi Praktik & Sandbox' : '📋 Studi Kasus & Skenario Praktik'}
                                  </h3>
                                  {editingSection === 'practice' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('practice', parsed);
                                      } catch (err) {
                                        toast.error("Format JSON tidak valid.");
                                      }
                                    }}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('practice'); setEditingText(JSON.stringify(activeLessonContent.practice || {}, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'practice' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '200px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <>
                                    <div style={{ background: 'var(--surface-2)', padding: '18px', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid var(--border-color)' }}>
                                      <ContentRenderer text={activeLessonContent.practice?.scenario || activeLessonContent.practice?.interactive_exercise || activeLessonContent.practice?.code_block || (typeof activeLessonContent.practice === 'string' ? activeLessonContent.practice : 'Ikuti skenario studi kasus berikut ini.')} />
                                    </div>
                                    <div className="exercise-task" style={{ marginTop: '10px' }}>
                                      <strong>Tugas &amp; Instruksi Utama:</strong> {activeLessonContent.practice?.interactive_exercise || activeLessonContent.practice?.task || 'Selesaikan panduan praktik mandiri berikut.'}
                                    </div>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 750, marginTop: '16px' }}>Checklist Capaian Belajar</h4>
                                    <ul className="checklist">
                                      {(activeLessonContent.practice?.checklist || []).map((item, idx) => (
                                        <li key={idx}><span className="check-icon">✓</span>{item}</li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                              </div>

                              <div id="step7-sec-debugging" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Kendala Umum &amp; Solusi (Debugging Pitfalls)</h3>
                                  {editingSection === 'debugging' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('debugging', editingText)}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Debugging')) return; setEditingSection('debugging'); setEditingText(activeLessonContent.debugging); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'debugging' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.debugging} />
                                )}
                                {renderAIActionBar('debugging', activeLessonContent.debugging)}
                              </div>

                              <div id="step7-sec-ethics" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Etika &amp; Standar Kualitas (Ethics &amp; Principles)</h3>
                                  {editingSection === 'ethics' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('ethics', editingText)}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Ethics')) return; setEditingSection('ethics'); setEditingText(activeLessonContent.ethics); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'ethics' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.ethics} />
                                )}
                                {renderAIActionBar('ethics', activeLessonContent.ethics)}
                              </div>
                              {renderCustomSections()}
                            </>
                          )}

                          {/* 🏫 EDUCATOR POV WORKSPACE */}
                          {activeRole === 'educator' && (
                            <>
                              <div id="step7-sec-facilitator_guide" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Panduan Fasilitator (Facilitator Guide)</h3>
                                  {editingSection === 'facilitator_guide' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('facilitator_guide', editingText)}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { if (!checkCanEdit('mengedit Facilitator Guide')) return; setEditingSection('facilitator_guide'); setEditingText(activeLessonContent.facilitator_guide); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'facilitator_guide' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '150px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <ContentRenderer text={activeLessonContent.facilitator_guide} />
                                )}
                                {renderAIActionBar('facilitator_guide', activeLessonContent.facilitator_guide)}
                              </div>

                              <div id="step7-sec-lesson_plan" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Rencana Sesi &amp; Alokasi Waktu (Lesson Plan &amp; Timing)</h3>
                                  {editingSection === 'lesson_plan' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('lesson_plan', parsed);
                                      } catch (err) {
                                        toast.error("Format JSON tidak valid. Contoh: { ice_breaker: string, timing: string }");
                                      }
                                    }}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('lesson_plan'); setEditingText(JSON.stringify(activeLessonContent.lesson_plan || {}, null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'lesson_plan' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <div className="lesson-plan-grid">
                                    <div className="lesson-plan-card">
                                      <h4>🧊 Ice Breaker &amp; Pembuka</h4>
                                      <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.ice_breaker || 'Tidak ada pertanyaan pemantik.'}</p>
                                    </div>
                                    <div className="lesson-plan-card">
                                      <h4>⏱ Alokasi Waktu</h4>
                                      <p style={{ marginTop: '10px' }}>{activeLessonContent.lesson_plan?.timing || '30 menit total durasi'}</p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div id="step7-sec-rubric" className="content-block" style={{ scrollMarginTop: '110px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                  <h3 style={{ margin: 0 }}>Rubrik Penilaian (Grading Rubric)</h3>
                                  {editingSection === 'rubric' ? (
                                    <button className="ai-pill-btn edit" onClick={() => {
                                      try {
                                        const parsed = JSON.parse(editingText);
                                        handleSaveManualEdit('rubric', parsed);
                                      } catch (err) {
                                        toast.error("Format JSON tidak valid.");
                                      }
                                    }}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('rubric'); setEditingText(JSON.stringify(activeLessonContent.rubric || [], null, 2)); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'rubric' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '180px', fontFamily: 'monospace' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                                ) : (
                                  <table className="rubric-table">
                                    <thead>
                                      <tr>
                                        <th>Kriteria</th>
                                        <th>Sangat Baik</th>
                                        <th>Baik</th>
                                        <th>Perlu Perbaikan</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(Array.isArray(activeLessonContent.rubric) ? activeLessonContent.rubric : []).map((row, idx) => (
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
                                  <h3 style={{ margin: 0 }}>Pertanyaan Diskusi Kelas</h3>
                                  {editingSection === 'discussion_questions' ? (
                                    <button className="ai-pill-btn edit" onClick={() => handleSaveManualEdit('discussion_questions', editingText.split('\n').filter(Boolean))}>Simpan</button>
                                  ) : (
                                    <button className="ai-pill-btn edit" onClick={() => { setEditingSection('discussion_questions'); setEditingText(Array.isArray(activeLessonContent.discussion_questions) ? activeLessonContent.discussion_questions.join('\n') : String(activeLessonContent.discussion_questions || '')); }}>Edit</button>
                                  )}
                                </div>
                                {editingSection === 'discussion_questions' ? (
                                  <textarea className="prompt-textarea" style={{ minHeight: '120px' }} value={editingText} onChange={(e) => setEditingText(e.target.value)} placeholder="Satu pertanyaan per baris..." />
                                ) : (
                                  <ol className="discussion-list">
                                    {(Array.isArray(activeLessonContent.discussion_questions) ? activeLessonContent.discussion_questions : (typeof activeLessonContent.discussion_questions === 'string' ? [activeLessonContent.discussion_questions] : [])).map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ol>
                                )}
                              </div>
                              {renderCustomSections()}
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

{['creator', 'student', 'educator'].map((role) => {
                  const isExpanded = openPov === role;
                  const roleLabel = role === 'creator' ? 'Creator PDF' : role === 'student' ? 'Student PDF' : 'Educator PDF';
                  const roleIcon = role === 'creator' ? '🎨' : role === 'student' ? '🎓' : '🏫';
                  
                  return (
                    <div key={role} className="assets-menu-group">
                      <button
                        type="button"
                        className={`assets-group-header-accordion ${isExpanded ? 'active' : ''}`}
                        onClick={() => {
                          const nextPov = isExpanded ? null : role;
                          setOpenPov(nextPov);
                          if (nextPov) {
                            setActiveRole(nextPov);
                            if (courseData.lessons?.length > 0 && !activeLessonId) {
                              setActiveLessonId(courseData.lessons[0].id);
                            }
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.05rem' }}>{roleIcon}</span>
                          <span>{roleLabel}</span>
                        </div>
                        <span className="assets-group-badge">
                          {courseData.lessons?.length || 0} lessons
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="assets-accordion-content">
                          {courseData.lessons?.map((lesson, idx) => (
                            <button
                              key={`${role}-${lesson.id}`}
                              className={`assets-lesson-btn ${activeRole === role && activeLessonId === lesson.id ? 'active' : ''}`}
                              onClick={() => {
                                setActiveRole(role);
                                setActiveLessonId(lesson.id);
                                setIsPptxPage(false);
                              }}
                            >
                              <span style={{ fontWeight: 700 }}>L0{idx + 1}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {lesson.title.replace(/^Lesson\s*\d+\s*[:\-\.]*\s*/i, '')}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="assets-menu-group">
                  <button
                    type="button"
                    className={`assets-group-header-accordion ${openPov === 'pptx' ? 'active' : ''}`}
                    onClick={() => {
                      const nextPov = openPov === 'pptx' ? null : 'pptx';
                      setOpenPov(nextPov);
                      if (nextPov) {
                        setIsPptxPage(true);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.05rem' }}>📊</span>
                      <span>Lesson Slides</span>
                    </div>
                    <span className="assets-group-badge">
                      {Object.keys(pptxDataByLesson).length} generated
                    </span>
                  </button>

                  {openPov === 'pptx' && (
                    <div className="assets-accordion-content">
                      {courseData.lessons?.map((lesson, idx) => {
                        const lessonPptx = pptxDataByLesson[lesson.id];
                        const isActive = activePptxLessonId === lesson.id;
                        const hasPptx = !!lessonPptx;
                        return (
                          <div
                            key={`pptx-${lesson.id}`}
                            className={`assets-lesson-btn ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              setActivePptxLessonId(lesson.id);
                              setIsPptxPage(true);
                              setPptxSlideIndex(0);
                            }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '8px 12px' }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                              <span style={{ fontWeight: 700, fontSize: '0.75rem', color: hasPptx ? 'var(--green)' : 'var(--text-secondary)' }}>
                                {hasPptx ? '✓' : `L0${idx + 1}`}
                              </span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{lesson.title}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              {!hasPptx && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGenerateLessonPptx(lesson.id);
                                  }}
                                  disabled={pptxLoading}
                                  style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'var(--navy)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: pptxLoading ? 'wait' : 'pointer' }}
                                >
                                  {pptxLoading && activePptxLessonId === lesson.id ? '⏳' : '⚡'}
                                </button>
                              )}
                              {hasPptx && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadLessonPptx(lesson.id);
                                  }}
                                  style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'var(--green)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  📥
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Document Viewer OR PPT Page */}
              {isPptxPage && (
                <div style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', background: 'var(--surface-1)', overflow: 'hidden' }}>
                  {!pptxData && activePptxLessonId && (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                      <h3 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Lesson Slide Generator</h3>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>
                        {courseData.lessons?.find(l => l.id === activePptxLessonId)?.title || 'Selected Lesson'}
                      </p>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Click below to generate presentation slides for this lesson.</p>
                      <button onClick={() => handleGenerateLessonPptx(activePptxLessonId)} disabled={pptxLoading}
                        style={{ padding: '12px 32px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, var(--navy), var(--blue))', color: '#fff', fontSize: '0.95rem', fontWeight: 700, cursor: pptxLoading ? 'wait' : 'pointer', boxShadow: '0 4px 14px rgba(26,32,64,0.3)' }}>
                        {pptxLoading ? '⏳ Generating...' : '⚡ Generate Slides for This Lesson'}
                      </button>
                    </div>
                  )}
                  {!pptxData && !activePptxLessonId && (
                    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                      <h3 style={{ color: 'var(--navy)', marginBottom: '8px' }}>Lesson Slide Generator</h3>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>Select a lesson from the sidebar to generate slides.</p>
                    </div>
                  )}
                  {pptxData && (
                    <>
                      {/* PPT Toolbar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>Layout:</span>
                          <select value={pptxLayout} onChange={e => { setPptxLayout(e.target.value); setPptxSlideIndex(0); }}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', background: 'var(--surface-1)', color: 'var(--navy)' }}>
                            <option value="layout_1">Layout 1 — Corporate Bold</option>
                            <option value="layout_2">Layout 2 — Creative</option>
                            <option value="layout_3">Layout 3 — Clean Minimal</option>
                          </select>
                          {activePptxLessonId && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px', padding: '4px 8px', background: 'var(--surface-1)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                              {courseData.lessons?.find(l => l.id === activePptxLessonId)?.title || 'Lesson'}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleDownloadLessonPptx(activePptxLessonId)}
                            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--navy)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                            📥 Download
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', overflow: 'hidden' }}>
                      <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <button onClick={() => setPptxSlideIndex(i => Math.max(0, i - 1))} disabled={pptxSlideIndex === 0}
                            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: pptxSlideIndex === 0 ? '#333' : 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: pptxSlideIndex === 0 ? 'not-allowed' : 'pointer' }}>
                            ◀ Prev
                          </button>
                          <span style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 600 }}>Slide {pptxSlideIndex + 1} / {currentPptxSlides.length}</span>
                          <button onClick={() => setPptxSlideIndex(i => Math.min(currentPptxSlides.length - 1, i + 1))} disabled={pptxSlideIndex >= currentPptxSlides.length - 1}
                            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: pptxSlideIndex >= currentPptxSlides.length - 1 ? '#333' : 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: pptxSlideIndex >= currentPptxSlides.length - 1 ? 'not-allowed' : 'pointer' }}>
                            Next ▶
                          </button>
                        </div>
                        {currentPptxSlide && (() => {
                          const theme = pptxData.layouts?.[pptxLayout]?.theme || {};
                          const isLayout1 = pptxLayout === 'layout_1';
                          const isLayout2 = pptxLayout === 'layout_2';
                          const isLayout3 = pptxLayout === 'layout_3';
                          const bgColor = isLayout3 ? '#ffffff' : isLayout2 ? '#141e32' : theme.primary || '#1a202c';
                          const textColor = isLayout3 ? theme.text || '#1a202c' : '#fff';
                          const accentColor = theme.accent || '#d69e2e';
                          return (
<div style={{
    background: bgColor,
    borderRadius: '8px',
    padding: '24px',
    height: '360px',
    width: '640px',
    maxWidth: '100%',
    margin: '0 auto',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative'
}}>
                            {isLayout2 && <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: accentColor, opacity: 0.15 }}></div>}
                            {isLayout3 && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: accentColor }}></div>}
                            {currentPptxSlide.type === 'title' && (
                              <div style={{ textAlign: 'center' }}>
                                {isLayout1 && <div style={{ width: '100%', height: '4px', background: accentColor, position: 'absolute', top: 0, left: 0 }}></div>}
                                <h1 style={{ color: textColor, fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }}>{currentPptxSlide.title}</h1>
                                {currentPptxSlide.subtitle && (
                                  <>
                                    <div style={{ width: isLayout3 ? '60px' : '80px', height: isLayout3 ? '2px' : '4px', background: accentColor, margin: '0 auto 16px', borderRadius: '2px' }}></div>
                                    <p style={{ color: accentColor, fontSize: '1.1rem', fontWeight: 600 }}>{currentPptxSlide.subtitle}</p>
                                  </>
                                )}
                              </div>
                            )}
                            {currentPptxSlide.type === 'toc' && (
                              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                <h2 style={{ color: textColor, fontSize: '1.6rem', fontWeight: 800, marginBottom: '20px' }}>{currentPptxSlide.title}</h2>
                                <div style={{ width: isLayout3 ? '40px' : '60px', height: isLayout3 ? '2px' : '3px', background: accentColor, marginBottom: '20px', borderRadius: '2px' }}></div>
                                {(currentPptxSlide.items || []).map((item, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    {!isLayout3 && <div style={{ width: isLayout2 ? '8px' : '10px', height: isLayout2 ? '8px' : '10px', borderRadius: isLayout2 ? '50%' : '2px', background: accentColor, flexShrink: 0 }}></div>}
                                    <p style={{ color: isLayout3 ? (theme.text || '#1a202c') : '#ccc', fontSize: '1rem', paddingLeft: isLayout3 ? '16px' : 0, borderLeft: isLayout3 ? `2px solid ${accentColor}` : 'none' }}>{isLayout3 ? `— ${item}` : item}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {currentPptxSlide.type === 'lesson_title' && (
                              <div style={{ paddingLeft: isLayout1 ? '16px' : 0, borderLeft: isLayout1 ? `5px solid ${accentColor}` : 'none' }}>
                                {isLayout2 && <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '150px', height: '150px', borderRadius: '50%', background: accentColor, opacity: 0.1 }}></div>}
                                <h2 style={{ color: textColor, fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>{currentPptxSlide.title}</h2>
                                {currentPptxSlide.subtitle && <p style={{ color: accentColor, fontSize: '1rem' }}>{currentPptxSlide.subtitle}</p>}
                                {isLayout3 && <div style={{ width: '50px', height: '2px', background: accentColor, marginTop: '12px' }}></div>}
                              </div>
                            )}
                            {currentPptxSlide.type === 'content' && (
                              <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                                <h2 style={{ color: textColor, fontSize: '1.5rem', fontWeight: 800, marginBottom: '16px' }}>{currentPptxSlide.title}</h2>
                                <div style={{ width: isLayout3 ? '30px' : '50px', height: isLayout3 ? '2px' : '3px', background: accentColor, marginBottom: '16px', borderRadius: '2px' }}></div>
                                {(currentPptxSlide.bullets || []).map((bullet, i) => (
                                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                                    {!isLayout3 && <div style={{ width: isLayout2 ? '8px' : '10px', height: isLayout2 ? '8px' : '10px', borderRadius: isLayout2 ? '50%' : '2px', background: accentColor, marginTop: '7px', flexShrink: 0 }}></div>}
                                    <p style={{ color: isLayout3 ? (theme.text || '#1a202c') : '#ddd', fontSize: '0.95rem', lineHeight: 1.5, paddingLeft: isLayout3 ? '16px' : 0 }}>{isLayout3 ? `— ${bullet}` : bullet}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {currentPptxSlide.type === 'code' && (
                              <div>
                                <h2 style={{ color: textColor, fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px' }}>{currentPptxSlide.title}</h2>
                                <pre style={{ background: isLayout3 ? '#f0f0f5' : isLayout2 ? 'rgba(15,25,45,0.8)' : 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '16px', color: isLayout3 ? '#28283c' : '#00c878', fontFamily: 'Courier New, monospace', fontSize: '0.7rem', lineHeight: 1.5, overflowY: 'auto', border: isLayout3 ? '1px solid #d0d0da' : isLayout2 ? `1px solid ${accentColor}40` : 'none' }}>{currentPptxSlide.code}</pre>
                              </div>
                            )}
                            {currentPptxSlide.type === 'end' && (
                              <div style={{ textAlign: 'center' }}>
                                {isLayout2 && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '200px', height: '200px', borderRadius: '50%', background: accentColor, opacity: 0.1 }}></div>}
                                <h1 style={{ color: textColor, fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px', position: 'relative' }}>{currentPptxSlide.title}</h1>
                                <div style={{ width: isLayout3 ? '60px' : '80px', height: isLayout3 ? '2px' : '4px', background: accentColor, margin: '0 auto 16px', borderRadius: '2px', position: 'relative' }}></div>
                                <p style={{ color: accentColor, fontSize: '1.1rem', position: 'relative' }}>{currentPptxSlide.subtitle}</p>
                              </div>
                            )}
                            <div style={{ position: 'absolute', bottom: '12px', right: '20px', color: isLayout3 ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>{pptxSlideIndex + 1}</div>
                          </div>
                          );
                        })()}
                      </div>
                      {currentPptxSlide && currentPptxSlide.notes && (
                        <div style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1rem' }}>📝</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy)' }}>Speaker Notes</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{currentPptxSlide.notes}</p>
                        </div>
                      )}
                      </div>
                    </>
                  )}
                </div>
              )}
              {!isPptxPage && (() => {
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
                    {/* Document Viewer Header */}
                    <div className="viewer-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem' }}>
                        Lesson {lessonNumber} of {courseData.lessons?.length || 1} &middot; {curLesson?.title || 'Document Preview'} ({activeRole.toUpperCase()} POV)
                      </div>
                      <div>
                        <button 
                          className="purple-start-btn" 
                          style={{ fontSize: '0.85rem', padding: '8px 18px', gap: '6px', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)' }} 
                          onClick={() => { setExportFormat('pdf'); setIsExportModalOpen(true); }} 
                          title="Download Options (PDF, Word, MD, HTML, ZIP)"
                        >
                          Download Assets &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Real Native PDF Embed */}
                    {sessionId ? (
                      <div id="internal-document-container" style={{ background: '#525659', borderRadius: '0 0 var(--radius-md) var(--radius-md)', padding: '12px', border: '1px solid var(--border-color)', borderTop: 'none', overflow: 'hidden' }}>
                        {(() => {
                          const cleanTitle = (courseData?.title || 'Course').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');
                          const embedFilename = `${cleanTitle}_${activeRole.toLowerCase()}.pdf`;
                          const embedSrc = `${API_BASE}/courses/${sessionId}/export/${embedFilename}?format=pdf&role=${activeRole.toLowerCase()}${activeLessonId ? `&lesson_id=${activeLessonId}` : ''}&disposition=inline#toolbar=1`;
                          
                          return (
                            <embed
                              key={embedSrc}
                              id="pdf-embed"
                              type="application/pdf"
                              src={embedSrc}
                              width="100%"
                              height="850px"
                              style={{
                                border: 'none',
                                borderRadius: '4px',
                                background: '#FFFFFF',
                                display: 'block',
                                transform: `scale(${pdfZoom / 100})`,
                                transformOrigin: 'top center',
                                transition: 'transform 0.15s ease-out'
                              }}
                            />
                          );
                        })()}
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
                      <h3>{activeLessonContent.practice?.content_type === 'markdown' ? 'Interactive Scenario / Case Study' : 'Interactive Coding Sandbox'}</h3>
                      {activeLessonContent.practice?.content_type === 'markdown' ? (
                        <ContentRenderer text={activeLessonContent.practice?.code_block || ''} />
                      ) : (
                        <pre className="code-block">{activeLessonContent.practice?.code_block || '// No code block available'}</pre>
                      )}
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
                      <option value="pdf">PDF Document (.pdf)</option>
                      <option value="docx">Word Document (.docx)</option>
                      <option value="md">Markdown Document (.md)</option>
                      <option value="html">Web Page (.html)</option>
                      <option value="zip">ZIP Package (PDF, DOCX, HTML & MD)</option>
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
                    <button className="file-upload-btn" onClick={() => setIsExportModalOpen(false)} disabled={isExporting}>Cancel</button>
                    <button className="action-btn" onClick={handleExport} disabled={isExporting}>
                      {isExporting ? <><IconSpinner /> Exporting…</> : '📥 Download'}
                    </button>
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