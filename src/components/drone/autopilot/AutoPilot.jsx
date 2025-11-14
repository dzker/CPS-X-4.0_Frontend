import React, { useState, useEffect } from "react";
import "../../../styles.css";
import ScannedItemsTable from "../shared_components/ScannedItemTable";
import FlightLogs from "./FlightLogs";
import { Card, Tabs, Select, Button, Tooltip, message } from "antd";
import { Star, StarOff } from "lucide-react";
import moment from "moment-timezone";
import BatteryDashboard from "./BatteryDashboard";

const { TabPane } = Tabs;
const { Option } = Select;

const AutoPilot = () => {
  const [connected, setConnected] = useState(false);
  const [battery, setBattery] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [flightPlanLoaded, setFlightPlanLoaded] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState("");
  const [qrResult, setQrResult] = useState("");
  const [flightPlanPreview, setFlightPlanPreview] = useState(null);
  const [calibrating, setCalibrating] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [flightSessions, setFlightSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isStoppingAutopilot, setIsStoppingAutopilot] = useState(false);
  const [emergencyStopInProgress, setEmergencyStopInProgress] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL;
  const CPS_API_BASE = process.env.REACT_APP_API_BASE_URL;

  // For both DroneInterface.jsx and AutoPilot.jsx

  useEffect(() => {
    fetchFlightSessions();
    const fetchData = async () => {
      try {
        // Fetch drone status
        const statusResponse = await fetch(`${API_BASE}/status`);
        const statusData = await statusResponse.json();
        setConnected(statusData.connected);
        setBattery(statusData.battery);
        setQrResult(statusData.qr_result);

        // Add this check for autopilot status
        if (isExecuting) {
          const autopilotResponse = await fetch(`${API_BASE}/autopilot/status`);
          const autopilotData = await autopilotResponse.json();
          if (!autopilotData.is_executing && isExecuting) {
            setIsExecuting(false);
            setError("Autopilot completed");
            setTimeout(() => setError(""), 3000);
          }
        }

        // Only fetch scanned items if drone is connected
        if (statusData.connected) {
          const scannedItemsResponse = await fetch(`${API_BASE}/scanned-items`);
          const scannedItemsData = await scannedItemsResponse.json();
          setScannedItems(
            scannedItemsData.items.map((item) => ({
              ...item,
              key: item.label_id + item.timestamp,
            }))
          );
        }
      } catch (err) {
        // Only show error message if connected (to avoid spam when disconnected)
        if (connected) {
          message.error("Failed to fetch drone status");
        } else {
          setError(
            "Attempting to connect... Please ensure Tello WiFi is connected."
          );
        }
      }
    };

    // Set up interval for status polling
    const intervalId = setInterval(fetchData, 1000);

    // Cleanup on unmount or when API_BASE changes
    return () => {
      clearInterval(intervalId);
    };
  }, [API_BASE, connected, isExecuting]); // Added 'connected' to dependencies

  // Add this additional effect to handle disconnection
  useEffect(() => {
    if (!connected) {
      // Keep the existing scanned items when disconnected
      // Don't clear them automatically
      setQrResult(""); // Clear QR result when disconnected
      setIsExecuting(false);
      setIsStoppingAutopilot(false);
      setEmergencyStopInProgress(false);
    }
  }, [connected]);

  const fetchFlightSessions = async () => {
    try {
      const response = await fetch(`${CPS_API_BASE}/api/movement-logs`);
      const data = await response.json();
      setFlightSessions(data.data);
    } catch (error) {
      message.error("Failed to fetch flight sessions");
    }
  };

  const handleStarSession = async (sessionId, currentStarred, e) => {
    e.stopPropagation(); // Prevent select dropdown from opening
    try {
      const response = await fetch(
        `${CPS_API_BASE}/api/movement-logs/${sessionId}/star`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_starred: !currentStarred }),
        }
      );

      if (response.ok) {
        setFlightSessions((sessions) =>
          sessions.map((session) =>
            session.session_id === sessionId
              ? { ...session, is_starred: !session.is_starred }
              : session
          )
        );
        message.success("Session updated successfully");
      }
    } catch (error) {
      message.error("Failed to update session");
    }
  };

  const handleSessionSelect = async (sessionId) => {
    if (!sessionId) {
      setSelectedSession(null);
      setFlightPlanLoaded(false);
      setFlightPlanPreview(null);
      return;
    }

    try {
      const response = await fetch(
        `${CPS_API_BASE}/api/movement-logs/${sessionId}`
      );
      const sessionData = await response.json();

      // Transform session data into flight plan format
      const flightPlan = {
        flight_data: sessionData.movements.map((m) => ({
          action: m.action.replace("auto_", ""),
          distance: m.distance,
          timestamp: m.timestamp,
        })),
        session_summary: {
          total_commands: sessionData.total_commands,
          battery_start: sessionData.battery_start,
          battery_end: sessionData.battery_end,
          command_breakdown: sessionData.movements.reduce((acc, m) => {
            const action = m.action.replace("auto_", "");
            acc[action] = (acc[action] || 0) + 1;
            return acc;
          }, {}),
        },
      };

      setSelectedSession(sessionId);
      setFlightPlanPreview(flightPlan);
      setFlightPlanLoaded(true);

      // Upload the flight plan to the drone
      const formData = new FormData();
      const blob = new Blob([JSON.stringify(flightPlan)], {
        type: "application/json",
      });
      formData.append("file", blob, "flight_plan.json");

      const uploadResponse = await fetch(
        `${API_BASE}/autopilot/upload_flight_plan`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();
      if (uploadData.status !== "success") {
        throw new Error(uploadData.message);
      }

      message.success("Flight plan loaded successfully");
    } catch (error) {
      message.error("Failed to load flight session");
      setFlightPlanLoaded(false);
      setFlightPlanPreview(null);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setFlightPlanLoaded(false);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setFlightPlanPreview(data);
        } catch (err) {
          setError("Invalid flight plan file");
        }
      };
      reader.readAsText(file);
    }
  };

  const uploadFlightPlan = async () => {
    if (!selectedFile) {
      setError("Please select a flight plan file");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/autopilot/upload_flight_plan`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.status === "success") {
        setFlightPlanLoaded(true);
        setError("Flight plan loaded successfully");
        setTimeout(() => setError(""), 3000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to upload flight plan");
    }
  };

  const startAutopilot = async () => {
    if (battery < 20) {
      setError("Battery too low for autopilot (minimum 20% required)");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/autopilot/start_autopilot`, {
        method: "POST",
      });

      const data = await response.json();
      if (data.status === "success") {
        setIsExecuting(true);
        setError("Autopilot started");
        setTimeout(() => setError(""), 3000);
      } else {
        setError(data.message);

        setIsExecuting(false);
      }
    } catch (err) {
      setError("Failed to start autopilot");

      setIsExecuting(false);
    }
  };

  const stopAutopilot = async () => {
    if (isExecuting) {
      setIsStoppingAutopilot(true);
      setIsExecuting(false);
      try {
        // First try to stop autopilot gracefully
        const response = await fetch(`${API_BASE}/autopilot/stop_autopilot`, {
          method: "POST",
        });
        const data = await response.json();

        if (data.status === "success") {
          setIsExecuting(false);
          message.success("AutoPilot stopped successfully");
        } else {
          throw new Error("Failed to stop autopilot");
        }
      } catch (err) {
        console.error("Error stopping autopilot:", err);
        message.error(
          "Failed to stop autopilot gracefully, trying emergency stop"
        );
        // If graceful stop fails, try emergency stop
        await emergencyStop();
      } finally {
        setIsStoppingAutopilot(false);
      }
    }
  };

  const calibrateDrone = async () => {
    if (!connected) {
      setError("Drone must be connected to calibrate");
      return;
    }

    try {
      setCalibrating(true);
      setError("Calibrating IMU - Please keep drone stationary...");

      const response = await fetch(`${API_BASE}/calibrate`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setError("Calibration successful");
        setTimeout(() => setError(""), 3000);
      } else {
        setError(data.message || "Calibration failed");
      }
    } catch (err) {
      setError("Calibration failed: " + err.message);
    } finally {
      setCalibrating(false);
    }
  };

  const emergencyStop = async () => {
    setEmergencyStopInProgress(true);
    setIsExecuting(false);
    try {
      // First stop the autopilot execution
      await fetch(`${API_BASE}/autopilot/stop_autopilot`, {
        method: "POST",
      });

      // Then trigger emergency stop
      const response = await fetch(`${API_BASE}/force_emergency`, {
        method: "POST",
      });

      if (response.ok) {
        setIsExecuting(false);
        message.warning("Emergency stop activated");
      } else {
        throw new Error("Failed to execute emergency stop");
      }
    } catch (err) {
      console.error("Emergency stop error:", err);
      message.error("Failed to execute emergency stop");
    } finally {
      setEmergencyStopInProgress(false);
    }
  };

  return (
    <div className="container">
      <Tabs defaultActiveKey="control" className="mb-4">
        <TabPane tab="Drone Control" key="control">
          <div className="dashboard-grid">
            {/* AutoPilot Control Card */}
            <div className="card control-card">
              <div className="card-header">
                <div className="card-title">
                  Tello Drone AutoPilot
                  <div className="status-bar">
                    <span className={connected ? "connected" : "disconnected"}>
                      {connected ? "● Connected" : "○ Disconnected"}
                    </span>
                    <span>Battery: {battery}%</span>
                    {isExecuting && (
                      <span className="executing">● AutoPilot Active</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="autopilot-controls">
                {/* Calibration Section */}
                <div className="calibration-section">
                  <button
                    className={`button calibrate ${
                      calibrating ? "calibrating" : ""
                    }`}
                    onClick={calibrateDrone}
                    disabled={!connected || isExecuting || calibrating}
                  >
                    {calibrating ? "Calibrating..." : "Calibrate IMU"}
                  </button>
                  <div className="calibration-note">
                    Note: Calibrate before starting AutoPilot for better
                    stability
                  </div>
                </div>

                {/* Flight Session Selection */}
                <div className="session-selection">
                  <h3 className="text-lg font-semibold mb-2">
                    Load Flight Session
                  </h3>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Select a flight session"
                    onChange={handleSessionSelect}
                    value={selectedSession}
                    disabled={!connected || isExecuting}
                    optionLabelProp="label"
                  >
                    <Option value="" label="Upload New Flight Plan">
                      <div className="flex items-center justify-between">
                        Upload New Flight Plan
                      </div>
                    </Option>
                    {flightSessions
                      .sort(
                        (a, b) =>
                          b.is_starred - a.is_starred ||
                          moment(b.start_time).diff(moment(a.start_time))
                      )
                      .map((session) => (
                        <Option
                          key={session.session_id}
                          value={session.session_id}
                          label={
                            session.name ||
                            `Flight Session ${session.session_id}`
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              {session.name ||
                                `Flight Session ${session.session_id}`}
                              <span className="text-gray-400 ml-2 text-sm">
                                (
                                {moment(session.start_time).format(
                                  "MMM D, HH:mm"
                                )}
                                )
                              </span>
                            </div>
                            <Tooltip
                              title={
                                session.is_starred
                                  ? "Remove from starred"
                                  : "Add to starred"
                              }
                            >
                              <Button
                                type="text"
                                icon={
                                  session.is_starred ? (
                                    <Star size={16} fill="#fadb14" />
                                  ) : (
                                    <StarOff size={16} />
                                  )
                                }
                                onClick={(e) =>
                                  handleStarSession(
                                    session.session_id,
                                    session.is_starred,
                                    e
                                  )
                                }
                              />
                            </Tooltip>
                          </div>
                        </Option>
                      ))}
                  </Select>
                </div>

                {/* File Upload Section (show only when no session is selected) */}
                {!selectedSession && (
                  <div className="file-upload">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      disabled={!connected || isExecuting}
                    />
                    <button
                      className="button"
                      onClick={uploadFlightPlan}
                      disabled={!selectedFile || !connected || isExecuting}
                    >
                      Upload Flight Plan
                    </button>
                  </div>
                )}

                {/* Execution Controls */}
                <div className="execution-controls">
                  <button
                    className={`button ${isExecuting ? "danger" : "primary"}`}
                    onClick={isExecuting ? stopAutopilot : startAutopilot}
                    disabled={!connected || !flightPlanLoaded}
                  >
                    {isExecuting ? "Stop AutoPilot" : "Start AutoPilot"}
                  </button>
                </div>

                {/* Emergency Stop Button */}
                <button
                  className="button danger force-emergency"
                  onClick={emergencyStop}
                  disabled={!connected}
                >
                  Force Emergency Stop
                </button>

                {/* Flight Plan Preview */}
                {flightPlanPreview && (
                  <div className="flight-plan-preview">
                    <h3>Flight Plan Preview</h3>
                    <div className="preview-content">
                      <p>
                        Total Commands:{" "}
                        {flightPlanPreview.session_summary.total_commands}
                      </p>
                      <p>
                        Battery Required:{" "}
                        {flightPlanPreview.session_summary.battery_start -
                          flightPlanPreview.session_summary.battery_end}
                        %
                      </p>
                      <p>Commands:</p>
                      <div className="command-list">
                        {Object.entries(
                          flightPlanPreview.session_summary.command_breakdown
                        ).map(([command, count]) => (
                          <div key={command} className="command-item">
                            {command}: {count}x
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Camera Feed Card */}
            <div className="card camera-card">
              <div className="card-header">
                <h2 className="card-title">Drone Camera Feed</h2>
              </div>
              <div className="video-feed">
                {connected ? (
                  <img src={`${API_BASE}/video_feed`} alt="Drone camera feed" />
                ) : (
                  <div className="placeholder">Camera feed unavailable</div>
                )}
              </div>
            </div>

            {/* QR Result Card */}
            <Card
              title="QR Code and Barcode Detection"
              className="qr-result-card"
            >
              <div className="qr-result">
                {qrResult ? (
                  <div className="qr-content">
                    <pre>{qrResult}</pre>
                  </div>
                ) : (
                  "No QR code detected"
                )}
              </div>
            </Card>

            {/* Scanned Items History Card */}
            <Card
              title="Scanned Items History"
              className="scanned-items-card"
              style={{ marginTop: "1rem" }}
            >
              <ScannedItemsTable items={scannedItems} />
            </Card>
          </div>

          {/* Error/Status Messages */}
          {error && (
            <div
              className={`alert ${
                error.includes("success")
                  ? "success"
                  : error.includes("Calibrating")
                  ? "info"
                  : error.includes("EMERGENCY")
                  ? "emergency"
                  : "error"
              }`}
            >
              {error}
            </div>
          )}
        </TabPane>

        <TabPane tab="Flight Logs" key="logs">
          <FlightLogs />
        </TabPane>
        <TabPane tab="Battery Analytics" key="battery">
          <BatteryDashboard />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AutoPilot;
