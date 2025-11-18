import express from 'express';
import { getEvents, getMetricsSummary, getTopIPs } from '../controllers/evidenceController';
// Load export controller at runtime to avoid TS module resolution issues in editor when
// tests or environment haven't installed dev deps. Use require and fall back to named export.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _exportModule: any = require('../controllers/exportController');
const exportEvents: any = _exportModule.default || _exportModule.exportEvents;

const router = express.Router();

// Get log events
router.get('/events', getEvents);

// Export events (CSV or JSON)
router.get('/events/export', exportEvents);

// Get metrics summary
router.get('/metrics/summary', getMetricsSummary);

// Get top IPs
router.get('/ips/top', getTopIPs);

export default router;
