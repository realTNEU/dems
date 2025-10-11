import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { Evidence } from '../models/Evidence';
import evidenceRoutes from '../routes/evidence';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/evidence', evidenceRoutes);

describe('Integration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/evidence-collector-test';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    await Evidence.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('End-to-End Evidence Collection Flow', () => {
    it('should collect evidence from dummy server and display in frontend', async () => {
      // Step 1: Simulate evidence collection (collector -> backend)
      const evidenceEvents = [
        {
          timestamp: new Date().toISOString(),
          request_id: 'integration-test-1',
          method: 'GET',
          path: '/api/v1/resource/1',
          status: 200,
          response_time_ms: 45,
          source_ip: '203.0.113.45',
          source_port: 54321,
          headers: { 'user-agent': 'Mozilla/5.0 (Test Browser)' },
          body_hash: null,
          server_name: 'dummy-server-1',
          note: 'Integration test event'
        },
        {
          timestamp: new Date().toISOString(),
          request_id: 'integration-test-2',
          method: 'POST',
          path: '/api/v1/resource/2',
          status: 201,
          response_time_ms: 78,
          source_ip: '203.0.113.46',
          source_port: 54322,
          headers: { 'user-agent': 'Mozilla/5.0 (Test Browser)' },
          body_hash: 'sha256-hash-of-body',
          server_name: 'dummy-server-1',
          note: 'Integration test event'
        }
      ];

      // Send evidence to backend
      const collectResponse = await request(app)
        .post('/api/evidence/bulk')
        .set('x-api-key', 'default-collector-key')
        .set('x-signature', 'mock-signature')
        .set('x-timestamp', Date.now().toString())
        .send({ events: evidenceEvents });

      expect(collectResponse.status).toBe(200);
      expect(collectResponse.body.accepted).toBe(2);
      expect(collectResponse.body.rejected).toBe(0);

      // Step 2: Verify events are stored in database
      const storedEvents = await Evidence.find({});
      expect(storedEvents).toHaveLength(2);

      // Step 3: Test frontend API endpoints
      // Get events
      const eventsResponse = await request(app)
        .get('/api/evidence/events');

      expect(eventsResponse.status).toBe(200);
      expect(eventsResponse.body.events).toHaveLength(2);
      expect(eventsResponse.body.total).toBe(2);

      // Get metrics
      const metricsResponse = await request(app)
        .get('/api/evidence/metrics/summary');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.body.metrics).toBeDefined();
      expect(Array.isArray(metricsResponse.body.metrics)).toBe(true);

      // Get top IPs
      const topIPsResponse = await request(app)
        .get('/api/evidence/ips/top');

      expect(topIPsResponse.status).toBe(200);
      expect(topIPsResponse.body.topIPs).toBeDefined();
      expect(Array.isArray(topIPsResponse.body.topIPs)).toBe(true);
      expect(topIPsResponse.body.topIPs).toHaveLength(2);

      // Verify IP data
      const ipData = topIPsResponse.body.topIPs;
      expect(ipData[0].ip).toBe('203.0.113.45');
      expect(ipData[0].requestCount).toBe(1);
      expect(ipData[1].ip).toBe('203.0.113.46');
      expect(ipData[1].requestCount).toBe(1);
    });

    it('should handle high-volume evidence collection', async () => {
      // Generate 100 test events
      const events = Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
        request_id: `high-volume-test-${i}`,
        method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4],
        path: `/api/v1/resource/${i % 50}`,
        status: [200, 201, 400, 500][i % 4],
        response_time_ms: Math.floor(Math.random() * 500) + 10,
        source_ip: `192.168.1.${(i % 10) + 1}`,
        server_name: 'test-server',
        headers: { 'user-agent': 'Test Agent' }
      }));

      // Send in batches
      const batchSize = 25;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        const response = await request(app)
          .post('/api/evidence/bulk')
          .set('x-api-key', 'default-collector-key')
          .set('x-signature', 'mock-signature')
          .set('x-timestamp', Date.now().toString())
          .send({ events: batch });

        expect(response.status).toBe(200);
        expect(response.body.accepted).toBe(batch.length);
      }

      // Verify all events were stored
      const storedEvents = await Evidence.find({});
      expect(storedEvents).toHaveLength(100);

      // Test pagination
      const page1Response = await request(app)
        .get('/api/evidence/events?limit=50&offset=0');

      expect(page1Response.status).toBe(200);
      expect(page1Response.body.events).toHaveLength(50);
      expect(page1Response.body.total).toBe(100);

      const page2Response = await request(app)
        .get('/api/evidence/events?limit=50&offset=50');

      expect(page2Response.status).toBe(200);
      expect(page2Response.body.events).toHaveLength(50);
      expect(page2Response.body.total).toBe(100);

      // Test filtering
      const getEventsResponse = await request(app)
        .get('/api/evidence/events?method=GET');

      expect(getEventsResponse.status).toBe(200);
      expect(getEventsResponse.body.events.every(e => e.method === 'GET')).toBe(true);

      // Test metrics with high volume data
      const metricsResponse = await request(app)
        .get('/api/evidence/metrics/summary');

      expect(metricsResponse.status).toBe(200);
      expect(metricsResponse.body.metrics).toBeDefined();

      // Test top IPs
      const topIPsResponse = await request(app)
        .get('/api/evidence/ips/top');

      expect(topIPsResponse.status).toBe(200);
      expect(topIPsResponse.body.topIPs).toBeDefined();
      expect(topIPsResponse.body.topIPs.length).toBeGreaterThan(0);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test with invalid data
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

      // Test with empty events array
      const emptyResponse = await request(app)
        .post('/api/evidence/bulk')
        .set('x-api-key', 'default-collector-key')
        .set('x-signature', 'mock-signature')
        .set('x-timestamp', Date.now().toString())
        .send({ events: [] });

      expect(emptyResponse.status).toBe(400);

      // Test with too many events
      const tooManyEvents = Array.from({ length: 1001 }, (_, i) => ({
        timestamp: new Date().toISOString(),
        request_id: `too-many-${i}`,
        method: 'GET',
        path: '/api/test',
        status: 200,
        response_time_ms: 100,
        source_ip: '192.168.1.1',
        server_name: 'test-server'
      }));

      const tooManyResponse = await request(app)
        .post('/api/evidence/bulk')
        .set('x-api-key', 'default-collector-key')
        .set('x-signature', 'mock-signature')
        .set('x-timestamp', Date.now().toString())
        .send({ events: tooManyEvents });

      expect(tooManyResponse.status).toBe(400);
    });
  });
});

