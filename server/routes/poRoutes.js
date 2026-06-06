const express = require('express');
const router = express.Router();
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrder } = require('../controllers/poController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getPurchaseOrders);
router.get('/:id', getPurchaseOrder);
router.post('/', authorize('procurement_officer', 'admin'), createPurchaseOrder);
router.put('/:id', authorize('procurement_officer', 'manager', 'admin'), updatePurchaseOrder);

module.exports = router;
