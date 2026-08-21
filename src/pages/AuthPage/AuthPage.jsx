import { useState, useEffect, useRef, useCallback } from 'react';
import './AuthPage.scss';

const IconEmail = () => (
  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = () => (
  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconUser = () => (
  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconEyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconBrand = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const GoogleSvg = () => (
  <svg viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MicrosoftSvg = () => (
  <svg viewBox="0 0 24 24">
    <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022" />
    <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00" />
    <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF" />
    <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900" />
  </svg>
);

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const calcStrength = (val) => {
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  return score;
};

const strengthClass = (score) => {
  if (score <= 1) return 'lit-weak';
  if (score === 2) return 'lit-fair';
  return 'lit-good';
};

function useParticleCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [], raf;

    function Particle() {
      this.x = Math.random() * W;
      this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.5 + 0.1;
    }

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }

    function init() {
      resize();
      particles = Array.from({ length: 80 }, () => new Particle());
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,194,168,${p.alpha})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,194,168,${0.08 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    init();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}

function useToast() {
  const [toast, setToast] = useState({ visible: false, message: '', success: true });
  const timerRef = useRef(null);

  const showToast = useCallback((message, success) => {
    setToast({ visible: true, message, success });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 3200);
  }, []);

  return { toast, showToast };
}

function PasswordField({ id, value, onChange, placeholder, autoComplete, onStrengthChange }) {
  const [show, setShow] = useState(false);

  const handleChange = (e) => {
    onChange(e);
    if (onStrengthChange) onStrengthChange(e.target.value);
  };

  return (
    <div className="input-wrap">
      <IconLock />
      <input
        type={show ? 'text' : 'password'}
        id={id}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        className="input-toggle"
        type="button"
        aria-label="Toggle password"
        onClick={() => setShow((s) => !s)}
      >
        {show ? <IconEyeClosed /> : <IconEyeOpen />}
      </button>
    </div>
  );
}

function LoginForm({ showToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: false, password: false });

  const handleLogin = () => {
    const emailErr = !isEmail(email);
    const passErr = !password;
    setErrors({ email: emailErr, password: passErr });
    if (!emailErr && !passErr) {
      showToast('✅ Signed in successfully! Redirecting…', true);
    }
  };

  return (
    <div className="form-view active">
      <div className="form-header">
        <div className="form-title">Welcome back</div>
        <div className="form-sub">Sign in to your QueueIQ dashboard</div>
      </div>

      <div className="field">
        <label>Email address</label>
        <div className={`input-wrap${errors.email ? ' error' : ''}`}>
          <IconEmail />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
            autoComplete="email"
          />
        </div>
        <span className={`err-msg${errors.email ? ' visible' : ''}`}>Please enter a valid email.</span>
      </div>

      <div className="field">
        <label>Password</label>
        <div className={errors.password ? 'error' : ''}>
          <PasswordField
            id="login-pass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        <span className={`err-msg${errors.password ? ' visible' : ''}`}>Password is required.</span>
      </div>

      <div className="forgot-link">
        <a href="#">Forgot password?</a>
      </div>

      <button className="btn-primary" onClick={handleLogin}>Sign In</button>

      <div className="divider">or continue with</div>

      <div className="oauth-row">
        <button className="btn-oauth" onClick={() => showToast('🔗 Google sign-in coming soon', false)}>
          <GoogleSvg /> Google
        </button>
        <button className="btn-oauth" onClick={() => showToast('🔗 Microsoft sign-in coming soon', false)}>
          <MicrosoftSvg /> Microsoft
        </button>
      </div>
    </div>
  );
}

function RegisterForm({ showToast }) {
  const [role, setRole] = useState('doctor');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [strength, setStrength] = useState(0);
  const [errors, setErrors] = useState({ fname: false, lname: false, email: false, password: false });

  const roles = [
    { id: 'doctor', icon: '🩺', label: 'Doctor' },
    { id: 'staff', icon: '👩‍💼', label: 'Staff' },
    { id: 'admin', icon: '🛡️', label: 'Admin' },
  ];

  const handleStrength = (val) => {
    setStrength(calcStrength(val));
  };

  const handleRegister = () => {
    const fnameErr = !fname.trim();
    const lnameErr = !lname.trim();
    const emailErr = !isEmail(email);
    const passErr = password.length < 8;
    setErrors({ fname: fnameErr, lname: lnameErr, email: emailErr, password: passErr });
    if (!terms) {
      showToast('⚠️ Please accept the Terms of Service', false);
      return;
    }
    if (!fnameErr && !lnameErr && !emailErr && !passErr) {
      showToast('🎉 Account created! Welcome to QueueIQ', true);
    }
  };

  const sc = strength > 0 ? strengthClass(strength) : '';

  return (
    <div className="form-view active">
      <div className="form-header">
        <div className="form-title">Create account</div>
        <div className="form-sub">Join QueueIQ — it takes under a minute</div>
      </div>

      <div className="field">
        <label>I am a</label>
        <div className="role-selector">
          {roles.map((r) => (
            <button
              key={r.id}
              className={`role-btn${role === r.id ? ' selected' : ''}`}
              onClick={() => setRole(r.id)}
              type="button"
            >
              <span className="role-icon">{r.icon}</span>
              <span className="role-label">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>First name</label>
          <div className={`input-wrap${errors.fname ? ' error' : ''}`}>
            <IconUser />
            <input
              type="text"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
            />
          </div>
        </div>
        <div className="field">
          <label>Last name</label>
          <div className={`input-wrap${errors.lname ? ' error' : ''}`}>
            <IconUser />
            <input
              type="text"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              placeholder="Smith"
              autoComplete="family-name"
            />
          </div>
        </div>
      </div>

      <div className="field">
        <label>Work email</label>
        <div className={`input-wrap${errors.email ? ' error' : ''}`}>
          <IconEmail />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@clinic.com"
            autoComplete="email"
          />
        </div>
        <span className={`err-msg${errors.email ? ' visible' : ''}`}>Please enter a valid email.</span>
      </div>

      <div className="field">
        <label>Password</label>
        <div className={errors.password ? 'error' : ''}>
          <PasswordField
            id="reg-pass"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            onStrengthChange={handleStrength}
          />
        </div>
        <div className="strength-bar">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`strength-seg${i < strength ? ` ${sc}` : ''}`}
            />
          ))}
        </div>
        <span className={`err-msg${errors.password ? ' visible' : ''}`}>Password must be at least 8 characters.</span>
      </div>

      <div className="checkbox-field">
        <input
          type="checkbox"
          id="terms"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
        />
        <label htmlFor="terms">
          I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
        </label>
      </div>

      <button className="btn-primary" onClick={handleRegister}>Create Account</button>

      <div className="divider">or sign up with</div>

      <div className="oauth-row">
        <button className="btn-oauth" onClick={() => showToast('🔗 Google sign-up coming soon', false)}>
          <GoogleSvg /> Google
        </button>
        <button className="btn-oauth" onClick={() => showToast('🔗 Microsoft sign-up coming soon', false)}>
          <MicrosoftSvg /> Microsoft
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const canvasRef = useRef(null);
  const { toast, showToast } = useToast();

  useParticleCanvas(canvasRef);

  const switchTab = (tab) => setActiveTab(tab);

  return (
    <>
      <canvas ref={canvasRef} className="bg-canvas" />
      <div className="grid-overlay" />

      <div className="layout">
        <div className="left-panel">
          <div className="brand">
            <div className="brand-icon">
              <IconBrand />
            </div>
            <span className="brand-name">Queue<span>IQ</span></span>
          </div>

          <div className="hero">
            <div className="hero-tag">Intelligent Queue Management</div>
            <h1>
              Smarter<br />
              Appointments,<br />
              <em>Zero</em> Wasted Slots
            </h1>
            <p>
              Scheduling platform with real-time slot optimization, no-show risk scoring, and dynamic queue intelligence.
            </p>
          </div>

          <div className="float-cards">
            <div className="float-card">
              <div className="fc-dot" style={{ background: 'rgba(0,194,168,.15)' }}>📉</div>
              <div className="fc-content">
                <div className="fc-title">No-Show Risk Score</div>
                <div className="fc-sub">Patient #4821 — Risk: 74%</div>
              </div>
            </div>
            <div className="float-card">
              <div className="fc-dot" style={{ background: 'rgba(0,120,255,.15)' }}>⚡</div>
              <div className="fc-content">
                <div className="fc-title">Slot Optimized</div>
                <div className="fc-sub">3 new bookings filled automatically</div>
              </div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-num">94<span>%</span></div>
              <div className="stat-label">Slot Utilization</div>
            </div>
            <div className="stat">
              <div className="stat-num">3.2<span>×</span></div>
              <div className="stat-label">Fewer No-Shows</div>
            </div>
            <div className="stat">
              <div className="stat-num">60<span>s</span></div>
              <div className="stat-label">Avg. Booking Time</div>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="tabs">
            <div className={`tab-slider${activeTab === 'register' ? ' right' : ''}`} />
            <button
              className={`tab-btn${activeTab === 'login' ? ' active' : ''}`}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              className={`tab-btn${activeTab === 'register' ? ' active' : ''}`}
              onClick={() => switchTab('register')}
            >
              Create Account
            </button>
          </div>

          {activeTab === 'login'
            ? <LoginForm showToast={showToast} />
            : <RegisterForm showToast={showToast} />}
        </div>
      </div>

      <div
        className={`toast${toast.visible ? ' show' : ''}`}
        style={{
          borderColor: toast.success
            ? 'rgba(0,194,168,.3)'
            : 'rgba(255,76,106,.3)',
        }}
      >
        <span className="toast-icon">{toast.success ? '✅' : '⚠️'}</span>
        <span>{toast.message}</span>
      </div>
    </>
  );
}
