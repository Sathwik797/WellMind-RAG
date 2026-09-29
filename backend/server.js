require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io'); 

const Well = require('./models/Well');
const Event = require('./models/Event');
const authRoutes = require('./routes/authRoutes');
const wellRoutes = require('./routes/wellRoutes');
const riskRoutes = require('./routes/riskRoutes');
const earlyWarningRoutes = require('./routes/earlyWarningRoutes');
const decisionLogRoutes = require("./routes/decisionLogRoutes");
const accountRoutes = require('./routes/accountRoutes');

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://e-rtmac-nwis.vercel.app',
];

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for local dev
  },
  credentials: true,
}));
app.use(express.json());

// Health check endpoint for dev startup system
app.get('/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    mongodb: isConnected ? 'connected' : 'disconnected',
  });
});

app.use((req, res, next) => {
  console.log('Body received:', req.body);
  next();
});
app.use('/api/alerts', require('./routes/alertRoutes'));
app.use('/api/auth', authRoutes);
app.use('/api/wells', wellRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/early-warning', earlyWarningRoutes);
app.use("/api", decisionLogRoutes);
app.use('/api', accountRoutes);
app.use('/api/wellmind', require('./routes/wellmindRoutes'));

const { populateData } = require('./seed');

async function initMongoDB() {
  const mongoUri = process.env.MONGO_URI;

  // 1. Try remote MONGO_URI if configured
  if (mongoUri && !mongoUri.includes("localhost:27017") && !mongoUri.includes("127.0.0.1:27017")) {
    try {
      console.log(`Connecting to configured MongoDB URI...`);
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      console.log('MongoDB connected successfully');
      await Well.createIndexes();
      return;
    } catch (err) {
      console.warn('Configured MONGO_URI failed, checking local options...');
    }
  }

  // 2. Try local MongoDB on 27017
  try {
    const localUri = mongoUri || 'mongodb://127.0.0.1:27017/nwis';
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2000 });
    console.log('MongoDB connected to local instance on port 27017');
    await Well.createIndexes();
    return;
  } catch (localErr) {
    console.log('Local MongoDB port 27017 not detected.');
    console.log('Starting embedded MongoMemoryServer for self-contained local development...');
  }

  // 3. Fallback to embedded in-memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    console.log(`Embedded MongoDB running at ${memUri}`);
    await mongoose.connect(memUri);
    await Well.createIndexes();

    const count = await Well.countDocuments();
    if (count === 0) {
      console.log('Auto-populating database with wells, formations, events, and drilling data...');
      await populateData();
      console.log('Database ready with initial test data.');
    }
  } catch (memErr) {
    console.error('❌ Failed to initialize embedded MongoDB:', memErr.message);
  }
}

initMongoDB();

app.get('/wells', async (req, res) => {
  try {
    const wells = await Well.find();
    res.json(wells);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/wells/nearby', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng || !radius) {
      return res.status(400).json({ error: 'lat, lng, and radius are required' });
    }
    const wells = await Well.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    });
    res.json(wells);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/wells/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid well ID format' });
    }
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    res.json(well);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/events/:wellId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.wellId)) {
      return res.status(400).json({ error: 'Invalid wellId format' });
    }
    const events = await Event.find({ wellId: req.params.wellId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/ai/query', async (req, res) => {
  try {
    res.json({ answer: 'stub response — AI service not wired yet' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/predict-risk', async (req, res) => {
  try {
    res.json({ risk: 50, label: 'stub — ML service not wired yet' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attach Socket.io to server with cloud-permissive CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
});
io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id);

  socket.on('watch-well', (wellId) => {
    if (!wellId) return;
    socket.join(`well:${wellId}`);
    console.log(`Socket ${socket.id} watching well ${wellId}`);
  });

  socket.on('unwatch-well', (wellId) => {
    if (!wellId) return;
    socket.leave(`well:${wellId}`);
  });

  socket.on('disconnect', () => {
    console.log('Dashboard disconnected:', socket.id);
  });
});

app.set('io', io);

require('./jobs/liveDepthMonitor')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));