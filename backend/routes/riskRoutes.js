const express = require('express');
const router = express.Router();
const { predictRiskForWell, explainRiskForWell,searchHistoricalDocuments,simulateScenario,getRiskTimeseries } = require('../controllers/riskController');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/:wellId', optionalAuth, predictRiskForWell);
router.get('/:wellId/explain', optionalAuth, explainRiskForWell);
router.get('/:wellId/timeseries', optionalAuth, getRiskTimeseries);
router.post('/historical-search', optionalAuth, searchHistoricalDocuments);
router.post('/simulate', optionalAuth, simulateScenario);

module.exports = router;