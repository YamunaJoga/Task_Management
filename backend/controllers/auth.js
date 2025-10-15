const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');

// Generate JWT Token
const sendTokenResponse = (user, statusCode, res) => {
  try {
    // Create token
    const token = user.getSignedJwtToken();

    console.log('Sending token response for user:', user.email);

    res.status(statusCode).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in sendTokenResponse:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating token'
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  console.log('Registration request received:', req.body);

  const { name, email, password, role = 'user' } = req.body;

  // Validate input
  if (!name || !email || !password) {
    console.log('Missing required fields');
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email and password'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    console.log('Creating new user...');
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    console.log('User created successfully:', user.email);
    sendTokenResponse(user, 201, res);
    
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating user: ' + error.message
    });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log('Login attempt for email:', email);

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email and password'
    });
  }

  try {
    // Check for user (include password for verification)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      console.log('Password mismatch for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Login successful for:', email);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login error: ' + error.message
    });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});