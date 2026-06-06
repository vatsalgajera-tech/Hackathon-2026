const RFQ = require('../models/RFQ');
const Activity = require('../models/Activity');

// @GET /api/rfqs
exports.getRFQs = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (req.user.role === 'vendor') {
      query.assignedVendors = req.user.vendorId;
    }
    const rfqs = await RFQ.find(query)
      .populate('createdBy', 'name')
      .populate('assignedVendors', 'companyName email')
      .populate('awardedTo', 'companyName')
      .sort('-createdAt');
    res.json({ success: true, count: rfqs.length, data: rfqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/rfqs/:id
exports.getRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('assignedVendors', 'companyName email contactName phone')
      .populate('awardedTo', 'companyName');
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    res.json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/rfqs
exports.createRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.create({ ...req.body, createdBy: req.user._id });
    await Activity.create({ type: 'rfq', action: 'created', description: `RFQ '${rfq.title}' created`, entityId: rfq._id, entityRef: 'RFQ', entityNumber: rfq.rfqNumber, performedBy: req.user._id, performedByName: req.user.name });
    res.status(201).json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/rfqs/:id
exports.updateRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    await Activity.create({ type: 'rfq', action: 'updated', description: `RFQ '${rfq.title}' updated to status '${rfq.status}'`, entityId: rfq._id, entityRef: 'RFQ', entityNumber: rfq.rfqNumber, performedBy: req.user._id, performedByName: req.user.name });
    res.json({ success: true, data: rfq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/rfqs/:id
exports.deleteRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    await rfq.deleteOne();
    res.json({ success: true, message: 'RFQ deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
