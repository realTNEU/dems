# Evidence Collector

A dark-themed observability and evidence collection application for digital forensics teams. Automatically collects server logs, sends evidence to a backend, stores it, and visualizes the data in a React frontend for attack analysis.

## 🎯 Overview

This application provides a complete evidence collection and analysis system with the following components:

- **Dummy Server**: Express server with 50 programmatically generated API endpoints
- **Traffic Generator**: Random traffic generator to simulate API calls
- **Collector**: TypeScript script that collects evidence from server logs
- **Backend**: TypeScript Node.js API with MongoDB storage
- **Frontend**: React dashboard with dark theme for data visualization

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dummy Server  │    │    Backend      │    │    Frontend     │
│   (Port 4000)   │───▶│   (Port 3000)   │◀───│   (Port 5173)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │    MongoDB      │
                        └─────────────────┘
```

## 🚀 Quick Start (Windows)

### Prerequisites

- Node.js 18+ 
- MongoDB (running locally with MongoDB Compass)
- Git
- Windows PowerShell or Command Prompt

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd evidence-collector
   ```

2. **Verify MongoDB is running**
   - Open MongoDB Compass
   - Connect to `mongodb://localhost:27017`
   - You should see the connection successful

3. **Start Backend (Terminal 1)**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   - Backend will start on http://localhost:3000
   - Health check: http://localhost:3000/health

4. **Start Dummy Server (Terminal 2)**
   ```bash
   cd dummy-server
   npm install
   npm start
   ```
   - Dummy server will start on http://localhost:4000
   - Health check: http://localhost:4000/health
   - Logs directly to MongoDB

5. **Start Frontend (Terminal 3)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Frontend will start on http://localhost:5173
   - Open browser to view the dashboard

6. **Generate Traffic (Terminal 4 - Optional)**
   ```bash
   cd traffic-gen
   npm install
   npm start
   ```
   - Generates random API calls to dummy server
   - Creates evidence data for the dashboard

## 📊 Features

### Dashboard
- **Real-time Metrics**: Total requests, average response time, unique IPs
- **Time Series Charts**: Requests over time with interactive filtering
- **Status Code Distribution**: Pie chart showing HTTP status codes
- **Top Source IPs**: Table with request counts, error rates, and last seen

### Evidence Table
- **Interactive Filtering**: Filter by time range, path, method, IP, status code
- **Pagination**: Navigate through large datasets
- **Export Functionality**: Export filtered data to CSV or JSON
- **Real-time Updates**: Live data refresh with loading states

### Data Collection
- **Multiple Collection Modes**: Middleware mode or log-tail mode
- **Batch Processing**: Efficient bulk evidence submission
- **Error Handling**: Retry logic and graceful degradation
- **Security**: API key authentication and HMAC signatures

## 🔧 Configuration

### Environment Variables

#### Backend
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/evidence-collector
COLLECTOR_API_KEY=default-collector-key
NODE_ENV=development
```

#### Traffic Generator
```env
SERVER_URL=http://localhost:4000
RPS=10
CONCURRENCY=5
DURATION=300
```


## 📡 API Endpoints

### Data Retrieval
- `GET /api/evidence/events` - Get filtered events with pagination
- `GET /api/evidence/metrics/summary` - Get aggregated metrics
- `GET /api/evidence/ips/top` - Get top source IPs

### Health Checks
- `GET /health` - Backend health check

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
npm test

# Integration tests
npm run test:integration
```

### Test Coverage
- Unit tests for all API endpoints
- Integration tests for end-to-end flow
- Error handling and edge cases
- High-volume data processing

## 🚀 Development Commands (Windows)

### Manual Start (4 terminals)

Open 4 separate PowerShell or Command Prompt windows and run:

```powershell
# Terminal 1: Backend
cd evidence-collector\backend
npm install
npm run dev

# Terminal 2: Dummy Server
cd evidence-collector\dummy-server
npm install
npm start

# Terminal 3: Frontend
cd evidence-collector\frontend
npm install
npm run dev

# Terminal 4: Traffic Generator (optional)
cd evidence-collector\traffic-gen
npm install
npm start
```

### Service URLs
- **Frontend Dashboard**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Dummy Server**: http://localhost:4000
- **MongoDB**: mongodb://localhost:27017

### Health Checks
- **Backend**: http://localhost:3000/health
- **Dummy Server**: http://localhost:4000/health

## 📁 Project Structure

```
evidence-collector/
├── backend/                 # TypeScript Node.js API
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # Express routes
│   │   └── utils/         # Database utilities
│   └── __tests__/         # Test files
├── frontend/               # React Vite application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
├── dummy-server/          # Express test server
├── traffic-gen/           # Traffic generator
└── .env                  # Environment variables
```

## 🔒 Security Considerations

- **Data Redaction**: Sensitive headers are automatically redacted
- **Body Hashing**: Request bodies are hashed instead of stored
- **Input Validation**: All inputs are validated and sanitized
- **CORS Protection**: Cross-origin requests are properly configured

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```powershell
   # Check if MongoDB is running
   mongosh --eval "db.runCommand('ping')"
   
   # Start MongoDB service (Windows)
   net start MongoDB
   # or restart from Services.msc
   ```

2. **Frontend Not Loading**
   ```powershell
   # Check if backend is running
   curl http://localhost:3000/health
   
   # Check frontend logs
   cd frontend
   npm run dev
   ```

3. **No Data in Dashboard**
   ```powershell
   # Check if traffic generator is running
   cd traffic-gen
   npm start
   
   # Verify dummy server is receiving requests
   curl http://localhost:4000/health
   ```

4. **Port Conflicts**
   ```powershell
   # Check what's using a port
   netstat -ano | findstr :3000
   
   # Kill process using port (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

### Performance Tuning

- **MongoDB Indexes**: Optimized for common query patterns
- **Batch Processing**: Configurable batch sizes for evidence collection
- **Connection Pooling**: Efficient database connections
- **Caching**: Frontend caching for better performance

## 📈 Monitoring

### Health Checks
- Backend: `http://localhost:3000/health`
- Dummy Server: `http://localhost:4000/health`
- Collector: `http://localhost:8080/health` (middleware mode)

### Metrics
- Request count and response times
- Error rates and status codes
- Source IP analysis
- System resource usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Open an issue on GitHub
4. Contact the development team

---

**Note**: This system is designed for forensics and analysis of server logs only. Do not use to exfiltrate user content or credentials. Respect privacy and applicable laws.
