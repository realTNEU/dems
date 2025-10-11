import fs from 'fs-extra';
import path from 'path';

export class Logger {
  private logFile?: string;

  constructor(logFile?: string) {
    this.logFile = logFile;
  }

  info(message: string, data?: any) {
    const logEntry = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      data
    };
    
    console.log(JSON.stringify(logEntry));
    
    if (this.logFile) {
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    }
  }

  error(message: string, error?: any) {
    const logEntry = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error?.message || error
    };
    
    console.error(JSON.stringify(logEntry));
    
    if (this.logFile) {
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    }
  }

  warn(message: string, data?: any) {
    const logEntry = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      data
    };
    
    console.warn(JSON.stringify(logEntry));
    
    if (this.logFile) {
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    }
  }
}
