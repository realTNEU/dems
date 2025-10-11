import axios, { AxiosResponse } from 'axios';
import { EvidenceEvent, CollectorConfig, LogEntry } from './types';
import { generateRequestId, hashBody, generateSignature, redactHeaders } from './utils/crypto';
import { Logger } from './utils/logger';

export class EvidenceCollector {
  private config: CollectorConfig;
  private buffer: EvidenceEvent[] = [];
  private logger: Logger;
  private flushTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(config: CollectorConfig) {
    this.config = config;
    this.logger = new Logger(config.logFile);
    this.startFlushTimer();
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  // Convert log entry to evidence event
  private logEntryToEvidence(logEntry: LogEntry): EvidenceEvent {
    return {
      timestamp: logEntry.timestamp,
      request_id: generateRequestId(),
      method: logEntry.method,
      path: logEntry.path,
      query: logEntry.query ? JSON.stringify(logEntry.query) : '{}',
      status: logEntry.status,
      response_time_ms: logEntry.responseTime,
      source_ip: logEntry.sourceIP,
      headers: redactHeaders({
        'user-agent': logEntry.userAgent
      }),
      body_hash: logEntry.body ? hashBody(logEntry.body) : undefined,
      server_name: this.config.serverName,
      note: 'Collected from log file'
    };
  }

  // Add evidence event from middleware
  addEvidenceFromMiddleware(req: any, res: any, startTime: number) {
    if (this.isShuttingDown) return;

    const event: EvidenceEvent = {
      timestamp: new Date().toISOString(),
      request_id: generateRequestId(),
      method: req.method,
      path: req.originalUrl || req.url,
      query: req.query ? JSON.stringify(req.query) : undefined,
      status: res.statusCode,
      response_time_ms: Date.now() - startTime,
      source_ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown',
      headers: redactHeaders(req.headers),
      body_hash: req.body ? hashBody(req.body) : undefined,
      server_name: this.config.serverName,
      note: 'Collected from middleware'
    };

    this.addEvidence(event);
  }

  // Add evidence event from log entry
  addEvidenceFromLog(logEntry: LogEntry) {
    if (this.isShuttingDown) return;

    const event = this.logEntryToEvidence(logEntry);
    this.addEvidence(event);
  }

  // Add evidence event to buffer
  private addEvidence(event: EvidenceEvent) {
    this.buffer.push(event);
    
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Send evidence to backend
  private async sendToBackend(events: EvidenceEvent[]): Promise<boolean> {
    try {
      const timestamp = Date.now().toString();
      const requestBody = { events };
      const signature = generateSignature(timestamp + JSON.stringify(requestBody), this.config.apiKey);

      const response: AxiosResponse = await axios.post(
        `${this.config.backendUrl}/api/evidence/bulk`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'x-signature': signature,
            'x-timestamp': timestamp
          },
          timeout: 10000
        }
      );

      if (response.status === 200) {
        this.logger.info(`Successfully sent ${events.length} events to backend`, {
          accepted: response.data.accepted,
          rejected: response.data.rejected
        });
        return true;
      } else {
        this.logger.error(`Backend returned status ${response.status}`);
        return false;
      }
    } catch (error: any) {
      this.logger.error('Failed to send evidence to backend', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });
      return false;
    }
  }

  // Flush buffer to backend
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const eventsToSend = [...this.buffer];
    this.buffer = [];

    const success = await this.sendToBackend(eventsToSend);
    
    if (!success) {
      // Re-add events to buffer for retry (with limit to prevent memory issues)
      this.buffer.unshift(...eventsToSend.slice(0, 1000));
      this.logger.warn(`Re-added ${Math.min(eventsToSend.length, 1000)} events to buffer for retry`);
    }
  }

  // Get current buffer size
  getBufferSize(): number {
    return this.buffer.length;
  }

  // Get health status
  getHealthStatus() {
    return {
      status: 'ok',
      bufferSize: this.buffer.length,
      config: {
        backendUrl: this.config.backendUrl,
        serverName: this.config.serverName,
        mode: this.config.mode,
        batchSize: this.config.batchSize,
        flushInterval: this.config.flushInterval
      },
      uptime: process.uptime()
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down evidence collector...');
    this.isShuttingDown = true;
    
    this.stopFlushTimer();
    await this.flush();
    
    this.logger.info('Evidence collector shutdown complete');
  }
}
