const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const Activity = require('../models/Activity');

// @GET /api/purchase-orders
exports.getPurchaseOrders = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const pos = await PurchaseOrder.find(query)
      .populate('vendorId', 'companyName email')
      .populate('rfqId', 'rfqNumber title')
      .populate('quotationId', 'totalPrice deliveryDays')
      .populate('approvedBy', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, count: pos.length, data: pos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/purchase-orders/:id
exports.getPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('vendorId', 'companyName email contactName phone address gstNumber bankDetails')
      .populate('rfqId', 'rfqNumber title')
      .populate('quotationId', 'totalPrice deliveryDays notes')
      .populate('approvedBy', 'name')
      .populate('createdBy', 'name');
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/purchase-orders
exports.createPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.create({ ...req.body, createdBy: req.user._id });

    // Update quotation to accepted
    if (req.body.quotationId) {
      await Quotation.findByIdAndUpdate(req.body.quotationId, { status: 'accepted' });
    }

    // Update RFQ to awarded
    if (req.body.rfqId) {
      await RFQ.findByIdAndUpdate(req.body.rfqId, { status: 'awarded', awardedTo: req.body.vendorId });
    }

    // Update vendor stats
    await Vendor.findByIdAndUpdate(req.body.vendorId, { $inc: { totalOrders: 1 } });

    await Activity.create({ type: 'purchase_order', action: 'created', description: `Purchase Order ${po.poNumber} created`, entityId: po._id, entityRef: 'PurchaseOrder', entityNumber: po.poNumber, performedBy: req.user._id, performedByName: req.user.name });
    res.status(201).json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/purchase-orders/:id
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!po) return res.status(404).json({ success: false, message: 'PO not found' });

    if (req.body.status === 'delivered') {
      await Vendor.findByIdAndUpdate(po.vendorId, { $inc: { completedOrders: 1 } });
    }

    await Activity.create({ type: 'purchase_order', action: 'updated', description: `PO ${po.poNumber} status updated to ${po.status}`, entityId: po._id, entityRef: 'PurchaseOrder', entityNumber: po.poNumber, performedBy: req.user._id, performedByName: req.user.name });
    res.json({ success: true, data: po });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
