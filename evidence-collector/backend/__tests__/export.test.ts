import mongoose from 'mongoose';
// Use require for mongodb-memory-server to avoid TypeScript errors when deps aren't installed
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MongoMemoryServer } = require('mongodb-memory-server');
import request from 'supertest';

let mongo: any;
let app: any;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri;

  // Connect mongoose
  await mongoose.connect(uri);

  // Import models and the app after connecting
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  app = require('../src/index').app;
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('export CSV contains seeded rows', async () => {
  const { LogEntry } = require('../src/models/LogEntry');

  // Seed 3 documents
  const docs = [
    {
      timestamp: new Date().toISOString(),
      method: 'GET',
      path: '/api/v1/test/1',
      query: {},
      status: 200,
      responseTime: 10,
      sourceIP: '127.0.0.1',
      userAgent: 'jest-test',
      body: null
    },
    {
      timestamp: new Date().toISOString(),
      method: 'POST',
      path: '/api/v1/test/2',
      query: {},
      status: 201,
      responseTime: 20,
      sourceIP: '127.0.0.2',
      userAgent: 'jest-test',
      body: { a: 1 }
    },
    {
      timestamp: new Date().toISOString(),
      method: 'PUT',
      path: '/api/v1/test/3',
      query: {},
      status: 500,
      responseTime: 200,
      sourceIP: '127.0.0.3',
      userAgent: 'jest-test',
      body: { error: true }
    }
  ];

  await LogEntry.insertMany(docs);

  const res = await request(app)
    .get('/api/evidence/events/export?format=csv&limit=10')
    .expect(200)
    .expect('Content-Type', /text\/csv/);

  const text = res.text;
  // Expect header + 3 rows
  const lines = text.trim().split('\n');
  expect(lines.length).toBeGreaterThanOrEqual(4);
  // header should include timestamp and request_id
  expect(lines[0]).toContain('timestamp');
  expect(lines[0]).toContain('request_id');
});
