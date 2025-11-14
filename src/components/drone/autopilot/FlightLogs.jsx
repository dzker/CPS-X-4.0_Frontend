import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  message,
  Tooltip,
  Modal,
  Popconfirm,
} from "antd";
import {
  Star,
  StarOff,
  Edit2,
  Clock,
  Battery,
  Package,
  Trash2,
  Download,
} from "lucide-react";
import moment from "moment-timezone";

const FlightLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/movement-logs");
      const data = await response.json();
      setLogs(data.data);
    } catch (error) {
      message.error("Failed to fetch flight logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleStarLog = async (sessionId, currentStarred) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/movement-logs/${sessionId}/star`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_starred: !currentStarred }),
        }
      );

      if (response.ok) {
        setLogs(
          logs.map((log) =>
            log.session_id === sessionId
              ? { ...log, is_starred: !log.is_starred }
              : log
          )
        );
        message.success("Log updated successfully");
      }
    } catch (error) {
      message.error("Failed to update log");
    }
  };

  const handleRename = async () => {
    if (!editingLog || !editedName.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/movement-logs/${editingLog}/rename`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editedName.trim() }),
        }
      );

      if (response.ok) {
        setLogs(
          logs.map((log) =>
            log.session_id === editingLog
              ? { ...log, name: editedName.trim() }
              : log
          )
        );
        message.success("Log renamed successfully");
        setEditingLog(null);
        setEditedName("");
      }
    } catch (error) {
      message.error("Failed to rename log");
    }
  };

  const handleDelete = async (sessionId) => {
    try {
      // Log the full URL for debugging
      const url = `http://localhost:8080/api/movement-logs/${sessionId}`;
      console.log("Attempting to delete:", url);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Log the response for debugging
      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (response.ok) {
        setLogs(logs.filter((log) => log.session_id !== sessionId));
        message.success("Flight session deleted successfully");
        if (selectedLog?.session_id === sessionId) {
          setDetailsVisible(false);
          setSelectedLog(null);
        }
      } else {
        throw new Error(responseData.message || "Failed to delete session");
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error(`Failed to delete flight session: ${error.message}`);
    }
  };

  const showDetails = (log) => {
    setSelectedLog(log);
    setDetailsVisible(true);
  };

  const formatMovementLogs = (session) => {
    const flightData = session.movements.map((movement) => ({
      action: movement.action,
      timestamp: movement.timestamp,
      battery_level: movement.battery_level,
      ...(movement.distance && { distance: movement.distance }),
    }));

    return {
      flight_data: flightData,
      end_reason: session.end_reason || "normal_landing",
      end_time: session.end_time,
      session_summary: {
        total_commands: session.total_commands,
        start_time: session.start_time,
        battery_start: session.battery_start,
        battery_end: session.battery_end,
        command_breakdown: flightData.reduce((acc, movement) => {
          acc[movement.action] = (acc[movement.action] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  };

  // Function to export movement logs
  const handleExport = (session) => {
    try {
      const formattedData = formatMovementLogs(session);
      const filename = `movement_log_${moment(session.start_time).format(
        "YYYYMMDD_HHmmss"
      )}_${session.end_reason || "normal_landing"}.json`;

      // Create and download the file
      const jsonStr = JSON.stringify(formattedData, null, 4);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success("Movement logs exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Failed to export movement logs");
    }
  };

  const columns = [
    {
      title: "",
      key: "star",
      width: 50,
      render: (_, record) => (
        <Button
          type="text"
          icon={
            record.is_starred ? (
              <Star size={18} fill="#fadb14" />
            ) : (
              <StarOff size={18} />
            )
          }
          onClick={() => handleStarLog(record.session_id, record.is_starred)}
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) =>
        editingLog === record.session_id ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onPressEnter={handleRename}
            onBlur={handleRename}
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-2">
            <span>{text || `Flight Session ${record.session_id}`}</span>
            <Button
              type="text"
              icon={<Edit2 size={16} />}
              onClick={() => {
                setEditingLog(record.session_id);
                setEditedName(text || `Flight Session ${record.session_id}`);
              }}
            />
          </div>
        ),
    },
    {
      title: "Start Time",
      dataIndex: "start_time",
      key: "start_time",
      render: (text) => (
        <Tooltip title={moment(text).format("YYYY-MM-DD HH:mm:ss")}>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            {moment(text).fromNow()}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Duration",
      key: "duration",
      render: (_, record) => {
        const duration = moment.duration(
          moment(record.end_time).diff(moment(record.start_time))
        );
        return `${Math.floor(duration.asMinutes())}m ${Math.floor(
          duration.seconds()
        )}s`;
      },
    },
    {
      title: "Battery Usage",
      key: "battery",
      render: (_, record) => (
        <Tooltip
          title={`Start: ${record.battery_start}%, End: ${record.battery_end}%`}
        >
          <div className="flex items-center gap-2">
            <Battery size={16} />
            {record.battery_start - record.battery_end}%
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Commands",
      key: "commands",
      render: (_, record) => (
        <Tooltip title="Total commands executed">
          <div className="flex items-center gap-2">
            <Package size={16} />
            {record.total_commands}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button type="link" onClick={() => showDetails(record)}>
            View Details
          </Button>
          <Tooltip title="Export Movement Logs">
            <Button
              type="text"
              icon={<Download size={16} />}
              onClick={() => handleExport(record)}
              className="text-blue-600 hover:text-blue-800"
            />
          </Tooltip>
          <Popconfirm
            title="Delete Flight Session"
            description="Are you sure you want to delete this flight session? This action cannot be undone."
            onConfirm={() => handleDelete(record.session_id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" icon={<Trash2 size={16} />} danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const renderMovementDetails = () => {
    if (!selectedLog) return null;

    const movementColumns = [
      {
        title: "Action",
        dataIndex: "action",
        key: "action",
      },
      {
        title: "Time",
        dataIndex: "timestamp",
        key: "timestamp",
        render: (text) => moment(text).format("HH:mm:ss"),
      },
      {
        title: "Battery",
        dataIndex: "battery_level",
        key: "battery_level",
        render: (text) => `${text}%`,
      },
      {
        title: "Distance",
        dataIndex: "distance",
        key: "distance",
        render: (text) => (text ? `${text}cm` : "-"),
      },
    ];

    return (
      <Modal
        title={`Flight Session Details - ${
          selectedLog.name || `Session ${selectedLog.session_id}`
        }`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          <Popconfirm
            key="delete"
            title="Delete Flight Session"
            description="Are you sure you want to delete this flight session? This action cannot be undone."
            onConfirm={() => handleDelete(selectedLog.session_id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<Trash2 size={16} />}>
              Delete Session
            </Button>
          </Popconfirm>,
        ]}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Start Time</p>
              <p>
                {moment(selectedLog.start_time).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Time</p>
              <p>
                {moment(selectedLog.end_time).format("YYYY-MM-DD HH:mm:ss")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Battery Usage</p>
              <p>
                {selectedLog.battery_start}% → {selectedLog.battery_end}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Commands</p>
              <p>{selectedLog.total_commands}</p>
            </div>
          </div>

          <Table
            columns={movementColumns}
            dataSource={selectedLog.movements}
            rowKey={(record) => `${record.timestamp}-${record.action}`}
            pagination={false}
            scroll={{ y: 400 }}
            size="small"
          />
        </div>
      </Modal>
    );
  };

  return (
    <Card title="Flight Logs" className="shadow-md">
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="session_id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} logs`,
        }}
      />
      {renderMovementDetails()}
    </Card>
  );
};

export default FlightLogs;
