import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDate, getStatusVariant } from '../../utils/aiEngine';
import {
  FileText, Building2, ShoppingCart, Receipt, TrendingUp, Clock,
  CheckCircle, AlertTriangle, Zap, ArrowRight, Brain, Activity,
  Plus, GitBranch, BarChart3, Star, Cpu, RefreshCw
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats]       = useState(null);
  const [health, setHealth]     = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [spendData, setSpendData]   = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes, spendRes, insightsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/ai/health-score'),
        api.get('/analytics/spending'),
        api.get('/ai/insights'),
      ]);
      setStats(statsRes.data.data);
      setHealth(healthRes.data.data);
      setAiInsights(insightsRes.data.data);
      const monthly = spendRes.data.data.monthlySpending.map(d => ({
        name: MONTHS[(d._id.month - 1)],
        spend: Math.round(d.total),
        orders: d.count,
      }));
      setSpendData(monthly);
    } catch {
      setStats({ totalRFQs: 5, activeRFQs: 2, pendingApprovals: 2, totalPOs: 5, totalVendors: 6, totalSpend: 5066400, recentPOs: [], recentInvoices: [] });
      setHealth({ healthScore: 82, status: 'Healthy', color: 'green', breakdown: { rfqCompletion: 80, invoiceCompletion: 85, poCompletion: 78, vendorPerf: 88 } });
      setAiInsights({ topVendor: { companyName: 'TechSupply Solutions' }, highRiskVendor: { companyName: 'Swift Logistics Ltd.' }, suggestion: 'TechSupply Solutions has the best on-time delivery record. Consider for all IT procurement.' });
      setSpendData([
        { name: 'Jan', spend: 320000, orders: 2 },
        { name: 'Feb', spend: 450000, orders: 3 },
        { name: 'Mar', spend: 580000, orders: 4 },
        { name: 'Apr', spend: 420000, orders: 3 },
        { name: 'May', spend: 870000, orders: 5 },
        { name: 'Jun', spend: 2112200, orders: 5 },
      ]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const healthColor = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' }[health?.color] || '#6366f1';
  const score = health?.healthScore || 0;

  return (
    <div className="dashboard animate-fade">
      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},
            {' '}{user?.name?.split(' ')[0]}! 👋
          </p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary btn-sm" onClick={fetchData}>
            <RefreshCw size={14} /> Refresh
          </button>
          {hasRole('procurement_officer', 'admin') && (
            <Link to="/rfqs" className="btn btn-primary btn-sm">
              <Plus size={14} /> New RFQ
            </Link>
          )}
        </div>
      </div>

      {/* ── TOP ROW: Health Score + AI Insights ─────── */}
      <div className="dashboard-top">
        {/* Procurement Health */}
        <div className="health-card glass">
          <div className="health-header">
            <div className="flex items-center gap-2">
              <div className="health-icon"><Brain size={20} /></div>
              <div>
                <h3>Procurement Health</h3>
                <p className="text-xs text-muted">AI Analysis</p>
              </div>
            </div>
            <span className={`badge badge-${health?.color === 'green' ? 'success' : health?.color === 'yellow' ? 'warning' : 'danger'} badge-dot`}>
              {health?.status || 'Computing...'}
            </span>
          </div>

          {/* ── Simple circle (no SVG ring glow) ── */}
          <div className="health-score-circle">
            <div className="health-circle-bg">
              <div className="health-circle-fill" style={{
                background: `conic-gradient(${healthColor} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
              }}>
                <div className="health-circle-inner">
                  <span className="health-number" style={{ color: healthColor }}>{score}</span>
                  <span className="health-unit">/100</span>
                </div>
              </div>
            </div>
          </div>

          <div className="health-breakdown">
            {health?.breakdown && Object.entries({
              'RFQ Completion': health.breakdown.rfqCompletion,
              'Invoice Rate':   health.breakdown.invoiceCompletion,
              'PO Delivery':    health.breakdown.poCompletion,
              'Vendor Perf.':   health.breakdown.vendorPerf,
            }).map(([key, val]) => (
              <div key={key} className="breakdown-item">
                <span className="breakdown-label">{key}</span>
                <div className="breakdown-bar-bg">
                  <div className="breakdown-bar" style={{ width: `${val}%`, background: healthColor }} />
                </div>
                <span className="breakdown-val">{val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="ai-insights glass">
          <div className="flex items-center gap-2 mb-4">
            <div className="ai-header-icon"><Cpu size={18} /></div>
            <div>
              <h3>AI Procurement Insights</h3>
              <p className="text-xs text-muted">Smart decision support</p>
            </div>
          </div>

          <div className="ai-insight-item">
            <div className="ai-insight-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>🏆</div>
            <div>
              <span className="ai-insight-label">Recommended Vendor</span>
              <span className="ai-insight-value">{aiInsights?.topVendor?.companyName || 'No data yet'}</span>
            </div>
          </div>

          <div className="ai-insight-item">
            <div className="ai-insight-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>📈</div>
            <div>
              <span className="ai-insight-label">Procurement Health</span>
              <span className="ai-insight-value" style={{ color: healthColor }}>{health?.healthScore || '--'}/100 — {health?.status}</span>
            </div>
          </div>

          <div className="ai-insight-item">
            <div className="ai-insight-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>⚠️</div>
            <div>
              <span className="ai-insight-label">High Risk Vendor</span>
              <span className="ai-insight-value" style={{ color: '#ef4444' }}>{aiInsights?.highRiskVendor?.companyName || 'None detected'}</span>
            </div>
          </div>

          <div className="ai-suggestion">
            <Zap size={14} />
            <span>{aiInsights?.suggestion || 'Add vendors and RFQs to get AI suggestions.'}</span>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        {[
          { label: 'Active RFQs',       value: stats?.activeRFQs ?? '--',         icon: FileText,   color: '#6366f1', link: '/rfqs' },
          { label: 'Pending Approvals', value: stats?.pendingApprovals ?? '--',    icon: Clock,      color: '#f59e0b', link: '/approvals', urgent: (stats?.pendingApprovals || 0) > 0 },
          { label: 'Total Vendors',     value: stats?.totalVendors ?? '--',        icon: Building2,  color: '#10b981', link: '/vendors' },
          { label: 'Total Spend',       value: formatCurrency(stats?.totalSpend || 0), icon: TrendingUp, color: '#8b5cf6', link: '/reports' },
        ].map((s, i) => (
          <Link to={s.link} key={i} style={{ textDecoration: 'none' }}>
            <div className={`stat-card ${s.urgent ? 'urgent' : ''}`}>
              <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                <s.icon size={22} />
              </div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
              {s.urgent && <span className="urgent-badge">Urgent</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* ── CHART + QUICK ACTIONS ───────────────────────────────── */}
      <div className="dashboard-mid">
        {/* Spending Chart */}
        <div className="card spend-chart-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3>Monthly Spending</h3>
              <p className="text-sm text-muted">Procurement spend over time</p>
            </div>
            <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
          </div>
          {spendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={spendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v}`} />
                <Tooltip
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  formatter={v => [formatCurrency(v), 'Spend']}
                />
                <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 200 }}>
              <BarChart3 size={40} />
              <p>No spending data yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card quick-actions-card">
          <h3 className="mb-4">Quick Actions</h3>
          <div className="quick-actions-list">
            {hasRole('procurement_officer', 'admin') && (
              <>
                <Link to="/rfqs" className="quick-action">
                  <div className="qa-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366f1' }}><FileText size={18} /></div>
                  <div><span>Create RFQ</span><p>Start procurement process</p></div>
                  <ArrowRight size={16} className="qa-arrow" />
                </Link>
                <Link to="/vendors" className="quick-action">
                  <div className="qa-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}><Building2 size={18} /></div>
                  <div><span>Add Vendor</span><p>Register new supplier</p></div>
                  <ArrowRight size={16} className="qa-arrow" />
                </Link>
                <Link to="/purchase-orders" className="quick-action">
                  <div className="qa-icon" style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}><ShoppingCart size={18} /></div>
                  <div><span>Create PO</span><p>Generate purchase order</p></div>
                  <ArrowRight size={16} className="qa-arrow" />
                </Link>
              </>
            )}
            {hasRole('manager', 'admin') && (
              <Link to="/approvals" className="quick-action urgent-action">
                <div className="qa-icon" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}><GitBranch size={18} /></div>
                <div><span>Pending Approvals</span><p>{stats?.pendingApprovals || 0} awaiting your action</p></div>
                <ArrowRight size={16} className="qa-arrow" />
              </Link>
            )}
            <Link to="/reports" className="quick-action">
              <div className="qa-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}><BarChart3 size={18} /></div>
              <div><span>View Analytics</span><p>Procurement insights</p></div>
              <ArrowRight size={16} className="qa-arrow" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── RECENT ACTIVITY ──────────────────────────────────────── */}
      <div className="grid-2">
        {/* Recent POs */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3>Recent Purchase Orders</h3>
            <Link to="/purchase-orders" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {(stats?.recentPOs?.length || 0) > 0 ? (
            <div className="recent-list">
              {stats.recentPOs.map(po => (
                <div key={po._id} className="recent-item">
                  <div className="recent-icon"><ShoppingCart size={16} /></div>
                  <div className="flex-1">
                    <span className="recent-number">{po.poNumber}</span>
                    <p className="text-xs text-muted">{po.rfqId?.title || 'Purchase Order'}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${getStatusVariant(po.status)}`}>{po.status}</span>
                    <p className="text-xs text-muted mt-1">{formatCurrency(po.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <ShoppingCart size={32} />
              <p>No purchase orders yet</p>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3>Recent Invoices</h3>
            <Link to="/invoices" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {(stats?.recentInvoices?.length || 0) > 0 ? (
            <div className="recent-list">
              {stats.recentInvoices.map(inv => (
                <div key={inv._id} className="recent-item">
                  <div className="recent-icon"><Receipt size={16} /></div>
                  <div className="flex-1">
                    <span className="recent-number">{inv.invoiceNumber}</span>
                    <p className="text-xs text-muted">{inv.vendorId?.companyName}</p>
                  </div>
                  <div className="text-right">
                    <span className={`badge badge-${getStatusVariant(inv.status)}`}>{inv.status}</span>
                    <p className="text-xs text-muted mt-1">{formatCurrency(inv.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <Receipt size={32} />
              <p>No invoices yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
