const Activity = require('../models/Activity');

// @GET /api/activity
exports.getActivity = async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    let query = {};
    if (type) query.type = type;
    const skip = (page - 1) * limit;
    const activities = await Activity.find(query)
      .populate('performedBy', 'name role')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(skip);
    const total = await Activity.countDocuments(query);
    res.json({ success: true, count: activities.length, total, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
