const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  name: String, quantity: Number, unitPrice: Number, totalPrice: Number,
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  poId:          { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
  vendorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items:         [invoiceItemSchema],
  subtotal:      { type: Number, required: true },
  gstRate:       { type: Number, default: 18 },
  gstAmount:     { type: Number },
  total:         { type: Number },
  issueDate:     { type: Date, default: Date.now },
  dueDate:       Date,
  status:        { type: String, enum: ['draft','sent','paid','overdue','cancelled'], default: 'draft' },
  sentViaEmail:  { type: Boolean, default: false },
  sentAt:        Date,
  paidAt:        Date,
  notes:         String,
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Mongoose v9: async pre-save, NO next parameter
invoiceSchema.pre('save', async function () {
  if (!this.invoiceNumber) {
    const count = await mongoose.model('Invoice').countDocuments();
    const year  = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  this.gstAmount = (this.subtotal * this.gstRate) / 100;
  this.total     = this.subtotal + this.gstAmount;
  if (!this.dueDate) {
    const due = new Date(this.issueDate);
    due.setDate(due.getDate() + 30);
    this.dueDate = due;
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
