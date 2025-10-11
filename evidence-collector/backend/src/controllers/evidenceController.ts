import { Request, Response } from 'express';
import { LogEntry, ILogEntry } from '../models/LogEntry';


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
    if (ip) query.sourceIP = ip as string;
    if (method) query.method = method as string;
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }

    const logs = await LogEntry.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string));

    const total = await LogEntry.countDocuments(query);

    // Transform logs to match the expected evidence format
    const events = logs.map(log => ({
      _id: log._id,
      timestamp: log.timestamp,
      request_id: log._id?.toString() || '',
      method: log.method,
      path: log.path,
      query: JSON.stringify(log.query),
      status: log.status,
      response_time_ms: log.responseTime,
      source_ip: log.sourceIP,
      headers: {
        'user-agent': log.userAgent
      },
      body_hash: log.body ? require('crypto').createHash('sha256').update(JSON.stringify(log.body)).digest('hex') : undefined,
      server_name: 'dummy-server',
      note: 'Collected from MongoDB logs',
      created_at: log.createdAt,
      createdAt: log.createdAt,
      updatedAt: log.createdAt,
      __v: 0
    }));

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
      matchQuery.createdAt = {};
      if (from) matchQuery.createdAt.$gte = new Date(from as string);
      if (to) matchQuery.createdAt.$lte = new Date(to as string);
    }

    const groupFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m-%d %H:00:00';

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: groupFormat, date: '$createdAt' }
          },
          totalRequests: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          uniqueIPs: { $addToSet: '$sourceIP' },
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

    const metrics = await LogEntry.aggregate(pipeline);

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
      matchQuery.createdAt = {};
      if (from) matchQuery.createdAt.$gte = new Date(from as string);
      if (to) matchQuery.createdAt.$lte = new Date(to as string);
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$sourceIP',
          requestCount: { $sum: 1 },
          avgResponseTime: { $avg: '$responseTime' },
          lastSeen: { $max: '$createdAt' },
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

    const topIPs = await LogEntry.aggregate(pipeline);

    res.json({ topIPs });
  } catch (error) {
    console.error('Error fetching top IPs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
