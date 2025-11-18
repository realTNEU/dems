const axios = require('axios');

// Configuration
const config = {
  serverUrl: process.env.SERVER_URL || 'https://dummy-server-lix5.onrender.com',
  rps: parseInt(process.env.RPS) || 100, // Requests per second
  concurrency: parseInt(process.env.CONCURRENCY) || 10,
  duration: parseInt(process.env.DURATION) || 20, // Duration in seconds (5 minutes default)
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.5790.98 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.127 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.7; rv:116.0) Gecko/20100101 Firefox/116.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:115.0) Gecko/20100101 Firefox/115.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.7 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.198 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.92 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/115.0.1901.188',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
    'Opera/9.80 (Windows NT 6.1; WOW64) Presto/2.12.388 Version/12.18',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.121 Safari/537.36 OPR/99.0.4844.51',
    'Mozilla/5.0 (Windows NT 6.3; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Android 12; Mobile; rv:109.0) Gecko/109.0 Firefox/109.0',
    'Mozilla/5.0 (Linux; U; Android 11; en-US; SM-A536U Build/RP1A.200720.012) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/108.0.5359.128 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:78.0) Gecko/20100101 Firefox/78.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/95.0.4638.50 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; SM-N975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.97 Mobile Safari/537.36 EdgA/104.0.1293.47',
    'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.177 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.5993.89 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.5249.119 Safari/537.36',
    'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 9; Redmi Note 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/601.7.7 (KHTML, like Gecko) Version/9.1.2 Safari/601.7.7',
    'Mozilla/5.0 (Linux; Android 8.1.0; Nexus 5X Build/OPM7.181205.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Mobile Safari/537.36'
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

