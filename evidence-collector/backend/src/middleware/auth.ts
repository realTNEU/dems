import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  collectorId?: string;
}

export const authenticateCollector = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const signature = req.headers['x-signature'] as string;
  const timestamp = req.headers['x-timestamp'] as string;

  if (!apiKey || !signature || !timestamp) {
    return res.status(401).json({ error: 'Missing authentication headers' });
  }

  // In production, validate API key against database
  // For now, use a simple hardcoded key
  const validApiKey = process.env.COLLECTOR_API_KEY || 'default-collector-key';
  
  if (apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', validApiKey)
    .update(timestamp + JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Check timestamp (prevent replay attacks)
  const requestTime = parseInt(timestamp);
  const currentTime = Date.now();
  const timeDiff = Math.abs(currentTime - requestTime);

  if (timeDiff > 300000) { // 5 minutes
    return res.status(401).json({ error: 'Request timestamp too old' });
  }

  req.collectorId = apiKey;
  next();
};

