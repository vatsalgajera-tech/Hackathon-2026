const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const Activity = require('../models/Activity');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ── Helper: extract readable mongoose validation errors ────────
const handleError = (err, res) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages[0] });
  }
  // Mongoose duplicate key (email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(400).json({ success: false, message: `This ${field} is already registered.` });
  }
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
  }
  // Generic server error
  console.error(`[Auth Error] ${err.name}: ${err.message}`);
  return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
};

// ── @POST /api/auth/register ───────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Manual required-field check (before hitting DB)
    if (!name?.trim())     return res.status(400).json({ success: false, message: 'Full name is required.' });
    if (!email?.trim())    return res.status(400).json({ success: false, message: 'Email address is required.' });
    if (!password)         return res.status(400).json({ success: false, message: 'Password is required.' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

    // Check duplicate before create (cleaner error)
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'An account with this email already exists. Please log in.' });

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: role || 'procurement_officer',
    });

    await Activity.create({
      type: 'auth',
      action: 'registered',
      description: `${user.name} registered as ${user.role}`,
      performedByName: user.name,
    });

    const token = generateToken(user._id);
    return res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return handleError(err, res);
  }
};

// ── @POST /api/auth/login ──────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim()) return res.status(400).json({ success: false, message: 'Email address is required.' });
    if (!password)      return res.status(400).json({ success: false, message: 'Password is required.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email address.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact your administrator.' });
    }

    await Activity.create({
      type: 'auth',
      action: 'logged_in',
      description: `${user.name} logged in`,
      performedBy: user._id,
      performedByName: user.name,
    });

    const token = generateToken(user._id);
    return res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return handleError(err, res);
  }
};

// ── @GET /api/auth/me ──────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
  });
};

// ── @POST /api/auth/forgot-password ───────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    if (!req.body.email) return res.status(400).json({ success: false, message: 'Email address is required.' });

    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with that email address.' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save({ validateBeforeSave: false });

    return res.json({ success: true, message: 'Password reset token generated.', resetToken });
  } catch (err) {
    return handleError(err, res);
  }
};

// ── @PUT /api/auth/reset-password/:token ──────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired.' });
    if (!req.body.password || req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    return res.json({ success: true, token, message: 'Password reset successful.' });
  } catch (err) {
    return handleError(err, res);
  }
};

// ── @GET /api/auth/users (admin only) ─────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    return res.json({ success: true, data: users });
  } catch (err) {
    return handleError(err, res);
  }
};
