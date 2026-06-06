const express = require('express');
const router = express.Router();
const { getVendorRecommendation, getProcurementHealthScore, getVendorRisk, getAIInsights } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/recommendation/:rfqId', getVendorRecommendation);
router.get('/health-score', getProcurementHealthScore);
router.get('/vendor-risk', getVendorRisk);
router.get('/insights', getAIInsights);

module.exports = router;
