import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { computeVendorRecommendation, formatCurrency, formatDate } from '../../utils/aiEngine';
import { Trophy, Star, Clock, DollarSign, TrendingUp, CheckCircle, ArrowLeft, Zap, BarChart3, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import './Quotations.css';

const demoQuotations = [
  { _id: 'q1', vendorId: { _id: 'v1', companyName: 'ABC Technologies', rating: 4.8, completedOrders: 45, totalOrders: 48, delayedOrders: 2 }, totalPrice: 1380000, deliveryDays: 7, notes: 'Includes 1-year warranty and free installation', status: 'submitted', items: [{ name: 'Dell Laptop 15"', quantity: 20, unitPrice: 64000, totalPrice: 1280000 }, { name: 'Laptop Bag', quantity: 20, unitPrice: 5000, totalPrice: 100000 }] },
  { _id: 'q2', vendorId: { _id: 'v2', companyName: 'XYZ Industries', rating: 3.8, completedOrders: 28, totalOrders: 35, delayedOrders: 8 }, totalPrice: 1320000, deliveryDays: 20, notes: 'Bulk discount applied', status: 'submitted', items: [{ name: 'Dell Laptop 15"', quantity: 20, unitPrice: 61000, totalPrice: 1220000 }, { name: 'Laptop Bag', quantity: 20, unitPrice: 5000, totalPrice: 100000 }] },
  { _id: 'q3', vendorId: { _id: 'v4', companyName: 'OfficeMax Pro', rating: 4.5, completedOrders: 67, totalOrders: 70, delayedOrders: 3 }, totalPrice: 1450000, deliveryDays: 5, notes: 'Premium quality, next business day support', status: 'submitted', items: [{ name: 'Dell Laptop 15"', quantity: 20, unitPrice: 67500, totalPrice: 1350000 }, { name: 'Laptop Bag', quantity: 20, unitPrice: 5000, totalPrice: 100000 }] },
];

export default function QuotationCompare() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [rfq, setRfq] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [sortBy, setSortBy] = useState('score');
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [qRes, rfqRes] = await Promise.all([
          api.get('/quotations', { params: { rfqId } }),
          rfqId ? api.get(`/rfqs/${rfqId}`) : Promise.resolve({ data: { data: null } })
        ]);
        const qs = qRes.data.data;
        setQuotations(qs);
        setRfq(rfqRes.data.data);
        if (qs.length > 0) {
          const rec = computeVendorRecommendation(qs);
          setRecommendation(rec);
        }
      } catch {
        setQuotations(demoQuotations);
        const rec = computeVendorRecommendation(demoQuotations);
        setRecommendation(rec);
        setRfq({ rfqNumber: 'RFQ-2026-0001', title: 'Laptop Procurement Q2 2026' });
      } finally { setLoading(false); }
    };
    fetchData();
  }, [rfqId]);

  const handleAccept = (quotation) => {
    setDialog({
      title: 'Accept Quotation',
      message: `Accept quotation from ${quotation.vendorId?.companyName} for ${formatCurrency(quotation.totalPrice)}? This will create a Purchase Order.`,
      type: 'info',
      confirmLabel: 'Accept & Create PO',
      onConfirm: async () => {
        setAccepting(quotation._id);
        try {
          await api.put(`/quotations/${quotation._id}/status`, { status: 'accepted' });
          toast.success('Quotation accepted! Creating purchase order...');
          await api.post('/purchase-orders', {
            rfqId: rfqId || quotation.rfqId,
            quotationId: quotation._id,
            vendorId: quotation.vendorId?._id || quotation.vendorId,
            items: quotation.items,
            subtotal: quotation.totalPrice,
          });
          toast.success('Purchase Order created!');
          navigate('/purchase-orders');
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to accept quotation');
        } finally { setAccepting(null); }
      }
    });
  };

  const getScored = () => {
    if (!recommendation) return quotations.map(q => ({ ...q, score: null }));
    return quotations.map(q => {
      const scored = recommendation.all.find(r => r.quotationId === q._id || r.quotationId?.toString() === q._id?.toString());
      return { ...q, score: scored };
    }).sort((a, b) => {
      if (sortBy === 'score') return (b.score?.scores.finalScore || 0) - (a.score?.scores.finalScore || 0);
      if (sortBy === 'price') return a.totalPrice - b.totalPrice;
      if (sortBy === 'delivery') return a.deliveryDays - b.deliveryDays;
      return 0;
    });
  };

  const minPrice = Math.min(...quotations.map(q => q.totalPrice));
  const minDelivery = Math.min(...quotations.map(q => q.deliveryDays));
  const scored = getScored();

  if (loading) return <div className="flex justify-center items-center" style={{ height: 300 }}><div className="btn-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div>;

  return (
    <div className="qcompare-page animate-fade">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/quotations" className="btn btn-secondary btn-sm btn-icon"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="page-title">Quotation Comparison</h1>
            {rfq && <p className="page-subtitle">{rfq.rfqNumber} — {rfq.title}</p>}
          </div>
        </div>
      </div>

      {quotations.length === 0 ? (
        <div className="empty-state card">
          <BarChart3 size={48} />
          <h3>No quotations yet</h3>
          <p>Vendors haven't submitted quotations for this RFQ</p>
        </div>
      ) : (
        <>
          {/* ── AI RECOMMENDATION BANNER ─────────────────────────────────── */}
          {recommendation?.recommended && (
            <div className="ai-recommendation-banner">
              <div className="rec-glow" />
              <div className="rec-content">
                <div className="rec-trophy">🏆</div>
                <div className="rec-main">
                  <div className="rec-label">
                    <Zap size={14} />
                    <span>AI Recommended Vendor</span>
                  </div>
                  <h2 className="rec-vendor-name">{recommendation.recommended.vendorName}</h2>
                  <div className="rec-reasons">
                    {recommendation.recommended.reasons.map((r, i) => (
                      <span key={i} className="rec-reason"><CheckCircle size={12} />{r}</span>
                    ))}
                  </div>
                </div>
                <div className="rec-score-block">
                  <div className="rec-score">{recommendation.recommended.scores.finalScore}</div>
                  <div className="rec-score-label">AI Score<br />/100</div>
                  <div className="rec-score-breakdown">
                    <span>Price: {recommendation.recommended.scores.priceScore}%</span>
                    <span>Delivery: {recommendation.recommended.scores.deliveryScore}%</span>
                    <span>Rating: {recommendation.recommended.scores.ratingScore}%</span>
                    <span>History: {recommendation.recommended.scores.historyScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-muted font-medium">Sort by:</span>
            {[['score', 'AI Score'], ['price', 'Lowest Price'], ['delivery', 'Fastest Delivery']].map(([v, l]) => (
              <button key={v} className={`sort-btn ${sortBy === v ? 'active' : ''}`} onClick={() => setSortBy(v)}>{l}</button>
            ))}
            <span className="text-sm text-muted ml-4">{quotations.length} quotations received</span>
          </div>

          {/* Comparison Cards */}
          <div className="qcompare-grid">
            {scored.map((q, idx) => {
              const isRecommended = recommendation?.recommended?.quotationId === q._id || recommendation?.recommended?.quotationId?.toString() === q._id?.toString();
              const isCheapest = q.totalPrice === minPrice;
              const isFastest = q.deliveryDays === minDelivery;
              const vendorScore = q.score?.scores;

              return (
                <div key={q._id} className={`quotation-card ${isRecommended ? 'recommended' : ''}`}>
                  {isRecommended && (
                    <div className="recommended-ribbon">🏆 Recommended</div>
                  )}

                  <div className="qcard-header">
                    <div className="qcard-avatar">{q.vendorId?.companyName?.charAt(0)}</div>
                    <div>
                      <h3 className="qcard-vendor">{q.vendorId?.companyName}</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} fill={i < Math.floor(q.vendorId?.rating || 0) ? '#f59e0b' : 'none'} stroke="#f59e0b" />
                        ))}
                        <span className="text-xs text-muted">{q.vendorId?.rating}/5</span>
                      </div>
                    </div>
                    {vendorScore && (
                      <div className={`ai-score-badge ${isRecommended ? 'recommended' : ''}`}>
                        {vendorScore.finalScore}<span>/100</span>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  <div className="qcard-highlights">
                    <div className={`qcard-highlight ${isCheapest ? 'best' : ''}`}>
                      <DollarSign size={16} />
                      <div>
                        <span className="highlight-val">{formatCurrency(q.totalPrice)}</span>
                        <span className="highlight-label">{isCheapest ? '✓ Lowest Price' : 'Total Price'}</span>
                      </div>
                    </div>
                    <div className={`qcard-highlight ${isFastest ? 'best' : ''}`}>
                      <Clock size={16} />
                      <div>
                        <span className="highlight-val">{q.deliveryDays} days</span>
                        <span className="highlight-label">{isFastest ? '✓ Fastest' : 'Delivery'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Bars */}
                  {vendorScore && (
                    <div className="qcard-scores">
                      {[['Price', vendorScore.priceScore, '#10b981'], ['Delivery', vendorScore.deliveryScore, '#6366f1'], ['Rating', vendorScore.ratingScore, '#f59e0b'], ['History', vendorScore.historyScore, '#8b5cf6']].map(([label, val, color]) => (
                        <div key={label} className="score-bar-row">
                          <span className="score-bar-label">{label}</span>
                          <div className="score-bar-bg">
                            <div className="score-bar-fill" style={{ width: `${val}%`, background: color }} />
                          </div>
                          <span className="score-bar-val">{val}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Items */}
                  <div className="qcard-items">
                    {q.items?.slice(0, 3).map((item, i) => (
                      <div key={i} className="qcard-item">
                        <span>{item.name}</span>
                        <span>{formatCurrency(item.unitPrice)}/unit</span>
                      </div>
                    ))}
                    {q.items?.length > 3 && <div className="qcard-item text-muted">+{q.items.length - 3} more items</div>}
                  </div>

                  {q.notes && <p className="qcard-notes">💬 {q.notes}</p>}

                  <button
                    className={`btn w-full mt-4 ${isRecommended ? 'btn-accent' : 'btn-secondary'}`}
                    onClick={() => handleAccept(q)}
                    disabled={accepting === q._id || q.status === 'accepted'}
                    id={`accept-${idx}`}
                  >
                    {accepting === q._id ? <span className="btn-spinner" /> :
                      q.status === 'accepted' ? '✓ Accepted' :
                        isRecommended ? '🏆 Accept Recommended' : 'Accept Quotation'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Side-by-side comparison table */}
          <div className="card">
            <h3 className="mb-4">Side-by-Side Comparison</h3>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Criteria</th>
                    {quotations.map(q => <th key={q._id}>{q.vendorId?.companyName}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="font-medium">Total Price</td>{quotations.map(q => <td key={q._id} className={q.totalPrice === minPrice ? 'best-cell' : ''}>{formatCurrency(q.totalPrice)}</td>)}</tr>
                  <tr><td className="font-medium">Delivery Days</td>{quotations.map(q => <td key={q._id} className={q.deliveryDays === minDelivery ? 'best-cell' : ''}>{q.deliveryDays} days</td>)}</tr>
                  <tr><td className="font-medium">Vendor Rating</td>{quotations.map(q => <td key={q._id}>⭐ {q.vendorId?.rating}/5</td>)}</tr>
                  <tr><td className="font-medium">AI Score</td>{scored.map(q => <td key={q._id} className="font-semibold" style={{ color: 'var(--primary)' }}>{q.score?.scores.finalScore || '—'}/100</td>)}</tr>
                  <tr><td className="font-medium">Status</td>{quotations.map(q => <td key={q._id}><span className={`badge badge-${q.status === 'accepted' ? 'success' : 'info'}`}>{q.status}</span></td>)}</tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
