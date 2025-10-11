import { Router } from 'express';
import { bulkCreateEvidence, getEvents, getMetricsSummary, getTopIPs } from '../controllers/evidenceController';
import { authenticateCollector } from '../middleware/auth';
import { validateBulkEvidence } from '../middleware/validation';

const router = Router();

// Evidence ingestion endpoint (requires authentication)
router.post('/bulk', authenticateCollector, validateBulkEvidence, bulkCreateEvidence);

// Public endpoints for frontend
router.get('/events', getEvents);
router.get('/metrics/summary', getMetricsSummary);
router.get('/ips/top', getTopIPs);

export default router;
