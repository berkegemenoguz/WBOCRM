require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes/index');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/api', routes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
});

module.exports = app;
