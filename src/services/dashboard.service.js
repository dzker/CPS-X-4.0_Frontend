import moment from 'moment-timezone';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Process flights by hour helper function
const processFlightsByHour = (flights) => {
  const hourCounts = Array(24).fill(0);
  flights.forEach(flight => {
    if (flight.start_time) {
      const hour = moment(flight.start_time).hour();
      hourCounts[hour]++;
    }
  });
  return hourCounts.map((count, hour) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    flights: count
  }));
};

// Process items data helper function
const processItemsData = (items) => {
  return {
    total: items.length,
    items: items, // Added this line to include raw items data
    byType: {
      'Roll': items.filter(item => item.label_type === 'Roll').length,
      'FG Pallet': items.filter(item => item.label_type === 'FG Pallet').length
    },
    byStatus: {
      'Available': items.filter(item => item.status === 'Available').length,
      'Checked Out': items.filter(item => item.status === 'Checked Out').length,
      'Lost': items.filter(item => item.status === 'Lost').length,
      'Unresolved': items.filter(item => item.status === 'Unresolved').length
    }
  };
};

// Process flight data helper function
const processFlightData = (flights) => {
  return {
    total: flights.length,
    totalCommands: flights.reduce((sum, flight) => sum + (flight.total_commands || 0), 0),
    avgBatteryUsage: flights.reduce((sum, flight) => {
      const usage = (flight.battery_start || 0) - (flight.battery_end || 0);
      return sum + (usage > 0 ? usage : 0);
    }, 0) / (flights.length || 1),
    byHour: processFlightsByHour(flights)
  };
};

// Process location data helper function
const processLocationData = (locations) => {
  return {
    total: locations.length,
    locations: locations, // Added this line to include raw locations data
    byType: locations.reduce((acc, loc) => {
      acc[loc.type_name] = (acc[loc.type_name] || 0) + 1;
      return acc;
    }, {})
  };
};

const calculateTypeDistribution = (items) => {
  const typeCount = {
    'Roll': 0,
    'FG Pallet': 0
  };

  items.forEach(item => {
    if (typeCount.hasOwnProperty(item.label_type)) {
      typeCount[item.label_type]++;
    }
  });

  return Object.entries(typeCount).map(([name, value]) => ({
    name,
    value
  }));
};

const calculateLocationUtilization = (items, locations) => {
  const locationMap = new Map();
  
  // Initialize all locations
  locations.forEach(loc => {
    locationMap.set(loc.location_id, {
      locationId: loc.location_id,
      typeName: loc.type_name,
      itemCount: 0,
      capacity: loc.type_name === 'Paper Roll Location' ? 50 : 30,
      utilization: 0
    });
  });

  // Count items
  items.forEach(item => {
    if (locationMap.has(item.location_id)) {
      const location = locationMap.get(item.location_id);
      location.itemCount++;
      location.utilization = Math.round((location.itemCount / location.capacity) * 100);
    }
  });

  // Return all locations sorted by utilization
  return Array.from(locationMap.values())
    .sort((a, b) => b.utilization - a.utilization);
};

export const dashboardService = {
  // Fetch all dashboard data
  async getDashboardData() {
    try {
      const [itemsResponse, flightResponse, locationsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/items`),
        fetch(`${API_BASE_URL}/api/movement-logs`),
        fetch(`${API_BASE_URL}/api/locations`)
      ]);

      const itemsData = await itemsResponse.json();
      const flightData = await flightResponse.json();
      const locationsData = await locationsResponse.json();

      const items = itemsData.data || [];
      const flights = flightData.data || [];
      const locations = locationsData.data || [];

      return {
        itemStats: processItemsData(items),
        flightStats: processFlightData(flights),
        locationStats: processLocationData(locations)
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw new Error('Failed to fetch dashboard data');
    }
  },

  // Transform data for charts
  transformChartData({ itemStats, locationStats }) {
    if (!itemStats || !locationStats) return {
      typeData: [],
      locationData: []
    };

    return {
      typeData: calculateTypeDistribution(itemStats.items),
      locationData: calculateLocationUtilization(itemStats.items, locationStats.locations)
    };
  },
};