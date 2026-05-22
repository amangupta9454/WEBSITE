const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let isMatch = false;

    // Handle legacy users without a stored password hash
    if (!user.password) {
      if (password === 'Welcome@123') {
        isMatch = true;
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isFirstLogin: user.isFirstLogin === undefined ? true : user.isFirstLogin
      }
    });

  } catch (err) {
    console.error('[Backend] Login error:', err);
    res.status(500).json({ message: 'Server configuration error or downtime' });
  }
};

const setupPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.isFirstLogin = false;
    await user.save();

    res.json({ message: 'Password updated successfully' });

  } catch (err) {
    console.error('[Backend] Setup password error:', err);
    res.status(500).json({ message: 'Server configuration error or downtime' });
  }
};

module.exports = {
  loginStudent,
  setupPassword
};
