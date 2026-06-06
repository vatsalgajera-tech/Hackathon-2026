const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  quantity:   { type: Number, required: true },
  unitPrice:  { type: Number, required: true },
  totalPrice: { type: Number },
});

const quotationSchema = new mongoose.Schema({
  rfqId:           { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ',      required: true },
  vendorId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor',   required: true },
  items:           [quotationItemSchema],
  totalPrice:      { type: Number, required: true },
  deliveryDays:    { type: Number, required: true },
  validityDays:    { type: Number, default: 30 },
  notes:           String,
  terms:           String,
  status:          { type: String, enum: ['submitted','under_review','accepted','rejected','expired'], default: 'submitted' },
  submittedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:      Date,
  rejectionReason: String,
}, { timestamps: true });

// Mongoose v9: synchronous pre-save (no async needed, no next)
quotationItemSchema.pre('save', function () {
  this.totalPrice = this.quantity * this.unitPrice;
});

module.exports = mongoose.model('Quotation', quotationSchema);
