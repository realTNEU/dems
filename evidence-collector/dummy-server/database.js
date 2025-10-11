const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/evidence-collector';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Log entry schema
const logEntrySchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.Mixed,
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
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create model
const LogEntry = mongoose.model('LogEntry', logEntrySchema);

module.exports = {
  connectDB,
  LogEntry
};
