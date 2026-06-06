import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, FileText, MessageSquare,
  GitBranch, ShoppingCart, Receipt, Activity, BarChart3,
  LogOut, ChevronRight, Cpu, Settings
} from 'lucide-react';
import './Sidebar.css';

const navGroups = [
  {
    label: 'Main',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
    ]
  },
  {
    label: 'Procurement',
    items: [
      { icon: Building2, label: 'Vendors', path: '/vendors', roles: ['admin', 'procurement_officer', 'manager'] },
      { icon: FileText, label: 'RFQs', path: '/rfqs', roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
      { icon: MessageSquare, label: 'Quotations', path: '/quotations', roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
      { icon: GitBranch, label: 'Approvals', path: '/approvals', roles: ['admin', 'manager', 'procurement_officer'] },
      { icon: ShoppingCart, label: 'Purchase Orders', path: '/purchase-orders', roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
      { icon: Receipt, label: 'Invoices', path: '/invoices', roles: ['admin', 'procurement_officer', 'manager', 'vendor'] },
    ]
  },
  {
    label: 'Insights',
    items: [
      { icon: Activity, label: 'Activity Logs', path: '/activity', roles: ['admin', 'procurement_officer', 'manager'] },
      { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['admin', 'procurement_officer', 'manager'] },
    ]
  }
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleLabel = {
    admin: 'Administrator', procurement_officer: 'Procurement Officer',
    manager: 'Manager / Approver', vendor: 'Vendor'
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Brand ──────────────────────────────────────────────── */}
      <div className="sidebar-brand" onClick={onToggle}>
        <div className="brand-icon">
          <Cpu size={22} />
        </div>
        {!collapsed && (
          <div className="brand-text">
            <span className="brand-name">VendorBridge AI</span>
            <span className="brand-tagline">Smart Procurement ERP</span>
          </div>
        )}

        <ChevronRight className={`collapse-arrow ${collapsed ? '' : 'rotated'}`} size={16} />
      </div>

      {/* ── User Badge ─────────────────────────────────────────────────── */}
      {!collapsed && user && (
        <div className="sidebar-user">
          <div className="user-avatar">{user.name?.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{roleLabel[user.role] || user.role}</span>
          </div>
        </div>
      )}

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="sidebar-nav">
        {navGroups.map(group => {
          const visibleItems = group.items.filter(item => item.roles.includes(user?.role));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="nav-group">
              {!collapsed && <span className="nav-group-label">{group.label}</span>}
              {visibleItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <item.icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
