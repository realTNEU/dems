import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

const Dashboard = ({ metrics, topIPs, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-dark-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-dark-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!metrics || !metrics.metrics) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-dark-100 mb-4">Dashboard</h2>
        <div className="text-center text-dark-400 py-8">
          No metrics data available
        </div>
      </div>
    );
  }

  const metricsData = metrics.metrics || [];
  const topIPsData = topIPs || [];

  // Calculate totals
  const totalRequests = metricsData.reduce((sum, item) => sum + item.totalRequests, 0);
  const avgResponseTime = metricsData.reduce((sum, item) => sum + item.avgResponseTime, 0) / metricsData.length || 0;
  const uniqueIPs = new Set(topIPsData.map(ip => ip.ip)).size;

  // Prepare status code distribution data
  const statusCodeData = [];
  if (metricsData.length > 0) {
    const statusCodes = metricsData[0].statusCodeDistribution || {};
    Object.entries(statusCodes).forEach(([code, count]) => {
      statusCodeData.push({ name: code, value: count });
    });
  }

  // Colors for charts
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-dark-400">Total Requests</p>
              <p className="text-2xl font-bold text-dark-100">{totalRequests.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">⚡</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-dark-400">Avg Response Time</p>
              <p className="text-2xl font-bold text-dark-100">{avgResponseTime.toFixed(2)}ms</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🌐</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-dark-400">Unique IPs</p>
              <p className="text-2xl font-bold text-dark-100">{uniqueIPs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Over Time */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Requests Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metricsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="_id" 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalRequests" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Code Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-dark-100 mb-4">Status Code Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusCodeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top IPs */}
      <div className="card">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Top Source IPs</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>IP Address</th>
                <th>Requests</th>
                <th>Avg Response Time</th>
                <th>Error Rate</th>
                <th>Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {topIPsData.slice(0, 10).map((ip, index) => (
                <tr key={ip.ip}>
                  <td className="font-mono text-sm">{ip.ip}</td>
                  <td>{ip.requestCount.toLocaleString()}</td>
                  <td>{ip.avgResponseTime}ms</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs ${
                      ip.errorRate > 10 ? 'bg-red-900 text-red-200' : 
                      ip.errorRate > 5 ? 'bg-yellow-900 text-yellow-200' : 
                      'bg-green-900 text-green-200'
                    }`}>
                      {ip.errorRate.toFixed(1)}%
                    </span>
                  </td>
                  <td>{new Date(ip.lastSeen).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
