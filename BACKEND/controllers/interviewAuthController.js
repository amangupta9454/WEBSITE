const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const InterviewUser = require('../models/InterviewUser');
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
      console.log("Google UserInfo Response:", data);
      
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
    
    const { sub, email, name, picture } = payload;
    
    let user = await InterviewUser.findOne({ googleId: sub });
    
    if (!user) {
      user = new InterviewUser({
        googleId: sub,
        email: email || 'no-email@google.com',
        name: name || 'Unknown User',
        profileImage: picture || '',
        credits: 3 // Default free credits
      });
      await user.save();
    }
    
    // Check if an intern account exists with this email
    let internUser = null;
    if (email) {
      internUser = await User.findOne({ email });
    }
    
    const role = internUser ? 'intern' : 'interview_user';
    const unifiedUserId = internUser ? internUser._id : user._id;

    // Generate JWT token
    const tokenPayload = { 
      userId: user._id, 
      role: 'interview_user', // Keep legacy for fallback
      unifiedUserId, 
      unifiedRole: role 
    };
    if (internUser) {
      tokenPayload.id = internUser._id; // Required by StudentController
    }

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
