const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuth");
const { requireFieldRole } = require("../middleware/requireFieldRole");

const {
  addDecisionLog,
  getDecisionLogsByWellId,
} = require("../controllers/DecisionLogController");

router.get(
  "/wells/:wellId/decision-logs",
  optionalAuth,
  getDecisionLogsByWellId
);

router.post(
  "/wells/:wellId/decision-logs",
  protect,
  requireFieldRole,
  addDecisionLog
);

module.exports = router;