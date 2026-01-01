// backend/controllers/authController.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, mobile, password, profileImage } = req.body;

    console.log('[Backend] Register attempt for:', email);

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      console.log('[Backend] User already exists:', email || mobile);
      return res.status(400).json({ message: 'User with this email or mobile already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('[Backend] Password hashed successfully');

    // Create user
    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      profileImage
    });

    console.log('[Backend] User registered successfully:', user._id);
    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('[Backend] Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('[Backend] Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('[Backend] User not found:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('[Backend] Password mismatch for:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profileImage: user.profileImage
    };

    console.log('[Backend] Login successful for:', email);
    res.json({ token, user: userData });
  } catch (error) {
    console.error('[Backend] Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('[Backend] getMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login, getMe };