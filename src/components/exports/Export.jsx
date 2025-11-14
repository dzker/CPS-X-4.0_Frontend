
import React, { useEffect, useState } from "react";
import { FileDown, Loader2, Clock, Database, BotIcon } from "lucide-react";
import { exportService } from "../../services/export.service";
import ExportDialog from "./ExportDialog";
import PreviewTable from "./PreviewTable";
import AIAnalysis from "./AIAnalysis";
import "../../assets/styles/components/Export.css";

const Export = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [selectedPreview, setSelectedPreview] = useState('items_status');
    const [selectedTab, setSelectedTab] = useState('analysis');

    useEffect(() => {
        const fetchPreviewData = async () => {
            try {
                setLoading(true);
                const data = await exportService.getPreviewData();
                setPreviewData(data);
            } catch (err) {
                console.error("Preview error:", err);
                setError("Failed to load preview data");
            } finally {
                setLoading(false);
            }
        };
        fetchPreviewData();
    }, []);

    const handleExport = async () => {
        try {
            setLoading(true);
            setError(null);
            await exportService.exportToExcel();
        } catch (err) {
            console.error("Export error:", err);
            setError("Failed to export data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const previewSections = [
        {
            id: 'items_status',
            title: 'Items Status Overview',
            icon: <Database className="w-6 h-6" />,
            description: 'Current status and scan history of all items'
        },
        {
            id: 'flight_sessions',
            title: 'Flight Sessions',
            icon: <Clock className="w-6 h-6" />,
            description: 'Drone flight sessions with performance metrics'
        },
        {
            id: 'labels',
            title: 'Item Overview',
            icon: <FileDown className="w-6 h-6" />,
            description: 'General item information and status'
        }
    ];

    if (loading && !previewData) {
        return (
            <div className="export-loading">
                <Loader2 className="export-loading-spinner w-8 h-8" />
            </div>
        );
    }
    return (
        <div className="export-container">
          {/* Header Section */}
          <div className="export-header">
            <div className="export-title">
              <BotIcon className="w-6 h-6" />
              <h1>Data Analysis</h1>
            </div>
          </div>
    
          {error && <div className="export-error">{error}</div>}
    
          {/* Tab Selection */}
          <div className="export-tabs">
            <button
              className={`export-tab ${selectedTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setSelectedTab('analysis')}
            >
              AI Analysis
            </button>
            <button
              className={`export-tab ${selectedTab === 'preview' ? 'active' : ''}`}
              onClick={() => setSelectedTab('preview')}
            >
              Data Preview
            </button>
          </div>
    
          {/* Content Section */}
          <div className="export-content">
            {selectedTab === 'analysis' ? (
              <AIAnalysis />
            ) : (
              <>
                {/* Preview Section */}
                {previewData && (
                  <div className="export-preview-wrapper">
                    <div className="export-preview-tab-list">
                      {previewSections.map((section) => (
                        <button
                          key={section.id}
                          className={`export-preview-tab ${selectedPreview === section.id ? 'active' : ''}`}
                          onClick={() => setSelectedPreview(section.id)}
                        >
                          {section.icon}
                          <div className="export-preview-tab-content">
                            <span className="export-preview-tab-title">{section.title}</span>
                            <span className="export-preview-tab-description">{section.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
    
                    {/* Preview Content */}
                    <div className="export-preview-content">
                      <div className="export-preview-section">
                        <h3>{previewSections.find(s => s.id === selectedPreview)?.title}</h3>
                        <PreviewTable
                          data={previewData[selectedPreview]}
                          type={selectedPreview}
                        />
                        <div className="export-preview-footer">
                          <span>
                            Showing {previewData[selectedPreview]?.length || 0} records
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
    
                {/* Export Button */}
                <div className="export-footer">
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="export-button export-button-primary"
                  >
                    <FileDown className="w-4 h-4" /> Export to Excel
                  </button>
                </div>
              </>
            )}
          </div>
    
          {/* Export Dialog */}
          <ExportDialog
            isOpen={dialogOpen}
            onClose={() => setDialogOpen(false)}
            onExport={handleExport}
          />
        </div>
      );
    };

export default Export;