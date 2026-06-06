const express = require('express');
const router = express.Router();
const { getQuotations, getQuotation, submitQuotation, updateQuotation, updateQuotationStatus } = require('../controllers/quotationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getQuotations);
router.get('/:id', getQuotation);
router.post('/', authorize('vendor', 'procurement_officer', 'admin'), submitQuotation);
router.put('/:id', authorize('vendor', 'procurement_officer', 'admin'), updateQuotation);
router.put('/:id/status', authorize('procurement_officer', 'manager', 'admin'), updateQuotationStatus);

module.exports = router;
