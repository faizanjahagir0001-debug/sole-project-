import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'net';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import cartRoutes from './routes/cart.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import contactRoutes from './routes/contactRoutes.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('netlify.app') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Windsurf Gear API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Function to find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });
    server.listen(startPort, () => {
      server.close();
      resolve(true);
    });
  });
};

// Start server with available port
const startServer = async () => {
  let portToUse = PORT;
  const isPortAvailable = await findAvailablePort(PORT);
  
  if (!isPortAvailable) {
    console.log(`⚠️  Port ${PORT} is already in use. Trying next available port...`);
    // Try ports 5001-5010
    for (let i = 5001; i <= 5010; i++) {
      const available = await findAvailablePort(i);
      if (available) {
        portToUse = i;
        console.log(`✅ Port ${i} is available!`);
        break;
      }
    }
  }
  
  app.listen(portToUse, () => {
    console.log(`✅ Server running on port ${portToUse}`);
    console.log(`🌐 API URL: http://localhost:${portToUse}`);
  });
};

startServer();
