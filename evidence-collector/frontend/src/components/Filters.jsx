import { useState } from 'react';
import { format, subDays, subHours } from 'date-fns';

const Filters = ({ filters, onFilterChange, onRefresh, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleQuickTimeRange = (range) => {
    const now = new Date();
    let from, to;

    switch (range) {
      case '1h':
        from = subHours(now, 1);
        to = now;
        break;
      case '24h':
        from = subDays(now, 1);
        to = now;
        break;
      case '7d':
        from = subDays(now, 7);
        to = now;
        break;
      default:
        return;
    }

    onFilterChange({
      from: format(from, "yyyy-MM-dd'T'HH:mm"),
      to: format(to, "yyyy-MM-dd'T'HH:mm")
    });
  };

  const clearFilters = () => {
    onFilterChange({
      from: '',
      to: '',
      path: '',
      method: '',
      ip: '',
      status: '',
      limit: 100,
      offset: 0
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-100">Filters</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary text-sm"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-primary text-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Quick time ranges */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Quick Ranges
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => handleQuickTimeRange('1h')}
              className="btn-secondary text-xs px-2 py-1"
            >
              1H
            </button>
            <button
              onClick={() => handleQuickTimeRange('24h')}
              className="btn-secondary text-xs px-2 py-1"
            >
              24H
            </button>
            <button
              onClick={() => handleQuickTimeRange('7d')}
              className="btn-secondary text-xs px-2 py-1"
            >
              7D
            </button>
          </div>
        </div>

        {/* Time range */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            From
          </label>
          <input
            type="datetime-local"
            value={filters.from}
            onChange={(e) => handleInputChange('from', e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            To
          </label>
          <input
            type="datetime-local"
            value={filters.to}
            onChange={(e) => handleInputChange('to', e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Limit
          </label>
          <select
            value={filters.limit}
            onChange={(e) => handleInputChange('limit', parseInt(e.target.value))}
            className="input w-full"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-dark-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Path
              </label>
              <input
                type="text"
                placeholder="Filter by path..."
                value={filters.path}
                onChange={(e) => handleInputChange('path', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Method
              </label>
              <select
                value={filters.method}
                onChange={(e) => handleInputChange('method', e.target.value)}
                className="input w-full"
              >
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Source IP
              </label>
              <input
                type="text"
                placeholder="Filter by IP..."
                value={filters.ip}
                onChange={(e) => handleInputChange('ip', e.target.value)}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Status Code
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="input w-full"
              >
                <option value="">All Status Codes</option>
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Internal Server Error</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="btn-secondary"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
