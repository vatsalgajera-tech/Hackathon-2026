const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Vendor = require('../models/Vendor');

// @GET /api/analytics/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalRFQs, activeRFQs, pendingApprovals, totalPOs, recentPOs, recentInvoices, totalVendors, totalSpend] = await Promise.all([
      RFQ.countDocuments(),
      RFQ.countDocuments({ status: 'open' }),
      Quotation.countDocuments({ status: 'under_review' }),
      PurchaseOrder.countDocuments(),
      PurchaseOrder.find().populate('vendorId', 'companyName').populate('rfqId', 'title').sort('-createdAt').limit(5),
      Invoice.find().populate('vendorId', 'companyName').populate('poId', 'poNumber').sort('-createdAt').limit(5),
      Vendor.countDocuments({ status: 'active' }),
      PurchaseOrder.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
    ]);

    res.json({
      success: true,
      data: {
        totalRFQs, activeRFQs, pendingApprovals, totalPOs,
        totalVendors,
        totalSpend: totalSpend[0]?.total || 0,
        recentPOs, recentInvoices
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/spending
exports.getSpendingAnalytics = async (req, res) => {
  try {
    const monthlySpending = await PurchaseOrder.aggregate([
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    const vendorSpending = await PurchaseOrder.aggregate([
      { $group: { _id: '$vendorId', total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      { $project: { vendorName: '$vendor.companyName', total: 1, count: 1 } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ]);

    const categorySpending = await PurchaseOrder.aggregate([
      { $lookup: { from: 'vendors', localField: 'vendorId', foreignField: '_id', as: 'vendor' } },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$vendor.category', total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json({ success: true, data: { monthlySpending, vendorSpending, categorySpending } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/analytics/vendor-performance
exports.getVendorPerformance = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: 'active' })
      .select('companyName rating completedOrders totalOrders delayedOrders category')
      .sort('-rating').limit(10);
    res.json({ success: true, data: vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
