const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  const { credential, accessToken } = req.body;
  try {
    let payload;
    
    if (accessToken) {
      // Custom button returns access token
      const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await googleResponse.json();
      
      if (data.error) throw new Error(data.error_description || data.error.message || JSON.stringify(data.error));
      
      payload = {
        sub: data.sub,
        email: data.email,
        name: data.name,
        picture: data.picture
      };
    } else if (credential) {
      // Standard iframe button returns JWT
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      return res.status(400).json({ success: false, message: 'No credential provided' });
    }
    
    const { email, name, picture } = payload;
    
    const normalizedEmail = email ? email.toLowerCase() : 'no-email@google.com';
    
    // Find in the unified User collection by email (case-insensitive)
    // Prioritize the document that has an internship matching this email, either as root email or within the internships array
    let user = await User.findOne({ 
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
      "internships.0": { $exists: true }
    });
    
    // If no intern account found, look for any account with this email
    if (!user) {
      user = await User.findOne({ 
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
      });
    }
    
    if (!user) {
      // Create a new normal user (who is not an intern yet)
      user = new User({
        email: normalizedEmail,
        name: name || 'Unknown User',
        profileImage: picture || '',
        mobile: 'Google Auth' // Required by User schema
      });
      await user.save();
    }
    
    // Determine role based on explicit role field, fallback to internships array
    const isIntern = user.role === 'intern' || (user.internships && user.internships.length > 0);
    const role = isIntern ? 'intern' : 'interview_user';

    // Generate JWT token
    const tokenPayload = { 
      id: user._id,
      userId: user._id, 
      unifiedUserId: user._id, 
      unifiedRole: role 
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'secret',
      { expiresIn: '30d' }
    );
    
    res.status(200).json({ success: true, token, user, role });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Google login failed', error: error.message, stack: error.stack });
  }
};
