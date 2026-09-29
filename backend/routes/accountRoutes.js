const express = require('express');
const router = express.Router();

const {
  getMyAccount,
  updateMyAccount
} = require('../controllers/accountController');

const protect = require('../middleware/authMiddleware');


// Get logged-in employee
router.get(
  '/account/me',
  protect,
  getMyAccount
);


// Update logged-in employee
router.put(
  '/account/me',
  protect,
  updateMyAccount
);

module.exports = router;