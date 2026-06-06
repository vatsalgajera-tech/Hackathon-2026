import { useState, useEffect } from 'react';
import api from '../../services/api';
import { computeVendorRisk, getStatusVariant, formatDate } from '../../utils/aiEngine';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, Search, Filter, Edit2, Trash2, X, Star, Phone, Mail, MapPin, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import './Vendors.css';

const CATEGORIES = ['IT & Software', 'Hardware', 'Office Supplies', 'Logistics', 'Consulting', 'Manufacturing', 'Other'];

const emptyVendor = {
  companyName: '', category: 'IT & Software', gstNumber: '', contactName: '', email: '',
  phone: '', rating: 4, status: 'active', completedOrders: 0, totalOrders: 0,
  delayedOrders: 0, rejectedQuotations: 0, totalQuotations: 0,
  address: { street: '', city: '', state: '', pincode: '' }, notes: ''
};

export default function Vendors() {
  const { hasRole } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [form, setForm] = useState(emptyVendor);
  const [saving, setSaving] = useState(false);
  const [viewVendor, setViewVendor] = useState(null);
  const [dialog, setDialog] = useState(null);

  const fetchVendors = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/vendors', { params });
      setVendors(res.data.data);
    } catch {
      // Demo data
      setVendors([
        { _id: '1', companyName: 'ABC Technologies', category: 'IT & Software', email: 'abc@tech.com', contactName: 'Raj Patel', phone: '+91 98765 43210', rating: 4.8, status: 'active', completedOrders: 45, totalOrders: 48, delayedOrders: 2, rejectedQuotations: 1, totalQuotations: 20, gstNumber: '27AABCU9603R1ZX', address: { city: 'Mumbai', state: 'Maharashtra' } },
        { _id: '2', companyName: 'XYZ Industries', category: 'Manufacturing', email: 'xyz@ind.com', contactName: 'Priya Shah', phone: '+91 87654 32109', rating: 3.8, status: 'active', completedOrders: 28, totalOrders: 35, delayedOrders: 8, rejectedQuotations: 6, totalQuotations: 25, gstNumber: '07AABCU9603R1ZP', address: { city: 'Delhi', state: 'Delhi' } },
        { _id: '3', companyName: 'FastSupply Ltd', category: 'Logistics', email: 'fast@supply.com', contactName: 'Amit Kumar', phone: '+91 76543 21098', rating: 2.9, status: 'active', completedOrders: 12, totalOrders: 20, delayedOrders: 10, rejectedQuotations: 8, totalQuotations: 15, gstNumber: '29AABCU9603R1ZG', address: { city: 'Bangalore', state: 'Karnataka' } },
        { _id: '4', companyName: 'OfficeMax Pro', category: 'Office Supplies', email: 'office@max.com', contactName: 'Sonia Mehta', phone: '+91 65432 10987', rating: 4.5, status: 'active', completedOrders: 67, totalOrders: 70, delayedOrders: 3, rejectedQuotations: 2, totalQuotations: 30, gstNumber: '33AABCU9603R1ZK', address: { city: 'Chennai', state: 'Tamil Nadu' } },
      ]);
    } finally { setLoading(false); }
  };

  const fetchRisk = async () => {
    try {
      const res = await api.get('/ai/vendor-risk');
      setRiskData(res.data.data || []);
    } catch { setRiskData([]); }
  };

  useEffect(() => { fetchVendors(); fetchRisk(); }, []);
  useEffect(() => { if (!loading) fetchVendors(); }, [search, filterCategory, filterStatus]);

  const getRisk = (vendor) => {
    const fromAPI = riskData.find(r => r.vendorId === vendor._id || r.vendorId?.toString() === vendor._id?.toString());
    if (fromAPI) return fromAPI;
    return computeVendorRisk(vendor);
  };

  const openCreate = () => { setEditVendor(null); setForm(emptyVendor); setShowModal(true); };
  const openEdit = (v) => { setEditVendor(v); setForm({ ...v, address: v.address || {} }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editVendor) {
        await api.put(`/vendors/${editVendor._id}`, form);
        toast.success('Vendor updated!');
      } else {
        await api.post('/vendors', form);
        toast.success('Vendor registered!');
      }
      setShowModal(false);
      fetchVendors(); fetchRisk();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vendor');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    setDialog({
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this vendor? This action cannot be undone.',
      type: 'danger',
      confirmLabel: 'Delete Vendor',
      onConfirm: async () => {
        try {
          await api.delete(`/vendors/${id}`);
          toast.success('Vendor deleted');
          fetchVendors();
        } catch { toast.error('Failed to delete'); }
      }
    });
  };

  const filtered = vendors.filter(v =>
    (!search || v.companyName?.toLowerCase().includes(search.toLowerCase()) || v.contactName?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterCategory || v.category === filterCategory) &&
    (!filterStatus || v.status === filterStatus)
  );

  return (
    <div className="vendors-page animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Vendor Management</h1>
          <p className="page-subtitle">Manage suppliers with AI risk indicators</p>
        </div>
        {hasRole('admin', 'procurement_officer') && (
          <button className="btn btn-primary" onClick={openCreate} id="add-vendor-btn">
            <Plus size={16} /> Add Vendor
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="vendors-filters card card-sm">
        <div className="input-with-icon flex-1">
          <Search size={15} className="input-icon" />
          <input className="form-control input-padded" placeholder="Search vendors..."
            value={search} onChange={e => setSearch(e.target.value)} id="vendor-search" />
        </div>
        <select className="form-control" style={{ width: 200 }} value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)} id="vendor-category-filter">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-control" style={{ width: 160 }} value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)} id="vendor-status-filter">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        {(search || filterCategory || filterStatus) && (
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterCategory(''); setFilterStatus(''); }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Vendor Grid */}
      {loading ? (
        <div className="vendors-grid">
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <Building2 size={48} />
          <h3>No vendors found</h3>
          <p>Add your first vendor to get started</p>
          {hasRole('admin', 'procurement_officer') && (
            <button className="btn btn-primary mt-4" onClick={openCreate}>Add Vendor</button>
          )}
        </div>
      ) : (
        <div className="vendors-grid">
          {filtered.map(vendor => {
            const risk = getRisk(vendor);
            return (
              <div key={vendor._id} className="vendor-card" onClick={() => setViewVendor(vendor)}>
                <div className="vendor-card-header">
                  <div className="vendor-avatar">
                    {vendor.companyName?.charAt(0).toUpperCase()}
                  </div>
                  <div className="vendor-meta">
                    <h3 className="vendor-name">{vendor.companyName}</h3>
                    <span className="badge badge-info">{vendor.category}</span>
                  </div>
                  <div className="vendor-actions" onClick={e => e.stopPropagation()}>
                    {hasRole('admin', 'procurement_officer') && (
                      <>
                        <button className="btn btn-icon btn-secondary btn-sm" onClick={() => openEdit(vendor)}>
                          <Edit2 size={14} />
                        </button>
                        {hasRole('admin') && (
                          <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleDelete(vendor._id)}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="vendor-info">
                  <div className="info-row"><Mail size={13} /><span>{vendor.email}</span></div>
                  <div className="info-row"><Phone size={13} /><span>{vendor.phone || '—'}</span></div>
                  {(vendor.address?.city) && <div className="info-row"><MapPin size={13} /><span>{vendor.address.city}, {vendor.address.state}</span></div>}
                </div>

                <div className="vendor-stats">
                  <div className="vstat">
                    <div className="flex items-center gap-1"><Star size={12} style={{ color: '#f59e0b' }} /><span className="vstat-val">{vendor.rating}</span></div>
                    <span className="vstat-label">Rating</span>
                  </div>
                  <div className="vstat">
                    <span className="vstat-val">{vendor.completedOrders}/{vendor.totalOrders}</span>
                    <span className="vstat-label">Orders</span>
                  </div>
                  <div className="vstat">
                    <span className={`badge badge-${getStatusVariant(vendor.status)}`}>{vendor.status}</span>
                  </div>
                </div>

                {/* AI Risk Indicator */}
                <div className="risk-indicator" title={risk.reasons?.join('\n')}>
                  <Shield size={13} />
                  <span className={`risk-label risk-${risk.riskColor}`}>
                    {risk.riskEmoji || (risk.riskColor === 'green' ? '🟢' : risk.riskColor === 'yellow' ? '🟡' : '🔴')} {risk.riskLevel} Risk
                  </span>
                  <span className="risk-score">Score: {risk.riskScore}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {viewVendor && (
        <div className="modal-overlay" onClick={() => setViewVendor(null)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{viewVendor.companyName}</h3>
              <button className="modal-close" onClick={() => setViewVendor(null)}><X size={20} /></button>
            </div>
            <div className="vendor-detail-grid">
              {[['Contact', viewVendor.contactName], ['Email', viewVendor.email], ['Phone', viewVendor.phone || '—'], ['GST No.', viewVendor.gstNumber || '—'], ['Category', viewVendor.category], ['Status', viewVendor.status], ['Rating', `${viewVendor.rating}/5`], ['Completed Orders', `${viewVendor.completedOrders}/${viewVendor.totalOrders}`], ['Delayed Orders', viewVendor.delayedOrders], ['City', viewVendor.address?.city || '—']].map(([k,v]) => (
                <div key={k} className="detail-row">
                  <span className="detail-key">{k}</span>
                  <span className="detail-val">{v}</span>
                </div>
              ))}
            </div>
            {(() => {
              const r = getRisk(viewVendor);
              return (
                <div className={`risk-detail risk-bg-${r.riskColor}`}>
                  <h4>AI Risk Assessment</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`risk-label risk-${r.riskColor}`} style={{ fontSize: '1rem' }}>
                      {r.riskEmoji} {r.riskLevel} Risk (Score: {r.riskScore}/100)
                    </span>
                  </div>
                  <ul className="risk-reasons">
                    {r.reasons?.map((reason, i) => <li key={i}>{reason}</li>)}
                  </ul>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editVendor ? 'Edit Vendor' : 'Register New Vendor'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input className="form-control" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Name *</label>
                  <input className="form-control" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <input className="form-control" value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-control" value={form.address?.city || ''} onChange={e => setForm(f => ({ ...f, address: { ...f.address, city: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-control" value={form.address?.state || ''} onChange={e => setForm(f => ({ ...f, address: { ...f.address, state: e.target.value } }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rating (0-5)</label>
                  <input type="number" className="form-control" min="0" max="5" step="0.1" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blacklisted">Blacklisted</option>
                  </select>
                </div>
              </div>
              <div className="form-group mt-4">
                <label className="form-label">Notes</label>
                <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
              </div>
              <div className="flex gap-3 justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : (editVendor ? 'Update Vendor' : 'Register Vendor')}
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
