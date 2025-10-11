import express from 'express';
import { getEvents, getMetricsSummary, getTopIPs } from '../controllers/evidenceController';

const router = express.Router();

// Get log events
router.get('/events', getEvents);

// Get metrics summary
router.get('/metrics/summary', getMetricsSummary);

// Get top IPs
router.get('/ips/top', getTopIPs);

export default router;
