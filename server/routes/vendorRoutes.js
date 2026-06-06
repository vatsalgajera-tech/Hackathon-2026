const express = require('express');
const router = express.Router();
const { getVendors, getVendor, createVendor, updateVendor, deleteVendor } = require('../controllers/vendorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getVendors);
router.get('/:id', getVendor);
router.post('/', authorize('admin', 'procurement_officer'), createVendor);
router.put('/:id', authorize('admin', 'procurement_officer'), updateVendor);
router.delete('/:id', authorize('admin'), deleteVendor);

module.exports = router;
