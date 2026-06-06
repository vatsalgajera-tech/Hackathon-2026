import { useState, useEffect } from 'react';
import api from '../../services/api';
import { timeAgo } from '../../utils/aiEngine';
import { Activity, Filter, X, FileText, Building2, ShoppingCart, Receipt, GitBranch, LogIn, RefreshCw } from 'lucide-react';
import './Activity.css';

const demoActivities = [
  { _id: '1', type: 'rfq', action: 'created', description: "RFQ 'Laptop Procurement Q2 2026' created", entityNumber: 'RFQ-2026-0001', performedByName: 'Admin', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { _id: '2', type: 'quotation', action: 'submitted', description: "ABC Technologies submitted quotation for RFQ", performedByName: 'Raj Patel', createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { _id: '3', type: 'approval', action: 'accepted', description: "Quotation from ABC Technologies accepted", performedByName: 'Manager', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { _id: '4', type: 'purchase_order', action: 'created', description: "Purchase Order PO-2026-0001 created", entityNumber: 'PO-2026-0001', performedByName: 'Admin', createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { _id: '5', type: 'invoice', action: 'created', description: "Invoice INV-202606-0001 generated", entityNumber: 'INV-202606-0001', performedByName: 'Admin', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { _id: '6', type: 'invoice', action: 'emailed', description: "Invoice INV-202606-0001 sent via email", entityNumber: 'INV-202606-0001', performedByName: 'Admin', createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString() },
  { _id: '7', type: 'vendor', action: 'created', description: "Vendor 'OfficeMax Pro' registered", performedByName: 'Admin', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
  { _id: '8', type: 'auth', action: 'logged_in', description: "Admin logged in", performedByName: 'Admin', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
  { _id: '9', type: 'rfq', action: 'updated', description: "RFQ 'Office Furniture Upgrade' status updated to awarded", entityNumber: 'RFQ-2026-0002', performedByName: 'Admin', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { _id: '10', type: 'purchase_order', action: 'updated', description: "PO PO-2026-0002 status updated to confirmed", entityNumber: 'PO-2026-0002', performedByName: 'Manager', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
];

const typeConfig = {
  rfq: { icon: FileText, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', label: 'RFQ' },
  quotation: { icon: Activity, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Quotation' },
  approval: { icon: GitBranch, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Approval' },
  purchase_order: { icon: ShoppingCart, color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Purchase Order' },
  invoice: { icon: Receipt, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Invoice' },
  vendor: { icon: Building2, color: '#ec4899', bg: 'rgba(236,72,153,0.12)', label: 'Vendor' },
  auth: { icon: LogIn, color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Auth' },
};

export default function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity', { params: { type: filterType || undefined, page, limit: 20 } });
      setActivities(res.data.data);
      setTotal(res.data.total);
    } catch {
      const filtered = filterType ? demoActivities.filter(a => a.type === filterType) : demoActivities;
      setActivities(filtered);
      setTotal(filtered.length);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchActivities(); }, [filterType, page]);

  return (
    <div className="activity-page animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">Complete audit trail of all procurement activities</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchActivities}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Type Filter */}
      <div className="activity-filters">
        <button className={`type-filter-btn ${filterType === '' ? 'active' : ''}`} onClick={() => { setFilterType(''); setPage(1); }}>
          All Events
        </button>
        {Object.entries(typeConfig).map(([key, cfg]) => (
          <button key={key} className={`type-filter-btn ${filterType === key ? 'active' : ''}`}
            onClick={() => { setFilterType(key); setPage(1); }}
            style={filterType === key ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}}>
            <cfg.icon size={13} /> {cfg.label}
          </button>
        ))}
        {filterType && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilterType('')}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state card">
          <Activity size={48} />
          <h3>No activity yet</h3>
          <p>Activity will appear here as procurement actions are taken</p>
        </div>
      ) : (
        <div className="activity-timeline card" style={{ padding: '20px 24px' }}>
          {activities.map((activity, idx) => {
            const cfg = typeConfig[activity.type] || typeConfig.auth;
            const Icon = cfg.icon;
            return (
              <div key={activity._id} className="activity-item">
                <div className="activity-left">
                  <div className="activity-icon" style={{ background: cfg.bg, color: cfg.color }}>
                    <Icon size={16} />
                  </div>
                  {idx < activities.length - 1 && <div className="activity-line" />}
                </div>
                <div className="activity-content">
                  <div className="activity-header">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="activity-type-badge" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                      {activity.entityNumber && (
                        <span className="activity-entity">{activity.entityNumber}</span>
                      )}
                      <span className={`activity-action action-${activity.action}`}>{activity.action}</span>
                    </div>
                    <span className="activity-time">{timeAgo(activity.createdAt)}</span>
                  </div>
                  <p className="activity-description">{activity.description}</p>
                  <span className="activity-actor">
                    👤 {activity.performedByName || activity.performedBy?.name || 'System'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-4">
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Previous
          </button>
          <span className="text-muted text-sm" style={{ padding: '8px 12px' }}>
            Page {page} · {total} total
          </span>
          <button className="btn btn-secondary btn-sm" disabled={activities.length < 20} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
