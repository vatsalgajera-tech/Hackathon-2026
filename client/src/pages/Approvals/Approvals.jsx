import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getStatusVariant, formatDate, formatCurrency } from '../../utils/aiEngine';
import { GitBranch, CheckCircle, XCircle, Clock, MessageSquare, X, RefreshCw, ChevronRight, User, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import './Approvals.css';

const demoApprovals = [
  { _id: 'a1', rfqId: { rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement Q2 2026' }, vendorId: { companyName: 'ABC Technologies' }, totalPrice: 1380000, deliveryDays: 7, status: 'under_review', createdAt: '2026-06-04T10:00:00Z', notes: 'Includes 1-year warranty' },
  { _id: 'a2', rfqId: { rfqNumber: 'RFQ-2026-0002', title: 'Office Furniture Upgrade' }, vendorId: { companyName: 'OfficeMax Pro' }, totalPrice: 420000, deliveryDays: 14, status: 'under_review', createdAt: '2026-06-03T14:00:00Z', notes: '' },
  { _id: 'a3', rfqId: { rfqNumber: 'RFQ-2026-0003', title: 'Network Equipment' }, vendorId: { companyName: 'XYZ Industries' }, totalPrice: 950000, deliveryDays: 10, status: 'accepted', createdAt: '2026-06-01T09:00:00Z', notes: 'Bulk order discount' },
  { _id: 'a4', rfqId: { rfqNumber: 'RFQ-2026-0004', title: 'Office Supplies Monthly' }, vendorId: { companyName: 'FastSupply Ltd' }, totalPrice: 85000, deliveryDays: 3, status: 'rejected', createdAt: '2026-05-30T11:00:00Z', rejectionReason: 'Price too high compared to market rate', notes: '' },
];

const timeline = [
  { label: 'Quotation Submitted', icon: MessageSquare, color: '#6366f1' },
  { label: 'Under Review', icon: Clock, color: '#f59e0b' },
  { label: 'Manager Approval', icon: User, color: '#8b5cf6' },
  { label: 'Decision Made', icon: CheckCircle, color: '#10b981' },
];

export default function Approvals() {
  const { hasRole } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [remarkModal, setRemarkModal] = useState(null); // { id, action }
  const [remark, setRemark] = useState('');
  const [filterStatus, setFilterStatus] = useState('under_review');

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations', { params: { status: filterStatus || undefined } });
      setQuotations(res.data.data);
    } catch {
      setQuotations(filterStatus ? demoApprovals.filter(a => a.status === filterStatus) : demoApprovals);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchQuotations(); }, [filterStatus]);

  const handleAction = async (quotationId, action, remarks) => {
    setProcessing(quotationId);
    try {
      await api.put(`/quotations/${quotationId}/status`, {
        status: action === 'approve' ? 'accepted' : 'rejected',
        rejectionReason: remarks
      });
      toast.success(action === 'approve' ? '✅ Quotation approved!' : '❌ Quotation rejected.');
      setRemarkModal(null);
      setRemark('');
      fetchQuotations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally { setProcessing(null); }
  };

  const openRemark = (id, action) => { setRemarkModal({ id, action }); setRemark(''); };

  // Counts from real API data (fetched for all statuses)
  const [allQuotations, setAllQuotations] = useState([]);
  useEffect(() => {
    api.get('/quotations').then(r => setAllQuotations(r.data.data || [])).catch(() => setAllQuotations(demoApprovals));
  }, [quotations]); // refresh counts whenever filtered list changes

  const pendingCount  = allQuotations.filter(q => q.status === 'under_review').length;
  const approvedCount = allQuotations.filter(q => q.status === 'accepted').length;
  const rejectedCount = allQuotations.filter(q => q.status === 'rejected').length;
  const totalCount    = allQuotations.length;

  const filtered = quotations.filter(q =>
    !filterStatus || q.status === filterStatus
  );

  return (
    <div className="approvals-page animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Approval Workflow</h1>
          <p className="page-subtitle">Review and process procurement approvals</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchQuotations}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Approval Timeline Header */}
      <div className="approval-timeline-header card card-sm">
        {timeline.map((step, i) => (
          <div key={i} className="timeline-step">
            <div className="timeline-icon" style={{ background: `${step.color}20`, color: step.color }}>
              <step.icon size={16} />
            </div>
            <span className="timeline-label">{step.label}</span>
            {i < timeline.length - 1 && <ChevronRight size={14} className="timeline-arrow" />}
          </div>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div className="approval-tabs">
        {[
          ['', 'All', quotations.length],
          ['under_review', 'Pending', pendingCount],
          ['accepted', 'Approved', approvedCount],
          ['rejected', 'Rejected', rejectedCount],
        ].map(([val, label, count]) => (
          <button key={val} className={`approval-tab ${filterStatus === val ? 'active' : ''}`}
            onClick={() => setFilterStatus(val)}>
            {label}
            {count > 0 && val === 'under_review' && (
              <span className="tab-urgency">{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid-4">
        {[
          { label: 'Pending',  count: pendingCount,  color: '#f59e0b', icon: Clock },
          { label: 'Approved', count: approvedCount, color: '#10b981', icon: CheckCircle },
          { label: 'Rejected', count: rejectedCount, color: '#ef4444', icon: XCircle },
          { label: 'Total',    count: totalCount,    color: '#6366f1', icon: GitBranch },
        ].map((s, i) => (
          <div key={i} className="approval-stat" style={{ '--acolor': s.color }}>
            <div className="astat-icon" style={{ background: `${s.color}18`, color: s.color }}>
              <s.icon size={20} />
            </div>
            <div>
              <div className="astat-val" style={{ color: s.color }}>{s.count}</div>
              <div className="astat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Approval Cards */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <CheckCircle size={48} />
          <h3>No {filterStatus ? filterStatus.replace('_', ' ') : ''} approvals</h3>
          <p>All caught up! No pending approvals at this time.</p>
        </div>
      ) : (
        <div className="approvals-list">
          {filtered.map(q => (
            <div key={q._id} className={`approval-card ${q.status}`}>
              <div className="approval-card-left">
                <div className={`approval-status-indicator ${q.status}`} />
                <div className="approval-info">
                  <div className="approval-rfq">
                    <span className="rfq-badge">{q.rfqId?.rfqNumber || 'RFQ'}</span>
                    <h3 className="approval-title">{q.rfqId?.title || 'Procurement Request'}</h3>
                  </div>
                  <div className="approval-meta">
                    <span>🏢 {q.vendorId?.companyName || 'Unknown Vendor'}</span>
                    <span>💰 {formatCurrency(q.totalPrice)}</span>
                    <span>🚚 {q.deliveryDays} days delivery</span>
                    <span>📅 {formatDate(q.createdAt)}</span>
                  </div>
                  {q.notes && <p className="approval-notes">📝 {q.notes}</p>}
                  {q.status === 'rejected' && q.rejectionReason && (
                    <div className="rejection-reason">
                      <AlertTriangle size={13} />
                      <span>Rejected: {q.rejectionReason}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="approval-card-right">
                <span className={`badge badge-${getStatusVariant(q.status)}`}>
                  {q.status === 'under_review' ? '⏳ Pending' :
                    q.status === 'accepted' ? '✅ Approved' : '❌ Rejected'}
                </span>

                {q.status === 'under_review' && hasRole('manager', 'admin') && (
                  <div className="approval-actions">
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => openRemark(q._id, 'approve')}
                      disabled={processing === q._id}
                      id={`approve-${q._id}`}
                    >
                      {processing === q._id ? <span className="btn-spinner" /> : <><CheckCircle size={14} /> Approve</>}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => openRemark(q._id, 'reject')}
                      disabled={processing === q._id}
                      id={`reject-${q._id}`}
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}

                {q.status === 'accepted' && (
                  <span className="approved-by">
                    <CheckCircle size={13} style={{ color: '#10b981' }} /> Manager Approved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Remark Modal */}
      {remarkModal && (
        <div className="modal-overlay" onClick={() => setRemarkModal(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {remarkModal.action === 'approve' ? '✅ Approve Quotation' : '❌ Reject Quotation'}
              </h3>
              <button className="modal-close" onClick={() => setRemarkModal(null)}><X size={20} /></button>
            </div>
            <p className="text-secondary mb-4">
              {remarkModal.action === 'approve'
                ? 'This will approve the quotation and initiate Purchase Order creation.'
                : 'Please provide a reason for rejection. This will be visible to the vendor.'}
            </p>
            <div className="form-group">
              <label className="form-label">
                {remarkModal.action === 'approve' ? 'Approval Remarks (optional)' : 'Rejection Reason *'}
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={remark}
                onChange={e => setRemark(e.target.value)}
                placeholder={remarkModal.action === 'approve' ? 'Any notes for approval...' : 'e.g., Price exceeds budget by 15%'}
                required={remarkModal.action === 'reject'}
              />
            </div>
            <div className="flex gap-3 justify-between mt-4">
              <button className="btn btn-secondary" onClick={() => setRemarkModal(null)}>Cancel</button>
              <button
                className={`btn ${remarkModal.action === 'approve' ? 'btn-accent' : 'btn-danger'}`}
                onClick={() => {
                  if (remarkModal.action === 'reject' && !remark.trim()) {
                    toast.error('Please provide a rejection reason');
                    return;
                  }
                  handleAction(remarkModal.id, remarkModal.action, remark);
                }}
                disabled={processing === remarkModal.id}
              >
                {processing === remarkModal.id ? <span className="btn-spinner" /> :
                  remarkModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
