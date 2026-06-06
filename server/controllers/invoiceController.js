const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const Activity = require('../models/Activity');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { sendInvoiceEmail } = require('../utils/emailSender');

// @GET /api/invoices
exports.getInvoices = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const invoices = await Invoice.find(query)
      .populate('vendorId', 'companyName email')
      .populate('poId', 'poNumber')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, count: invoices.length, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendorId', 'companyName email contactName phone address gstNumber bankDetails')
      .populate('poId', 'poNumber deliveryAddress paymentTerms')
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/invoices
exports.createInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.create({ ...req.body, createdBy: req.user._id });
    await PurchaseOrder.findByIdAndUpdate(req.body.poId, { status: 'confirmed' });
    await Activity.create({ type: 'invoice', action: 'created', description: `Invoice ${invoice.invoiceNumber} generated`, entityId: invoice._id, entityRef: 'Invoice', entityNumber: invoice.invoiceNumber, performedBy: req.user._id, performedByName: req.user.name });
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/invoices/:id/pdf — Download PDF
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendorId', 'companyName email contactName phone address gstNumber')
      .populate('poId', 'poNumber');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    const pdfStream = generateInvoicePDF(invoice);
    pdfStream.pipe(res);
    pdfStream.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/invoices/:id/email — Send via email
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('vendorId', 'companyName email contactName')
      .populate('poId', 'poNumber');
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    await sendInvoiceEmail(invoice, req.body.recipientEmail || invoice.vendorId.email);
    invoice.sentViaEmail = true;
    invoice.sentAt = new Date();
    invoice.status = 'sent';
    await invoice.save();
    await Activity.create({ type: 'invoice', action: 'emailed', description: `Invoice ${invoice.invoiceNumber} sent via email`, entityId: invoice._id, entityRef: 'Invoice', entityNumber: invoice.invoiceNumber, performedBy: req.user._id, performedByName: req.user.name });
    res.json({ success: true, message: 'Invoice sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/invoices/:id
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
