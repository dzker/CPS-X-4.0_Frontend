import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  Roll: 'rgba(151, 70, 255, 1)',
  'FG Pallet': 'rgba(88, 74, 221, 1)'
};

const DistributionCharts = ({ typeData, locationData }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const filteredLocations = locationData.filter(loc => {
    if (selectedFilter === 'all') return true;
    return loc.typeName === selectedFilter;
  });
  return (
    <div className="distribution-container">
      <div className="donut-chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Item Type Distribution</h3>
        </div>
        <div className="chart-content donut">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                label
              >
                {typeData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="location-chart-container">
        <div className="chart-header">
          <h3 className="chart-title">Location Utilization</h3>
        </div>
        
        <div className="location-filter">
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'Paper Roll Location' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('Paper Roll Location')}
            >
              Paper Roll Location
            </button>
            <button 
              className={`filter-btn ${selectedFilter === 'FG Pallet Location' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('FG Pallet Location')}
            >
              FG Pallet Location
            </button>
          </div>
        </div>

        <div className="chart-content">
          {filteredLocations.map((location) => (
            <div key={location.locationId} className="location-bar">
              <span className="location-label">{location.locationId}</span>
              <div className="location-bar-container">
                <div
                  className="location-bar-fill"
                  style={{ width: `${location.utilization}%` }}
                />
              </div>
              <span className="location-value">
                {location.itemCount} items ({location.utilization}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DistributionCharts;