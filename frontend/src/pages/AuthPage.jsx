import React from 'react';
import { IconSpinner } from '../components/icons/Icons';

export function AuthPage({
  currentView,
  setCurrentView,
  handleAuthSubmit,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  showAuthPassword,
  setShowAuthPassword,
  authRole,
  setAuthRole,
  authLoading
}) {
  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: 'radial-gradient(circle at 50% 10%, rgba(72,107,245,0.06) 0%, transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: '980px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', background: 'var(--white)', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--border-color)', boxShadow: '0 20px 50px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        
        {/* Left Visual Column */}
        <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #1e264a 100%)', padding: '48px 40px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'var(--blue)', filter: 'blur(70px)', opacity: 0.25 }}></div>
          <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'var(--gold)', filter: 'blur(80px)', opacity: 0.15 }}></div>

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.04em', color: 'var(--gold)', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.15)' }}>
              ⚡ CURRICULA AI SUITE
            </div>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1.25, margin: '0 0 16px 0', letterSpacing: '-0.02em', color: '#fff' }}>
              {currentView === 'login' ? 'Welcome Back to Next-Gen Course Creation.' : 'Transform Topics into Production-Ready Curricula.'}
            </h2>
            <p style={{ fontSize: '0.94rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
              {currentView === 'login' 
                ? 'Sign in to access your custom AI pedagogical proposals, multi-role exports, and dynamic lesson studio.' 
                : 'Join thousands of instructional designers and educators leveraging autonomous AI for rapid, multi-perspective course authoring.'}
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 2, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '24px', marginTop: '40px' }}>
            <div style={{ display: 'flex', gap: '18px' }}>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--gold)' }}>3 Roles</div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Creator, Student, Educator</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.12)' }}></div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--blue-light)' }}>1-Click</div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>PDF, Slide, DOCX Export</div>
              </div>
            </div>
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
  );
}
