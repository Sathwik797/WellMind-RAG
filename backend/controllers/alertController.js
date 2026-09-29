const Alert = require('../models/Alert');
exports.getAlerts = async (req, res) => {
  try {
    const { wellId } = req.query;
    const filter = wellId ? { wellId } : {};
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ alerts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
};
// @route PATCH /api/alerts/:id/read
exports.markAlertRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.status(200).json(alert);
  } catch (error) {
    res.status(500).json({ message: 'Error updating alert', error: error.message });
  }
};

// @route PATCH /api/alerts/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Alert.updateMany({ read: false }, { read: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating alerts', error: error.message });
  }
};