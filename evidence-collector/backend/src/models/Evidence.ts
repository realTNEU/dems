import mongoose, { Document, Schema } from 'mongoose';

export interface IEvidence extends Document {
  timestamp: Date;
  request_id: string;
  method: string;
  path: string;
  query?: string;
  status: number;
  response_time_ms: number;
  source_ip: string;
  source_port?: number;
  headers: Record<string, any>;
  body_hash?: string;
  server_name: string;
  note?: string;
  created_at: Date;
}

const EvidenceSchema = new Schema<IEvidence>({
  timestamp: { type: Date, required: true, index: true },
  request_id: { type: String, required: true, unique: true },
  method: { type: String, required: true, index: true },
  path: { type: String, required: true, index: true },
  query: { type: String },
  status: { type: Number, required: true, index: true },
  response_time_ms: { type: Number, required: true },
  source_ip: { type: String, required: true, index: true },
  source_port: { type: Number },
  headers: { type: Schema.Types.Mixed, default: {} },
  body_hash: { type: String },
  server_name: { type: String, required: true, index: true },
  note: { type: String },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
EvidenceSchema.index({ timestamp: 1, source_ip: 1 });
EvidenceSchema.index({ path: 1, method: 1 });
EvidenceSchema.index({ status: 1, timestamp: 1 });

export const Evidence = mongoose.model<IEvidence>('Evidence', EvidenceSchema);

