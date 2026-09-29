const express = require('express');
const router = express.Router();
const { predictRiskForWell, explainRiskForWell,searchHistoricalDocuments,simulateScenario,getRiskTimeseries } = require('../controllers/riskController');
const protect = require('../middleware/authMiddleware');

router.get('/:wellId', protect, predictRiskForWell);
router.get('/:wellId/explain', protect, explainRiskForWell);
router.get('/:wellId/timeseries', protect, getRiskTimeseries);
router.post('/historical-search', protect, searchHistoricalDocuments);
router.post('/simulate', protect, simulateScenario);

module.exports = router;