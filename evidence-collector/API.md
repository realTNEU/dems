# Evidence Collector API Documentation

## Overview

The Evidence Collector API provides endpoints for collecting, storing, and retrieving server evidence data for digital forensics analysis.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

Evidence collection endpoints require authentication using API keys and HMAC signatures.

### Headers Required

```
x-api-key: your-api-key
x-signature: hmac-sha256-signature
x-timestamp: unix-timestamp
```

### Signature Generation

```javascript
const crypto = require('crypto');
const timestamp = Date.now().toString();
const signature = crypto
  .createHmac('sha256', apiKey)
  .update(timestamp + JSON.stringify(requestBody))
  .digest('hex');
```

## Endpoints

### 1. Evidence Collection

#### POST /api/evidence/bulk

Submit evidence events in bulk to the system.

**Headers:**
```
Content-Type: application/json
x-api-key: string (required)
x-signature: string (required)
x-timestamp: string (required)
```

**Request Body:**
```json
{
  "events": [
    {
      "timestamp": "2025-01-11T10:00:00.000Z",
      "request_id": "uuid-v4",
      "method": "GET",
      "path": "/api/v1/users",
      "query": "?page=2",
      "status": 200,
      "response_time_ms": 42,
      "source_ip": "203.0.113.45",
      "source_port": 54321,
      "headers": {
        "user-agent": "Mozilla/5.0...",
        "x-forwarded-for": "..."
      },
      "body_hash": "sha256-of-body-or-null",
      "server_name": "dummy-server-1",
      "note": "optional"
    }
  ]
}
```

**Response:**
```json
{
  "accepted": 1,
  "rejected": 0
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (validation failed)
- `401` - Unauthorized (invalid API key or signature)
- `500` - Internal Server Error

### 2. Data Retrieval

#### GET /api/evidence/events

Retrieve evidence events with filtering and pagination.

**Query Parameters:**
- `from` (string) - Start timestamp (ISO 8601)
- `to` (string) - End timestamp (ISO 8601)
- `path` (string) - Filter by path (supports regex)
- `method` (string) - HTTP method (GET, POST, etc.)
- `ip` (string) - Source IP address
- `status` (number) - HTTP status code
- `limit` (number) - Number of results per page (default: 100)
- `offset` (number) - Number of results to skip (default: 0)

**Example:**
```
GET /api/evidence/events?method=GET&status=200&limit=50&offset=0
```

**Response:**
```json
{
  "events": [
    {
      "_id": "object-id",
      "timestamp": "2025-01-11T10:00:00.000Z",
      "request_id": "uuid-v4",
      "method": "GET",
      "path": "/api/v1/users",
      "query": "?page=2",
      "status": 200,
      "response_time_ms": 42,
      "source_ip": "203.0.113.45",
      "source_port": 54321,
      "headers": {
        "user-agent": "Mozilla/5.0..."
      },
      "body_hash": "sha256-hash",
      "server_name": "dummy-server-1",
      "note": "optional",
      "created_at": "2025-01-11T10:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### GET /api/evidence/metrics/summary

Get aggregated metrics and statistics.

**Query Parameters:**
- `from` (string) - Start timestamp (ISO 8601)
- `to` (string) - End timestamp (ISO 8601)
- `groupBy` (string) - Grouping interval (hour, day)

**Example:**
```
GET /api/evidence/metrics/summary?from=2025-01-11T00:00:00Z&to=2025-01-11T23:59:59Z&groupBy=hour
```

**Response:**
```json
{
  "metrics": [
    {
      "_id": "2025-01-11 10:00:00",
      "totalRequests": 150,
      "avgResponseTime": 45.5,
      "uniqueIPCount": 25,
      "statusCodeDistribution": {
        "200": 120,
        "201": 20,
        "400": 5,
        "500": 5
      }
    }
  ]
}
```

#### GET /api/evidence/ips/top

Get top source IPs by request count.

**Query Parameters:**
- `from` (string) - Start timestamp (ISO 8601)
- `to` (string) - End timestamp (ISO 8601)
- `limit` (number) - Number of results (default: 50)

**Example:**
```
GET /api/evidence/ips/top?limit=20
```

**Response:**
```json
{
  "topIPs": [
    {
      "ip": "203.0.113.45",
      "requestCount": 150,
      "avgResponseTime": 42.5,
      "lastSeen": "2025-01-11T10:00:00.000Z",
      "errorRate": 5.2
    }
  ]
}
```

### 3. Health Checks

#### GET /health

Check the health status of the API.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-11T10:00:00.000Z"
}
```

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```

### Common Error Codes

- `400` - Bad Request
  - Invalid request body
  - Missing required fields
  - Validation errors

- `401` - Unauthorized
  - Invalid API key
  - Invalid signature
  - Expired timestamp

- `404` - Not Found
  - Endpoint not found
  - Resource not found

- `500` - Internal Server Error
  - Database connection issues
  - Unexpected server errors

## Rate Limiting

- Evidence collection: 1000 requests per minute
- Data retrieval: 100 requests per minute
- Health checks: 1000 requests per minute

## Data Validation

### Evidence Event Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | string | Yes | ISO 8601 timestamp |
| request_id | string | Yes | Unique request identifier |
| method | string | Yes | HTTP method |
| path | string | Yes | Request path |
| query | string | No | Query string |
| status | number | Yes | HTTP status code (100-599) |
| response_time_ms | number | Yes | Response time in milliseconds |
| source_ip | string | Yes | Source IP address |
| source_port | number | No | Source port |
| headers | object | Yes | Request headers (redacted) |
| body_hash | string | No | SHA256 hash of request body |
| server_name | string | Yes | Server identifier |
| note | string | No | Optional note |

### Validation Rules

- `timestamp`: Must be valid ISO 8601 format
- `request_id`: Must be unique across all events
- `method`: Must be valid HTTP method
- `status`: Must be between 100 and 599
- `response_time_ms`: Must be non-negative
- `source_ip`: Must be valid IP address format
- `server_name`: Must be non-empty string

## Examples

### cURL Examples

#### Submit Evidence
```bash
curl -X POST http://localhost:3000/api/evidence/bulk \
  -H "Content-Type: application/json" \
  -H "x-api-key: default-collector-key" \
  -H "x-signature: your-signature" \
  -H "x-timestamp: $(date +%s)000" \
  -d '{
    "events": [
      {
        "timestamp": "2025-01-11T10:00:00.000Z",
        "request_id": "req-123",
        "method": "GET",
        "path": "/api/test",
        "status": 200,
        "response_time_ms": 100,
        "source_ip": "192.168.1.1",
        "server_name": "test-server",
        "headers": {"user-agent": "curl/7.68.0"}
      }
    ]
  }'
```

#### Get Events
```bash
curl "http://localhost:3000/api/evidence/events?method=GET&limit=10"
```

#### Get Metrics
```bash
curl "http://localhost:3000/api/evidence/metrics/summary?groupBy=hour"
```

#### Get Top IPs
```bash
curl "http://localhost:3000/api/evidence/ips/top?limit=20"
```

### JavaScript Examples

#### Submit Evidence
```javascript
const axios = require('axios');
const crypto = require('crypto');

const apiKey = 'default-collector-key';
const timestamp = Date.now().toString();
const events = [
  {
    timestamp: new Date().toISOString(),
    request_id: crypto.randomUUID(),
    method: 'GET',
    path: '/api/test',
    status: 200,
    response_time_ms: 100,
    source_ip: '192.168.1.1',
    server_name: 'test-server',
    headers: { 'user-agent': 'axios/1.0.0' }
  }
];

const signature = crypto
  .createHmac('sha256', apiKey)
  .update(timestamp + JSON.stringify({ events }))
  .digest('hex');

const response = await axios.post('http://localhost:3000/api/evidence/bulk', {
  events
}, {
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-signature': signature,
    'x-timestamp': timestamp
  }
});

console.log(response.data);
```

#### Get Events with Filtering
```javascript
const response = await axios.get('http://localhost:3000/api/evidence/events', {
  params: {
    method: 'GET',
    status: 200,
    limit: 50,
    offset: 0
  }
});

console.log(response.data.events);
```

## SDKs and Libraries

### Node.js
```bash
npm install evidence-collector-sdk
```

```javascript
const { EvidenceCollector } = require('evidence-collector-sdk');

const collector = new EvidenceCollector({
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:3000'
});

await collector.submitEvidence(events);
```

### Python
```bash
pip install evidence-collector
```

```python
from evidence_collector import EvidenceCollector

collector = EvidenceCollector(
    api_key='your-api-key',
    base_url='http://localhost:3000'
)

collector.submit_evidence(events)
```

## Changelog

### v1.0.0
- Initial release
- Evidence collection and retrieval
- Metrics and analytics
- Authentication and security
- Docker support

