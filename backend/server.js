const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Workflow API is running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/documents', require('./routes/documents'));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📱 API URL: http://localhost:${PORT}`);
});