import mongoose, { Document, Schema } from 'mongoose';

export interface ILogEntry extends Document {
  timestamp: string;
  method: string;
  path: string;
  query: any;
  status: number;
  responseTime: number;
  sourceIP: string;
  userAgent: string;
  body: any;
  createdAt: Date;
}

const logEntrySchema = new Schema<ILogEntry>({
  timestamp: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  query: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number,
    required: true
  },
  sourceIP: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  body: {
    type: Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
logEntrySchema.index({ timestamp: 1 });
logEntrySchema.index({ sourceIP: 1 });
logEntrySchema.index({ method: 1 });
logEntrySchema.index({ status: 1 });
logEntrySchema.index({ createdAt: 1 });

export const LogEntry = mongoose.model<ILogEntry>('LogEntry', logEntrySchema);
