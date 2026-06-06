const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, updateInvoice, downloadInvoicePDF, sendInvoiceEmail } = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', downloadInvoicePDF);
router.post('/:id/email', sendInvoiceEmail);
router.post('/', authorize('procurement_officer', 'admin'), createInvoice);
router.put('/:id', authorize('procurement_officer', 'admin'), updateInvoice);

module.exports = router;
