import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/UserAvatar";
import {
  CalendarDays,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  RotateCw,
  AlertCircle,
  DollarSign,
  User,
  BedDouble,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";

function Bookings() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();
  const isAdmin = admin?.role === "Super Admin" || admin?.role === "Admin";
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [notes, setNotes] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchCustomers();
    fetchRooms();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/bookings");
      const records = response.data?.data || response.data || [];

      const bookingData = records.map((booking) => ({
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customer?._id || "",
        customerName: booking.customer?.name || booking.customerName || "Guest",
        roomId: booking.room?._id || "",
        roomNumber: booking.room?.roomNumber || booking.roomNumber || "-",
        roomType: booking.room?.roomType || "",
        pricePerNight: booking.room?.pricePerNight || 0,
        checkIn: booking.checkIn ? booking.checkIn.split("T")[0] : "",
        checkOut: booking.checkOut ? booking.checkOut.split("T")[0] : "",
        guests: booking.guests || 1,
        totalAmount: booking.totalAmount || 0,
        status: booking.status || "Pending",
        paymentStatus: booking.paymentStatus || "Pending",
        notes: booking.notes || "",
      }));

      setBookings(bookingData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomers() {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data?.data || response.data || []);
    } catch (err) {
      console.warn("Failed to fetch customers:", err);
    }
  }

  async function fetchRooms() {
    try {
      const response = await api.get("/rooms");
      setRooms(response.data?.data || response.data || []);
    } catch (err) {
      console.warn("Failed to fetch rooms:", err);
    }
  }

  function resetForm() {
    setCustomerId("");
    setRoomId("");
    setCheckIn("");
    setCheckOut("");
    setGuests("1");
    setNotes("");
    setEditingId(null);
    setIsFormOpen(false);
  }

  const estimatedCost = useMemo(() => {
    if (!roomId || !checkIn || !checkOut) return 0;
    const room = rooms.find((r) => (r._id || r.id) === roomId);
    if (!room) return 0;

    const diffDays = Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
    const nights = Math.max(1, diffDays > 0 ? diffDays : 1);
    return nights * (room.pricePerNight || room.price || 0);
  }, [roomId, checkIn, checkOut, rooms]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!customerId || !roomId || !checkIn || !checkOut) {
      toast.warning("Please complete all required fields.", "Incomplete Form");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.warning("Check-out date must be strictly after check-in date.", "Invalid Dates");
      return;
    }

    const payload = {
      customer: customerId,
      room: roomId,
      checkIn,
      checkOut,
      guests: Number(guests),
      notes,
    };

    try {
      setSaving(true);
      setError("");

      if (editingId !== null) {
        await api.put(`/bookings/${editingId}`, payload);
        toast.success("Reservation details have been updated.", "Booking Updated");
      } else {
        await api.post("/bookings", payload);
        toast.success("New reservation successfully booked.", "Reservation Created");
      }

      resetForm();
      await fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save booking.";
      setError(msg);
      toast.error(msg, "Booking Failed");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(booking) {
    setCustomerId(booking.customerId);
    setRoomId(booking.roomId);
    setCheckIn(booking.checkIn);
    setCheckOut(booking.checkOut);
    setGuests(String(booking.guests));
    setNotes(booking.notes);
    setEditingId(booking.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleStatusChange(id, nextStatus) {
    try {
      if (nextStatus === "Checked-Out") {
        await api.put(`/bookings/${id}/checkout`);
      } else {
        await api.put(`/bookings/${id}`, { status: nextStatus });
      }
      toast.success(`Booking status changed to ${nextStatus}`, "Status Updated");
      await fetchBookings();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status.";
      toast.error(msg, "Status Update Error");
    }
  }

  async function handleDelete(id) {
    if (!isAdmin) {
      toast.warning("Only an Administrator can delete bookings.", "Access Restricted");
      return;
    }

    const target = bookings.find((b) => b.id === id);
    const bkRef = target?.bookingNumber || "this booking";

    const ok = await confirm({
      title: "Cancel Reservation",
      message: `Are you sure you want to cancel ${bkRef}? The assigned room will immediately become available.`,
      confirmText: "Yes, Cancel Booking",
      cancelText: "Keep Reservation",
      type: "warning",
    });

    if (!ok) return;

    try {
      await api.delete(`/bookings/${id}`);
      if (editingId === id) resetForm();
      await fetchBookings();
      toast.success(`Reservation ${bkRef} has been cancelled.`, "Booking Removed");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete booking.";
      toast.error(msg, "Cancellation Error");
    }
  }

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    const q = search.toLowerCase().trim();
    return bookings.filter((b) => {
      const matchSearch =
        b.customerName.toLowerCase().includes(q) ||
        b.roomNumber.toLowerCase().includes(q) ||
        (b.bookingNumber && b.bookingNumber.toLowerCase().includes(q)) ||
        b.status.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, search, statusFilter]);

  // Summary Metrics
  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) =>
    ["Confirmed", "Checked-In"].includes(b.status)
  ).length;
  const totalValue = bookings
    .filter((b) => b.status !== "Cancelled")
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  const checkedInCount = bookings.filter((b) => b.status === "Checked-In").length;

  return (
    <div className="synaptix-dashboard-root">
      {/* Header */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="ai-active-pill">
            <CalendarDays className="spark-icon" />
            <span>GUEST RESERVATIONS</span>
          </div>
          <h1 className="welcome-title">Guest Bookings Registry</h1>
          <p className="welcome-subtitle">
            Manage guest reservations, room assignments, stay dates, and check-in status.
          </p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchBookings}
            title="Refresh bookings"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

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
                <span>New Booking</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Glowing Synaptix Cards) */}
      <div className="synaptix-kpi-grid">
        {/* Total Bookings */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <CalendarDays className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL BOOKINGS</span>
          <div className="stat-main-number">{totalBookings}</div>
          <div className="stat-growth-tag positive">
            <span>All guest reservations</span>
          </div>
        </div>

        {/* Active Reservations */}
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
          <span className="stat-caption">ACTIVE RESERVATIONS</span>
          <div className="stat-main-number">{activeBookings}</div>
          <div className="stat-growth-tag positive">
            <span>Confirmed & checked-in</span>
          </div>
        </div>

        {/* Gross Booked Value */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <DollarSign className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">GROSS BOOKED VALUE</span>
          <div className="stat-main-number">₹{totalValue.toLocaleString("en-IN")}</div>
          <div className="stat-growth-tag positive">
            <span>Cumulative room revenue</span>
          </div>
        </div>

        {/* In-House Guests */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <Clock className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 16 Q 20 5, 40 18 T 78 2" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">IN-HOUSE GUESTS</span>
          <div className="stat-main-number">{checkedInCount}</div>
          <div className="stat-growth-tag positive">
            <span>Checked-in right now</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#F87171", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      {isFormOpen && (
        <div className="synaptix-main-card" style={{ marginBottom: "24px" }}>
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">{editingId !== null ? "MODIFY BOOKING" : "NEW BOOKING"}</span>
              <h3 className="card-title-light">{editingId !== null ? "Modify Reservation" : "Create New Guest Reservation"}</h3>
              <p className="card-desc-muted">Select guest, room, stay dates, and occupancy details.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="synaptix-form-grid">
            <div className="desk-input-field">
              <label>Select Guest *</label>
              <div className="input-wrap">
                <User className="w-4 h-4 text-purple-400" />
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="desk-input-field">
              <label>Assign Room *</label>
              <div className="input-wrap">
                <BedDouble className="w-4 h-4 text-purple-400" />
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  required
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map((r) => (
                    <option key={r._id || r.id} value={r._id || r.id}>
                      Room {r.roomNumber} - {r.roomType} (₹{r.pricePerNight || r.price}/night)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="desk-input-field">
              <label>Check-in Date *</label>
              <div className="input-wrap">
                <CalendarDays className="w-4 h-4 text-purple-400" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Check-out Date *</label>
              <div className="input-wrap">
                <CalendarDays className="w-4 h-4 text-purple-400" />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Number of Guests</label>
              <div className="input-wrap">
                <User className="w-4 h-4 text-purple-400" />
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Estimated Booking Total</label>
              <div style={{ height: "44px", background: "var(--bg-card-inner)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total:</span>
                <strong style={{ color: "var(--accent)", fontSize: "16px" }}>₹{estimatedCost.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="desk-input-field" style={{ gridColumn: "1 / -1" }}>
              <label>Special Requests / Notes</label>
              <div className="input-wrap">
                <input
                  type="text"
                  placeholder="e.g. Airport pick up, extra pillow, sea-facing room"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
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
                disabled={saving}
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
                {saving
                  ? "Processing..."
                  : editingId !== null
                  ? "Update Booking"
                  : "Confirm & Book Room"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar: Search & Multi-Filters Card */}
      <div className="synaptix-toolbar-card">
        <div className="synaptix-search-input-wrap">
          <Search className="search-icon w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search by customer, room, or booking ID..."
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

        <div className="synaptix-filter-group">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="synaptix-select"
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Checked-In">Checked-In</option>
            <option value="Checked-Out">Checked-Out</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="synaptix-main-card">
        <div className="card-header-clean">
          <div>
            <span className="card-pretitle">RESERVATIONS REGISTRY</span>
            <h3 className="card-title-light">Guest Bookings ({filteredBookings.length})</h3>
            <p className="card-desc-muted">Manage guest stays, room assignments, schedules, and active check-in status.</p>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="desktop-table-view">
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="synaptix-data-table">
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Stay Dates</th>
                  <th>Amount</th>
                  <th>Stay Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
                        <RotateCw className="w-5 h-5 animate-spin text-purple-400" />
                        <span>Loading reservations...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px" }}>
                      <CalendarDays className="w-10 h-10 text-purple-400 opacity-50 mx-auto mb-2" />
                      <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0" }}>No reservations found</h4>
                      <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "12px" }}>Adjust your search filters or book a new guest above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "12px",
                            fontWeight: "700",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            background: "var(--bg-card-inner)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--accent)",
                          }}
                        >
                          {b.bookingNumber || b.id.substring(b.id.length - 6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <UserAvatar name={b.customerName} size={34} />
                          <div>
                            <strong style={{ display: "block", color: "var(--text-main)", fontSize: "13.5px" }}>
                              {b.customerName}
                            </strong>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                              {b.guests} Guest(s)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span className="room-number-pill" style={{ fontSize: "12.5px", padding: "3px 8px", background: "var(--bg-card-inner)", borderRadius: "6px", border: "1px solid var(--border-subtle)" }}>
                            Room {b.roomNumber}
                          </span>
                          {b.roomType && (
                            <span className="room-type-chip" style={{ fontSize: "10px" }}>
                              {b.roomType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          <span style={{ color: "var(--text-main)", fontWeight: "600" }}>{b.checkIn}</span>
                          <span style={{ margin: "0 4px", color: "var(--text-dim)" }}>→</span>
                          <span style={{ color: "var(--text-main)", fontWeight: "600" }}>{b.checkOut}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong style={{ display: "block", color: "var(--accent)", fontSize: "14px" }}>
                            ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                          </strong>
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: "700",
                              textTransform: "uppercase",
                              color: b.paymentStatus === "Paid" ? "#34D399" : "#FB923C",
                            }}
                          >
                            {b.paymentStatus}
                          </span>
                        </div>
                      </td>
                      <td>
                        {/* Status Selector Dropdown */}
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          style={{
                            background: "var(--bg-card-inner)",
                            border: "1px solid var(--border-subtle)",
                            borderRadius: "8px",
                            padding: "5px 10px",
                            color: "var(--text-main)",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Checked-In">Checked-In</option>
                          <option value="Checked-Out">Checked-Out</option>
                          <option value="Pending">Pending</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleEdit(b)}
                            title="Edit Booking"
                            disabled={["Checked-Out"].includes(b.status)}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              background: "var(--bg-card-inner)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-muted)",
                              display: "grid",
                              placeItems: "center",
                              cursor: ["Checked-Out"].includes(b.status) ? "not-allowed" : "pointer",
                              opacity: ["Checked-Out"].includes(b.status) ? 0.4 : 1,
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!["Checked-Out"].includes(b.status)) {
                                e.currentTarget.style.color = "var(--accent)";
                                e.currentTarget.style.borderColor = "var(--primary)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "var(--text-muted)";
                              e.currentTarget.style.borderColor = "var(--border-subtle)";
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {isAdmin ? (
                            <button
                              type="button"
                              className="btn-action-icon delete"
                              onClick={() => handleDelete(b.id)}
                              title="Delete Booking (Admin Only)"
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
                          ) : (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "var(--text-dim)",
                                background: "var(--bg-card-inner)",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-subtle)",
                              }}
                            >
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View: High-End Responsive Booking Cards */}
        <div className="mobile-bookings-cards-view">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <RotateCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading reservations...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <CalendarDays className="w-10 h-10 text-purple-400 opacity-50 mx-auto mb-2" />
              <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0", fontSize: "15px" }}>No reservations found</h4>
              <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "12px" }}>Adjust your search filters or book a new guest above.</p>
            </div>
          ) : (
            filteredBookings.map((b) => (
              <div key={b.id} className="mobile-booking-mgmt-card">
                <div className="booking-mgmt-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="booking-mgmt-number-badge">
                      #{b.bookingNumber || b.id.substring(b.id.length - 6).toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        padding: "2px 7px",
                        borderRadius: "9999px",
                        background: b.paymentStatus === "Paid" ? "rgba(52, 211, 153, 0.15)" : "rgba(251, 146, 60, 0.15)",
                        color: b.paymentStatus === "Paid" ? "#34D399" : "#FB923C",
                        border: `1px solid ${b.paymentStatus === "Paid" ? "rgba(52, 211, 153, 0.3)" : "rgba(251, 146, 60, 0.3)"}`,
                      }}
                    >
                      {b.paymentStatus}
                    </span>
                  </div>

                  <select
                    value={b.status}
                    onChange={(e) => handleStatusChange(b.id, e.target.value)}
                    className="booking-mgmt-status-select"
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "8px",
                      padding: "4px 8px",
                      color: "var(--text-main)",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Checked-In">Checked-In</option>
                    <option value="Checked-Out">Checked-Out</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="booking-mgmt-guest-row">
                  <UserAvatar name={b.customerName} size={36} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <strong style={{ display: "block", color: "var(--text-main)", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {b.customerName}
                    </strong>
                    <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                      {b.guests} Guest(s) • <span style={{ color: "var(--accent)", fontWeight: "600" }}>Room {b.roomNumber} ({b.roomType || "Room"})</span>
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong style={{ color: "var(--accent)", fontSize: "15px", display: "block" }}>
                      ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                <div className="booking-mgmt-dates-bar">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
                    <CalendarDays className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{b.checkIn}</span>
                    <span style={{ color: "var(--text-dim)" }}>→</span>
                    <span>{b.checkOut}</span>
                  </div>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      className="booking-mgmt-btn edit"
                      onClick={() => handleEdit(b)}
                      disabled={["Checked-Out"].includes(b.status)}
                      title="Edit Booking"
                      style={{
                        padding: "5px 10px",
                        borderRadius: "8px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-main)",
                        fontSize: "11.5px",
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        cursor: ["Checked-Out"].includes(b.status) ? "not-allowed" : "pointer",
                        opacity: ["Checked-Out"].includes(b.status) ? 0.4 : 1,
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        className="booking-mgmt-btn delete"
                        onClick={() => handleDelete(b.id)}
                        title="Delete Booking"
                        style={{
                          padding: "5px 10px",
                          borderRadius: "8px",
                          background: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                          color: "#F87171",
                          fontSize: "11.5px",
                          fontWeight: "600",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>
            Showing <strong style={{ color: "var(--text-main)" }}>{filteredBookings.length}</strong> of{" "}
            <strong style={{ color: "var(--text-main)" }}>{totalBookings}</strong> reservations
          </span>
          <span style={{ color: "var(--text-dim)" }}>Stay Management Active</span>
        </div>
      </div>
    </div>
  );
}

export default Bookings;
