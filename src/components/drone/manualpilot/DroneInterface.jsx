import React, { useState, useEffect } from "react";
import "../../../styles.css";
import ScannedItemsTable from "../shared_components/ScannedItemTable";
import { Card } from "antd";

const DroneInterface = () => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [battery, setBattery] = useState(0);
  const [qrResult, setQrResult] = useState("");
  const [error, setError] = useState("");
  const [calibrating, setCalibrating] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);

  // Distance states for each direction
  const [distances, setDistances] = useState({
    up: "40",
    down: "40",
    left: "40",
    right: "40",
    forward: "40",
    back: "40",
    rotate_left: "90",
    rotate_right: "90",
  });

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Validation function for distances
  const validateDistance = (value, isRotation = false) => {
    const num = parseInt(value);
    if (isRotation) {
      return !isNaN(num) && num > 0 && num <= 360 && num % 90 === 0;
    }
    return !isNaN(num) && num > 0 && num <= 100 && num % 5 === 0;
  };

  // Handle distance input change
  const handleDistanceChange = (direction, value) => {
    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setDistances((prev) => ({
        ...prev,
        [direction]: value,
      }));
    }
  };

  // Handle distance input blur (for validation)
  const handleDistanceBlur = (direction) => {
    const value = distances[direction];
    const isRotation = direction.startsWith("yaw_");
    const defaultValue = isRotation ? "90" : "20";

    if (value === "") {
      setDistances((prev) => ({ ...prev, [direction]: "40" })); // Default value
      return;
    }

    const num = parseInt(value);
    if (!validateDistance(num, isRotation)) {
      setError(
        isRotation
          ? `Invalid rotation for ${direction}. Must be a multiple of 90 and not exceed 360`
          : `Invalid distance for ${direction}. Must be a multiple of 5 and not exceed 100`
      );
      setDistances((prev) => ({ ...prev, [direction]: "40" })); // Reset to default
      setTimeout(() => setError(""), 3000);
    }
  };

  // For both DroneInterface.jsx and AutoPilot.jsx

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch drone status
        const statusResponse = await fetch(`${API_BASE}/status`);
        const statusData = await statusResponse.json();
        setConnected(statusData.connected);
        setBattery(statusData.battery);
        setQrResult(statusData.qr_result);

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
          // message.error("Failed to fetch drone status");
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
  }, [API_BASE, connected]); // Added 'connected' to dependencies

  // Add this additional effect to handle disconnection
  useEffect(() => {
    if (!connected) {
      // Keep the existing scanned items when disconnected
      // Don't clear them automatically
      setQrResult(""); // Clear QR result when disconnected
    }
  }, [connected]);

  const handleConnect = async () => {
    setConnecting(true);
    setError("Attempting to connect... Please ensure Tello WiFi is connected.");

    try {
      const response = await fetch(`${API_BASE}/connect`, { method: "POST" });
      const data = await response.json();

      if (data.status === "connected") {
        setConnected(true);
        setError("Connection successful!");
        setTimeout(() => setError(""), 3000);
      } else {
        throw new Error("Connection failed");
      }
    } catch (err) {
      setError("Failed to connect to drone. Please check WiFi connection.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch(`${API_BASE}/disconnect`, { method: "POST" });
      setConnected(false);
      setError("Disconnected successfully");
      setTimeout(() => setError(""), 3000);
    } catch (err) {
      setError("Failed to disconnect from drone");
    }
  };

  const sendCommand = async (cmd) => {
    try {
      const url = new URL(`${API_BASE}/command/${cmd}`);

      // Add distance parameter for movement commands
      if (!["takeoff", "land", "emergency"].includes(cmd)) {
        url.searchParams.append("distance", distances[cmd]);
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "error") {
        setError(data.message);
      } else {
        setError("");
      }
    } catch (err) {
      setError(`Failed to execute command: ${cmd}`);
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

  const forceEmergencyStop = async () => {
    try {
      await fetch(`${API_BASE}/force_emergency`, { method: "POST" });
      setError("EMERGENCY STOP ACTIVATED");
    } catch (err) {
      setError("Failed to execute emergency stop");
    }
  };

  const saveLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/save_logs`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.status === "success") {
        setError("Logs saved successfully!");
        setTimeout(() => setError(""), 3000);
      } else {
        setError(data.message || "Failed to save logs");
      }
    } catch (err) {
      setError("Failed to save logs: " + err.message);
    }
  };

  const renderDistanceInput = (direction) => (
    <input
      type="text"
      className="distance-input"
      value={distances[direction]}
      onChange={(e) => handleDistanceChange(direction, e.target.value)}
      onBlur={() => handleDistanceBlur(direction)}
      disabled={!connected}
      placeholder="Distance"
      title="Enter a multiple of 5 (max 100)"
    />
  );

  return (
    <div className="container">
      <div className="dashboard-grid">
        {/* Control Card */}
        <div className="card control-card">
          <div className="card-header">
            <div className="card-title">
              Tello Drone Control
              <div className="status-bar">
                <span className={connected ? "connected" : "disconnected"}>
                  {connected
                    ? "● Connected"
                    : connecting
                    ? "◌ Connecting..."
                    : "○ Disconnected"}
                </span>
                <span>Battery: {battery}%</span>
              </div>
            </div>
          </div>

          <div className="button-container">
            <div className="connection-controls">
              <button
                className={`button ${connected ? "danger" : ""} ${
                  connecting ? "connecting" : ""
                }`}
                onClick={connected ? handleDisconnect : handleConnect}
                disabled={connecting}
              >
                {connecting
                  ? "Connecting..."
                  : connected
                  ? "Disconnect"
                  : "Connect"}
              </button>
              <button
                className={`button calibrate ${
                  calibrating ? "calibrating" : ""
                }`}
                onClick={calibrateDrone}
                disabled={!connected || calibrating}
              >
                {calibrating ? "Calibrating..." : "Calibrate IMU"}
              </button>
            </div>

            <div className="controls">
              <div></div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("takeoff")}
                  disabled={!connected}
                >
                  Take Off
                </button>
              </div>
              <div></div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("left")}
                  disabled={!connected}
                >
                  Left
                </button>
                {renderDistanceInput("left")}
              </div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("up")}
                  disabled={!connected}
                >
                  Up
                </button>
                {renderDistanceInput("up")}
              </div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("right")}
                  disabled={!connected}
                >
                  Right
                </button>
                {renderDistanceInput("right")}
              </div>
              <div></div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("down")}
                  disabled={!connected}
                >
                  Down
                </button>
                {renderDistanceInput("down")}
              </div>
              <div></div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("forward")}
                  disabled={!connected}
                >
                  Forward
                </button>
                {renderDistanceInput("forward")}
              </div>
              <div></div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("back")}
                  disabled={!connected}
                >
                  Back
                </button>
                {renderDistanceInput("back")}
              </div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("rotate_left")}
                  disabled={!connected}
                >
                  Rotate Left
                </button>
                {renderDistanceInput("rotate_left")}
              </div>
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("land")}
                  disabled={!connected}
                >
                  Land
                </button>
              </div>{" "}
              <div className="direction-control">
                <button
                  className="button"
                  onClick={() => sendCommand("rotate_right")}
                  disabled={!connected}
                >
                  Rotate Right
                </button>
                {renderDistanceInput("rotate_right")}
              </div>
              <div></div>
            </div>

            <button
              className="button"
              onClick={saveLogs}
              disabled={!connected}
              style={{ backgroundColor: "#2ecc71" }}
            >
              Save Movement Logs
            </button>

            <button
              className="button danger force-emergency"
              onClick={forceEmergencyStop}
              disabled={!connected}
            >
              Force Emergency Stop
            </button>
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
        <Card title="QR Code and Barcode Detection" className="qr-result-card">
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

      {/* Force Emergency Stop */}
      {/* <button
        className="button danger force-emergency"
        onClick={forceEmergencyStop}
        disabled={!connected}
      >
        FORCE EMERGENCY STOP
      </button> */}

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
    </div>
  );
};

export default DroneInterface;
