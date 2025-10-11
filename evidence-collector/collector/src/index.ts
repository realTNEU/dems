import { Command } from 'commander';
import { EvidenceCollector } from './collector';
import { LogTailer } from './logTailer';
import { createEvidenceMiddleware } from './middleware';
import { CollectorConfig } from './types';
import { Logger } from './utils/logger';

const program = new Command();
const logger = new Logger();

program
  .name('evidence-collector')
  .description('Evidence collection tool for digital forensics')
  .version('1.0.0');

program
  .option('-b, --backend-url <url>', 'Backend URL', 'http://localhost:3000')
  .option('-k, --api-key <key>', 'API key for authentication', 'default-collector-key')
  .option('-s, --batch-size <size>', 'Batch size for sending events', '50')
  .option('-i, --flush-interval <ms>', 'Flush interval in milliseconds', '5000')
  .option('-l, --log-file <file>', 'Log file to tail (for log-tail mode)')
  .option('-n, --server-name <name>', 'Server name identifier', 'unknown-server')
  .option('-m, --mode <mode>', 'Collection mode: middleware or log-tail', 'log-tail')
  .option('-p, --port <port>', 'Port for health endpoint (middleware mode)', '8080');

program.parse();

const options = program.opts();

const config: CollectorConfig = {
  backendUrl: options.backendUrl,
  apiKey: options.apiKey,
  batchSize: parseInt(options.batchSize),
  flushInterval: parseInt(options.flushInterval),
  logFile: options.logFile,
  serverName: options.serverName,
  mode: options.mode as 'middleware' | 'log-tail'
};

async function startCollector() {
  logger.info('Starting evidence collector', config);

  const collector = new EvidenceCollector(config);

  if (config.mode === 'log-tail') {
    if (!config.logFile) {
      logger.error('Log file is required for log-tail mode');
      process.exit(1);
    }

    const logTailer = new LogTailer(collector, config.logFile);
    await logTailer.start();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      logTailer.stop();
      await collector.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      logTailer.stop();
      await collector.shutdown();
      process.exit(0);
    });

  } else if (config.mode === 'middleware') {
    // For middleware mode, we'll create a simple Express server
    const express = require('express');
    const app = express();

    app.use(express.json());
    app.use(createEvidenceMiddleware(collector));

    // Health endpoint
    app.get('/health', (req: any, res: any) => {
      res.json(collector.getHealthStatus());
    });

    // Example endpoints
    app.get('/api/test', (req: any, res: any) => {
      res.json({ message: 'Test endpoint', timestamp: new Date().toISOString() });
    });

    app.post('/api/test', (req: any, res: any) => {
      res.json({ message: 'Test POST endpoint', data: req.body });
    });

    const port = parseInt(options.port);
    app.listen(port, () => {
      logger.info(`Middleware server running on port ${port}`);
      logger.info(`Health endpoint: http://localhost:${port}/health`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      await collector.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      await collector.shutdown();
      process.exit(0);
    });
  } else {
    logger.error(`Invalid mode: ${config.mode}. Must be 'middleware' or 'log-tail'`);
    process.exit(1);
  }
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { promise, reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

startCollector().catch(error => {
  logger.error('Failed to start collector:', error);
  process.exit(1);
});
