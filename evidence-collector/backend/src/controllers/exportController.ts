import { Request, Response } from 'express';
import { LogEntry } from '../models/LogEntry';
import crypto from 'crypto';

// Streaming export controller for demo/dev use. Streams CSV or JSON array.
export const exportEvents = async (req: Request, res: Response) => {
  try {
    const { path, ip, method, from, to, format = 'csv', limit = '' } = req.query as any;

    const query: any = {};
    if (path) query.path = { $regex: path as string, $options: 'i' };
    if (ip) query.sourceIP = ip as string;
    if (method) query.method = method as string;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }

    const MAX_EXPORT_ROWS = parseInt(process.env.EXPORT_MAX_ROWS || '10000', 10);
    const requestedLimit = parseInt(limit, 10) || 1000;
    const finalLimit = Math.min(requestedLimit, MAX_EXPORT_ROWS);

    const queryBuilder = LogEntry.find(query).sort({ createdAt: -1 }).limit(finalLimit);
    const cursor = queryBuilder.cursor();

    // Define columns for CSV
    const columns = [
      'timestamp',
      'request_id',
      'method',
      'path',
      'query',
      'status',
      'response_time_ms',
      'source_ip',
      'body_hash',
      'server_name',
      'note'
    ];

    const escapeCsv = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };

    if (format === 'json') {
      // Stream JSON array
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="events.json"`);
      res.write('[');
      let first = true;
      for await (const log of cursor) {
        const ev = {
          _id: log._id,
          timestamp: log.timestamp,
          request_id: log._id?.toString() || '',
          method: log.method,
          path: log.path,
          query: typeof log.query === 'object' ? JSON.stringify(log.query) : log.query,
          status: log.status,
          response_time_ms: log.responseTime,
          source_ip: log.sourceIP,
          body_hash: log.body ? crypto.createHash('sha256').update(JSON.stringify(log.body)).digest('hex') : undefined,
          server_name: 'dummy-server',
          note: 'Exported from MongoDB logs',
          created_at: log.createdAt
        };

        if (!first) res.write(',');
        res.write(JSON.stringify(ev));
        first = false;
      }
      res.write(']');
      return res.end();
    }

    // CSV streaming
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="events.csv"`);

    // Write header
    res.write(columns.join(',') + '\n');

    for await (const log of cursor) {
      const ev: any = {
        timestamp: log.timestamp,
        request_id: log._id?.toString() || '',
        method: log.method,
        path: log.path,
        query: typeof log.query === 'object' ? JSON.stringify(log.query) : log.query,
        status: log.status,
        response_time_ms: log.responseTime,
        source_ip: log.sourceIP,
        body_hash: log.body ? crypto.createHash('sha256').update(JSON.stringify(log.body)).digest('hex') : undefined,
        server_name: 'dummy-server',
        note: 'Exported from MongoDB logs'
      };

      const row = columns.map(col => escapeCsv(ev[col])).join(',') + '\n';
      if (!res.write(row)) {
        // backpressure handling: wait for drain
        await new Promise<void>(resolve => res.once('drain', () => resolve()));
      }
    }

    return res.end();
  } catch (error) {
    console.error('Error exporting events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default exportEvents;
