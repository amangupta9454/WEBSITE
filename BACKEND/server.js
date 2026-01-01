// backend/server.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const registerRoutes = require('./routes/register');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
dotenv.config();
const app = express();
app.use(cors("*"));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));
// intern registration
app.use('/api', registerRoutes);
// login
app.use('/api/auth', authRoutes);
// admin
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => {
  res.send('API is running...');
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));