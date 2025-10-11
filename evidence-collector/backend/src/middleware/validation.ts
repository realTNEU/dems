import { Request, Response, NextFunction } from 'express';

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

export interface BulkEvidenceRequest {
  events: EvidenceEvent[];
}

export const validateBulkEvidence = (req: Request, res: Response, next: NextFunction) => {
  const { events }: BulkEvidenceRequest = req.body;

  if (!events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'Events array is required' });
  }

  if (events.length === 0) {
    return res.status(400).json({ error: 'Events array cannot be empty' });
  }

  if (events.length > 1000) {
    return res.status(400).json({ error: 'Too many events in single request (max 1000)' });
  }

  // Validate each event
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const errors: string[] = [];

    if (!event.timestamp || typeof event.timestamp !== 'string') {
      errors.push('timestamp is required and must be a string');
    }

    if (!event.request_id || typeof event.request_id !== 'string') {
      errors.push('request_id is required and must be a string');
    }

    if (!event.method || typeof event.method !== 'string') {
      errors.push('method is required and must be a string');
    }

    if (!event.path || typeof event.path !== 'string') {
      errors.push('path is required and must be a string');
    }

    if (typeof event.status !== 'number' || event.status < 100 || event.status > 599) {
      errors.push('status is required and must be a valid HTTP status code');
    }

    if (typeof event.response_time_ms !== 'number' || event.response_time_ms < 0) {
      errors.push('response_time_ms is required and must be a non-negative number');
    }

    if (!event.source_ip || typeof event.source_ip !== 'string') {
      errors.push('source_ip is required and must be a string');
    }

    if (!event.server_name || typeof event.server_name !== 'string') {
      errors.push('server_name is required and must be a string');
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: `Validation failed for event ${i}`, 
        details: errors 
      });
    }
  }

  next();
};

