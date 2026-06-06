const express = require('express');
const router = express.Router();
const { getRFQs, getRFQ, createRFQ, updateRFQ, deleteRFQ } = require('../controllers/rfqController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getRFQs);
router.get('/:id', getRFQ);
router.post('/', authorize('admin', 'procurement_officer'), createRFQ);
router.put('/:id', authorize('admin', 'procurement_officer', 'manager'), updateRFQ);
router.delete('/:id', authorize('admin', 'procurement_officer'), deleteRFQ);

module.exports = router;
