require('dotenv').config();
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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
app.listen(PORT, () => console.log(`LittleLearners API running on port ${PORT}`));
