import React, { useState, useEffect, useRef } from 'react';

export function LandingPage({ onNavigate, requireAuth, onLoginSuccess }) {
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
