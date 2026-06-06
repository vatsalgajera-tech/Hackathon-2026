const Quotation = require('../models/Quotation');
const Vendor = require('../models/Vendor');
const RFQ = require('../models/RFQ');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');

// ─── Helper: Normalize 0–100 (lower is better for price/delivery) ───────────
const normalizeMin = (value, min, max) => {
  if (max === min) return 100;
  return Math.round(((max - value) / (max - min)) * 100);
};

// ─── 1. SMART VENDOR RECOMMENDATION ENGINE ───────────────────────────────────
// @GET /api/ai/recommendation/:rfqId
exports.getVendorRecommendation = async (req, res) => {
  try {
    const quotations = await Quotation.find({ rfqId: req.params.rfqId, status: { $in: ['submitted', 'under_review'] } })
      .populate('vendorId', 'companyName rating completedOrders totalOrders delayedOrders');

    if (quotations.length === 0) return res.json({ success: true, data: null, message: 'No quotations yet' });

    const prices = quotations.map(q => q.totalPrice);
    const deliveries = quotations.map(q => q.deliveryDays);
    const minPrice = Math.min(...prices), maxPrice = Math.max(...prices);
    const minDel = Math.min(...deliveries), maxDel = Math.max(...deliveries);

    const scored = quotations.map(q => {
      const v = q.vendorId;
      const priceScore = normalizeMin(q.totalPrice, minPrice, maxPrice);
      const deliveryScore = normalizeMin(q.deliveryDays, minDel, maxDel);
      const ratingScore = Math.round((v.rating / 5) * 100);
      const historyScore = v.totalOrders > 0 ? Math.round((v.completedOrders / v.totalOrders) * 100) : 70;
      const finalScore = Math.round(priceScore * 0.4 + deliveryScore * 0.3 + ratingScore * 0.2 + historyScore * 0.1);

      const reasons = [];
      if (priceScore >= 80) reasons.push('Competitive pricing');
      if (deliveryScore >= 80) reasons.push('Fast delivery timeline');
      if (ratingScore >= 80) reasons.push('Excellent vendor rating');
      if (historyScore >= 80) reasons.push('Strong order completion history');

      return {
        quotationId: q._id,
        vendorId: v._id,
        vendorName: v.companyName,
        totalPrice: q.totalPrice,
        deliveryDays: q.deliveryDays,
        rating: v.rating,
        scores: { priceScore, deliveryScore, ratingScore, historyScore, finalScore },
        reasons,
      };
    });

    scored.sort((a, b) => b.scores.finalScore - a.scores.finalScore);
    res.json({ success: true, data: { recommended: scored[0], all: scored } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 2. PROCUREMENT HEALTH SCORE ─────────────────────────────────────────────
// @GET /api/ai/health-score
exports.getProcurementHealthScore = async (req, res) => {
  try {
    const [totalRFQs, awardedRFQs, totalPOs, deliveredPOs, totalInvoices, paidInvoices, vendors] = await Promise.all([
      RFQ.countDocuments(),
      RFQ.countDocuments({ status: 'awarded' }),
      PurchaseOrder.countDocuments(),
      PurchaseOrder.countDocuments({ status: 'delivered' }),
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'paid' }),
      Vendor.find({ status: 'active' }, 'rating completedOrders totalOrders delayedOrders'),
    ]);

    const rfqCompletion = totalRFQs > 0 ? Math.round((awardedRFQs / totalRFQs) * 100) : 85;
    const invoiceCompletion = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 90;
    const poCompletion = totalPOs > 0 ? Math.round((deliveredPOs / totalPOs) * 100) : 80;

    let vendorPerf = 85;
    if (vendors.length > 0) {
      const avgRating = vendors.reduce((s, v) => s + v.rating, 0) / vendors.length;
      vendorPerf = Math.round((avgRating / 5) * 100);
    }

    const healthScore = Math.round((rfqCompletion + invoiceCompletion + poCompletion + vendorPerf) / 4);
    const status = healthScore >= 80 ? 'Healthy' : healthScore >= 60 ? 'Moderate' : 'Critical';
    const color = healthScore >= 80 ? 'green' : healthScore >= 60 ? 'yellow' : 'red';

    res.json({
      success: true,
      data: {
        healthScore,
        status,
        color,
        breakdown: { rfqCompletion, invoiceCompletion, poCompletion, vendorPerf }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 3. VENDOR RISK INDICATOR ─────────────────────────────────────────────────
// @GET /api/ai/vendor-risk
exports.getVendorRisk = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'active' });
    const result = vendors.map(v => {
      const delayRate = v.totalOrders > 0 ? (v.delayedOrders / v.totalOrders) * 100 : 0;
      const delayScore = Math.min(delayRate, 100);
      const ratingScore = v.rating < 3 ? 100 : v.rating < 4 ? 50 : 0;
      const rejectionRate = v.totalQuotations > 0 ? (v.rejectedQuotations / v.totalQuotations) * 100 : 0;
      const rejectionScore = Math.min(rejectionRate, 100);
      const riskScore = Math.round(delayScore * 0.4 + ratingScore * 0.3 + rejectionScore * 0.3);

      const riskLevel = riskScore <= 25 ? 'Low' : riskScore <= 60 ? 'Medium' : 'High';
      const riskColor = riskScore <= 25 ? 'green' : riskScore <= 60 ? 'yellow' : 'red';

      const reasons = [];
      if (delayScore > 30) reasons.push(`${Math.round(delayRate)}% delayed deliveries`);
      if (ratingScore > 0) reasons.push(`Low rating (${v.rating}/5)`);
      if (rejectionScore > 30) reasons.push(`${Math.round(rejectionRate)}% rejection rate`);
      if (reasons.length === 0) reasons.push('Excellent performance record');

      return { vendorId: v._id, companyName: v.companyName, rating: v.rating, riskScore, riskLevel, riskColor, reasons };
    });

    result.sort((a, b) => b.riskScore - a.riskScore);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/ai/insights — Combined AI dashboard insights
exports.getAIInsights = async (req, res) => {
  try {
    const [healthResp, riskResp] = await Promise.all([
      exports.getProcurementHealthScore({ params: {} }, { json: (d) => d }),
      exports.getVendorRisk({ params: {} }, { json: (d) => d }),
    ]);

    const vendors = await Vendor.find({ status: 'active' }).sort('-rating').limit(1);
    const highRiskVendors = await Vendor.find({ status: 'active' });
    const riskScored = highRiskVendors.map(v => {
      const delayRate = v.totalOrders > 0 ? (v.delayedOrders / v.totalOrders) * 100 : 0;
      const ratingScore = v.rating < 3 ? 100 : v.rating < 4 ? 50 : 0;
      const rejectionRate = v.totalQuotations > 0 ? (v.rejectedQuotations / v.totalQuotations) * 100 : 0;
      const riskScore = Math.round(delayRate * 0.4 + ratingScore * 0.3 + rejectionRate * 0.3);
      return { ...v.toObject(), riskScore };
    });
    riskScored.sort((a, b) => b.riskScore - a.riskScore);
    const topRisk = riskScored[0];

    res.json({
      success: true,
      data: {
        topVendor: vendors[0] || null,
        highRiskVendor: topRisk || null,
        suggestion: vendors[0] ? `Consider ${vendors[0].companyName} for future RFQs — top-rated vendor.` : 'Add vendors to get AI recommendations.'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
