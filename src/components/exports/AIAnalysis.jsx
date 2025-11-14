import React, { useState, useEffect, useRef } from 'react';
import { Battery, ChevronRight, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { analysisService } from '../../services/analysis.service';
import PDFDownload from './PDFDownload';
import '../../assets/styles/components/AIAnalysis.css';

const AIAnalysis = () => {
  const [batteryAnalysis, setBatteryAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 200000);
    return () => clearInterval(interval);

  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const [batteryData] = await Promise.all([
        analysisService.getBatteryEfficiency(),
      ]);
      setBatteryAnalysis(batteryData);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const BatteryEfficiencySection = ({ data }) => {
    if (!data?.timeSeriesData || !data?.metrics) return null;

    const efficiencyGap = (
      Number(data.metrics.avg_actual_rate) -
      Number(data.metrics.avg_recommended_rate)
    ).toFixed(2);

    const processInsights = (analysisText) => {
      const sections = {
        findings: [],
        implications: [],
        recommendations: []
      };

      let currentSection = null;
      const lines = analysisText.split('\n').filter(Boolean);

      lines.forEach(line => {
        if (line.includes('**Findings:**')) {
          currentSection = 'findings';
        } else if (line.includes('**Implications:**')) {
          currentSection = 'implications';
        } else if (line.includes('**Recommendations:**')) {
          currentSection = 'recommendations';
        } else if (currentSection && line.trim()) {
          const cleanedLine = line
            .replace(/^\d+\.\s*\*\*\*/, '')
            .replace(/\*\*/g, '')
            .trim();
          if (cleanedLine) {
            sections[currentSection].push({
              isHeader: line.includes('**') && line.match(/^\d/),
              content: cleanedLine
            });
          }
        }
      });

      return sections;
    };

    const insights = processInsights(data.analysis);

    const renderInsightSection = (title, items) => (
      <div className="insight-section">
        <h3 className="insight-section-title">{title}</h3>
        <div className="insight-section-content">
          {items.map((item, index) => (
            <div
              key={index}
              className={`insight-item ${item.isHeader ? 'insight-header' : 'insight-detail'}`}
            >
              {item.isHeader ? (
                <div className="insight-header-content">
                  <ChevronRight className="insight-icon" />
                  <p><strong>{item.content}</strong></p>
                </div>
              ) : (
                <div className="insight-detail-content">
                  <p>{item.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="battery-analysis-section">
        <div className="battery-metrics-grid">
          <div className="metric-card">
            <h4>Actual Rate</h4>
            <p className="metric-value">{data.metrics.avg_actual_rate}%/s</p>
            <p className="metric-label">consumption rate</p>
          </div>
          <div className="metric-card">
            <h4>Recommended Rate</h4>
            <p className="metric-value">{data.metrics.avg_recommended_rate}%/s</p>
            <p className="metric-label">based on specs</p>
          </div>
          <div className="metric-card">
            <h4>Efficiency Gap</h4>
            <p className={`metric-value ${efficiencyGap < 0 ? 'positive' : 'negative'}`}>
              {efficiencyGap}%
            </p>
            <p className="metric-label">vs recommended</p>
          </div>
        </div>

        <div className="battery-charts-container">
          <div className="chart-wrapper">
            <h4>Battery Level Comparison</h4>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timePoint"
                  label={{ value: 'Time (seconds)', position: 'insideBottomRight', offset: -6}}
                />
                <YAxis
                  label={{ value: 'Battery (%)', angle: -90, position: 'insideLeft' }}
                  domain={[0, 100]}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Actual Consumption"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={true}
                />
                <Line
                  type="monotone"
                  dataKey="Recommended Consumption"
                  stroke="#82ca9d"
                  strokeWidth={3}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analysis-content">
          <div className="insights-container">
            {renderInsightSection('Findings', insights.findings)}
            {renderInsightSection('Implications', insights.implications)}
            {renderInsightSection('Recommendations', insights.recommendations)}
          </div>
        </div>
      </div>
    );
  };
  if (loading) {
    return (
      <div className="analysis-loading">
        <div className="loading-content">
          <Loader2 className="loading-spinner" />
          <p className="loading-text">Generating AI Analysis...</p>
          <div className="loading-progress">
            <div className="loading-bar">
              <div className="loading-bar-fill"></div>
            </div>
            <p className="loading-description">
              This may take a few moments while we analyze your data
            </p>
          </div>
        </div>
      </div>
    );
  }


  if (error) {
    return <div className="analysis-error">Failed to fetch analysis data: {error}</div>;
  }

  return (
    <div className="ai-analysis">
      <div className="analysis-section" ref={contentRef}>
        <div className="section-header">
          <Battery className="section-icon-battery" />
          <h3>Battery Efficiency</h3>
        </div>
        {batteryAnalysis && (
          <BatteryEfficiencySection data={batteryAnalysis} />
        )}
        <div className="download-footer">
          <PDFDownload 
            targetRef={contentRef} 
            filename="battery_efficiency_analysis.pdf"
            batteryData={batteryAnalysis}
          />
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;