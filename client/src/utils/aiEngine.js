/**
 * VendorBridge AI Engine
 * Pure business logic — no ML required
 */

// ─── 1. SMART VENDOR RECOMMENDATION ENGINE ────────────────────────────────
// Weights: Price 40% + Delivery 30% + Rating 20% + History 10%

const normalizeMin = (value, min, max) => {
  if (max === min) return 100;
  return Math.round(((max - value) / (max - min)) * 100);
};

export const computeVendorRecommendation = (quotations) => {
  if (!quotations || quotations.length === 0) return null;

  const prices = quotations.map(q => q.totalPrice);
  const deliveries = quotations.map(q => q.deliveryDays);
  const minPrice = Math.min(...prices), maxPrice = Math.max(...prices);
  const minDel = Math.min(...deliveries), maxDel = Math.max(...deliveries);

  const scored = quotations.map(q => {
    const v = q.vendorId || {};
    const priceScore = normalizeMin(q.totalPrice, minPrice, maxPrice);
    const deliveryScore = normalizeMin(q.deliveryDays, minDel, maxDel);
    const ratingScore = Math.round(((v.rating || 4) / 5) * 100);
    const historyScore = v.totalOrders > 0
      ? Math.round((v.completedOrders / v.totalOrders) * 100)
      : 75;
    const finalScore = Math.round(
      priceScore * 0.4 + deliveryScore * 0.3 + ratingScore * 0.2 + historyScore * 0.1
    );

    const reasons = [];
    if (priceScore >= 80) reasons.push('✓ Competitive pricing');
    if (deliveryScore >= 80) reasons.push('✓ Fast delivery timeline');
    if (ratingScore >= 80) reasons.push('✓ Excellent vendor rating');
    if (historyScore >= 80) reasons.push('✓ Strong completion history');
    if (reasons.length === 0) reasons.push('✓ Best overall balance');

    return {
      quotationId: q._id,
      vendorId: v._id,
      vendorName: v.companyName || 'Unknown',
      totalPrice: q.totalPrice,
      deliveryDays: q.deliveryDays,
      rating: v.rating || 4,
      scores: { priceScore, deliveryScore, ratingScore, historyScore, finalScore },
      reasons,
    };
  });

  scored.sort((a, b) => b.scores.finalScore - a.scores.finalScore);
  return { recommended: scored[0], all: scored };
};

// ─── 2. PROCUREMENT HEALTH SCORE ──────────────────────────────────────────
export const computeHealthScore = ({ totalRFQs, awardedRFQs, totalPOs, deliveredPOs, totalInvoices, paidInvoices, avgVendorRating }) => {
  const rfqCompletion = totalRFQs > 0 ? Math.round((awardedRFQs / totalRFQs) * 100) : 85;
  const invoiceCompletion = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 90;
  const poCompletion = totalPOs > 0 ? Math.round((deliveredPOs / totalPOs) * 100) : 80;
  const vendorPerf = Math.round(((avgVendorRating || 4) / 5) * 100);
  const healthScore = Math.round((rfqCompletion + invoiceCompletion + poCompletion + vendorPerf) / 4);

  return {
    healthScore,
    status: healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Moderate' : 'Critical',
    color: healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red',
    breakdown: { rfqCompletion, invoiceCompletion, poCompletion, vendorPerf }
  };
};

// ─── 3. VENDOR RISK INDICATOR ─────────────────────────────────────────────
export const computeVendorRisk = (vendor) => {
  const delayRate = vendor.totalOrders > 0 ? (vendor.delayedOrders / vendor.totalOrders) * 100 : 0;
  const delayScore = Math.min(delayRate, 100);
  const ratingScore = vendor.rating < 2.5 ? 100 : vendor.rating < 3.5 ? 60 : vendor.rating < 4 ? 30 : 0;
  const rejectionRate = vendor.totalQuotations > 0 ? (vendor.rejectedQuotations / vendor.totalQuotations) * 100 : 0;
  const rejectionScore = Math.min(rejectionRate, 100);
  const riskScore = Math.round(delayScore * 0.4 + ratingScore * 0.3 + rejectionScore * 0.3);

  const riskLevel = riskScore <= 25 ? 'Low' : riskScore <= 60 ? 'Medium' : 'High';
  const riskColor = riskScore <= 25 ? 'green' : riskScore <= 60 ? 'yellow' : 'red';
  const riskEmoji = riskScore <= 25 ? '🟢' : riskScore <= 60 ? '🟡' : '🔴';

  const reasons = [];
  if (delayScore > 30) reasons.push(`${Math.round(delayRate)}% delayed deliveries`);
  if (ratingScore > 0) reasons.push(`Low rating (${vendor.rating}/5)`);
  if (rejectionScore > 30) reasons.push(`${Math.round(rejectionRate)}% rejection rate`);
  if (reasons.length === 0) reasons.push('Excellent performance record');

  return { riskScore, riskLevel, riskColor, riskEmoji, reasons };
};

// ─── Helper: Status Badge Variant ─────────────────────────────────────────
export const getStatusVariant = (status) => {
  const map = {
    open: 'primary', active: 'primary', submitted: 'info',
    approved: 'success', accepted: 'success', delivered: 'success',
    paid: 'success', healthy: 'success', low: 'success',
    under_review: 'warning', pending: 'warning', draft: 'warning',
    moderate: 'warning', medium: 'warning',
    rejected: 'danger', cancelled: 'danger', blacklisted: 'danger',
    critical: 'danger', high: 'danger', overdue: 'danger',
    awarded: 'success', closed: 'secondary', inactive: 'secondary', expired: 'secondary',
    confirmed: 'info', dispatched: 'info', sent: 'info',
  };
  return map[status?.toLowerCase()] || 'secondary';
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};
