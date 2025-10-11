import { Request, Response, NextFunction } from 'express';
import { EvidenceCollector } from './collector';

export function createEvidenceMiddleware(collector: EvidenceCollector) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Override res.end to capture response
    const originalEnd = res.end.bind(res);
    res.end = function(chunk?: any, encoding?: any, cb?: any) {
      // Add evidence after response is sent
      collector.addEvidenceFromMiddleware(req, res, startTime);
      
      // Call original end method
      return originalEnd(chunk, encoding, cb);
    };
    
    next();
  };
}
