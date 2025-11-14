// Use REACT_APP_ prefix for Create React App environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

export const endpoints = {
  items: {
    base: `${API_BASE_URL}/api/items`,
    getAll: `${API_BASE_URL}/api/items`,
    getById: (id) => `${API_BASE_URL}/api/items/${id}`,
    create: `${API_BASE_URL}/api/items`,
    update: (id) => `${API_BASE_URL}/api/items/${id}`,
    delete: (id) => `${API_BASE_URL}/api/items/${id}`,
    updateStatus: (id) => `${API_BASE_URL}/api/items/${id}/status`,
    updateLocation: (id) => `${API_BASE_URL}/api/items/${id}/location`,
    checkExists: (id) => `${API_BASE_URL}/api/items/${id}/exists`,
  },
  locations: {
    base: `${API_BASE_URL}/api/locations`,
    getAll: `${API_BASE_URL}/api/locations`,
    getById: (id) => `${API_BASE_URL}/api/locations/${id}`,
    create: `${API_BASE_URL}/api/locations`,
    delete: (id) => `${API_BASE_URL}/api/locations/${id}`
  },
  export: {
    csv: `${API_BASE_URL}/api/export/csv`,
  },
  analysis: {
    batteryEfficiency: `${API_BASE_URL}/api/analysis/battery`,
    movementPatterns: `${API_BASE_URL}/api/analysis/movements`,
    flightPerformance: `${API_BASE_URL}/api/analysis/performance`
  }
};