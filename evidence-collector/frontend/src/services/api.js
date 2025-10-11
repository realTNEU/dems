const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(`API Error: ${response.status} ${response.statusText}`, response.status);
  }
  return response.json();
}

export async function fetchEvents(filters = {}) {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/evidence/events?${params}`);
  return handleResponse(response);
}

export async function fetchMetrics(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.groupBy) params.append('groupBy', filters.groupBy);

  const response = await fetch(`${API_BASE_URL}/api/evidence/metrics/summary?${params}`);
  return handleResponse(response);
}

export async function fetchTopIPs(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.limit) params.append('limit', filters.limit);

  const response = await fetch(`${API_BASE_URL}/api/evidence/ips/top?${params}`);
  return handleResponse(response);
}

export async function exportEvents(filters = {}, format = 'csv') {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/evidence/events/export?${params}&format=${format}`);
  
  if (!response.ok) {
    throw new ApiError(`Export failed: ${response.status} ${response.statusText}`, response.status);
  }
  
  return response.blob();
}
