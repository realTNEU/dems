const axios = require('axios');

// Configuration
const config = {
  serverUrl: process.env.SERVER_URL || 'http://localhost:4000',
  rps: parseInt(process.env.RPS) || 10, // Requests per second
  concurrency: parseInt(process.env.CONCURRENCY) || 5,
  duration: parseInt(process.env.DURATION) || 10, // Duration in seconds (5 minutes default)
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59'
  ],
  endpoints: [
    // Resource endpoints
    ...Array.from({ length: 50 }, (_, i) => `/api/v1/resource/${i + 1}`),
    // Additional endpoints
    '/api/v1/users',
    '/api/v1/products',
    '/api/v1/orders',
    '/health',
    '/'
  ]
};

// Statistics tracking
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  startTime: null,
  endTime: null
};

// Random IP generator (for simulating different source IPs)
function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Random delay generator
function randomDelay(min = 0, max = 100) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Make a single request
async function makeRequest() {
  const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
  const method = Math.random() < 0.7 ? 'GET' : Math.random() < 0.9 ? 'POST' : Math.random() < 0.95 ? 'PUT' : 'DELETE';
  
  const requestConfig = {
    method: method.toLowerCase(),
    url: `${config.serverUrl}${endpoint}`,
    headers: {
      'User-Agent': config.userAgents[Math.floor(Math.random() * config.userAgents.length)],
      'X-Forwarded-For': generateRandomIP(),
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    timeout: 5000
  };

  // Add body for POST/PUT requests
  if (method === 'POST' || method === 'PUT') {
    requestConfig.data = {
      id: Math.floor(Math.random() * 1000),
      data: `Random data ${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }

  try {
    const response = await axios(requestConfig);
    stats.successfulRequests++;
    return { success: true, status: response.status, endpoint, method };
  } catch (error) {
    stats.failedRequests++;
    return { 
      success: false, 
      status: error.response?.status || 0, 
      endpoint, 
      method, 
      error: error.message 
    };
  } finally {
    stats.totalRequests++;
  }
}

// Worker function for concurrent requests
async function worker(workerId) {
  console.log(`Worker ${workerId} started`);
  
  while (stats.startTime && Date.now() - stats.startTime < config.duration * 1000) {
    await makeRequest();
    
    // Add random delay to vary request timing
    await new Promise(resolve => setTimeout(resolve, randomDelay(50, 200)));
  }
  
  console.log(`Worker ${workerId} finished`);
}

// Print statistics
function printStats() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const rps = stats.totalRequests / elapsed;
  
  console.log('\n=== Traffic Generator Statistics ===');
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful: ${stats.successfulRequests}`);
  console.log(`Failed: ${stats.failedRequests}`);
  console.log(`Success Rate: ${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(2)}%`);
  console.log(`Elapsed Time: ${elapsed.toFixed(2)}s`);
  console.log(`Actual RPS: ${rps.toFixed(2)}`);
  console.log(`Target RPS: ${config.rps}`);
  console.log('=====================================\n');
}

// Main function
async function startTrafficGenerator() {
  console.log('Starting Traffic Generator...');
  console.log(`Server URL: ${config.serverUrl}`);
  console.log(`Target RPS: ${config.rps}`);
  console.log(`Concurrency: ${config.concurrency}`);
  console.log(`Duration: ${config.duration}s`);
  console.log(`Endpoints: ${config.endpoints.length}`);
  console.log('=====================================\n');

  stats.startTime = Date.now();

  // Start workers
  const workers = [];
  for (let i = 0; i < config.concurrency; i++) {
    workers.push(worker(i + 1));
  }

  // Wait for all workers to complete
  await Promise.all(workers);

  stats.endTime = Date.now();
  printStats();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  stats.endTime = Date.now();
  printStats();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  stats.endTime = Date.now();
  printStats();
  process.exit(0);
});

// Start the traffic generator
if (require.main === module) {
  startTrafficGenerator().catch(error => {
    console.error('Error starting traffic generator:', error);
    process.exit(1);
  });
}

module.exports = { startTrafficGenerator, config };
