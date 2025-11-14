import React, { useState, useEffect } from "react";
import { Loader2, Package, Plane, MapPin, Clock } from "lucide-react";
import { dashboardService } from "../../services/dashboard.service";
import DistributionCharts from "./DistributionCharts";
import LocationOverview from "./LocationOverview";
import SummaryCard from "./SummaryCard";
import "../../assets/styles/components/Dashboard.css";

const Dashboard = () => {
  const [itemStats, setItemStats] = useState(null);
  const [flightStats, setFlightStats] = useState(null);
  const [locationStats, setLocationStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await dashboardService.getDashboardData();
        setItemStats(data.itemStats);
        setFlightStats(data.flightStats);
        setLocationStats(data.locationStats);
      } catch (err) {
        console.error("Dashboard error:", err);
        setError("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const { typeData, locationData } = dashboardService.transformChartData({
    itemStats,
    locationStats,
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Dashboard Overview</h1>
      </header>

      <div className="summary-cards-grid">
        <SummaryCard
          icon={Package}
          title="Total Items"
          value={itemStats?.total || 0}
          style={{ backgroundColor: '#dbeafe' }} // bg-blue-100
          iconStyle={{ color: '#2563eb' }} // text-blue-600
        />
        <SummaryCard
          icon={Plane}
          title="Flight Sessions"
          value={flightStats?.total || 0}
          style={{ backgroundColor: '#dcfce7' }} // bg-green-100
          iconStyle={{ color: '#16a34a' }} // text-green-600
        />
        <SummaryCard
          icon={MapPin}
          title="Locations"
          value={locationStats?.total || 0}
          style={{ backgroundColor: '#fef9c3' }} // bg-yellow-100
          iconStyle={{ color: '#ca8a04' }} // text-yellow-600
        />
        <SummaryCard
          icon={Clock}
          title="Total Commands"
          value={flightStats?.totalCommands || 0}
          style={{ backgroundColor: '#f3e8ff' }} // bg-purple-100
          iconStyle={{ color: '#9333ea' }} // text-purple-600
        />
      </div>

      <div className="charts-container">
        <div className="distribution-charts-grid">
          <DistributionCharts typeData={typeData} locationData={locationData} />
        </div>

        {/* <div className="full-width-chart">
          <FlightActivityChart flightStats={flightStats} />
        </div>

        <div className="full-width-chart">
          <LocationChart locationTypeData={locationTypeData} />
        </div> */}
        <div className="full-width-chart">
          <LocationOverview
            locations={locationStats?.locations || []}
            items={itemStats?.items || []}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
