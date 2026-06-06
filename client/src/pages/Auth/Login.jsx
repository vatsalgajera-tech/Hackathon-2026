import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Cpu, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../services/api';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim()) { setError('Please enter your email address.'); return; }
    if (!form.password) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      const { user, source } = await login(form.email.trim(), form.password);
      if (source === 'local') {
        toast.success(`Welcome back, ${user.name.split(' ')[0]}! (offline mode)`);
      } else {
        toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

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
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access VendorBridge</p>
          </div>

          {error && (
            <div className="auth-alert" role="alert">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <div className="input-with-icon">
                <Mail size={15} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-control has-icon"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <Lock size={15} className="input-icon" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control has-icon has-icon-right"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button type="button" className="input-icon-right"
                  onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full"
              disabled={loading} id="login-submit">
              {loading
                ? <span className="btn-spinner" />
                : <><span>Sign In</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="auth-divider"><span>New to VendorBridge?</span></div>

          <Link to="/signup" className="btn btn-secondary btn-lg w-full"
            style={{ justifyContent: 'center' }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
