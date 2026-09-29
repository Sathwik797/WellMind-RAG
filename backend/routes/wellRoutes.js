const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const { requireFieldRole } = require('../middleware/requireFieldRole');

const {
  getNearbyWells,
  getSimilarWells,
  createWell,
  searchWells,
  getWellByWellId,
  getWellFullDetails,
  getWellEvents,
  createEvent,
  getWellContributors,
} = require('../controllers/wellController');
const {
  addDecisionLog,
  getDecisionLogsByWellId,
} = require('../controllers/DecisionLogController');

// State mutation / administrative writes: REQUIRE AUTHENTICATION
router.post('/', protect, createWell);
router.post('/:wellId/events', protect, createEvent);
router.post('/:wellId/decision-logs', protect, requireFieldRole, addDecisionLog);

// Read-only analytical / intelligence endpoints: GUEST ACCESSIBLE (optional authentication)
router.get('/nearby', optionalAuth, getNearbyWells);
router.get('/search', optionalAuth, searchWells);
router.get('/:wellId/contributors', optionalAuth, getWellContributors);
router.get('/similar/:wellId', optionalAuth, getSimilarWells);
router.get('/:wellId/full', optionalAuth, getWellFullDetails);
router.get('/:wellId/events', optionalAuth, getWellEvents);
router.get('/:wellId/decision-logs', optionalAuth, getDecisionLogsByWellId);
router.get('/:wellId', optionalAuth, getWellByWellId);

module.exports = router;