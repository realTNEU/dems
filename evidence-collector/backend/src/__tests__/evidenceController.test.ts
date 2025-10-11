import request from 'supertest';
import express from 'express';
import { Evidence } from '../models/Evidence';
import evidenceRoutes from '../routes/evidence';
import { authenticateCollector } from '../middleware/auth';
import { validateBulkEvidence } from '../middleware/validation';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/evidence', evidenceRoutes);

describe('Evidence Controller', () => {
  beforeEach(async () => {
    // Clear database before each test
    await Evidence.deleteMany({});
  });

  describe('POST /api/evidence/bulk', () => {
    it('should create evidence events successfully', async () => {
      const mockEvents = [
        {
          timestamp: new Date().toISOString(),
          request_id: 'test-request-1',
          method: 'GET',
          path: '/api/test',
          status: 200,
          response_time_ms: 100,
          source_ip: '192.168.1.1',
          server_name: 'test-server',
          headers: { 'user-agent': 'test-agent' }
        },
        {
          timestamp: new Date().toISOString(),
          request_id: 'test-request-2',
          method: 'POST',
          path: '/api/test',
          status: 201,
          response_time_ms: 150,
          source_ip: '192.168.1.2',
          server_name: 'test-server',
          headers: { 'user-agent': 'test-agent' }
        }
      ];

      const response = await request(app)
        .post('/api/evidence/bulk')
        .set('x-api-key', 'default-collector-key')
        .set('x-signature', 'mock-signature')
        .set('x-timestamp', Date.now().toString())
        .send({ events: mockEvents });

      expect(response.status).toBe(200);
      expect(response.body.accepted).toBe(2);
      expect(response.body.rejected).toBe(0);

      // Verify events were saved to database
      const savedEvents = await Evidence.find({});
      expect(savedEvents).toHaveLength(2);
    });

    it('should reject invalid events', async () => {
      const invalidEvents = [
        {
          // Missing required fields
          method: 'GET',
          path: '/api/test'
        }
      ];

      const response = await request(app)
        .post('/api/evidence/bulk')
        .set('x-api-key', 'default-collector-key')
        .set('x-signature', 'mock-signature')
        .set('x-timestamp', Date.now().toString())
        .send({ events: invalidEvents });

      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const mockEvents = [
        {
          timestamp: new Date().toISOString(),
          request_id: 'test-request-1',
          method: 'GET',
          path: '/api/test',
          status: 200,
          response_time_ms: 100,
          source_ip: '192.168.1.1',
          server_name: 'test-server'
        }
      ];

      const response = await request(app)
        .post('/api/evidence/bulk')
        .send({ events: mockEvents });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/evidence/events', () => {
    beforeEach(async () => {
      // Create test events
      await Evidence.create([
        {
          timestamp: new Date('2023-01-01T10:00:00Z'),
          request_id: 'test-1',
          method: 'GET',
          path: '/api/users',
          status: 200,
          response_time_ms: 100,
          source_ip: '192.168.1.1',
          server_name: 'test-server'
        },
        {
          timestamp: new Date('2023-01-01T11:00:00Z'),
          request_id: 'test-2',
          method: 'POST',
          path: '/api/users',
          status: 201,
          response_time_ms: 150,
          source_ip: '192.168.1.2',
          server_name: 'test-server'
        }
      ]);
    });

    it('should return events with default pagination', async () => {
      const response = await request(app)
        .get('/api/evidence/events');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.limit).toBe(100);
      expect(response.body.offset).toBe(0);
    });

    it('should filter events by method', async () => {
      const response = await request(app)
        .get('/api/evidence/events?method=GET');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].method).toBe('GET');
    });

    it('should filter events by IP', async () => {
      const response = await request(app)
        .get('/api/evidence/events?ip=192.168.1.1');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].source_ip).toBe('192.168.1.1');
    });

    it('should filter events by path', async () => {
      const response = await request(app)
        .get('/api/evidence/events?path=users');

      expect(response.status).toBe(200);
      expect(response.body.events).toHaveLength(2);
      expect(response.body.events.every(e => e.path.includes('users'))).toBe(true);
    });
  });

  describe('GET /api/evidence/metrics/summary', () => {
    beforeEach(async () => {
      // Create test events for metrics
      await Evidence.create([
        {
          timestamp: new Date('2023-01-01T10:00:00Z'),
          request_id: 'test-1',
          method: 'GET',
          path: '/api/users',
          status: 200,
          response_time_ms: 100,
          source_ip: '192.168.1.1',
          server_name: 'test-server'
        },
        {
          timestamp: new Date('2023-01-01T10:30:00Z'),
          request_id: 'test-2',
          method: 'POST',
          path: '/api/users',
          status: 201,
          response_time_ms: 150,
          source_ip: '192.168.1.2',
          server_name: 'test-server'
        }
      ]);
    });

    it('should return metrics summary', async () => {
      const response = await request(app)
        .get('/api/evidence/metrics/summary');

      expect(response.status).toBe(200);
      expect(response.body.metrics).toBeDefined();
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });
  });

  describe('GET /api/evidence/ips/top', () => {
    beforeEach(async () => {
      // Create test events for IP analysis
      await Evidence.create([
        {
          timestamp: new Date('2023-01-01T10:00:00Z'),
          request_id: 'test-1',
          method: 'GET',
          path: '/api/users',
          status: 200,
          response_time_ms: 100,
          source_ip: '192.168.1.1',
          server_name: 'test-server'
        },
        {
          timestamp: new Date('2023-01-01T11:00:00Z'),
          request_id: 'test-2',
          method: 'GET',
          path: '/api/users',
          status: 200,
          response_time_ms: 120,
          source_ip: '192.168.1.1',
          server_name: 'test-server'
        },
        {
          timestamp: new Date('2023-01-01T12:00:00Z'),
          request_id: 'test-3',
          method: 'POST',
          path: '/api/users',
          status: 201,
          response_time_ms: 150,
          source_ip: '192.168.1.2',
          server_name: 'test-server'
        }
      ]);
    });

    it('should return top IPs', async () => {
      const response = await request(app)
        .get('/api/evidence/ips/top');

      expect(response.status).toBe(200);
      expect(response.body.topIPs).toBeDefined();
      expect(Array.isArray(response.body.topIPs)).toBe(true);
      expect(response.body.topIPs.length).toBeGreaterThan(0);
      
      // First IP should have more requests
      expect(response.body.topIPs[0].ip).toBe('192.168.1.1');
      expect(response.body.topIPs[0].requestCount).toBe(2);
    });
  });
});

