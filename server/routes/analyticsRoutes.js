const express = require('express');
const router = express.Router();
const { getDashboardStats, getSpendingAnalytics, getVendorPerformance } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/spending', getSpendingAnalytics);
router.get('/vendor-performance', getVendorPerformance);

module.exports = router;
