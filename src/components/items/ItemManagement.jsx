import React, { useState, useEffect } from "react";
import {
  Package,
  Loader2,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Trash2,
  ChevronRight,
  Edit2,
} from "lucide-react";
import "../../assets/styles/components/ItemManagement.css";
import { itemService } from "../../services/item.service";

const ItemManagement = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    location: "",
  });
  const [sorting, setSorting] = useState({
    field: null,
    direction: "asc",
  });
  const [locations, setLocations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [itemDetails, setItemDetails] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    itemId: null,
    itemLabel: "",
  });
  const [formData, setFormData] = useState({
    label_id: "",
    label_type: "Roll",
    location_id: "",
    details: {
      code: "",
      name: "",
      size_mm: "",
      plt_number: "",
      quantity: "",
      work_order_id: "",
      total_pieces: "",
    },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "",
    location_id: "",
  });

  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsResponse, locationsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/items`),
          fetch(`${API_BASE_URL}/api/locations`),
        ]);

        if (!itemsResponse.ok || !locationsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const itemsData = await itemsResponse.json();
        const locationsData = await locationsResponse.json();

        setItems(itemsData.data);
        setLocations(locationsData.data);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const fetchItemDetails = async (itemId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/items/${itemId}/exists`
      );
      if (!response.ok) throw new Error("Failed to fetch item details");
      const data = await response.json();
      setItemDetails((prev) => ({
        ...prev,
        [itemId]: data.item,
      }));
    } catch (err) {
      console.error("Error fetching item details:", err);
      setError("Failed to fetch item details");
    }
  };

  const handleRowExpand = async (itemId) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(itemId)) {
      newExpandedRows.delete(itemId);
    } else {
      newExpandedRows.add(itemId);
      if (!itemDetails[itemId]) {
        await fetchItemDetails(itemId);
      }
    }
    setExpandedRows(newExpandedRows);
  };

  const getUniqueValues = (field) => {
    return [...new Set(items.map((item) => item[field]))].filter(Boolean);
  };

  const filteredItems = items.filter((item) => {
    return (
      (filters.type === "" || item.label_type === filters.type) &&
      (filters.status === "" || item.status === filters.status) &&
      (filters.location === "" || item.location_id === filters.location)
    );
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sorting.field) return 0;

    let valueA = a[sorting.field];
    let valueB = b[sorting.field];

    if (sorting.field === "last_scan_time") {
      valueA = valueA ? new Date(valueA).getTime() : 0;
      valueB = valueB ? new Date(valueB).getTime() : 0;
    }

    if (valueA < valueB) return sorting.direction === "asc" ? -1 : 1;
    if (valueA > valueB) return sorting.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    setSorting((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const totalItems = sortedItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedItems.slice(startIndex, endIndex);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const PaginationControls = () => {
    return (
      <div className="item-management-pagination">
        <div className="pagination-left">
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="items-per-page-select"
          >
            <option value="10">10 items</option>
            <option value="20">20 items</option>
            <option value="30">30 items</option>
            <option value="40">40 items</option>
            <option value="50">50 items</option>
          </select>
          <span className="showing-text">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
            {totalItems} items
          </span>
        </div>
        <div className="pagination-right">
          <button
            className="page-nav"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;
            return (
              <button
                key={pageNumber}
                onClick={() => handlePageChange(pageNumber)}
                className={`page-number ${
                  currentPage === pageNumber ? "active" : ""
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          <button
            className="page-nav"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      </div>
    );
  };

  const resetForm = () => {
    setFormData({
      label_id: "",
      label_type: "Roll",
      location_id: "",
      details: {
        code: "",
        name: "",
        size_mm: "",
        plt_number: "",
        quantity: "",
        work_order_id: "",
        total_pieces: "",
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("details.")) {
      const detailField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        details: {
          ...prev.details,
          [detailField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Refresh the items list
      const itemsResponse = await fetch(`${API_BASE_URL}/api/items`);
      const itemsData = await itemsResponse.json();
      setItems(itemsData.data);

      // Close the confirmation dialog
      setDeleteConfirm({ isOpen: false, itemId: null, itemLabel: "" });
    } catch (err) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create item");
      }

      const itemsResponse = await fetch(`${API_BASE_URL}/api/items`);
      const itemsData = await itemsResponse.json();
      setItems(itemsData.data);

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error creating item:", err);
      setError("Failed to create item");
    }
  };

  // Handle edit button click
  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      status: item.status,
      location_id: item.location_id,
    });
    setIsEditModalOpen(true);
  };

  // Handle form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editForm.status !== editingItem.status) {
        await itemService.updateItemStatus(
          editingItem.label_id,
          editForm.status
        );
      }

      if (editForm.location_id !== editingItem.location_id) {
        await itemService.updateItemLocation(
          editingItem.label_id,
          editForm.location_id
        );
      }

      // Refresh items list
      const response = await itemService.getAllItems();
      setItems(response.data);

      setIsEditModalOpen(false);
      setEditingItem(null);
      setEditForm({ status: "", location_id: "" });
    } catch (err) {
      setError("Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString)
      return <span className="text-blue-600 font-medium">New Scan</span>;

    try {
      const date = new Date(dateString);
      return date
        .toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(",", "");
    } catch (error) {
      return dateString;
    }
  };

  const renderSortIcon = (field) => {
    if (sorting.field !== field) return null;
    return sorting.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className="item-management-loading">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="item-management-error">{error}</div>;
  }

  return (
    <div className="item-management">
      <div className="item-management-header">
        <div className="item-management-title">
          <Package className="w-6 h-6" />
          <h1>Item Management</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="item-management-button item-management-button-primary"
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      <div className="item-management-filters">
        <select
          value={filters.type}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, type: e.target.value }))
          }
          className="item-management-filter"
        >
          <option value="">All Types</option>
          {getUniqueValues("label_type").map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className="item-management-filter"
        >
          <option value="">All Status</option>
          {getUniqueValues("status").map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filters.location}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, location: e.target.value }))
          }
          className="item-management-filter"
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.location_id} value={loc.location_id}>
              {loc.location_id}
            </option>
          ))}
        </select>
      </div>

      <div className="item-management-table-container">
        <table className="item-management-table">
          <thead>
            <tr>
              <th data-column="expand">EXPAND</th>
              <th data-column="label_id" onClick={() => handleSort("label_id")}>
                <div className="header-content">
                  LABEL ID
                  {renderSortIcon("label_id")}
                </div>
              </th>
              <th data-column="type" onClick={() => handleSort("type")}>
                <div className="header-content">
                  TYPE
                  {renderSortIcon("type")}
                </div>
              </th>
              <th data-column="location" onClick={() => handleSort("location")}>
                <div className="header-content">
                  LOCATION
                  {renderSortIcon("location")}
                </div>
              </th>
              <th data-column="status" onClick={() => handleSort("status")}>
                <div className="header-content">
                  STATUS
                  {renderSortIcon("status")}
                </div>
              </th>
              <th
                data-column="last_scan"
                onClick={() => handleSort("last_scan")}
              >
                <div className="header-content">
                  LAST SCAN
                  {renderSortIcon("last_scan")}
                </div>
              </th>
              <th data-column="actions">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <React.Fragment key={item.label_id}>
                <tr>
                  <td data-column="expand">
                    <button
                      onClick={() => handleRowExpand(item.label_id)}
                      className={`item-management-expand-button ${
                        expandedRows.has(item.label_id) ? "active" : ""
                      }`}
                    >
                      {expandedRows.has(item.label_id) ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                    </button>
                  </td>
                  <td data-column="label_id">{item.label_id}</td>
                  <td data-column="type">{item.label_type}</td>
                  <td data-column="location">{item.location_id}</td>
                  <td data-column="status">
                    <span
                      className={`item-management-status item-management-status-${item.status.replace(
                        " ",
                        "_"
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td data-column="last_scan">
                    {formatDate(item.last_scan_time)}
                  </td>
                  <td data-column="actions">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="item-management-button-icon"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          isOpen: true,
                          itemId: item.label_id,
                          itemLabel: item.label_id,
                        })
                      }
                      className="item-management-button-icon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
                {expandedRows.has(item.label_id) && (
                  <tr>
                    <td colSpan="7" className="item-management-expanded-row">
                      {itemDetails[item.label_id] ? (
                        <div className="item-management-details">
                          {item.label_type === "Roll" ? (
                            <>
                              <p>
                                Name: {itemDetails[item.label_id].details?.name}
                              </p>
                              <p>
                                Size (mm):{" "}
                                {itemDetails[item.label_id].details?.size_mm}
                              </p>
                            </>
                          ) : (
                            <>
                              <p>
                                Pallet Number:{" "}
                                {itemDetails[item.label_id].details?.plt_number}
                              </p>
                              <p>
                                Quantity:{" "}
                                {itemDetails[item.label_id].details?.quantity}
                              </p>
                              <p>
                                Work Order ID:{" "}
                                {
                                  itemDetails[item.label_id].details
                                    ?.work_order_id
                                }
                              </p>
                              <p>
                                Total Pieces:{" "}
                                {
                                  itemDetails[item.label_id].details
                                    ?.total_pieces
                                }
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <p>Loading details...</p>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <PaginationControls />
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="item-management-modal-overlay">
          <div className="item-management-modal">
            <div className="item-management-modal-header">
              <h2>Delete Item</h2>
              <button
                onClick={() =>
                  setDeleteConfirm({
                    isOpen: false,
                    itemId: null,
                    itemLabel: "",
                  })
                }
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="item-management-modal-content">
              <p>
                Are you sure you want to delete item{" "}
                <span className="font-semibold">{deleteConfirm.itemLabel}</span>
                ? This action cannot be undone.
              </p>
              <div className="item-management-modal-footer">
                <button
                  onClick={() =>
                    setDeleteConfirm({
                      isOpen: false,
                      itemId: null,
                      itemLabel: "",
                    })
                  }
                  className="item-management-button item-management-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.itemId)}
                  className="item-management-button item-management-button-primary"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="item-management-modal-overlay">
          <div className="item-management-modal">
            <div className="item-management-modal-header">
              <h2>Edit Item</h2>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="item-management-form">
              <div className="item-management-form-group">
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Checked Out">Checked Out</option>
                  <option value="Lost">Lost</option>
                  <option value="Unresolved">Unresolved</option>
                </select>
              </div>
              <div className="item-management-form-group">
                <label>Location</label>
                <select
                  value={editForm.location_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      location_id: e.target.value,
                    }))
                  }
                  required
                >
                  {locations
                    .filter((loc) =>
                      editingItem?.label_type === "Roll"
                        ? loc.type_name === "Paper Roll Location"
                        : loc.type_name === "FG Pallet Location"
                    )
                    .map((location) => (
                      <option
                        key={location.location_id}
                        value={location.location_id}
                      >
                        {location.location_id} - {location.type_name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="item-management-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="item-management-button item-management-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="item-management-button item-management-button-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isModalOpen && (
        <div className="item-management-modal-overlay">
          <div className="item-management-modal">
            <div className="item-management-modal-header">
              <h2>Add New Item</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="item-management-button item-management-button-secondary"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="item-management-form">
              <div className="item-management-form-grid">
                {/* Label ID */}
                <div className="item-management-form-group">
                  <label htmlFor="label_id">Label ID</label>
                  <input
                    id="label_id"
                    type="text"
                    name="label_id"
                    value={formData.label_id}
                    onChange={handleInputChange}
                    required
                    className="item-management-input"
                  />
                </div>

                {/* Label Type */}
                <div className="item-management-form-group">
                  <label htmlFor="label_type">Label Type</label>
                  <select
                    id="label_type"
                    name="label_type"
                    value={formData.label_type}
                    onChange={handleInputChange}
                    required
                    className="item-management-input"
                  >
                    <option value="Roll">Roll</option>
                    <option value="FG Pallet">FG Pallet</option>
                  </select>
                </div>

                {/* Location */}
                <div className="item-management-form-group">
                  <label htmlFor="location_id">Location</label>
                  <select
                    id="location_id"
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleInputChange}
                    required
                    className="item-management-input"
                  >
                    <option value="">Select Location</option>
                    {locations
                      .filter((loc) =>
                        formData.label_type === "Roll"
                          ? loc.type_name === "Paper Roll Location"
                          : loc.type_name === "FG Pallet Location"
                      )
                      .map((loc) => (
                        <option key={loc.location_id} value={loc.location_id}>
                          {loc.location_id} - {loc.type_name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Conditional Fields */}
                {formData.label_type === "Roll" ? (
                  <>
                    <div className="item-management-form-group">
                      <label htmlFor="name">Name</label>
                      <input
                        id="name"
                        type="text"
                        name="details.name"
                        value={formData.details.name}
                        onChange={handleInputChange}
                        required
                        className="item-management-input"
                      />
                    </div>
                    <div className="item-management-form-group">
                      <label htmlFor="size_mm">Size (mm)</label>
                      <input
                        id="size_mm"
                        type="number"
                        name="details.size_mm"
                        value={formData.details.size_mm}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="item-management-input"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="item-management-form-group">
                      <label htmlFor="plt_number">Pallet Number</label>
                      <input
                        id="plt_number"
                        type="number"
                        name="details.plt_number"
                        value={formData.details.plt_number}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="item-management-input"
                      />
                    </div>
                    <div className="item-management-form-group">
                      <label htmlFor="quantity">Quantity</label>
                      <input
                        id="quantity"
                        type="number"
                        name="details.quantity"
                        value={formData.details.quantity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="item-management-input"
                      />
                    </div>
                    <div className="item-management-form-group">
                      <label htmlFor="total_pieces">Total Pieces</label>
                      <input
                        id="total_pieces"
                        type="number"
                        name="details.total_pieces"
                        value={formData.details.total_pieces}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className="item-management-input"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="item-management-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="item-management-button item-management-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="item-management-button item-management-button-primary"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManagement;
