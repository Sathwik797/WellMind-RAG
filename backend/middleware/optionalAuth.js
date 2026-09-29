const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Optional authentication middleware for read-only analytical endpoints.
// If a valid JWT is provided, req.employee is populated.
// If no token or invalid token, req.employee is null and request proceeds in Guest mode.
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.employee = await Employee.findById(decoded.id).select('-password');
    } catch (error) {
      // In guest mode, proceed even if token expired or invalid
      req.employee = null;
    }
  } else {
    req.employee = null;
  }

  next();
};

module.exports = optionalAuth;
