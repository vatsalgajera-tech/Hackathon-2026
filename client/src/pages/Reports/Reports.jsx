import { useState, useEffect } from 'react';
import api from '../../services/api';
import { computeHealthScore, formatCurrency } from '../../utils/aiEngine';
import { BarChart3, TrendingUp, Brain, Building2, ShoppingCart, Receipt, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Reports.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

const demoStats = {
  totalVendors: 32, totalRFQs: 24, totalPOs: 18, totalInvoices: 14,
  totalSpend: 4850000, paidInvoices: 10, pendingInvoices: 4,
  avgDeliveryDays: 12, topCategory: 'IT & Software',
  rfqsByStatus: [{ status: 'open', count: 8 }, { status: 'under_review', count: 4 }, { status: 'awarded', count: 9 }, { status: 'cancelled', count: 3 }],
  posByStatus: [{ status: 'pending', count: 3 }, { status: 'confirmed', count: 6 }, { status: 'delivered', count: 9 }],
  topVendors: [
    { companyName: 'ABC Technologies', totalOrders: 48, completedOrders: 45, rating: 4.8 },
    { companyName: 'OfficeMax Pro', totalOrders: 70, completedOrders: 67, rating: 4.5 },
    { companyName: 'XYZ Industries', totalOrders: 35, completedOrders: 28, rating: 3.8 },
  ],
  monthlySpend: [
    { month: 'Jan', spend: 320000 }, { month: 'Feb', spend: 450000 },
    { month: 'Mar', spend: 380000 }, { month: 'Apr', spend: 620000 },
    { month: 'May', spend: 540000 }, { month: 'Jun', spend: 780000 },
  ],
  healthScore: { healthScore: 87, status: 'Healthy', color: 'green', breakdown: { rfqCompletion: 85, invoiceCompletion: 90, poCompletion: 82, vendorPerf: 91 } },
  aiRisk: [
    { companyName: 'FastSupply Ltd', riskScore: 72, riskLevel: 'High' },
    { companyName: 'XYZ Industries', riskScore: 44, riskLevel: 'Medium' },
    { companyName: 'ABC Technologies', riskScore: 8, riskLevel: 'Low' },
    { companyName: 'OfficeMax Pro', riskScore: 12, riskLevel: 'Low' },
  ]
};

const TOOLTIP_STYLE = { background: '#1a1a2e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', color: '#e2e8f0' };

export default function Reports() {
  const [stats, setStats] = useState(demoStats);
  const [health, setHealth] = useState(demoStats.healthScore);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [analyticsRes, healthRes, riskRes] = await Promise.all([
          api.get('/analytics/dashboard'),
          api.get('/ai/health-score'),
          api.get('/ai/vendor-risk'),
        ]);
        setStats(s => ({ ...s, ...analyticsRes.data.data }));
        setHealth(healthRes.data.data);
        setStats(s => ({ ...s, aiRisk: riskRes.data.data }));
      } catch {
        // keep demo data
      } finally { setLoading(false); }
    };
    fetchReports();
  }, []);

  const healthColor = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' }[health?.color] || '#6366f1';

  return (
    <div className="reports-page animate-fade">
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <p className="page-subtitle">AI-powered procurement intelligence dashboard</p>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid-4">
        {[
          { label: 'Total Spend', value: formatCurrency(stats.totalSpend), icon: DollarSign, color: '#6366f1', sub: 'Cumulative procurement' },
          { label: 'Active Vendors', value: stats.totalVendors, icon: Building2, color: '#10b981', sub: 'Registered suppliers' },
          { label: 'Purchase Orders', value: stats.totalPOs, icon: ShoppingCart, color: '#f59e0b', sub: `${stats.posByStatus?.find(p => p.status === 'delivered')?.count || 0} delivered` },
          { label: 'Invoices', value: stats.totalInvoices, icon: Receipt, color: '#8b5cf6', sub: `${stats.paidInvoices} paid · ${stats.pendingInvoices} pending` },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card" style={{ '--kcolor': kpi.color }}>
            <div className="kpi-icon" style={{ background: `${kpi.color}18`, color: kpi.color }}><kpi.icon size={22} /></div>
            <div>
              <div className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-sub">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Health Score + Monthly Spend ──────────────────────────────── */}
      <div className="reports-row">
        {/* Health Score Gauge */}
        <div className="card health-report">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} style={{ color: 'var(--primary)' }} />
            <h3>AI Procurement Health Score</h3>
          </div>
          <div className="health-score-circle" style={{ width: 130, height: 130, margin: '0 auto 20px' }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={healthColor}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(health?.healthScore || 0) * 3.14} 314`}
                transform="rotate(-90 60 60)"
                style={{ filter: `drop-shadow(0 0 8px ${healthColor})` }} />
            </svg>
            <div className="health-score-value">
              <span style={{ fontSize: '2rem', fontWeight: 800, color: healthColor }}>{health?.healthScore}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {health?.breakdown && Object.entries({ 'RFQ Completion': health.breakdown.rfqCompletion, 'Invoice Rate': health.breakdown.invoiceCompletion, 'PO Delivery': health.breakdown.poCompletion, 'Vendor Perf.': health.breakdown.vendorPerf }).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 100 }}>{key}</span>
                <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: healthColor, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', width: 32, textAlign: 'right' }}>{val}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Spending */}
        <div className="card spend-chart">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} style={{ color: 'var(--accent)' }} />
            <h3>Monthly Procurement Spend</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.monthlySpend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [formatCurrency(v), 'Spend']} />
              <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Status Distribution ──────────────────────────────────────────── */}
      <div className="grid-2">
        {/* RFQ Status Pie */}
        <div className="card">
          <h3 className="mb-4">RFQ Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.rfqsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status} (${count})`} labelLine={false}>
                {stats.rfqsByStatus?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* PO Status Pie */}
        <div className="card">
          <h3 className="mb-4">Purchase Order Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.posByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${status} (${count})`} labelLine={false}>
                {stats.posByStatus?.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── AI Vendor Risk Table + Top Vendors ──────────────────────────── */}
      <div className="grid-2">
        {/* AI Risk Ranking */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} style={{ color: 'var(--primary)' }} />
            <h3>AI Vendor Risk Ranking</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Vendor</th><th>Risk Score</th><th>Level</th></tr></thead>
              <tbody>
                {(stats.aiRisk || []).map(v => (
                  <tr key={v.companyName}>
                    <td className="font-medium">{v.companyName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 3 }}>
                          <div style={{ width: `${v.riskScore}%`, height: '100%', borderRadius: 3, background: v.riskScore > 60 ? '#ef4444' : v.riskScore > 30 ? '#f59e0b' : '#10b981' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, width: 28 }}>{v.riskScore}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${v.riskLevel === 'High' ? 'danger' : v.riskLevel === 'Medium' ? 'warning' : 'success'}`}>{v.riskLevel}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vendors */}
        <div className="card">
          <h3 className="mb-4">Top Performing Vendors</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(stats.topVendors || []).map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${COLORS[i]}, ${COLORS[i + 1] || COLORS[0]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v.companyName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {v.completedOrders}/{v.totalOrders} orders · ⭐ {v.rating}
                  </div>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS[i] }}>
                  {Math.round((v.completedOrders / v.totalOrders) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
