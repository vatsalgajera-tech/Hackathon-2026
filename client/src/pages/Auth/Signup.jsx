import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight,
  AlertCircle, Cpu, ShieldCheck, Briefcase,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../services/api';
import './Auth.css';

const ROLES = [
  { value: 'procurement_officer', label: 'Procurement Officer' },
  { value: 'manager', label: 'Manager / Approver' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'admin', label: 'Administrator' },
];

const validateForm = ({ name, email, password }) => {
  if (!name.trim()) return 'Full name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (!email.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'procurement_officer',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validErr = validateForm(form);
    if (validErr) { setError(validErr); return; }

    setLoading(true);
    try {
      const { user, source } = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      if (source === 'local') {
        toast.success(`Account created, ${user.name.split(' ')[0]}! (offline mode)`);
      } else {
        toast.success(`Welcome to VendorBridge, ${user.name.split(' ')[0]}!`);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: '#ef4444', pct: '20%' };
    if (p.length < 8) return { label: 'Weak', color: '#f59e0b', pct: '45%' };
    if (p.length < 12) return { label: 'Good', color: '#3b82f6', pct: '70%' };
    return { label: 'Strong', color: '#10b981', pct: '100%' };
  })();

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-logo"><Cpu size={26} /></div>
          <h1 className="auth-product-name">VendorBridge AI</h1>
          <p className="auth-tagline">AI-Powered Procurement &amp; Vendor Management ERP</p>
          <div className="auth-features">
            {[
              'Smart vendor recommendation engine',
              'Real-time procurement health scoring',
              'Automated approval workflows',
              'Invoice generation & email delivery',
            ].map((f, i) => (
              <div key={i} className="auth-feature">
                <ShieldCheck size={15} /><span>{f}</span>
              </div>
            ))}
          </div>
          <div className="auth-decoration" />
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-wrap animate-slide">
          <div className="auth-header">
            <h2>Create your account</h2>
            <p>Join VendorBridge to start managing procurement</p>
          </div>

          {error && (
            <div className="auth-alert" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <div className="input-with-icon">
                <User size={15} className="input-icon" />
                <input
                  id="signup-name" type="text"
                  className="form-control has-icon"
                  placeholder="John Doe"
                  value={form.name} onChange={set('name')}
                  autoComplete="name" disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={15} className="input-icon" />
                <input
                  id="signup-email" type="email"
                  className="form-control has-icon"
                  placeholder="you@company.com"
                  value={form.email} onChange={set('email')}
                  autoComplete="email" disabled={loading}
                />
              </div>
            </div>

            {/* Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-role">Your Role</label>
              <div className="input-with-icon">
                <Briefcase size={15} className="input-icon" />
                <select
                  id="signup-role"
                  className="form-control has-icon"
                  value={form.role} onChange={set('role')}
                  disabled={loading}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <div className="input-with-icon">
                <Lock size={15} className="input-icon" />
                <input
                  id="signup-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control has-icon has-icon-right"
                  placeholder="Min. 6 characters"
                  value={form.password} onChange={set('password')}
                  autoComplete="new-password" disabled={loading}
                />
                <button type="button" className="input-icon-right"
                  onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {strength && (
                <div className="password-strength">
                  <div className="strength-bar-bg">
                    <div className="strength-bar-fill"
                      style={{ width: strength.pct, background: strength.color }} />
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full"
              disabled={loading} id="signup-submit">
              {loading
                ? <span className="btn-spinner" />
                : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>

          <Link to="/login" className="btn btn-secondary btn-lg w-full"
            style={{ justifyContent: 'center' }}>
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
