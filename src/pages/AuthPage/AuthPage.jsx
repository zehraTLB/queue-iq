import { useState, useRef, useCallback } from 'react';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CalendarCheck2,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authErrorMessage } from '../../utils/authErrors';
import './AuthPage.scss';

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
      <Lock className="input-icon" size={17} />
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
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function OAuthButtons({ showToast, disabled }) {
  const { loginWithGoogle, loginWithMicrosoft } = useAuth();

  const handle = async (fn) => {
    try {
      await fn();
    } catch (err) {
      showToast(authErrorMessage(err), false);
    }
  };

  return (
    <div className="oauth-row">
      <button type="button" className="btn-oauth" disabled={disabled} onClick={() => handle(loginWithGoogle)}>
        <GoogleSvg /> Google
      </button>
      <button type="button" className="btn-oauth" disabled={disabled} onClick={() => handle(loginWithMicrosoft)}>
        <MicrosoftSvg /> Microsoft
      </button>
    </div>
  );
}

function LoginForm({ showToast }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const emailErr = !isEmail(email);
    const passErr = !password;
    setErrors({ email: emailErr, password: passErr });
    if (emailErr || passErr) return;

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      showToast(authErrorMessage(err), false);
      setSubmitting(false);
    }
  };

  return (
    <form className="form-view active" onSubmit={handleLogin}>
      <div className="form-header">
        <div className="form-title">Welcome back</div>
        <div className="form-sub">Sign in to your QueueIQ dashboard</div>
      </div>

      <div className="field">
        <label>Email address</label>
        <div className={`input-wrap${errors.email ? ' error' : ''}`}>
          <Mail className="input-icon" size={17} />
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

      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? <><Loader2 className="btn-spinner" size={17} /> Signing in…</> : 'Sign In'}
      </button>

      <div className="divider">or continue with</div>

      <OAuthButtons showToast={showToast} disabled={submitting} />
    </form>
  );
}

function RegisterForm({ showToast }) {
  const { register } = useAuth();
  const [role, setRole] = useState('doctor');
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [strength, setStrength] = useState(0);
  const [errors, setErrors] = useState({ fname: false, lname: false, email: false, password: false });
  const [submitting, setSubmitting] = useState(false);

  const roles = [
    { id: 'doctor', icon: Stethoscope, label: 'Doctor' },
    { id: 'staff', icon: ClipboardList, label: 'Staff' },
    { id: 'admin', icon: ShieldCheck, label: 'Admin' },
  ];

  const handleStrength = (val) => {
    setStrength(calcStrength(val));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const fnameErr = !fname.trim();
    const lnameErr = !lname.trim();
    const emailErr = !isEmail(email);
    const passErr = password.length < 8;
    setErrors({ fname: fnameErr, lname: lnameErr, email: emailErr, password: passErr });
    if (!terms) {
      showToast('Please accept the Terms of Service', false);
      return;
    }
    if (fnameErr || lnameErr || emailErr || passErr) return;

    setSubmitting(true);
    try {
      await register({
        email,
        password,
        firstName: fname.trim(),
        lastName: lname.trim(),
        role,
      });
    } catch (err) {
      showToast(authErrorMessage(err), false);
      setSubmitting(false);
    }
  };

  const sc = strength > 0 ? strengthClass(strength) : '';

  return (
    <form className="form-view active" onSubmit={handleRegister}>
      <div className="form-header">
        <div className="form-title">Create account</div>
        <div className="form-sub">Join QueueIQ — it takes under a minute</div>
      </div>

      <div className="field">
        <label>I am a</label>
        <div className="role-selector">
          {roles.map((r) => {
            const RoleIcon = r.icon;
            return (
              <button
                key={r.id}
                className={`role-btn${role === r.id ? ' selected' : ''}`}
                onClick={() => setRole(r.id)}
                type="button"
              >
                <RoleIcon className="role-icon" size={22} />
                <span className="role-label">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>First name</label>
          <div className={`input-wrap${errors.fname ? ' error' : ''}`}>
            <User className="input-icon" size={17} />
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
            <User className="input-icon" size={17} />
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
          <Mail className="input-icon" size={17} />
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

      <button className="btn-primary" type="submit" disabled={submitting}>
        {submitting ? <><Loader2 className="btn-spinner" size={17} /> Creating account…</> : 'Create Account'}
      </button>

      <div className="divider">or sign up with</div>

      <OAuthButtons showToast={showToast} disabled={submitting} />
    </form>
  );
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const { toast, showToast } = useToast();

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />
        <div className="bg-blob blob-3" />
      </div>

      <div className="layout">
        <div className="left-panel">
          <div className="brand">
            <div className="brand-icon">
              <CalendarCheck2 size={22} strokeWidth={2.2} />
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
              Scheduling platform with real-time slot optimization, no-show risk scoring, and dynamic queue intelligence for clinics and hospitals.
            </p>
          </div>

          <div className="float-cards">
            <div className="float-card">
              <div className="fc-dot fc-dot-risk">
                <Activity size={18} />
              </div>
              <div className="fc-content">
                <div className="fc-title">No-Show Risk Score</div>
                <div className="fc-sub">Patient #4821 — Risk: 74%</div>
              </div>
            </div>
            <div className="float-card">
              <div className="fc-dot fc-dot-slot">
                <Zap size={18} />
              </div>
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
          <div className="form-card">
            <div className="tabs">
              <div className={`tab-slider${activeTab === 'register' ? ' right' : ''}`} />
              <button
                className={`tab-btn${activeTab === 'login' ? ' active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                className={`tab-btn${activeTab === 'register' ? ' active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'login'
              ? <LoginForm showToast={showToast} />
              : <RegisterForm showToast={showToast} />}
          </div>
        </div>
      </div>

      <div className={`toast${toast.visible ? ' show' : ''}${toast.success ? ' ok' : ' warn'}`}>
        <span className="toast-icon">
          {toast.success ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
