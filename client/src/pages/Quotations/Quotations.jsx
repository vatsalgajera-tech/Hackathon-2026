import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getStatusVariant, formatCurrency, formatDate } from '../../utils/aiEngine';
import { MessageSquare, Plus, X, Send, GitCompare } from 'lucide-react';
import toast from 'react-hot-toast';
import './Quotations.css';

const demoQuotations = [
  { _id: 'q1', rfqId: { _id: 'r1', rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement Q2 2026', deadline: '2026-06-30' }, vendorId: { _id: 'v1', companyName: 'ABC Technologies', email: 'abc@tech.com', rating: 4.8 }, totalPrice: 1380000, deliveryDays: 7, status: 'submitted', createdAt: '2026-06-02T10:00:00Z', items: [{ name: 'Dell Laptop', quantity: 20, unitPrice: 64000, totalPrice: 1280000 }], notes: 'Includes warranty' },
  { _id: 'q2', rfqId: { _id: 'r1', rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement Q2 2026', deadline: '2026-06-30' }, vendorId: { _id: 'v2', companyName: 'XYZ Industries', email: 'xyz@ind.com', rating: 3.8 }, totalPrice: 1320000, deliveryDays: 20, status: 'submitted', createdAt: '2026-06-03T14:00:00Z', items: [{ name: 'Dell Laptop', quantity: 20, unitPrice: 61000, totalPrice: 1220000 }], notes: 'Bulk discount' },
];

export default function Quotations() {
  const { hasRole } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ rfqId: '', vendorId: '', deliveryDays: 14, validityDays: 30, notes: '', items: [{ name: '', quantity: 1, unitPrice: 0 }] });
  const [saving, setSaving] = useState(false);


  const fetchAll = async () => {
    try {
      const [qRes, rfqRes, vRes] = await Promise.all([api.get('/quotations'), api.get('/rfqs'), api.get('/vendors')]);
      setQuotations(qRes.data.data);
      setRfqs(rfqRes.data.data);
      setVendors(vRes.data.data);
    } catch {
      setQuotations(demoQuotations);
      setRfqs([{ _id: 'r1', rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement Q2 2026' }]);
      setVendors([{ _id: 'v1', companyName: 'ABC Technologies' }, { _id: 'v2', companyName: 'XYZ Industries' }]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: '', quantity: 1, unitPrice: 0 }] }));
  const updateItem = (idx, field, value) => setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  const total = form.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/quotations', { ...form, totalPrice: total });
      toast.success('Quotation submitted!');
      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit quotation');
    } finally { setSaving(false); }
  };

  // Group quotations by RFQ
  const grouped = quotations.reduce((acc, q) => {
    const rfqId = q.rfqId?._id || q.rfqId;
    if (!acc[rfqId]) acc[rfqId] = { rfq: q.rfqId, quotations: [] };
    acc[rfqId].quotations.push(q);
    return acc;
  }, {});

  return (
    <div className="quotations-page animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">{quotations.length} quotations across {Object.keys(grouped).length} RFQs</p>
        </div>
        <div className="flex gap-3">
          {hasRole('vendor', 'procurement_officer', 'admin') && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)} id="submit-quotation-btn">
              <Plus size={16} /> Submit Quotation
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 12 }} />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="empty-state card">
          <MessageSquare size={48} />
          <h3>No quotations yet</h3>
          <p>Vendors will submit quotations after RFQs are created</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.values(grouped).map(({ rfq, quotations: qs }) => (
            <div key={rfq?._id || 'unknown'} className="card">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rfq-number-badge" style={{ fontSize: '0.7rem' }}>{rfq?.rfqNumber}</span>
                    <span className={`badge badge-${qs.length >= 2 ? 'success' : 'warning'}`}>{qs.length} quotation{qs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem' }}>{rfq?.title}</h3>
                </div>
                {qs.length >= 2 && hasRole('admin', 'procurement_officer', 'manager') && (
                  <Link to={`/quotations/compare/${rfq?._id}`} className="btn btn-accent btn-sm">
                    <GitCompare size={14} /> Compare & Select
                  </Link>
                )}
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Total Price</th>
                      <th>Delivery</th>
                      <th>Rating</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {qs.map(q => (
                      <tr key={q._id}>
                        <td className="font-medium">{q.vendorId?.companyName}</td>
                        <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(q.totalPrice)}</td>
                        <td>{q.deliveryDays} days</td>
                        <td>⭐ {q.vendorId?.rating}/5</td>
                        <td><span className={`badge badge-${getStatusVariant(q.status)}`}>{q.status}</span></td>
                        <td className="text-muted">{formatDate(q.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Submit Quotation</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">RFQ *</label>
                  <select className="form-control" value={form.rfqId} onChange={e => setForm(f => ({ ...f, rfqId: e.target.value }))} required>
                    <option value="">Select RFQ</option>
                    {rfqs.map(r => <option key={r._id} value={r._id}>{r.rfqNumber} — {r.title}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor *</label>
                  <select className="form-control" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} required>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Days *</label>
                  <input type="number" className="form-control" min="1" value={form.deliveryDays}
                    onChange={e => setForm(f => ({ ...f, deliveryDays: parseInt(e.target.value) }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Validity (days)</label>
                  <input type="number" className="form-control" min="1" value={form.validityDays}
                    onChange={e => setForm(f => ({ ...f, validityDays: parseInt(e.target.value) }))} />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Line Items *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <input className="form-control" placeholder="Item name" value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)} required />
                    <input type="number" className="form-control" placeholder="Qty" min="1" value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} style={{ width: 80 }} />
                    <input type="number" className="form-control" placeholder="Unit Price ₹" min="0" value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} style={{ width: 150 }} />
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-icon btn-danger btn-sm"
                        onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="total-row">
                  <span>Total:</span>
                  <span className="total-amount">{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="form-group mt-4">
                <label className="form-label">Notes / Terms</label>
                <textarea className="form-control" rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Warranty, terms, etc." />
              </div>

              <div className="flex gap-3 justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : <><Send size={15} /> Submit Quotation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
