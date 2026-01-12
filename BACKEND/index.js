require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const registerRoutes = require('./routes/register');     // Internship application (now public)
const adminRoutes = require('./routes/admin');           // Admin panel
const verifyRoutes = require('./routes/verify');         // Certificate verification
const projectRoutes = require('./routes/project');      // New: Project submission
const app = express();
app.use(cors("*"));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Public internship application route (NO auth required)
app.use('/api/register', registerRoutes);

// Admin routes (protected)
app.use('/api/admin', adminRoutes);

// Public certificate verification
app.use('/api/verify', verifyRoutes);

// New: Public project submission
app.use('/api/project', projectRoutes);
console.log('Loaded ENV vars:');
console.log('EMAIL_USER       →', process.env.EMAIL_USER || 'NOT FOUND');
console.log('EMAIL_APP_PASSWORD →', process.env.EMAIL_APP_PASSWORD);
console.log('JWT_SECRET       →', process.env.JWT_SECRET); // just to compare

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
