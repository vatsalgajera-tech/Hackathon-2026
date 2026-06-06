const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema({
  name: String, quantity: Number, unitPrice: Number, totalPrice: Number,
});

const purchaseOrderSchema = new mongoose.Schema({
  poNumber:         { type: String, unique: true },
  rfqId:            { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
  quotationId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  vendorId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items:            [poItemSchema],
  subtotal:         { type: Number, required: true },
  taxRate:          { type: Number, default: 18 },
  taxAmount:        { type: Number },
  total:            { type: Number },
  deliveryAddress:  String,
  deliveryDate:     Date,
  paymentTerms:     { type: String, default: 'Net 30' },
  status:           { type: String, enum: ['pending','confirmed','dispatched','delivered','cancelled'], default: 'pending' },
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalRemarks:  String,
  createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Mongoose v9: async pre-save, NO next parameter
purchaseOrderSchema.pre('save', async function () {
  if (!this.poNumber) {
    const count = await mongoose.model('PurchaseOrder').countDocuments();
    const year  = new Date().getFullYear();
    this.poNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  this.taxAmount = (this.subtotal * this.taxRate) / 100;
  this.total     = this.subtotal + this.taxAmount;
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
