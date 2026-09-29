const { OAuth2Client } = require('google-auth-library');
const Employee = require('../models/Employee');
const generateToken = require('../utils/generateToken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body; // role sent only on first-time signup

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let employee = await Employee.findOne({ googleId });

    if (!employee) {
      // first-time Google login — role must be provided
      if (!role || !['office', 'field'].includes(role)) {
        return res.status(400).json({ message: 'Role is required for first-time signup' });
      }
      employee = await Employee.create({
        employeeId: email,
        employeeName: name,
        googleId,
        authProvider: 'google',
        role,
      });
    }

    res.status(200).json({
      _id: employee._id,
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      role: employee.role,
      token: generateToken(employee._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Google auth failed', error: error.message });
  }
};