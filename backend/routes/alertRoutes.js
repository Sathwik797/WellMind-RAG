const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');
const { getAlerts, markAlertRead, markAllRead } = require('../controllers/alertController');

router.get('/', optionalAuth, getAlerts);
router.patch('/:id/read', protect, markAlertRead);
router.patch('/read-all', protect, markAllRead);

module.exports = router;