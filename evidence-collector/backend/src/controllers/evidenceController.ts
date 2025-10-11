import { Request, Response } from 'express';
import { Evidence, IEvidence } from '../models/Evidence';
import { BulkEvidenceRequest } from '../middleware/validation';

export const bulkCreateEvidence = async (req: Request, res: Response) => {
  try {
    const { events }: BulkEvidenceRequest = req.body;
    
    const evidenceDocs: Partial<IEvidence>[] = events.map(event => ({
      timestamp: new Date(event.timestamp),
      request_id: event.request_id,
      method: event.method,
      path: event.path,
      query: event.query,
      status: event.status,
      response_time_ms: event.response_time_ms,
      source_ip: event.source_ip,
      source_port: event.source_port,
      headers: event.headers,
      body_hash: event.body_hash,
      server_name: event.server_name,
      note: event.note
    }));

    const result = await Evidence.insertMany(evidenceDocs, { ordered: false });
    
    res.status(200).json({
      accepted: result.length,
      rejected: events.length - result.length
    });
  } catch (error: any) {
    console.error('Error creating evidence:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const accepted = error.result?.insertedCount || 0;
      const { events }: BulkEvidenceRequest = req.body;
      res.status(200).json({
        accepted,
        rejected: events.length - accepted
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const {
      path,
      ip,
      method,
      from,
      to,
      limit = '100',
      offset = '0'
    } = req.query;

    const query: any = {};

    if (path) query.path = { $regex: path as string, $options: 'i' };
    if (ip) query.source_ip = ip as string;
    if (method) query.method = method as string;
    
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from as string);
      if (to) query.timestamp.$lte = new Date(to as string);
    }

    const events = await Evidence.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await Evidence.countDocuments(query);

    res.json({
      events,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMetricsSummary = async (req: Request, res: Response) => {
  try {
    const { from, to, groupBy = 'hour' } = req.query;

    const matchQuery: any = {};
    if (from || to) {
      matchQuery.timestamp = {};
      if (from) matchQuery.timestamp.$gte = new Date(from as string);
      if (to) matchQuery.timestamp.$lte = new Date(to as string);
    }

    const groupFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m-%d %H:00:00';

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$timestamp' }
          },
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: '$response_time_ms' },
          uniqueIPs: { $addToSet: '$source_ip' },
          statusCodes: { $push: '$status' }
        }
      },
      {
        $project: {
          _id: 1,
          totalRequests: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          uniqueIPCount: { $size: '$uniqueIPs' },
          statusCodeDistribution: {
            $reduce: {
              input: '$statusCodes',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: { $toString: '$$this' },
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: { $toString: '$$this' }, input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      { $sort: { _id: 1 as 1 } }
    ];

    const metrics = await Evidence.aggregate(pipeline);

    res.json({ metrics });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTopIPs = async (req: Request, res: Response) => {
  try {
    const { from, to, limit = '50' } = req.query;

    const matchQuery: any = {};
    if (from || to) {
      matchQuery.timestamp = {};
      if (from) matchQuery.timestamp.$gte = new Date(from as string);
      if (to) matchQuery.timestamp.$lte = new Date(to as string);
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$source_ip',
          requestCount: { $sum: 1 },
          avgResponseTime: { $avg: '$response_time_ms' },
          lastSeen: { $max: '$timestamp' },
          statusCodes: { $push: '$status' }
        }
      },
      {
        $project: {
          ip: '$_id',
          requestCount: 1,
          avgResponseTime: { $round: ['$avgResponseTime', 2] },
          lastSeen: 1,
          errorRate: {
            $multiply: [
              {
                $divide: [
                  { $size: { $filter: { input: '$statusCodes', cond: { $gte: ['$$this', 400] } } } },
                  { $size: '$statusCodes' }
                ]
              },
              100
            ]
          }
        }
      },
      { $sort: { requestCount: -1 as -1 } },
      { $limit: parseInt(limit as string) }
    ];

    const topIPs = await Evidence.aggregate(pipeline);

    res.json({ topIPs });
  } catch (error) {
    console.error('Error fetching top IPs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
