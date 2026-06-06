const Vendor = require('../models/Vendor');
const Activity = require('../models/Activity');

// @GET /api/vendors
exports.getVendors = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = {};
    if (search) query.$or = [{ companyName: { $regex: search, $options: 'i' } }, { contactName: { $regex: search, $options: 'i' } }];
    if (category) query.category = category;
    if (status) query.status = status;
    const vendors = await Vendor.find(query).populate('createdBy', 'name').sort('-createdAt');
    res.json({ success: true, count: vendors.length, data: vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/vendors/:id
exports.getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('createdBy', 'name');
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/vendors
exports.createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create({ ...req.body, createdBy: req.user._id });
    await Activity.create({ type: 'vendor', action: 'created', description: `Vendor '${vendor.companyName}' registered`, entityId: vendor._id, entityRef: 'Vendor', performedBy: req.user._id, performedByName: req.user.name });
    res.status(201).json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/vendors/:id
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    await Activity.create({ type: 'vendor', action: 'updated', description: `Vendor '${vendor.companyName}' updated`, entityId: vendor._id, entityRef: 'Vendor', performedBy: req.user._id, performedByName: req.user.name });
    res.json({ success: true, data: vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/vendors/:id
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    await vendor.deleteOne();
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
