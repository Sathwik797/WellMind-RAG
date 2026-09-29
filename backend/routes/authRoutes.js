const express = require('express');
const router = express.Router();
const { registerEmployee, loginEmployee } = require('../controllers/authController');
const { googleAuth } = require('../controllers/googleAuthController');

router.post('/register', registerEmployee);
router.post('/login', loginEmployee);
router.post('/google', googleAuth);

module.exports = router;