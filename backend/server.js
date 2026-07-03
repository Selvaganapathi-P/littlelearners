require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

connectDB();

app.use(helmet());
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP',
});
app.use('/api', limiter);

// Serve locally rendered videos and thumbnails (fallback when Cloudinary not configured)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/grades', require('./src/routes/grades'));
app.use('/api/subjects', require('./src/routes/subjects'));
app.use('/api/lessons', require('./src/routes/lessons'));
app.use('/api/compilations', require('./src/routes/compilations'));
app.use('/api/calendar', require('./src/routes/calendar'));
app.use('/api/children', require('./src/routes/children'));
app.use('/api/schools', require('./src/routes/schools'));
app.use('/api/video', require('./src/routes/videoGeneration'));

app.get('/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`LittleLearners API running on port ${PORT}`);
  // Pre-warm Remotion bundle + browser so first render isn't slow
  const { warmUp } = require('./src/services/videoRenderer');
  warmUp();
});
