import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Layout.css';

const pageNames = {
  '/dashboard':      'Dashboard',
  '/vendors':        'Vendor Management',
  '/rfqs':           'RFQ Management',
  '/quotations':     'Quotations',
  '/approvals':      'Approval Workflow',
  '/purchase-orders':'Purchase Orders',
  '/invoices':       'Invoices',
  '/activity':       'Activity Logs',
  '/reports':        'Reports & Analytics',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location   = useLocation();
  const { user }   = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pageName   = pageNames[location.pathname] || 'VendorBridge AI';

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="layout-main">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="layout-header no-print">
          <div className="header-left">
            <button className="btn btn-icon btn-secondary" onClick={() => setCollapsed(c => !c)} aria-label="Toggle sidebar">
              <Menu size={18} />
            </button>
            <h1 className="header-title">{pageName}</h1>
          </div>

          <div className="header-right">
            {/* ── Theme Toggle ─────────────────────────── */}
            <button
              className="theme-toggle btn btn-icon btn-secondary"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to Light Mode ☀️' : 'Switch to Dark Mode 🌙'}
              id="theme-toggle-btn"
            >
              <span className="theme-toggle-inner">
                {theme === 'dark'
                  ? <Sun  size={17} className="theme-icon sun"  />
                  : <Moon size={17} className="theme-icon moon" />
                }
              </span>
            </button>

            {/* ── User Info ────────────────────────────── */}
            <div className="header-user">
              <div className="header-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <div className="header-user-info">
                <span className="header-user-name">{user?.name}</span>
                <span className="header-user-role">{user?.role?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Content ──────────────────────────────────────────── */}
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
