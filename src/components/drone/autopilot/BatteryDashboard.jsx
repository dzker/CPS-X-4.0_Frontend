import React, { useState, useEffect } from 'react';
import { Card } from 'antd';
import { Battery, AlertTriangle } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import moment from 'moment-timezone';

const BatteryDashboard = () => {
  const [batteryData, setBatteryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchFlightData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/movement-logs');
      if (!response.ok) throw new Error('Failed to fetch flight data');
      const data = await response.json();
      
      // Process the flight data
      const processedData = data.data.map(session => ({
        timestamp: moment(session.start_time).format('HH:mm'),
        batteryUsage: session.battery_start - session.battery_end,
        batteryStart: session.battery_start,
        batteryEnd: session.battery_end,
        efficiency: session.total_commands ? 
          ((session.battery_start - session.battery_end) / session.total_commands).toFixed(2) : 0,
        duration: moment(session.end_time).diff(moment(session.start_time), 'minutes')
      }));

      // Sort by timestamp
      processedData.sort((a, b) => moment(a.timestamp, 'HH:mm').diff(moment(b.timestamp, 'HH:mm')));
      
      // Calculate metrics
      const metrics = {
        avgBatteryUsage: processedData.reduce((acc, curr) => acc + curr.batteryUsage, 0) / processedData.length,
        avgEfficiency: processedData.reduce((acc, curr) => acc + parseFloat(curr.efficiency), 0) / processedData.length,
        avgDuration: processedData.reduce((acc, curr) => acc + curr.duration, 0) / processedData.length,
        totalFlights: processedData.length
      };

      setBatteryData({
        timeSeriesData: processedData,
        metrics
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching flight data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightData();
    const interval = setInterval(fetchFlightData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
        <AlertTriangle className="w-5 h-5" />
        <span>Failed to load battery data: {error}</span>
      </div>
    );
  }

  if (!batteryData?.timeSeriesData?.length) return null;

  const { timeSeriesData, metrics } = batteryData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Battery Usage Over Time */}
      <Card title="Battery Usage Per Flight" className="shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <Battery className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Battery Usage</p>
            <p className="text-2xl font-semibold">{metrics.avgBatteryUsage.toFixed(1)}%</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="batteryUsage" 
              name="Battery Usage (%)" 
              stroke="#3b82f6" 
              fill="#3b82f6" 
              fillOpacity={0.3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Battery Start/End Comparison */}
      <Card title="Battery Levels" className="shadow-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Battery className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Average Flight Time</p>
            <p className="text-2xl font-semibold">{metrics.avgDuration.toFixed(1)} min</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="batteryStart" 
              name="Start Level" 
              stroke="#3b82f6" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="batteryEnd" 
              name="End Level" 
              stroke="#ef4444" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Summary Metrics */}
      <div className="col-span-1 md:col-span-2">
        <Card title="Battery Performance Analysis" className="shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Total Flights</p>
              <p className="text-xl font-semibold">{metrics.totalFlights}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Avg Flight Duration</p>
              <p className="text-xl font-semibold">{metrics.avgDuration.toFixed(1)} min</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Avg Battery Usage</p>
              <p className="text-xl font-semibold">{metrics.avgBatteryUsage.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Avg Battery Efficiency</p>
              <p className="text-xl font-semibold">{metrics.avgEfficiency.toFixed(2)}%</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BatteryDashboard;