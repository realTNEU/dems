import { useState } from 'react';
import { exportEvents } from '../services/api';

const EventsTable = ({ events, filters, onPageChange, loading }) => {
  const [selectedEvents, setSelectedEvents] = useState(new Set());
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportLimit, setExportLimit] = useState(filters.limit || 100);
  const [activeEvent, setActiveEvent] = useState(null);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents(new Set(events.map(event => event._id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleSelectEvent = (eventId, checked) => {
    const newSelected = new Set(selectedEvents);
    if (checked) {
      newSelected.add(eventId);
    } else {
      newSelected.delete(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const exportFilters = { ...filters, limit: exportLimit };
      const blob = await exportEvents(exportFilters, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-blue-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    if (status >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  const getMethodColor = (method) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'text-blue-400';
      case 'POST': return 'text-green-400';
      case 'PUT': return 'text-yellow-400';
      case 'DELETE': return 'text-red-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-dark-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-dark-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-dark-100">
          Events ({events.length})
        </h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-dark-300">Format</label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            className="input text-sm"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>

          <label className="text-sm text-dark-300">Limit</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={exportLimit}
            onChange={(e) => setExportLimit(Number(e.target.value))}
            className="input w-24 text-sm"
          />

          <button
            onClick={() => handleExport(exportFormat)}
            disabled={exporting}
            className="btn-secondary text-sm"
          >
            {exporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
          </button>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center text-dark-400 py-8">
          No events found matching the current filters
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedEvents.size === events.length && events.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-dark-600 bg-dark-800 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th>Timestamp</th>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status</th>
                  <th>Response Time</th>
                  <th>Source IP</th>
                  <th>Server</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-dark-800 cursor-pointer" onClick={() => setActiveEvent(event)}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event._id)}
                        onChange={(e) => handleSelectEvent(event._id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-dark-600 bg-dark-800 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="text-sm">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className={`font-mono text-sm font-bold ${getMethodColor(event.method)}`}>
                        {event.method}
                      </span>
                    </td>
                    <td className="font-mono text-sm max-w-xs truncate" title={event.path}>
                      {event.path}
                    </td>
                    <td>
                      <span className={`font-mono text-sm font-bold ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="text-sm">
                      {event.response_time_ms}ms
                    </td>
                    <td className="font-mono text-sm">
                      {event.source_ip}
                    </td>
                    <td className="text-sm">
                      {event.server_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Event details modal */}
          {activeEvent && (
            <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => setActiveEvent(null)}></div>
              <div className="relative bg-dark-900 border border-dark-700 rounded shadow-lg max-w-3xl w-full p-6 z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Event Details</h3>
                  <button className="btn-secondary" onClick={() => setActiveEvent(null)}>Close</button>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Method:</strong> <span className="font-mono">{activeEvent.method}</span>
                    {' '}<strong>Path:</strong> <span className="font-mono">{activeEvent.path}</span>
                  </div>
                  <div>
                    <strong>Source IP:</strong> {activeEvent.source_ip} {' '}
                    <strong>Status:</strong> {activeEvent.status}
                  </div>
                  <div>
                    <strong>Has Media:</strong> {activeEvent.has_media ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Params:</strong>
                    <pre className="overflow-auto max-h-40 p-2 bg-dark-800 rounded mt-1">{JSON.stringify(activeEvent.params || {}, null, 2)}</pre>
                  </div>
                  <div>
                    <strong>Headers:</strong>
                    <pre className="overflow-auto max-h-40 p-2 bg-dark-800 rounded mt-1">{JSON.stringify(activeEvent.headers || {}, null, 2)}</pre>
                  </div>
                  <div>
                    <strong>Body:</strong>
                    <pre className="overflow-auto max-h-40 p-2 bg-dark-800 rounded mt-1">{activeEvent.body ? JSON.stringify(activeEvent.body, null, 2) : '—'}</pre>
                  </div>
                  <div>
                    <strong>Body Hash:</strong> <span className="font-mono">{activeEvent.body_hash || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
            <div className="text-sm text-dark-400">
              Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, events.length)} of {events.length} events
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(Math.max(0, filters.offset - filters.limit))}
                disabled={filters.offset === 0}
                className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => onPageChange(filters.offset + filters.limit)}
                disabled={events.length < filters.limit}
                className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EventsTable;

