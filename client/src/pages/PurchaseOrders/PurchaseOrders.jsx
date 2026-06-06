import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getStatusVariant, formatCurrency, formatDate } from '../../utils/aiEngine';
import { ShoppingCart, Plus, X, Eye, Edit2, FileText, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './PurchaseOrders.css';

const demoPOs = [
  { _id: 'po1', poNumber: 'PO-2026-0001', rfqId: { rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement Q2 2026' }, vendorId: { companyName: 'ABC Technologies', email: 'abc@tech.com', contactName: 'Raj Patel', gstNumber: '27AABCU9603R1ZX' }, items: [{ name: 'Dell Laptop 15"', quantity: 20, unitPrice: 64000, totalPrice: 1280000 }, { name: 'Laptop Bag', quantity: 20, unitPrice: 5000, totalPrice: 100000 }], subtotal: 1380000, taxRate: 18, taxAmount: 248400, total: 1628400, status: 'confirmed', paymentTerms: 'Net 30', deliveryDate: '2026-06-20', createdAt: '2026-06-05T10:00:00Z', createdBy: { name: 'Admin' } },
  { _id: 'po2', poNumber: 'PO-2026-0002', rfqId: { rfqNumber: 'RFQ-2026-0002', title: 'Office Furniture Upgrade' }, vendorId: { companyName: 'OfficeMax Pro', email: 'office@max.com', contactName: 'Sonia Mehta', gstNumber: '33AABCU9603R1ZK' }, items: [{ name: 'Ergonomic Chair', quantity: 50, unitPrice: 7500, totalPrice: 375000 }, { name: 'Standing Desk', quantity: 10, unitPrice: 18000, totalPrice: 180000 }], subtotal: 555000, taxRate: 18, taxAmount: 99900, total: 654900, status: 'pending', paymentTerms: 'Net 30', deliveryDate: '2026-07-01', createdAt: '2026-06-04T14:00:00Z', createdBy: { name: 'Admin' } },
];

export default function PurchaseOrders() {
  const { hasRole } = useAuth();
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewPO, setViewPO] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendorId: '', rfqId: '', items: [{ name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }], subtotal: 0, taxRate: 18, paymentTerms: 'Net 30', deliveryDate: '', deliveryAddress: '' });
  const [saving, setSaving] = useState(false);

  const fetchPOs = async () => {
    setLoading(true);
    try {
      const [poRes, vRes, rRes] = await Promise.all([
        api.get('/purchase-orders', { params: { status: filterStatus || undefined } }),
        api.get('/vendors'),
        api.get('/rfqs')
      ]);
      setPOs(poRes.data.data);
      setVendors(vRes.data.data);
      setRfqs(rRes.data.data);
    } catch {
      setPOs(demoPOs);
      setVendors([{ _id: 'v1', companyName: 'ABC Technologies' }, { _id: 'v2', companyName: 'OfficeMax Pro' }]);
      setRfqs([{ _id: 'r1', rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement' }]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPOs(); }, [filterStatus]);

  const updateItem = (idx, field, value) => {
    const items = form.items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      updated.totalPrice = updated.quantity * updated.unitPrice;
      return updated;
    });
    const subtotal = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
    setForm(f => ({ ...f, items, subtotal }));
  };

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }] }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/purchase-orders', form);
      toast.success('Purchase Order created!');
      setShowCreate(false);
      fetchPOs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create PO');
    } finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/purchase-orders/${id}`, { status });
      toast.success(`PO status updated to ${status}`);
      fetchPOs();
    } catch { toast.error('Failed to update status'); }
  };

  const tax = (form.subtotal * form.taxRate) / 100;
  const total = form.subtotal + tax;
  const filtered = pos.filter(p => !filterStatus || p.status === filterStatus);

  return (
    <div className="po-page animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{pos.length} total purchase orders</p>
        </div>
        {hasRole('admin', 'procurement_officer') && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-po-btn">
            <Plus size={16} /> Create PO
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['dispatched', 'Dispatched'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']].map(([val, label]) => (
          <button key={val} className={`status-pill ${filterStatus === val ? 'active' : ''}`}
            onClick={() => setFilterStatus(val)}>{label}</button>
        ))}
      </div>

      {/* PO Table */}
      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <ShoppingCart size={48} />
          <h3>No purchase orders</h3>
          <p>Accept a quotation to generate a purchase order</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Vendor</th>
                  <th>RFQ</th>
                  <th>Amount</th>
                  <th>Delivery Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(po => (
                  <tr key={po._id}>
                    <td>
                      <span className="po-number">{po.poNumber}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="mini-avatar">{po.vendorId?.companyName?.charAt(0)}</div>
                        <span>{po.vendorId?.companyName}</span>
                      </div>
                    </td>
                    <td className="text-muted">{po.rfqId?.rfqNumber || '—'}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(po.total)}</td>
                    <td className="text-muted">{formatDate(po.deliveryDate)}</td>
                    <td><span className={`badge badge-${getStatusVariant(po.status)}`}>{po.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setViewPO(po)} title="View">
                          <Eye size={14} />
                        </button>
                        {po.status === 'pending' && hasRole('manager', 'admin', 'procurement_officer') && (
                          <button className="btn btn-sm btn-accent" onClick={() => updateStatus(po._id, 'confirmed')}>
                            Confirm
                          </button>
                        )}
                        {po.status === 'confirmed' && hasRole('manager', 'admin', 'procurement_officer') && (
                          <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(po._id, 'dispatched')}>
                            Dispatch
                          </button>
                        )}
                        {po.status === 'dispatched' && hasRole('manager', 'admin', 'procurement_officer') && (
                          <button className="btn btn-sm btn-primary" onClick={() => updateStatus(po._id, 'delivered')}>
                            Delivered
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View PO Modal */}
      {viewPO && (
        <div className="modal-overlay" onClick={() => setViewPO(null)}>
          <div className="modal po-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">{viewPO.poNumber}</h3>
                <span className={`badge badge-${getStatusVariant(viewPO.status)}`}>{viewPO.status}</span>
              </div>
              <button className="modal-close" onClick={() => setViewPO(null)}><X size={20} /></button>
            </div>

            <div className="po-detail-grid">
              <div className="po-section">
                <h4><Building2 size={14} /> Vendor Details</h4>
                <p>{viewPO.vendorId?.companyName}</p>
                <p className="text-muted">{viewPO.vendorId?.email}</p>
                <p className="text-muted">{viewPO.vendorId?.contactName}</p>
                <p className="text-muted">GST: {viewPO.vendorId?.gstNumber || '—'}</p>
              </div>
              <div className="po-section">
                <h4><FileText size={14} /> Order Details</h4>
                <p>RFQ: {viewPO.rfqId?.rfqNumber || '—'}</p>
                <p className="text-muted">Payment: {viewPO.paymentTerms}</p>
                <p className="text-muted">Delivery: {formatDate(viewPO.deliveryDate)}</p>
                <p className="text-muted">Created: {formatDate(viewPO.createdAt)}</p>
              </div>
            </div>

            <h4 style={{ marginBottom: 10, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Line Items</h4>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                <tbody>
                  {viewPO.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td className="font-semibold">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="po-totals">
              <div className="total-line"><span>Subtotal</span><span>{formatCurrency(viewPO.subtotal)}</span></div>
              <div className="total-line"><span>GST ({viewPO.taxRate}%)</span><span>{formatCurrency(viewPO.taxAmount)}</span></div>
              <div className="total-line grand"><span>Grand Total</span><span>{formatCurrency(viewPO.total)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Vendor *</label>
                  <select className="form-control" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} required>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Linked RFQ</label>
                  <select className="form-control" value={form.rfqId} onChange={e => setForm(f => ({ ...f, rfqId: e.target.value }))}>
                    <option value="">None</option>
                    {rfqs.map(r => <option key={r._id} value={r._id}>{r.rfqNumber} — {r.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Date</label>
                  <input type="date" className="form-control" value={form.deliveryDate}
                    onChange={e => setForm(f => ({ ...f, deliveryDate: e.target.value }))} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Terms</label>
                  <select className="form-control" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))}>
                    {['Net 30', 'Net 15', 'Net 45', 'Immediate', 'Advance'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Items *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <input className="form-control" placeholder="Item name" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} required />
                    <input type="number" className="form-control" placeholder="Qty" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} style={{ width: 80 }} />
                    <input type="number" className="form-control" placeholder="Unit Price ₹" min="0" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} style={{ width: 140 }} />
                    <span className="item-total">{formatCurrency(item.totalPrice)}</span>
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-icon btn-danger btn-sm" onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="po-totals-mini">
                  <div className="total-line"><span>Subtotal</span><span>{formatCurrency(form.subtotal)}</span></div>
                  <div className="total-line"><span>GST (18%)</span><span>{formatCurrency(tax)}</span></div>
                  <div className="total-line grand"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </div>

              <div className="flex gap-3 justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
