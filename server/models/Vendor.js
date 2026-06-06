const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['IT & Software', 'Hardware', 'Office Supplies', 'Logistics', 'Consulting', 'Manufacturing', 'Other'],
    required: true
  },
  gstNumber: { type: String, trim: true },
  contactName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  rating: { type: Number, default: 4.0, min: 0, max: 5 },
  status: { type: String, enum: ['active', 'inactive', 'blacklisted'], default: 'active' },
  completedOrders: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  delayedOrders: { type: Number, default: 0 },
  rejectedQuotations: { type: Number, default: 0 },
  totalQuotations: { type: Number, default: 0 },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
  },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
