import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// ── Context ────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Local storage keys ─────────────────────────────────────────
const K = { users: 'vb_local_users', token: 'vb_token', user: 'vb_user' };

// ── Offline helpers ────────────────────────────────────────────
const getUsers  = () => { try { return JSON.parse(localStorage.getItem(K.users) || '[]'); } catch { return []; } };
const setUsers  = (u) => localStorage.setItem(K.users, JSON.stringify(u));
const hashPw    = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i); return (h >>> 0).toString(36); };
const makeToken = (u) => btoa(JSON.stringify({ id: u.id, exp: Date.now() + 604800000 }));

const offlineRegister = ({ name, email, password, role }) => {
  const users = getUsers();
  const em = email.trim().toLowerCase();
  if (users.find(u => u.email === em)) throw new Error('Email already registered. Please log in.');
  const nu = { id: `L${Date.now()}`, name: name.trim(), email: em, role: role || 'procurement_officer', _h: hashPw(password) };
  setUsers([...users, nu]);
  const { _h, ...safe } = nu;
  return { token: makeToken(safe), user: safe };
};

const offlineLogin = (email, password) => {
  const em = email.trim().toLowerCase();
  const u  = getUsers().find(x => x.email === em);
  if (!u)           throw new Error('No account with this email. Please register first.');
  if (u._h !== hashPw(password)) throw new Error('Incorrect password.');
  const { _h, ...safe } = u;
  return { token: makeToken(safe), user: safe };
};

// ── Provider ───────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem(K.token);
      const u = localStorage.getItem(K.user);
      if (t && u) setUser(JSON.parse(u));
    } catch {
      localStorage.removeItem(K.token);
      localStorage.removeItem(K.user);
    } finally { setLoading(false); }
  }, []);

  const save = (token, userData) => {
    localStorage.setItem(K.token, token);
    localStorage.setItem(K.user,  JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (fd) => {
    try {
      const { data } = await api.post('/auth/register', fd);
      save(data.token, data.user);
      return { user: data.user, offline: false };
    } catch (e) {
      if (e.isNetworkError) { const r = offlineRegister(fd); save(r.token, r.user); return { user: r.user, offline: true }; }
      throw e;
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      save(data.token, data.user);
      return { user: data.user, offline: false };
    } catch (e) {
      if (e.isNetworkError) { const r = offlineLogin(email, password); save(r.token, r.user); return { user: r.user, offline: true }; }
      throw e;
    }
  };

  const logout = () => { localStorage.removeItem(K.token); localStorage.removeItem(K.user); setUser(null); };
  const hasRole = (...roles) => roles.includes(user?.role);

  return <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>{children}</AuthContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
