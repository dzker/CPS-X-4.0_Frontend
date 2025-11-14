import React, { useState, useEffect } from 'react';
import { 
  Package, 
  RotateCw, 
  LayoutList, 
  X, 
  Eye, 
  Clock, 
  Database 
} from 'lucide-react';
import { exportService } from '../../services/export.service';
import PreviewTable from './PreviewTable';

const ExportDialog = ({ isOpen, onClose, onExport }) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadPreviewData();
    }
  }, [isOpen]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      const data = await exportService.getPreviewData();
      setPreviewData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load preview data');
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const sheetInfo = [
    {
      id: 'flight_sessions',
      title: "Flight Sessions",
      icon: <Clock size={20} />,
      fields: "Session ID, Date, Time Period, Battery Usage, Commands, Scans, Duration"
    },
    {
      id: 'items_status',
      title: "Items Status",
      icon: <Database size={20} />,
      fields: "Label ID, Type, Status, Last Scan, Attempts, Location, Days Since Scan"
    },
    {
      id: 'labels',
      title: "Items",
      icon: <LayoutList size={20} />,
      fields: "Label ID, Type, Location, Status, Time"
    },
    {
      id: 'rolls',
      title: "Roll",
      icon: <RotateCw size={20} />,
      fields: "Label ID, Code, Name, Size, Status, Time"
    },
    {
      id: 'pallets',
      title: "FG Pallet",
      icon: <Package size={20} />,
      fields: "Label ID, PLT, Quantity, Work Order, Total, Status, Time"
    }
  ];

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog export-dialog-with-preview">
        <div className="export-dialog-header">
          <h2>Export to Excel</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="export-dialog-content">
          <p className="export-dialog-description">
            The following sheets will be exported:
          </p>
          <div className="export-sheet-list">
            {sheetInfo.map((sheet) => (
              <div key={sheet.id} className="export-sheet-item">
                <div className="export-sheet-icon">
                  {sheet.icon}
                </div>
                <div className="export-sheet-info">
                  <div className="export-sheet-title">
                    {sheet.title}
                  </div>
                  <div className="export-sheet-fields">
                    {sheet.fields}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPreview(
                    selectedPreview === sheet.id ? null : sheet.id
                  )}
                  className="export-preview-button"
                  disabled={loading || !previewData}
                >
                  <Eye size={16} />
                  Preview
                </button>
              </div>
            ))}
          </div>

          {loading && (
            <div className="export-preview-loading">
              Loading preview data...
            </div>
          )}

          {error && (
            <div className="export-preview-error">
              {error}
            </div>
          )}

          {selectedPreview && previewData && (
            <div className="export-preview-section">
              <h3>Preview - {sheetInfo.find(s => s.id === selectedPreview)?.title}</h3>
              <PreviewTable
                data={previewData[selectedPreview]}
                type={selectedPreview}
              />
              <div className="export-preview-footer">
                Showing {previewData[selectedPreview]?.length || 0} sample records
              </div>
            </div>
          )}
        </div>
        <div className="export-dialog-footer">
          <button
            onClick={onClose}
            className="export-button export-button-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose();
              onExport();
            }}
            className="export-button export-button-primary"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;