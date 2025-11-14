import { endpoints } from '../config/api.config';

// Constants for caching
const SESSION_STORAGE_PREFIX = 'analysis_cache_';
const SESSION_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper functions for session storage
const getSessionCache = (key) => {
  try {
    const cached = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > SESSION_CACHE_DURATION) {
      sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Session cache error:', err);
    return null;
  }
};

const setSessionCache = (key, data) => {
  try {
    sessionStorage.setItem(
      `${SESSION_STORAGE_PREFIX}${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now()
      })
    );
  } catch (err) {
    console.error('Error setting session cache:', err);
  }
};

// Main service
export const analysisService = {
  async getBatteryEfficiency() {
    try {
      // Check session storage first
      // const cachedData = getSessionCache('battery');
      // if (cachedData) {
      //   return cachedData;
      // }

      const response = await fetch(endpoints.analysis.batteryEfficiency);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform data for the battery comparison chart
      const transformedData = {
        metrics: data.metrics,
        timeSeriesData: data.timeSeriesData.map(point => ({
          timePoint: point.timePoint,
          'Actual Consumption': point.actualBattery,
          'Recommended Consumption': point.recommendedBattery,
        })),
        analysis: data.analysis
      };

      // Cache the response
      // setSessionCache('battery', transformedData);

      return transformedData;
    } catch (err) {
      console.error('Battery efficiency analysis error:', err);
      throw new Error('Failed to fetch battery efficiency data');
    }
  },

  async getMovementPatterns() {
    try {
      // Check session storage first
      const cachedData = getSessionCache('movement');
      if (cachedData) {
        console.log('Using cached movement patterns data');
        return cachedData;
      }

      const response = await fetch(endpoints.analysis.movementPatterns);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the response
      setSessionCache('movement', data);
      return data;

    } catch (err) {
      console.error('Movement patterns analysis error:', err);
      throw new Error('Failed to fetch movement patterns data');
    }
  },

  async getDronePerformance() {
    try {
      // Check session storage first
      const cachedData = getSessionCache('performance');
      if (cachedData) {
        console.log('Using cached performance data');
        return cachedData;
      }

      const response = await fetch(endpoints.analysis.flightPerformance);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Cache the response
      setSessionCache('performance', data);
      return data;

    } catch (err) {
      console.error('Performance analysis error:', err);
      throw new Error('Failed to fetch performance analysis data');
    }
  },

  // Method to force refresh all analysis data
  async refreshAnalysis() {
    this.clearCache();
    try {
      await Promise.all([
        this.getBatteryEfficiency(),
        this.getMovementPatterns(),
        this.getDronePerformance()
      ]);
      return true;
    } catch (err) {
      console.error('Error refreshing analysis:', err);
      return false;
    }
  },

  // Method to clear all cached data
  clearCache() {
    try {
      Object.keys(sessionStorage)
        .filter(key => key.startsWith(SESSION_STORAGE_PREFIX))
        .forEach(key => sessionStorage.removeItem(key));
      console.log('Analysis cache cleared');
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  },

  // Method to check if data is cached
  isCached(analysisType) {
    return !!getSessionCache(analysisType);
  },

  // Method to get cache age
  getCacheAge(analysisType) {
    try {
      const cached = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${analysisType}`);
      if (!cached) return null;

      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp;
    } catch (err) {
      console.error('Error getting cache age:', err);
      return null;
    }
  }
};