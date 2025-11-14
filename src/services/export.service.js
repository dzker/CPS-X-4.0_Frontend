import { endpoints } from '../config/api.config';
import * as XLSX from 'xlsx';
import moment from 'moment-timezone';

const formatDateTime = (dateString) => {
  if (!dateString) return 'New Scan';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '');
  } catch (error) {
    return dateString;
  }
};

export const exportService = {
  async getPreviewData() {
    try {
      const response = await fetch(endpoints.export.csv);
      if (!response.ok) {
        throw new Error('Failed to fetch preview data');
      }
      const data = await response.json();
      return {
        labels: (data.labels || []).slice(0, 5),
        rolls: (data.rolls || []).slice(0, 5),
        pallets: (data.pallets || []).slice(0, 5),
        flight_sessions: (data.flight_sessions || []).slice(0, 5),
        items_status: (data.items_status || []).slice(0, 5)
      };
    } catch (error) {
      console.error('Preview error:', error);
      throw error;
    }
  },

  async exportToExcel() {
    try {
      const response = await fetch(endpoints.export.csv);
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const data = await response.json();
      const workbook = XLSX.utils.book_new();

      // Flight Sessions Sheet
      const flightSessionsHeaders = [
        'Session ID',
        'Date',
        'Time of Day',
        'Day of Week',
        'Start Time',
        'End Time',
        'Battery Start (%)',
        'Battery End (%)',
        'Total Commands',
        'Items Scanned',
        'Successful Scans',
        'Failed Scans',
        'Flight Duration (min)'
      ];

      const flightSessionsData = (data.flight_sessions || []).map(session => [
        session.session_id,
        session.date,
        session.time_of_day,
        session.day_of_week,
        formatDateTime(session.start_time),
        formatDateTime(session.end_time),
        session.battery_start,
        session.battery_end,
        session.total_commands,
        session.items_scanned_count,
        session.successful_scans,
        session.failed_scans,
        session.flight_duration
      ]);

      const flightSessionsSheet = XLSX.utils.aoa_to_sheet([
        flightSessionsHeaders,
        ...flightSessionsData
      ]);


      // Items Status Sheet
      const itemsStatusHeaders = [
        'Label ID',
        'Label Type',
        'Status',
        'Last Scan Time',
        'Scan Attempts',
        'Successful Scans',
        'Location',
        'Days Since Last Scan'
      ];

      const itemsStatusData = (data.items_status || []).map(item => [
        item.label_id,
        item.label_type,
        item.status,
        formatDateTime(item.last_scan_time),
        item.scan_attempts,
        item.successful_scans,
        item.location_id,
        item.days_since_last_scan
      ]);

      const itemsStatusSheet = XLSX.utils.aoa_to_sheet([
        itemsStatusHeaders,
        ...itemsStatusData
      ]);

      // Original sheets
      const itemHeaders = ['Label ID', 'Label Type', 'Location', 'Status', 'Last Scan'];
      const itemData = (data.labels || []).map(item => [
        item.labelId || '',
        item.labelType || '',
        item.location || '',
        item.status || '',
        formatDateTime(item.lastScanTime)
      ]);
      const itemSheet = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemData]);

      const rollHeaders = ['Label ID', 'Code', 'Name', 'Size (mm)', 'Status', 'Last Scan'];
      const rollData = (data.rolls || []).map(roll => [
        roll.labelId || '',
        roll.code || '',
        roll.name || '',
        roll.size?.toString() || '',
        roll.status || '',
        formatDateTime(roll.lastScanTime)
      ]);
      const rollSheet = XLSX.utils.aoa_to_sheet([rollHeaders, ...rollData]);

      const palletHeaders = [
        'Label ID',
        'PLT',
        'Quantity (pcs)',
        'Work Order ID',
        'Total (pcs)',
        'Status',
        'Last Scan'
      ];
      const palletData = (data.pallets || []).map(pallet => [
        pallet.labelId || '',
        pallet.pltNumber?.toString() || '',
        pallet.quantity?.toString() || '',
        pallet.workOrderId || '',
        pallet.totalPieces?.toString() || '',
        pallet.status || '',
        formatDateTime(pallet.lastScanTime)
      ]);
      const palletSheet = XLSX.utils.aoa_to_sheet([palletHeaders, ...palletData]);

      // Add all sheets to workbook
      XLSX.utils.book_append_sheet(workbook, flightSessionsSheet, 'Flight Sessions');
      XLSX.utils.book_append_sheet(workbook, itemsStatusSheet, 'Items Status');
      XLSX.utils.book_append_sheet(workbook, itemSheet, 'Item');
      XLSX.utils.book_append_sheet(workbook, rollSheet, 'Roll');
      XLSX.utils.book_append_sheet(workbook, palletSheet, 'FG Pallet');

      // Apply sheet styling
      ['Flight Sessions', 'Items Status', 'Item', 'Roll', 'FG Pallet'].forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        
        // Set column widths
        const maxWidth = 20;
        const range = XLSX.utils.decode_range(sheet['!ref']);
        const colWidths = {};
        
        for(let C = range.s.c; C <= range.e.c; ++C) {
          colWidths[C] = maxWidth;
        }
        
        sheet['!cols'] = Object.keys(colWidths).map(width => ({
          wch: colWidths[width]
        }));
      });

      // Generate filename with timestamp
      const timestamp = moment().format('YYYYMMDD_HHmmss');
      const fileName = `CPS_Data_${timestamp}.xlsx`;

      // Write file
      XLSX.writeFile(workbook, fileName);

      return true;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
};