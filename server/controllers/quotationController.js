const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
const Vendor = require('../models/Vendor');
const Activity = require('../models/Activity');

// @GET /api/quotations
exports.getQuotations = async (req, res) => {
  try {
    const { rfqId, vendorId, status } = req.query;
    let query = {};
    if (rfqId) query.rfqId = rfqId;
    if (vendorId) query.vendorId = vendorId;
    if (status) query.status = status;
    if (req.user.role === 'vendor' && req.user.vendorId) query.vendorId = req.user.vendorId;
    const quotations = await Quotation.find(query)
      .populate('rfqId', 'rfqNumber title deadline')
      .populate('vendorId', 'companyName email rating completedOrders delayedOrders')
      .populate('submittedBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, count: quotations.length, data: quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/quotations/:id
exports.getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('rfqId', 'rfqNumber title items deadline')
      .populate('vendorId', 'companyName email contactName phone rating completedOrders totalOrders delayedOrders')
      .populate('submittedBy', 'name');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/quotations
exports.submitQuotation = async (req, res) => {
  try {
    const { rfqId, vendorId } = req.body;
    const existing = await Quotation.findOne({ rfqId, vendorId });
    if (existing) return res.status(400).json({ success: false, message: 'Quotation already submitted for this RFQ by this vendor' });

    const items = req.body.items.map(item => ({ ...item, totalPrice: item.quantity * item.unitPrice }));
    const totalPrice = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const quotation = await Quotation.create({ ...req.body, items, totalPrice, submittedBy: req.user._id });

    await RFQ.findByIdAndUpdate(rfqId, { $inc: { quotationsReceived: 1 } });
    const vendor = await Vendor.findByIdAndUpdate(vendorId, { $inc: { totalQuotations: 1 } }, { new: true });

    await Activity.create({ type: 'quotation', action: 'submitted', description: `${vendor?.companyName || 'Vendor'} submitted quotation for RFQ`, entityId: quotation._id, entityRef: 'Quotation', performedBy: req.user._id, performedByName: req.user.name });
    res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/quotations/:id
exports.updateQuotation = async (req, res) => {
  try {
    const items = req.body.items?.map(item => ({ ...item, totalPrice: item.quantity * item.unitPrice }));
    const totalPrice = items?.reduce((sum, i) => sum + i.totalPrice, 0);
    const quotation = await Quotation.findByIdAndUpdate(req.params.id, { ...req.body, items, totalPrice }, { new: true });
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/quotations/:id/status
exports.updateQuotationStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const quotation = await Quotation.findByIdAndUpdate(req.params.id,
      { status, rejectionReason, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }).populate('vendorId', 'companyName');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (status === 'rejected') {
      await Vendor.findByIdAndUpdate(quotation.vendorId._id, { $inc: { rejectedQuotations: 1 } });
    }
    await Activity.create({ type: 'quotation', action: status, description: `Quotation from ${quotation.vendorId?.companyName} ${status}`, entityId: quotation._id, entityRef: 'Quotation', performedBy: req.user._id, performedByName: req.user.name });
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
