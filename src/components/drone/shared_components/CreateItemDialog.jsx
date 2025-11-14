import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Select,
  Alert,
} from "antd";
import { itemService } from "../../../services/item.service";
import { locationService } from "../../../services/location.service";

const CreateItemDialog = ({ isOpen, onClose, item, onCreateItem }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState([]);

  // Fetch locations based on item type
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await locationService.getAllLocations();
        const filteredLocations = response.data.filter((location) =>
          item.type === "Roll"
            ? location.type_name === "Paper Roll Location"
            : location.type_name === "FG Pallet Location"
        );

        setLocations(filteredLocations);
      } catch (err) {
        console.error("Error fetching locations:", err);
        message.error("Failed to load locations");
      }
    };

    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen, item.type]);

  const checkItemExists = async (labelId) => {
    try {
      const data = await itemService.checkItemExists(labelId);
      return data.exists;
    } catch (err) {
      console.error("Error checking item existence:", err);
      throw new Error("Failed to check if item exists");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Check if item exists
      const exists = await checkItemExists(item.label_id);
      if (exists) {
        setError(
          `Item with ID ${item.label_id} already exists in the database`
        );
        return;
      }

      const payload = {
        label_id: item.label_id,
        label_type: item.type,
        location_id: values.location_id,
        details:
          item.type === "Roll"
            ? {
                code: item.label_id,
                name: values.name,
                size_mm: parseInt(values.size_mm),
              }
            : {
                plt_number: parseInt(values.plt_number),
                quantity: parseInt(values.quantity),
                work_order_id: item.work_order,
                total_pieces: parseInt(values.total_pieces),
              },
      };

      const data = await itemService.createItem(payload);
      message.success("Item created successfully");
      onCreateItem(data);
      onClose();
    } catch (err) {
      setError(err.message || "Error creating item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Create New ${item.type}`}
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Create
        </Button>,
      ]}
    >
      {error && (
        <Alert message={error} type="error" showIcon className="mb-4" />
      )}

      <Form form={form} layout="vertical" initialValues={{}}>
        {/* Location Select Dropdown */}
        <Form.Item
          name="location_id"
          label="Location"
          rules={[{ required: true, message: "Please select a location!" }]}
        >
          <Select
            placeholder={`Select ${
              item.type === "Roll" ? "Paper Roll" : "FG"
            } Location`}
            showSearch
            optionFilterProp="children"
          >
            {locations.map((location) => (
              <Select.Option
                key={location.location_id}
                value={location.location_id}
              >
                {location.location_id} - {location.type_name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {item.type === "Roll" ? (
          <>
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Please input the name!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="size_mm"
              label="Size (mm)"
              rules={[
                { required: true, message: "Please input the size!" },
                {
                  type: "number",
                  min: 1,
                  message: "Size must be greater than 0!",
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item
              name="plt_number"
              label="Pallet Number"
              rules={[
                { required: true, message: "Please input the pallet number!" },
                {
                  type: "number",
                  min: 1,
                  message: "Pallet number must be greater than 0!",
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[
                { required: true, message: "Please input the quantity!" },
                {
                  type: "number",
                  min: 1,
                  message: "Quantity must be greater than 0!",
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="total_pieces"
              label="Total Pieces"
              rules={[
                { required: true, message: "Please input the total pieces!" },
                {
                  type: "number",
                  min: 1,
                  message: "Total pieces must be greater than 0!",
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default CreateItemDialog;
