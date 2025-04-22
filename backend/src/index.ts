import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

// Import routes
import synthesisRoutes from './routes/synthesisRoutes';
import storageRoutes from './routes/storageRoutes';
import executionRoutes from './routes/executionRoutes';
import promptTestingRoutes from './routes/promptTestingRoutes';

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const port = process.env.PORT || 3001;
const availablePorts = [3001, 3005, 3006, 3007, 3008];

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004'
  ]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.redirect('/api/health');
});

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Agent Orchestration API is running' });
});

// Use routes
app.use('/api/synthesis', synthesisRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/prompt-testing', promptTestingRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'An unknown error occurred'
  });
});

// Try to start server on different ports if one is already in use
const startServer = (portIndex = 0) => {
  if (portIndex >= availablePorts.length) {
    console.error('No available ports found');
    process.exit(1);
    return;
  }
  
  const currentPort = availablePorts[portIndex];
  const server = http.createServer(app);
  
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${currentPort} is already in use, trying next port...`);
      startServer(portIndex + 1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
  
  server.listen(currentPort, () => {
    console.log(`Server running on port ${currentPort}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
};

// Start the server
startServer();

export default app; 