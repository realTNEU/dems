import crypto from 'crypto';

export function generateRequestId(): string {
  return crypto.randomUUID();
}

export function hashBody(body: any): string | undefined {
  if (!body) return undefined;
  
  try {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    return crypto.createHash('sha256').update(bodyString).digest('hex');
  } catch (error) {
    console.error('Error hashing body:', error);
    return undefined;
  }
}

export function generateSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function redactHeaders(headers: Record<string, any>): Record<string, any> {
  const redacted = { ...headers };
  
  // Redact sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
    'x-refresh-token'
  ];
  
  sensitiveHeaders.forEach(header => {
    if (redacted[header]) {
      redacted[header] = '[REDACTED]';
    }
  });
  
  return redacted;
}
