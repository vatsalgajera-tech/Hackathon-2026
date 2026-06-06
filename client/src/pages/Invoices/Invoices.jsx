import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getStatusVariant, formatCurrency, formatDate } from '../../utils/aiEngine';
import { Receipt, Plus, X, Download, Eye, Printer, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import './Invoices.css';

export default function Invoices() {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [pos, setPOs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewInvoice, setViewInvoice] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    poId: '', vendorId: '',
    items: [{ name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
    subtotal: 0, gstRate: 18, notes: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [invRes, poRes, vRes] = await Promise.all([
        api.get('/invoices'),
        api.get('/purchase-orders'),
        api.get('/vendors'),
      ]);
      setInvoices(invRes.data.data);
      setPOs(poRes.data.data);
      setVendors(vRes.data.data);
    } catch {
      setInvoices([]);
      setPOs([]);
      setVendors([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/invoices', form);
      toast.success('Invoice generated!');
      setShowCreate(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create invoice');
    } finally { setSaving(false); }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      const res = await api.get(`/invoices/${invoice._id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF download requires server connection'); }
  };

  const markPaid = async (id) => {
    try {
      await api.put(`/invoices/${id}`, { status: 'paid' });
      toast.success('Invoice marked as paid!');
      fetchAll();
    } catch { toast.error('Failed to update'); }
  };

  const gst = (form.subtotal * form.gstRate) / 100;
  const invoiceTotal = form.subtotal + gst;
  const filtered = invoices.filter(inv => !filterStatus || inv.status === filterStatus);

  return (
    <div className="invoices-page animate-fade">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} total invoices</p>
        </div>
        {hasRole('admin', 'procurement_officer') && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)} id="create-invoice-btn">
            <Plus size={16} /> Generate Invoice
          </button>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['draft', 'Draft'], ['sent', 'Sent'], ['paid', 'Paid'], ['overdue', 'Overdue']].map(([val, label]) => (
          <button key={val} className={`status-pill ${filterStatus === val ? 'active' : ''}`}
            onClick={() => setFilterStatus(val)}>{label}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <Receipt size={48} />
          <h3>No invoices</h3>
          <p>Generate invoices from confirmed purchase orders</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Vendor</th>
                  <th>PO Number</th>
                  <th>Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv._id}>
                    <td><span className="inv-number">{inv.invoiceNumber}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="mini-avatar">{inv.vendorId?.companyName?.charAt(0)}</div>
                        <span>{inv.vendorId?.companyName}</span>
                      </div>
                    </td>
                    <td className="text-muted">{inv.poId?.poNumber || '—'}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(inv.total)}</td>
                    <td className="text-muted">{formatDate(inv.issueDate)}</td>
                    <td className={new Date(inv.dueDate) < new Date() && inv.status !== 'paid' ? 'text-danger' : 'text-muted'}>
                      {formatDate(inv.dueDate)}
                    </td>
                    <td>
                      <span className={`badge badge-${getStatusVariant(inv.status)}`}>{inv.status}</span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-icon btn-secondary btn-sm" onClick={() => setViewInvoice(inv)} title="Preview">
                          <Eye size={13} />
                        </button>
                        <button className="btn btn-icon btn-secondary btn-sm" onClick={() => handleDownloadPDF(inv)} title="Download PDF">
                          <Download size={13} />
                        </button>
                        <button className="btn btn-icon btn-secondary btn-sm no-print" onClick={() => { setViewInvoice(inv); setTimeout(() => window.print(), 300); }} title="Print">
                          <Printer size={13} />
                        </button>
                        {inv.status !== 'paid' && hasRole('admin', 'procurement_officer') && (
                          <button className="btn btn-icon btn-accent btn-sm" onClick={() => markPaid(inv._id)} title="Mark Paid">
                            <Check size={13} />
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

      {/* ── View / Print Invoice Modal ───────────────────────────────── */}
      {viewInvoice && (
        <div className="modal-overlay no-print" onClick={() => setViewInvoice(null)}>
          <div className="modal invoice-print-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header no-print">
              <h3 className="modal-title">Invoice Preview</h3>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm no-print" onClick={() => handleDownloadPDF(viewInvoice)}>
                  <Download size={14} /> PDF
                </button>
                <button className="btn btn-primary btn-sm no-print" onClick={() => window.print()}>
                  <Printer size={14} /> Print
                </button>
                <button className="modal-close" onClick={() => setViewInvoice(null)}><X size={20} /></button>
              </div>
            </div>

            {/* Printable Invoice */}
            <div className="invoice-document">
              {/* Header */}
              <div className="inv-header">
                <div>
                  <h2 className="inv-brand">VendorBridge AI</h2>
                  <p className="inv-brand-tag">Smart Procurement ERP</p>
                </div>
                <div className="inv-header-right">
                  <div className="inv-type-label">TAX INVOICE</div>
                  <div className="inv-number-display">{viewInvoice.invoiceNumber}</div>
                </div>
              </div>

              {/* Parties */}
              <div className="inv-parties">
                <div className="inv-party">
                  <div className="inv-party-label">Bill From (Vendor)</div>
                  <p className="inv-party-company">{viewInvoice.vendorId?.companyName}</p>
                  {viewInvoice.vendorId?.contactName && <p>{viewInvoice.vendorId.contactName}</p>}
                  {viewInvoice.vendorId?.email && <p>{viewInvoice.vendorId.email}</p>}
                  {viewInvoice.vendorId?.phone && <p>{viewInvoice.vendorId.phone}</p>}
                  {viewInvoice.vendorId?.gstNumber && <p>GST: {viewInvoice.vendorId.gstNumber}</p>}
                </div>
                <div className="inv-party">
                  <div className="inv-party-label">Invoice Details</div>
                  <div className="inv-details-grid">
                    <span>Invoice No.</span><strong>{viewInvoice.invoiceNumber}</strong>
                    <span>PO Number</span><strong>{viewInvoice.poId?.poNumber || '—'}</strong>
                    <span>Issue Date</span><strong>{formatDate(viewInvoice.issueDate)}</strong>
                    <span>Due Date</span><strong>{formatDate(viewInvoice.dueDate)}</strong>
                    <span>Status</span><strong className={`inv-status-${viewInvoice.status}`}>{viewInvoice.status?.toUpperCase()}</strong>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="inv-items-section">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Unit Price</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.items?.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right inv-item-total">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="inv-totals-section">
                <div className="inv-totals">
                  <div className="total-line">
                    <span>Subtotal</span>
                    <span>{formatCurrency(viewInvoice.subtotal)}</span>
                  </div>
                  <div className="total-line">
                    <span>GST ({viewInvoice.gstRate}%)</span>
                    <span>{formatCurrency(viewInvoice.gstAmount)}</span>
                  </div>
                  <div className="total-line grand">
                    <span>Total Amount Due</span>
                    <span>{formatCurrency(viewInvoice.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewInvoice.notes && (
                <div className="inv-notes">
                  <strong>Notes:</strong> {viewInvoice.notes}
                </div>
              )}

              {/* Footer */}
              <div className="inv-footer">
                <p>This is a computer-generated invoice. No signature required.</p>
                <p>VendorBridge AI — Smart Procurement ERP &nbsp;|&nbsp; Generated on {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Invoice Modal ──────────────────────────────────────── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Invoice</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Purchase Order *</label>
                  <select className="form-control" value={form.poId} onChange={e => setForm(f => ({ ...f, poId: e.target.value }))} required>
                    <option value="">Select PO</option>
                    {pos.map(p => <option key={p._id} value={p._id}>{p.poNumber}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Vendor *</label>
                  <select className="form-control" value={form.vendorId} onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))} required>
                    <option value="">Select Vendor</option>
                    {vendors.map(v => <option key={v._id} value={v._id}>{v.companyName}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="form-label">Invoice Items *</label>
                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => setForm(f => ({ ...f, items: [...f.items, { name: '', quantity: 1, unitPrice: 0, totalPrice: 0 }] }))}>
                    <Plus size={13} /> Add Item
                  </button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="item-row">
                    <input className="form-control" placeholder="Description" value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)} required />
                    <input type="number" className="form-control" placeholder="Qty" min="1" value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} style={{ width: 80 }} />
                    <input type="number" className="form-control" placeholder="Unit Price ₹" min="0" value={item.unitPrice}
                      onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} style={{ width: 130 }} />
                    <span className="item-total">{formatCurrency(item.totalPrice)}</span>
                    {form.items.length > 1 && (
                      <button type="button" className="btn btn-icon btn-danger btn-sm"
                        onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="po-totals-mini">
                  <div className="total-line"><span>Subtotal</span><span>{formatCurrency(form.subtotal)}</span></div>
                  <div className="total-line"><span>GST (18%)</span><span>{formatCurrency(gst)}</span></div>
                  <div className="total-line grand"><span>Total</span><span>{formatCurrency(invoiceTotal)}</span></div>
                </div>
              </div>

              <div className="form-group mt-4">
                <label className="form-label">Notes</label>
                <textarea className="form-control" rows={2} placeholder="Additional notes..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <div className="flex gap-3 justify-between mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="btn-spinner" /> : <><Receipt size={15} /> Generate Invoice</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
