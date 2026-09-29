const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { requireFieldRole } = require("../middleware/requireFieldRole");

const {
  addDecisionLog,
  getDecisionLogsByWellId,
} = require("../controllers/DecisionLogController");

router.get(
  "/wells/:wellId/decision-logs",
  protect,
  getDecisionLogsByWellId
);

router.post(
  "/wells/:wellId/decision-logs",
  protect,
  requireFieldRole,
  addDecisionLog
);

module.exports = router;