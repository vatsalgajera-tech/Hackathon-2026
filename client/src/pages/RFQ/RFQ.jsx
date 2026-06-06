import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getStatusVariant, formatDate } from '../../utils/aiEngine';
import { FileText, Plus, Search, X, ChevronDown, ChevronUp, Calendar, Building2, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import './RFQ.css';

const emptyForm = {
  title: '', description: '', items: [{ name: '', quantity: 1, unit: 'pcs', estimatedPrice: '' }],
  deadline: '', assignedVendors: [], status: 'open'
};

const demoRFQs = [
  { _id: '1', rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement Q2 2026', status: 'open', deadline: '2026-06-30', quotationsReceived: 3, assignedVendors: [{ _id: 'v1', companyName: 'ABC Technologies' }, { _id: 'v2', companyName: 'XYZ Industries' }], items: [{ name: 'Dell Laptop 15"', quantity: 20, unit: 'pcs', estimatedPrice: 65000 }, { name: 'Laptop Bag', quantity: 20, unit: 'pcs', estimatedPrice: 1500 }], createdBy: { name: 'Admin' }, createdAt: '2026-06-01' },
  { _id: '2', rfqNumber: 'RFQ-2026-0002', title: 'Office Furniture Upgrade', status: 'under_review', deadline: '2026-07-15', quotationsReceived: 2, assignedVendors: [{ _id: 'v4', companyName: 'OfficeMax Pro' }], items: [{ name: 'Ergonomic Chair', quantity: 50, unit: 'pcs', estimatedPrice: 8000 }], createdBy: { name: 'Admin' }, createdAt: '2026-05-28' },
  { _id: '3', rfqNumber: 'RFQ-2026-0003', title: 'Network Equipment', status: 'awarded', deadline: '2026-06-20', quotationsReceived: 4, assignedVendors: [], items: [{ name: 'Cisco Switch 48-port', quantity: 5, unit: 'pcs', estimatedPrice: 45000 }], createdBy: { name: 'Admin' }, createdAt: '2026-05-15' },
];

export default function RFQ() {
  const { hasRole } = useAuth();
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRFQ, setEditRFQ] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [expandedRFQ, setExpandedRFQ] = useState(null);

  const fetchRFQs = async () => {
    try {
      const res = await api.get('/rfqs', { params: { search, status: filterStatus } });
      setRfqs(res.data.data);
    } catch { setRfqs(demoRFQs); } finally { setLoading(false); }
  };

  const fetchVendors = async () => {
    try {
      const res = await api.get('/vendors');
      setVendors(res.data.data);
    } catch { setVendors([{ _id: 'v1', companyName: 'ABC Technologies' }, { _id: 'v2', companyName: 'XYZ Industries' }, { _id: 'v3', companyName: 'FastSupply Ltd' }]); }
  };

  useEffect(() => { fetchRFQs(); fetchVendors(); }, []);
  useEffect(() => { if (!loading) fetchRFQs(); }, [search, filterStatus]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: '', quantity: 1, unit: 'pcs', estimatedPrice: '' }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, value) => setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));

  const toggleVendor = (id) => {
    setForm(f => ({
      ...f,
      assignedVendors: f.assignedVendors.includes(id) ? f.assignedVendors.filter(v => v !== id) : [...f.assignedVendors, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editRFQ) {
        await api.put(`/rfqs/${editRFQ._id}`, form);
        toast.success('RFQ updated!');
      } else {
        await api.post('/rfqs', form);
        toast.success('RFQ created successfully!');
      }
      setShowModal(false);
      fetchRFQs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save RFQ');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    setDialog({
      title: 'Delete RFQ',
      message: 'Are you sure you want to delete this RFQ? All associated quotations will also be removed.',
      type: 'danger',
      confirmLabel: 'Delete RFQ',
      onConfirm: async () => {
        try {
          await api.delete(`/rfqs/${id}`);
          toast.success('RFQ deleted');
          fetchRFQs();
        } catch { toast.error('Failed to delete'); }
      }
    });
  };

  const filtered = rfqs.filter(r =>
    (!search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.rfqNumber?.includes(search)) &&
    (!filterStatus || r.status === filterStatus)
  );

  const statusCounts = rfqs.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

  return (
    <div className="rfq-page animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">RFQ Management</h1>
          <p className="page-subtitle">{rfqs.length} total RFQs — {statusCounts.open || 0} open</p>
        </div>
        {hasRole('admin', 'procurement_officer') && (
          <button className="btn btn-primary" onClick={() => { setEditRFQ(null); setForm(emptyForm); setShowModal(true); }} id="create-rfq-btn">
            <Plus size={16} /> Create RFQ
          </button>
        )}
      </div>

      {/* Status Summary */}
      <div className="rfq-status-bar">
        {[['open', 'primary'], ['under_review', 'warning'], ['awarded', 'success'], ['cancelled', 'danger']].map(([s, v]) => (
          <button key={s} className={`status-pill ${filterStatus === s ? 'active' : ''}`}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}>
            <span className={`badge badge-${v}`}>{statusCounts[s] || 0}</span>
            <span>{s.replace('_', ' ')}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="rfq-search card card-sm flex gap-3">
        <div className="input-with-icon flex-1">
          <Search size={15} className="input-icon" />
          <input className="form-control input-padded" placeholder="Search RFQ title or number..."
            value={search} onChange={e => setSearch(e.target.value)} id="rfq-search" />
        </div>
        {search && <button className="btn btn-secondary btn-sm" onClick={() => setSearch('')}><X size={14} /></button>}
      </div>

      {/* RFQ List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <FileText size={48} />
          <h3>No RFQs found</h3>
          <p>Create your first RFQ to start the procurement process</p>
          {hasRole('admin', 'procurement_officer') && (
            <button className="btn btn-primary mt-4" onClick={() => { setEditRFQ(null); setForm(emptyForm); setShowModal(true); }}>Create RFQ</button>
          )}
        </div>
      ) : (
        <div className="rfq-list">
          {filtered.map(rfq => (
            <div key={rfq._id} className="rfq-card">
              <div className="rfq-card-header" onClick={() => setExpandedRFQ(expandedRFQ === rfq._id ? null : rfq._id)}>
                <div className="rfq-main">
                  <div className="rfq-number-badge">{rfq.rfqNumber}</div>
                  <div>
                    <h3 className="rfq-title">{rfq.title}</h3>
                    <div className="rfq-meta">
                      <span><Calendar size={12} /> Due: {formatDate(rfq.deadline)}</span>
                      <span><Building2 size={12} /> {rfq.assignedVendors?.length || 0} vendors</span>
                      <span><FileText size={12} /> {rfq.quotationsReceived || 0} quotations</span>
                      <span>By: {rfq.createdBy?.name || 'System'}</span>
                    </div>
                  </div>
                </div>
                <div className="rfq-right">
                  <span className={`badge badge-${getStatusVariant(rfq.status)}`}>{rfq.status?.replace('_', ' ')}</span>
                  {hasRole('admin', 'procurement_officer') && (
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-icon btn-secondary btn-sm" onClick={() => { setEditRFQ(rfq); setForm({ ...rfq, assignedVendors: rfq.assignedVendors?.map(v => v._id || v) || [] }); setShowModal(true); }}>
                        <Edit2 size={13} />
                      </button>
                      {hasRole('admin') && (
                        <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleDelete(rfq._id)}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                  {expandedRFQ === rfq._id ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {expandedRFQ === rfq._id && (
                <div className="rfq-details animate-slide">
                  <div className="rfq-items-table">
                    <h4>Items</h4>
                    <table>
                      <thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Est. Price</th></tr></thead>
                      <tbody>
                        {rfq.items?.map((item, i) => (
                          <tr key={i}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit}</td>
                            <td>{item.estimatedPrice ? `₹${Number(item.estimatedPrice).toLocaleString('en-IN')}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rfq.assignedVendors?.length > 0 && (
                    <div className="rfq-vendors">
                      <h4>Assigned Vendors</h4>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {rfq.assignedVendors.map(v => (
                          <span key={v._id || v} className="badge badge-info">{v.companyName || v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editRFQ ? 'Edit RFQ' : 'Create New RFQ'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">RFQ Title *</label>
                <input className="form-control" placeholder="e.g., Office Laptop Procurement Q2 2026"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group mt-4">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={2} placeholder="Additional details..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              {/* Items */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Items *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <input className="form-control" placeholder="Item name" value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)} required />
                    <input type="number" className="form-control" placeholder="Qty" min="1" value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} style={{ width: 80 }} />
                    <select className="form-control" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} style={{ width: 90 }}>
                      {['pcs', 'kg', 'ltr', 'set', 'box', 'unit'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="number" className="form-control" placeholder="Est. Price ₹" value={item.estimatedPrice}
                      onChange={e => updateItem(idx, 'estimatedPrice', e.target.value)} style={{ width: 130 }} />
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-icon btn-danger btn-sm" onClick={() => removeItem(idx)}><X size={13} /></button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid-2 mt-4">
                <div className="form-group">
                  <label className="form-label">Deadline *</label>
                  <input type="date" className="form-control" value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {['draft', 'open', 'under_review', 'cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              {/* Assign Vendors */}
              <div className="form-group mt-4">
                <label className="form-label">Assign Vendors</label>
                <div className="vendor-checkboxes">
                  {vendors.map(v => (
                    <label key={v._id} className={`vendor-check ${form.assignedVendors.includes(v._id) ? 'checked' : ''}`}>
                      <input type="checkbox" checked={form.assignedVendors.includes(v._id)} onChange={() => toggleVendor(v._id)} />
                      <span>{v.companyName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-between mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : (editRFQ ? 'Update RFQ' : 'Create RFQ')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
