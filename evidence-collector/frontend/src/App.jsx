import { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import EventsTable from './components/EventsTable';
import Filters from './components/Filters';
import { fetchEvents, fetchMetrics, fetchTopIPs } from './services/api';

function App() {
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [topIPs, setTopIPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    path: '',
    method: '',
    ip: '',
    status: '',
    limit: 100,
    offset: 0
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsData, metricsData, topIPsData] = await Promise.all([
        fetchEvents(filters),
        fetchMetrics(filters),
        fetchTopIPs(filters)
      ]);

      setEvents(eventsData.events || []);
      setMetrics(metricsData);
      setTopIPs(topIPsData.topIPs || []);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-dark-300">Loading evidence data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-dark-100 mb-2">Error Loading Data</h2>
          <p className="text-dark-300 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-dark-100">Evidence Collector</h1>
              <p className="text-dark-400">Digital Forensics Dashboard</p>
            </div>
            <div className="text-sm text-dark-400">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Filters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            onRefresh={loadData}
            loading={loading}
          />
          
          <Dashboard 
            metrics={metrics}
            topIPs={topIPs}
            loading={loading}
          />
          
          <EventsTable 
            events={events}
            filters={filters}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}

export default App;