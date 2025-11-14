import React from 'react';

const PreviewTable = ({ data, type }) => {
  const getHeaders = () => {
    switch (type) {
      case 'labels':
        return ['Label ID', 'Label Type', 'Location', 'Status', 'Last Scan'];
      case 'rolls':
        return ['Label ID', 'Code', 'Name', 'Size', 'Status', 'Last Scan'];
      case 'pallets':
        return ['Label ID', 'PLT', 'Quantity', 'Work Order', 'Total', 'Status', 'Last Scan'];
      case 'flight_sessions':
        return ['Session ID', 'Date', 'Time of Day', 'Battery Start', 'Battery End', 'Commands', 'Scans', 'Duration'];
      case 'items_status':
        return ['Label ID', 'Type', 'Status', 'Last Scan', 'Attempts', 'Success Rate', 'Location', 'Days Ago'];
      default:
        return [];
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-blue-600 font-medium">New Scan</span>;
    try {
      const date = new Date(dateString);
      return date
        .toLocaleString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        .replace(',', '');
    } catch (error) {
      return dateString;
    }
  };

  const formatValue = (item, header) => {
    switch (header) {
      // Labels table formatting
      case 'Label ID':
        return item.labelId || item.label_id || '-';
      case 'Label Type':
      case 'Type':
        return item.labelType || item.label_type || '-';
      case 'Location':
        return item.location || item.location_id || '-';
      case 'Status':
        return item.status || '-';
      case 'Last Scan':
        const timestamp = item.lastScanTime || item.last_scan_time;
        return formatDate(timestamp);
      
      // Rolls table formatting
      case 'Code':
        return item.code || '-';
      case 'Name':
        return item.name || '-';
      case 'Size':
        return item.size_mm ? `${item.size_mm} mm` : '-';

      // Pallets table formatting
      case 'PLT':
        return item.pltNumber || item.plt_number || '-';
      case 'Quantity':
        return item.quantity ? item.quantity.toLocaleString() : '-';
      case 'Work Order':
        return item.workOrderId || item.work_order_id || '-';
      case 'Total':
        return item.totalPieces ? item.totalPieces.toLocaleString() : '-';

      // Flight Sessions formatting
      case 'Session ID':
        return item.session_id || '-';
      case 'Date':
        return item.date || '-';
      case 'Time of Day':
        return item.time_of_day || '-';
      case 'Battery Start':
        return item.battery_start ? `${item.battery_start}%` : '-';
      case 'Battery End':
        return item.battery_end ? `${item.battery_end}%` : '-';
      case 'Commands':
        return item.total_commands || '0';
      case 'Scans':
        return `${item.successful_scans || 0}/${item.items_scanned_count || 0}`;
      case 'Duration':
        return `${parseFloat(item.flight_duration || 0).toFixed(2)} min`;

      // Items Status formatting
      case 'Attempts':
        return item.scan_attempts || '0';
      case 'Success Rate':
        if (!item.scan_attempts) return '0%';
        const rate = (item.successful_scans / item.scan_attempts) * 100;
        return `${rate.toFixed(1)}%`;
      case 'Days Ago':
        return item.days_since_last_scan || '0';

      default:
        return '-';
    }
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'checked out':
        return 'bg-blue-100 text-blue-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'unresolved':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return '';
    }
  };

  const formatCell = (value, header, item) => {
    // Special formatting for status cells
    if (header === 'Status') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(value)}`}>
          {value}
        </span>
      );
    }

    // Special formatting for success cells
    if (header === 'Success') {
      const successClass = value === 'Yes' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800';
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${successClass}`}>
          {value}
        </span>
      );
    }

    return value;
  };

  return (
    <div className="export-preview-table-container">
      <table className="export-preview-table">
        <thead>
          <tr>
            {getHeaders().map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {getHeaders().map((header) => (
                <td key={header}>
                  {formatCell(formatValue(item, header), header, item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewTable;