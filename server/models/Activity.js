const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['rfq', 'quotation', 'approval', 'purchase_order', 'invoice', 'vendor', 'auth'],
    required: true
  },
  action: { type: String, required: true }, // 'created', 'updated', 'approved', 'rejected', etc.
  description: { type: String, required: true },
  entityId: mongoose.Schema.Types.ObjectId,
  entityRef: String, // 'RFQ', 'Quotation', etc.
  entityNumber: String, // e.g. 'RFQ-2026-0001'
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: String,
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema);
