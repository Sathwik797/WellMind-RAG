// // @route GET /api/wells/:wellId/decision-logs
const DecisionLog = require('../models/DecisionLog');
const Well = require('../models/Well');

// @route POST /api/wells/:wellId/decision-logs
exports.addDecisionLog = async (req, res) => {
  try {
    const { wellId } = req.params;
    const { depth, problem, solution, category, date } = req.body;

    if (!problem || !solution) {
      return res.status(400).json({ message: 'problem and solution are required' });
    }

    let well = await Well.findOne({ wellId });
    if (!well && (wellId === 'WELL-001' || wellId === 'OIL-BHK-142')) {
      well = await Well.findOne({ wellId: 'W001' });
    }
    if (!well) {
      well = await Well.findOne({ wellId: wellId.replace(/-/g, '') });
    }
    if (!well) {
      return res.status(404).json({ message: 'Well not found' });
    }

    const log = await DecisionLog.create({
      wellId: well.wellId,
      engineerName: req.employee ? req.employee.employeeName : 'Guest Field Engineer',
      depth: depth ? Number(depth) : null,
      problem,
      solution,
      category,
      date,
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @route GET /api/wells/:wellId/decision-logs
exports.getDecisionLogsByWellId = async (req, res) => {
  try {
    const { wellId } = req.params;
    let targetWellId = wellId;
    if (wellId === 'WELL-001' || wellId === 'OIL-BHK-142') {
      targetWellId = 'W001';
    } else {
      const well = await Well.findOne({ wellId: wellId.replace(/-/g, '') });
      if (well) targetWellId = well.wellId;
    }

    const logs = await DecisionLog.find({
      $or: [{ wellId: targetWellId }, { wellId: wellId }]
    }).sort({ createdAt: -1 });
    res.status(200).json({ count: logs.length, logs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};