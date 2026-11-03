import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  BedDouble,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCw,
  DoorOpen,
  DollarSign,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  KeyRound,
} from "lucide-react";

function Rooms() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();
  const isAdmin = admin?.role === "Super Admin" || admin?.role === "Admin";
  const [rooms, setRooms] = useState([]);
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("Single");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("Available");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch rooms from backend
  async function fetchRooms() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/rooms");
      const records = response.data?.data || response.data || [];

      setRooms(
        records.map((room) => ({
          ...room,
          id: room._id,
          price: room.pricePerNight,
          status: room.status === "Occupied" ? "Booked" : room.status || "Available",
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Unable to connect to the server"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRooms();
  }, []);

  function resetForm() {
    setRoomNumber("");
    setRoomType("Single");
    setPrice("");
    setStatus("Available");
    setEditingId(null);
    setIsFormOpen(false);
  }

  // Add or update room
  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin) {
      toast.error("Access Restricted: Only Administrators can configure rooms and modify pricing.", "Permission Denied");
      return;
    }

    const trimmedRoomNumber = roomNumber.trim();
    const numericPrice = Number(price);

    if (!trimmedRoomNumber || price === "" || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.warning("Please enter a valid room number and positive price per night.", "Missing Information");
      return;
    }

    const duplicateRoom = rooms.some(
      (room) => room.roomNumber === trimmedRoomNumber && room.id !== editingId
    );

    if (duplicateRoom) {
      toast.error("This room number already exists in your inventory.", "Duplicate Room");
      return;
    }

    const calculatedCapacity =
      roomType === "Single" ? 1 : roomType === "Suite" ? 4 : 2;

    const roomData = {
      roomNumber: trimmedRoomNumber,
      roomType,
      pricePerNight: numericPrice,
      capacity: calculatedCapacity,
      status: status === "Booked" ? "Occupied" : status,
    };

    try {
      setError("");

      if (editingId !== null) {
        await api.put(`/rooms/${editingId}`, roomData);
        toast.success(`Room #${trimmedRoomNumber} has been updated.`, "Room Updated");
      } else {
        await api.post("/rooms", roomData);
        toast.success(`Room #${trimmedRoomNumber} has been added to catalog.`, "Room Created");
      }

      resetForm();
      await fetchRooms();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Operation failed";
      setError(msg);
      toast.error(msg, "Error Saving Room");
    }
  }

  function handleEditRoom(room) {
    setRoomNumber(room.roomNumber);
    setRoomType(room.roomType);
    setPrice(String(room.price || ""));
    setStatus(room.status);
    setEditingId(room.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Quick status change for Admin directly from table
  async function handleQuickStatusChange(roomId, newStatus) {
    if (!isAdmin) {
      toast.error("Access Restricted: Only Administrators can modify room status directly.", "Permission Denied");
      return;
    }
    const backendStatus = newStatus === "Booked" ? "Occupied" : newStatus;
    try {
      await api.put(`/rooms/${roomId}`, { status: backendStatus });
      toast.success(`Room status updated to ${newStatus}.`, "Status Updated");
      await fetchRooms();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update room status";
      toast.error(msg, "Status Update Failed");
    }
  }

  async function handleDeleteRoom(id) {
    if (!isAdmin) {
      toast.warning("Only an Administrator can delete rooms.", "Access Restricted");
      return;
    }

    const targetRoom = rooms.find((r) => r.id === id);
    const roomLabel = targetRoom ? `Room #${targetRoom.roomNumber}` : "this room";

    const ok = await confirm({
      title: "Delete Room",
      message: `Are you sure you want to permanently delete ${roomLabel} from the hotel catalog? This action cannot be undone.`,
      confirmText: "Yes, Delete Room",
      cancelText: "Keep Room",
      type: "danger",
    });

    if (!ok) return;

    try {
      setError("");
      await api.delete(`/rooms/${id}`);
      if (editingId === id) resetForm();
      await fetchRooms();
      toast.success(`${roomLabel} has been permanently deleted.`, "Room Removed");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unable to delete room";
      setError(msg);
      toast.error(msg, "Error Deleting Room");
    }
  }

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchSearch =
        room.roomNumber.toLowerCase().includes(search.toLowerCase().trim()) ||
        room.roomType.toLowerCase().includes(search.toLowerCase().trim());
      const matchType = typeFilter === "All" || room.roomType === typeFilter;
      const matchStatus = statusFilter === "All" || room.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [rooms, search, typeFilter, statusFilter]);

  // Statistics
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;
  const bookedRooms = rooms.filter((r) => r.status === "Booked" || r.status === "Occupied").length;
  const maintenanceRooms = rooms.filter((r) => r.status === "Maintenance").length;

  return (
    <div className="synaptix-dashboard-root">
      {/* Page Header */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="ai-active-pill">
            <DoorOpen className="spark-icon" />
            <span>ROOMS & PRICING</span>
          </div>
          <h1 className="welcome-title">Hotel Rooms Catalog</h1>
          <p className="welcome-subtitle">
            View all hotel rooms, manage nightly prices, and update availability status.
          </p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchRooms}
            title="Refresh room list"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isAdmin ? (
            <button
              type="button"
              onClick={() => {
                if (isFormOpen && editingId === null) {
                  setIsFormOpen(false);
                } else {
                  resetForm();
                  setIsFormOpen(true);
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "12px",
                background: "var(--primary-gradient)",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              {isFormOpen ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close Form</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Room</span>
                </>
              )}
            </button>
          ) : (
            <div
              className="synaptix-ghost-pill"
              style={{
                opacity: 0.9,
                cursor: "default",
                border: "1px solid var(--border-subtle)",
                fontSize: "12px",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "9999px",
                color: "var(--accent)",
              }}
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Catalog View (Price Edits Admin Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Glowing Synaptix Cards) */}
      <div className="synaptix-kpi-grid">
        {/* Total Rooms */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <DoorOpen className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL ROOMS</span>
          <div className="stat-main-number">{totalRooms}</div>
          <div className="stat-growth-tag positive">
            <span>Configured inventory</span>
          </div>
        </div>

        {/* Available Now */}
        <div className="synaptix-stat-card glow-emerald">
          <div className="card-top-spark">
            <div className="stat-symbol emerald">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="sparkline-mini emerald">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 14 Q 20 18, 40 6 T 78 8" stroke="#34D399" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">AVAILABLE NOW</span>
          <div className="stat-main-number">{availableRooms}</div>
          <div className="stat-growth-tag positive">
            <span>Ready for guest check-in</span>
          </div>
        </div>

        {/* Booked / Occupied */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <BedDouble className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">BOOKED / OCCUPIED</span>
          <div className="stat-main-number">{bookedRooms}</div>
          <div className="stat-growth-tag positive">
            <span>Staying with active tokens</span>
          </div>
        </div>

        {/* Maintenance */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <Layers className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 16 Q 20 5, 40 18 T 78 2" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">MAINTENANCE</span>
          <div className="stat-main-number">{maintenanceRooms}</div>
          <div className="stat-growth-tag positive">
            <span>Under service / cleaning</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#F87171", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Floating / Collapsible Form Card (Admin Only) */}
      {isAdmin && isFormOpen && (
        <div className="synaptix-main-card" style={{ marginBottom: "24px" }}>
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">{editingId !== null ? "EDIT ROOM" : "NEW ROOM"}</span>
              <h3 className="card-title-light">{editingId !== null ? "Edit Room Details" : "Create New Room"}</h3>
              <p className="card-desc-muted">Fill out room information to update the live booking catalog.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="synaptix-form-grid">
            <div className="desk-input-field">
              <label>Room Number *</label>
              <div className="input-wrap">
                <DoorOpen className="w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  placeholder="e.g. 101, 204A, V-1"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Room Type *</label>
              <div className="input-wrap">
                <BedDouble className="w-4 h-4 text-purple-400" />
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <option value="Single">Single Room (1 Guest)</option>
                  <option value="Double">Double Room (2 Guests)</option>
                  <option value="Deluxe">Deluxe Room (3 Guests)</option>
                  <option value="Suite">Presidential Suite (4 Guests)</option>
                </select>
              </div>
            </div>

            <div className="desk-input-field">
              <label>Price Per Night (₹) *</label>
              <div className="input-wrap">
                <DollarSign className="w-4 h-4 text-purple-400" />
                <input
                  type="number"
                  placeholder="e.g. 2500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Room Status</label>
              <div className="input-wrap">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked / Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                className="synaptix-ghost-pill"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  background: "var(--primary-gradient)",
                  color: "#FFFFFF",
                  border: "none",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                }}
              >
                {editingId !== null ? "Update Room" : "Save Room to Catalog"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar: Search & Multi-Filters Card (Compact 3-Column Grid) */}
      <div className="synaptix-toolbar-card rooms-catalog-toolbar">
        {/* Column 1: Search */}
        <div className="synaptix-search-input-wrap">
          <Search className="search-icon w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by room number or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
            >
              ×
            </button>
          )}
        </div>

        {/* Column 2: Room Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="synaptix-select"
        >
          <option value="All">All Room Types</option>
          <option value="Single">Single Room</option>
          <option value="Double">Double Room</option>
          <option value="Deluxe">Deluxe Room</option>
          <option value="Suite">Presidential Suite</option>
        </select>

        {/* Column 3: Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="synaptix-select"
        >
          <option value="All">All Statuses</option>
          <option value="Available">🟢 Available</option>
          <option value="Booked">🟣 Booked / Occupied</option>
          <option value="Maintenance">🟠 Maintenance</option>
        </select>
      </div>

      {/* Main Table Card */}
      <div className="synaptix-main-card">
        <div className="card-header-clean">
          <div>
            <span className="card-pretitle">ACCOMMODATION ROSTER</span>
            <h3 className="card-title-light">Rooms Catalog ({filteredRooms.length})</h3>
            <p className="card-desc-muted">Real-time room occupancy, pricing tiers and amenity status.</p>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="desktop-table-view">
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="synaptix-data-table">
              <thead>
                <tr>
                  <th>Room #</th>
                  <th>Category</th>
                  <th>Price / Night</th>
                  <th>Capacity</th>
                  <th>Current Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
                        <RotateCw className="w-5 h-5 animate-spin text-purple-400" />
                        <span>Loading rooms inventory...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                      <BedDouble className="w-10 h-10 text-purple-400 opacity-50 mx-auto mb-2" />
                      <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0" }}>No rooms match your criteria</h4>
                      <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "12px" }}>Try modifying your search or add a new room above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room) => (
                    <tr key={room.id}>
                      <td>
                        <span className="room-number-pill" style={{ fontSize: "14px", padding: "4px 10px", background: "var(--bg-card-inner)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                          #{room.roomNumber}
                        </span>
                      </td>
                      <td>
                        <span className="room-type-chip" style={{ fontSize: "11px" }}>
                          {room.roomType} Room
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: "700", color: "var(--accent)", fontSize: "14px" }}>
                          ₹{room.price?.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
                          {room.capacity || (room.roomType === "Single" ? 1 : 2)} Guest(s)
                        </span>
                      </td>
                      <td>
                        {isAdmin ? (
                          <select
                            value={room.status}
                            onChange={(e) => handleQuickStatusChange(room.id, e.target.value)}
                            style={{
                              background: "var(--bg-card-inner)",
                              border: "1.5px solid var(--border-subtle)",
                              borderRadius: "8px",
                              padding: "4px 8px",
                              color:
                                room.status === "Available"
                                  ? "#34D399"
                                  : room.status === "Maintenance"
                                  ? "#FB923C"
                                  : "#C084FC",
                              fontSize: "12px",
                              fontWeight: "700",
                              cursor: "pointer",
                              outline: "none",
                            }}
                            title="Admin: Click to change room status"
                          >
                            <option value="Available">🟢 Available</option>
                            <option value="Booked">🟣 Booked</option>
                            <option value="Maintenance">🟠 Maintenance</option>
                          </select>
                        ) : (
                          <span
                            className={`status-pill status-${
                              room.status === "Available"
                                ? "confirmed"
                                : room.status === "Maintenance"
                                ? "pending"
                                : "checked-in"
                            }`}
                          >
                            {room.status}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isAdmin ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <button
                              type="button"
                              className="btn-action-icon edit"
                              onClick={() => handleEditRoom(room)}
                              title="Edit Room & Pricing"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "var(--bg-card-inner)",
                                border: "1px solid var(--border-subtle)",
                                color: "var(--text-muted)",
                                display: "grid",
                                placeItems: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = "var(--accent)";
                                e.currentTarget.style.borderColor = "var(--primary)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = "var(--text-muted)";
                                e.currentTarget.style.borderColor = "var(--border-subtle)";
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="btn-action-icon delete"
                              onClick={() => handleDeleteRoom(room.id)}
                              title="Delete Room (Admin Only)"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "8px",
                                background: "rgba(239, 68, 68, 0.1)",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#F87171",
                                display: "grid",
                                placeItems: "center",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#EF4444";
                                e.currentTarget.style.color = "#FFFFFF";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                e.currentTarget.style.color = "#F87171";
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "var(--text-dim)",
                              background: "var(--bg-card-inner)",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-subtle)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            🔒 Price Locked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: High-End Responsive Room Cards */}
        <div className="mobile-rooms-cards-view">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <RotateCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading rooms inventory...</span>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <BedDouble className="w-10 h-10 text-purple-400 opacity-50 mx-auto mb-2" />
              <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0", fontSize: "15px" }}>No rooms match your criteria</h4>
              <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "12px" }}>Try modifying your search or add a new room above.</p>
            </div>
          ) : (
            filteredRooms.map((room) => (
              <div key={room.id} className="mobile-room-mgmt-card">
                <div className="room-mgmt-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <span className="room-mgmt-number-badge">#{room.roomNumber}</span>
                    <span className="room-type-chip">{room.roomType} Room</span>
                  </div>
                  <div style={{ fontWeight: "800", color: "var(--accent)", fontSize: "15px", whiteSpace: "nowrap" }}>
                    ₹{room.price?.toLocaleString("en-IN")}
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text-muted)", marginLeft: "2px" }}>/night</span>
                  </div>
                </div>

                <div className="room-mgmt-card-meta">
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <BedDouble className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    Capacity: <strong style={{ color: "var(--text-main)" }}>{room.capacity || (room.roomType === "Single" ? 1 : 2)} Guest(s)</strong>
                  </span>

                  {isAdmin ? (
                    <select
                      value={room.status}
                      onChange={(e) => handleQuickStatusChange(room.id, e.target.value)}
                      className="room-mgmt-status-select"
                      style={{
                        background: "var(--bg-card)",
                        border: "1.5px solid var(--border-subtle)",
                        borderRadius: "8px",
                        padding: "5px 8px",
                        color:
                          room.status === "Available"
                            ? "#34D399"
                            : room.status === "Maintenance"
                            ? "#FB923C"
                            : "#C084FC",
                        fontSize: "11.5px",
                        fontWeight: "700",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="Available">🟢 Available</option>
                      <option value="Booked">🟣 Booked</option>
                      <option value="Maintenance">🟠 Maintenance</option>
                    </select>
                  ) : (
                    <span
                      className={`status-pill status-${
                        room.status === "Available"
                          ? "confirmed"
                          : room.status === "Maintenance"
                          ? "pending"
                          : "checked-in"
                      }`}
                    >
                      {room.status}
                    </span>
                  )}
                </div>

                {isAdmin && (
                  <div className="room-mgmt-card-actions">
                    <button
                      type="button"
                      className="room-mgmt-btn edit"
                      onClick={() => handleEditRoom(room)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Room</span>
                    </button>
                    <button
                      type="button"
                      className="room-mgmt-btn delete"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>
            Showing <strong style={{ color: "var(--text-main)" }}>{filteredRooms.length}</strong> of{" "}
            <strong style={{ color: "var(--text-main)" }}>{totalRooms}</strong> total rooms
          </span>
          <span style={{ color: "var(--text-dim)" }}>Live Inventory Synced</span>
        </div>
      </div>
    </div>
  );
}

export default Rooms;
