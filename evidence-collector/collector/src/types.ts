export interface EvidenceEvent {
  timestamp: string;
  request_id: string;
  method: string;
  path: string;
  query?: string;
  status: number;
  response_time_ms: number;
  source_ip: string;
  source_port?: number;
  headers: Record<string, any>;
  body_hash?: string;
  server_name: string;
  note?: string;
}

export interface CollectorConfig {
  backendUrl: string;
  apiKey: string;
  batchSize: number;
  flushInterval: number;
  logFile?: string;
  serverName: string;
  mode: 'middleware' | 'log-tail';
}

export interface LogEntry {
  timestamp: string;
  method: string;
  path: string;
  query?: any;
  status: number;
  responseTime: number;
  sourceIP: string;
  userAgent?: string;
  body?: any;
}

