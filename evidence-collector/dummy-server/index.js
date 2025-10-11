const express = require('express');
const morgan = require('morgan');
const { connectDB, LogEntry } = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(morgan('combined'));

// Don't trust proxy - handle X-Forwarded-For manually

// Connect to MongoDB (optional)
let mongoConnected = false;
connectDB().then(connected => {
  mongoConnected = connected;
});

// Custom logging middleware
const logToMongoDB = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Get IP from X-Forwarded-For header first, then fallback to connection remote address
    let sourceIP = req.connection.remoteAddress;
    if (req.headers['x-forwarded-for']) {
      sourceIP = req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      query: req.query,
      status: res.statusCode,
      responseTime: Date.now() - req.startTime,
      sourceIP: sourceIP,
      userAgent: req.get('User-Agent'),
      body: req.body || null
    };
    
    // Log to console (structured JSON)
    console.log(JSON.stringify(logEntry));
    
    // Save to MongoDB (only if connected)
    if (mongoConnected) {
      const logDocument = new LogEntry(logEntry);
      logDocument.save().catch(error => {
        console.error('Error saving log to MongoDB:', error);
      });
    }
    
    originalSend.call(this, data);
  };
  
  req.startTime = Date.now();
  next();
};

app.use(logToMongoDB);

// Helper function to create handlers with variation
function makeHandler(i) {
  return (req, res) => {
    const delay = Math.random() * 100; // Random delay 0-100ms
    
    setTimeout(() => {
      // Add some variation to responses
      const shouldError = i % 10 === 0;
      const shouldSlow = i % 7 === 0;
      
      if (shouldSlow) {
        // Simulate slow response
        setTimeout(() => {
          if (shouldError) {
            res.status(500).json({ 
              ok: false, 
              id: i, 
              error: 'Internal server error',
              route: req.path 
            });
          } else {
            res.json({ 
              ok: true, 
              id: i, 
              route: req.path,
              data: `Resource ${i} data`,
              timestamp: new Date().toISOString()
            });
          }
        }, 200);
      } else {
        if (shouldError) {
          res.status(500).json({ 
            ok: false, 
            id: i, 
            error: 'Internal server error',
            route: req.path 
          });
        } else {
          res.json({ 
            ok: true, 
            id: i, 
            route: req.path,
            data: `Resource ${i} data`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }, delay);
  };
}

// Create 50 endpoints with different HTTP methods
const endpoints = [];

for (let i = 1; i <= 50; i++) {
  const path = `/api/v1/resource/${i}`;
  let method = 'get';
  
  // Mix HTTP methods
  if (i % 4 === 0) method = 'post';
  else if (i % 4 === 1) method = 'get';
  else if (i % 4 === 2) method = 'put';
  else if (i % 4 === 3) method = 'delete';
  
  app[method](path, makeHandler(i));
  endpoints.push({ method: method.toUpperCase(), path });
}

// Additional endpoints for variety
app.get('/api/v1/users', makeHandler(51));
app.post('/api/v1/users', makeHandler(52));
app.get('/api/v1/products', makeHandler(53));
app.get('/api/v1/orders', makeHandler(54));
app.post('/api/v1/orders', makeHandler(55));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    endpoints: endpoints.length + 5,
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Dummy Server for Evidence Collection',
    endpoints: endpoints.length + 5,
    health: '/health',
    docs: 'This server generates random API traffic for testing evidence collection'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Dummy server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Total endpoints: ${endpoints.length + 5}`);
  console.log(`Logs saved to MongoDB`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
