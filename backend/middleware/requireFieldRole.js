exports.requireFieldRole = (req, res, next) => {
  if (!req.employee || req.employee.role !== 'field') {
    return res.status(403).json({ message: 'Only field role can access this feature' });
  }
  next();
};