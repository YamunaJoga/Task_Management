const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Admin route to get all users
router.get('/users', protect, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find().select('name email role createdAt');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

module.exports = router;