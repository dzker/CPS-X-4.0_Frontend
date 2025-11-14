import React, { useState } from "react";
import { Table, Button, Tag, Modal, message, notification } from "antd";
import { WarningOutlined, CheckCircleOutlined } from "@ant-design/icons";
import CreateItemDialog from "./CreateItemDialog";

const ScannedItemsTable = ({ items }) => {
  console.log("Received items:", items);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateConfirmVisible, setUpdateConfirmVisible] = useState(false);
  const [itemToUpdate, setItemToUpdate] = useState(null);

  const handleCreateItem = (createdItem) => {
    const updatedItems = items.map((item) =>
      item.label_id === createdItem.data.label_id
        ? { ...item, exists: true }
        : item
    );

    if (typeof window !== "undefined" && window.updateScannedItems) {
      window.updateScannedItems(updatedItems);
    }
  };

  const showUpdateConfirm = (record) => {
    setItemToUpdate(record);
    setUpdateConfirmVisible(true);
  };

  const handleUpdateLocation = async () => {
    if (!itemToUpdate) return;

    try {
      setUpdating(true);
      const response = await fetch(
        `http://localhost:8080/api/items/${itemToUpdate.label_id}/location`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location_id: itemToUpdate.current_location,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "INCOMPATIBLE_LOCATION") {
          notification.error({
            message: "Invalid Location Type",
            description: `Cannot move ${data.details.itemType} to ${data.details.locationType}. 
                         This item can only be moved to ${data.details.expectedType}.`,
            icon: <WarningOutlined style={{ color: "#ef4444" }} />,
            placement: "topRight",
            duration: 4.5,
          });
        } else {
          throw new Error(data.message || "Failed to update location");
        }
        return;
      }

      notification.success({
        message: "Location Updated Successfully",
        description: `Item ${itemToUpdate.label_id} has been moved from ${itemToUpdate.past_location} to ${itemToUpdate.current_location}`,
        icon: <CheckCircleOutlined style={{ color: "#22c55e" }} />,
        placement: "topRight",
        duration: 4.5,
      });

      // Update the items list to reflect the change
      const updatedItems = items.map((item) =>
        item.label_id === itemToUpdate.label_id
          ? {
              ...item,
              past_location: item.current_location,
            }
          : item
      );

      if (typeof window !== "undefined" && window.updateScannedItems) {
        window.updateScannedItems(updatedItems);
      }
    } catch (error) {
      console.error("Error updating location:", error);
      notification.error({
        message: "Failed to Update Location",
        description:
          error.message ||
          "There was an error updating the item location. Please try again.",
        icon: <WarningOutlined style={{ color: "#ef4444" }} />,
        placement: "topRight",
        duration: 4.5,
      });
    } finally {
      setUpdating(false);
      setUpdateConfirmVisible(false);
      setItemToUpdate(null);
    }
  };

  const processedItems = items.map((item) => {
    console.log("Processing item:", item);
    return {
      key: item.label_id + (item.timestamp || ""),
      timestamp: item.timestamp || "",
      label_id: item.label_id || "",
      work_order: item.work_order || "",
      type: item.type || "",
      current_location: item.current_location || "N/A",
      past_location: item.past_location || "N/A",
      exists: !!item.exists,
      correct_location: item.correct_location ?? true,
      needs_location_update:
        item.current_location !== "N/A" &&
        item.past_location !== "N/A" &&
        item.current_location !== item.past_location,
    };
  });

  const columns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      width: "15%",
    },
    {
      title: "Label ID",
      dataIndex: "label_id",
      key: "label_id",
      width: "15%",
    },
    {
      title: "Work Order",
      dataIndex: "work_order",
      key: "work_order",
      width: "15%",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: "10%",
      render: (type) => (
        <Tag color={type === "Roll" ? "blue" : "purple"}>
          {type || "Unknown"}
        </Tag>
      ),
    },
    {
      title: "Current Location",
      dataIndex: "current_location",
      key: "current_location",
      width: "15%",
      render: (text, record) => (
        <span>
          {text || "N/A"}
          {record.correct_location === false && (
            <Tag color="red" style={{ marginLeft: "8px" }}>
              Wrong Rack
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: "Past Location",
      dataIndex: "past_location",
      key: "past_location",
      width: "15%",
      render: (text) => text || "N/A",
    },
    {
      title: "Status",
      dataIndex: "exists",
      key: "exists",
      width: "10%",
      render: (exists) => (
        <Tag color={exists ? "success" : "error"}>
          {exists ? "Found" : "Not Found"}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: "15%",
      render: (_, record) => {
        if (!record.exists) {
          return (
            <Button
              type="primary"
              onClick={() => {
                setSelectedItem(record);
                setIsDialogOpen(true);
              }}
              style={{ backgroundColor: "#22c55e" }}
            >
              Create
            </Button>
          );
        } else if (record.needs_location_update) {
          return (
            <Button
              type="primary"
              onClick={() => showUpdateConfirm(record)}
              loading={updating && itemToUpdate?.label_id === record.label_id}
              style={{ backgroundColor: "#3b82f6" }}
            >
              Update Location
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={processedItems}
        pagination={false}
        scroll={{ y: 400 }}
        size="middle"
      />

      {selectedItem && (
        <CreateItemDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onCreateItem={handleCreateItem}
        />
      )}

      <Modal
        title="Update Location"
        open={updateConfirmVisible}
        onOk={handleUpdateLocation}
        onCancel={() => {
          setUpdateConfirmVisible(false);
          setItemToUpdate(null);
        }}
        confirmLoading={updating}
      >
        <p>
          Are you sure you want to update the location of item{" "}
          <strong>{itemToUpdate?.label_id}</strong> from{" "}
          <strong>{itemToUpdate?.past_location}</strong> to{" "}
          <strong>{itemToUpdate?.current_location}</strong>?
        </p>
      </Modal>
    </>
  );
};

export default ScannedItemsTable;
