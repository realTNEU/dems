import fs from 'fs-extra';
import { EvidenceCollector } from './collector';
import { LogEntry } from './types';
import { Logger } from './utils/logger';

export class LogTailer {
  private collector: EvidenceCollector;
  private logFile: string;
  private logger: Logger;
  private isRunning = false;
  private watchInterval?: NodeJS.Timeout;
  private lastPosition = 0;

  constructor(collector: EvidenceCollector, logFile: string) {
    this.collector = collector;
    this.logFile = logFile;
    this.logger = new Logger();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Log tailer is already running');
      return;
    }

    this.logger.info(`Starting log tailer for file: ${this.logFile}`);
    
    // Check if log file exists
    if (!await fs.pathExists(this.logFile)) {
      this.logger.error(`Log file does not exist: ${this.logFile}`);
      throw new Error(`Log file does not exist: ${this.logFile}`);
    }

    // Get initial file size
    const stats = await fs.stat(this.logFile);
    this.lastPosition = stats.size;

    this.isRunning = true;
    this.startWatching();
  }

  private startWatching(): void {
    this.watchInterval = setInterval(async () => {
      try {
        await this.processNewLines();
      } catch (error) {
        this.logger.error('Error processing log file', error);
      }
    }, 1000); // Check every second
  }

  private async processNewLines(): Promise<void> {
    try {
      const stats = await fs.stat(this.logFile);
      
      if (stats.size > this.lastPosition) {
        // Read new content
        const fd = await fs.open(this.logFile, 'r');
        const buffer = Buffer.alloc(stats.size - this.lastPosition);
        await fs.read(fd, buffer, 0, buffer.length, this.lastPosition);
        await fs.close(fd);

        const newContent = buffer.toString('utf8');
        const lines = newContent.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const logEntry = JSON.parse(line);
            this.collector.addEvidenceFromLog(logEntry);
          } catch (error) {
            this.logger.warn('Failed to parse log line', { line });
          }
        }

        this.lastPosition = stats.size;
      }
    } catch (error) {
      this.logger.error('Error reading log file', error);
    }
  }

  stop(): void {
    if (!this.isRunning) {
      this.logger.warn('Log tailer is not running');
      return;
    }

    this.logger.info('Stopping log tailer');
    this.isRunning = false;

    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = undefined;
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
