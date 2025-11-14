import React from 'react';
import { Package, Plane, MapPin, Clock } from 'lucide-react';
import SummaryCard from './SummaryCard';

const SummaryCards = ({ itemStats, flightStats, locationStats }) => {
  const summaryCards = [
    {
      icon: Package,
      title: 'Total Items',
      value: itemStats?.total || 0,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: Plane,
      title: 'Flight Sessions',
      value: flightStats?.total || 0,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: MapPin,
      title: 'Locations',
      value: locationStats?.total || 0,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      icon: Clock,
      title: 'Total Commands',
      value: flightStats?.totalCommands || 0,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {summaryCards.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  );
};

export default SummaryCards;