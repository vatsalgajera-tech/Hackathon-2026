const mongoose = require('mongoose');

const rfqItemSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  description:    String,
  quantity:       { type: Number, required: true, min: 1 },
  unit:           { type: String, default: 'pcs' },
  estimatedPrice: Number,
});

const rfqSchema = new mongoose.Schema({
  rfqNumber:          { type: String, unique: true },
  title:              { type: String, required: true, trim: true },
  description:        String,
  items:              [rfqItemSchema],
  deadline:           { type: Date, required: true },
  status:             { type: String, enum: ['draft','open','under_review','awarded','cancelled','closed'], default: 'open' },
  assignedVendors:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  attachments:        [{ name: String, url: String }],
  quotationsReceived: { type: Number, default: 0 },
  createdBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  awardedTo:          { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
}, { timestamps: true });

// Mongoose v9: async pre-save hooks do NOT receive `next`
rfqSchema.pre('save', async function () {
  if (!this.rfqNumber) {
    const count = await mongoose.model('RFQ').countDocuments();
    const year  = new Date().getFullYear();
    this.rfqNumber = `RFQ-${year}-${String(count + 1).padStart(4, '0')}`;
  }
});

module.exports = mongoose.model('RFQ', rfqSchema);
