import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/UserAvatar";
import {
  BedDouble,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Crown,
  KeyRound,
  Printer,
  Sparkles,
  RotateCw,
  LogOut,
  ShieldCheck,
  DoorOpen,
  DollarSign,
  X,
  AlertTriangle,
  Receipt,
  Users,
  ArrowUpRight,
  ChevronRight,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

export default function RoomDesk() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();

  // Data states
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters & selection
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All' | 'Available' | 'Occupied' | 'Maintenance'
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Customer intake form states
  const [guestSearch, setGuestSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCity, setGuestCity] = useState("");

  // Booking details
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [guestsCount, setGuestsCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [notes, setNotes] = useState("");

  // Stay Pass Modal State
  const [generatedToken, setGeneratedToken] = useState(null);
  const [activePassData, setActivePassData] = useState(null);

  // Tab switch between "New Booking Desk" and "Occupied Rooms & Check-Out"
  const [activeTab, setActiveTab] = useState("book"); // 'book' | 'occupancies'

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, bookingsRes, customersRes] = await Promise.all([
        api.get("/rooms"),
        api.get("/bookings"),
        api.get("/customers"),
      ]);

      const roomsList = roomsRes.data?.data || roomsRes.data || [];
      const bookingsList = bookingsRes.data?.data || bookingsRes.data || [];
      const customersList = customersRes.data?.data || customersRes.data || [];

      setRooms(roomsList);
      setBookings(bookingsList);
      setCustomers(customersList);
    } catch (err) {
      console.error("Failed to load room desk data:", err);
      toast.error("Unable to sync room records.", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Occupied rooms & staying bookings
  const activeOccupancies = useMemo(() => {
    return bookings.filter(
      (b) => b.status === "Confirmed" || b.status === "Checked-In"
    );
  }, [bookings]);

  // Helper to determine live occupancy & status
  const getRoomOccupancy = (r) => {
    return activeOccupancies.find(
      (b) =>
        (b.room?._id || b.room?.id) === (r._id || r.id) ||
        b.room?.roomNumber === r.roomNumber
    );
  };

  const getEffectiveStatus = (r) => {
    const isOccupied =
      r.status === "Occupied" ||
      r.status === "Booked" ||
      !!getRoomOccupancy(r);
    if (isOccupied) return "Occupied";
    if (r.status === "Maintenance") return "Maintenance";
    return "Available";
  };

  // Status counts
  const availableRoomsList = useMemo(() => {
    return rooms.filter((r) => getEffectiveStatus(r) === "Available");
  }, [rooms, activeOccupancies]);

  const occupiedRoomsList = useMemo(() => {
    return rooms.filter((r) => getEffectiveStatus(r) === "Occupied");
  }, [rooms, activeOccupancies]);

  const maintenanceRoomsList = useMemo(() => {
    return rooms.filter((r) => getEffectiveStatus(r) === "Maintenance");
  }, [rooms, activeOccupancies]);

  // Displayed rooms based on Status Filter & Type Filter
  const displayedRooms = useMemo(() => {
    return rooms.filter((r) => {
      const effStatus = getEffectiveStatus(r);
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Available" && effStatus === "Available") ||
        (statusFilter === "Occupied" && effStatus === "Occupied") ||
        (statusFilter === "Maintenance" && effStatus === "Maintenance");
      const matchType = typeFilter === "All" || r.roomType === typeFilter;
      return matchStatus && matchType;
    });
  }, [rooms, statusFilter, typeFilter, activeOccupancies]);

  const availableRooms = availableRoomsList;

  // Calculate nights and estimated total
  const calculatedNights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const diffTime = new Date(checkOut) - new Date(checkIn);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  }, [checkIn, checkOut]);

  const estimatedTotal = useMemo(() => {
    if (!selectedRoom) return 0;
    return calculatedNights * (selectedRoom.pricePerNight || selectedRoom.price || 0);
  }, [selectedRoom, calculatedNights]);

  // Handle Quick Guest Search / Select
  const handleSelectExistingCustomer = (c) => {
    setSelectedCustomerId(c.id || c._id);
    setGuestName(c.name || "");
    setGuestPhone(c.phone || "");
    setGuestEmail(c.email || "");
    setGuestCity(c.address || c.city || "");
    setGuestSearch("");
    toast.info(`Selected existing guest profile: ${c.name}`, "Guest Selected");
  };

  // Clear guest inputs
  const handleClearGuest = () => {
    setSelectedCustomerId("");
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setGuestCity("");
  };

  // Handle Booking & Stay Token Generation
  const handleCreateBooking = async (e) => {
    e.preventDefault();

    if (!selectedRoom) {
      toast.warning("Please choose an available room from the catalog.", "Select Room");
      return;
    }

    if (!guestName.trim() || !guestPhone.trim()) {
      toast.warning("Please provide guest full name and phone number.", "Guest Required");
      return;
    }

    if (!/^\d{10}$/.test(guestPhone.trim())) {
      toast.warning("Please enter a valid 10-digit phone number.", "Invalid Phone");
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      toast.warning("Check-out date must be strictly after check-in date.", "Invalid Dates");
      return;
    }

    if (guestsCount > selectedRoom.capacity) {
      toast.warning(
        `Room ${selectedRoom.roomNumber} accommodates maximum ${selectedRoom.capacity} guests.`,
        "Capacity Exceeded"
      );
      return;
    }

    try {
      setSubmitting(true);

      // 1. Ensure Customer exists or create new
      let customerId = selectedCustomerId;
      if (!customerId) {
        // Look up by phone in existing customer list
        const found = customers.find((c) => c.phone === guestPhone.trim());
        if (found) {
          customerId = found.id || found._id;
        } else {
          // Register new customer
          const newCustRes = await api.post("/customers", {
            name: guestName.trim(),
            phone: guestPhone.trim(),
            email: guestEmail.trim() || `${guestPhone.trim()}@guest.rpn`,
            address: guestCity.trim() || "City Center",
          });
          const created = newCustRes.data?.data || newCustRes.data;
          customerId = created.id || created._id;
        }
      }

      // 2. Generate Booking & Stay Pass Token
      const tokenNumber = `RPN-PASS-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
      const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;

      const bookingPayload = {
        bookingNumber,
        tokenNumber,
        customer: customerId,
        room: selectedRoom.id || selectedRoom._id,
        checkIn,
        checkOut,
        guests: Number(guestsCount),
        paymentMethod,
        paymentStatus: "Paid",
        status: "Confirmed",
        notes: notes || `Direct Desk Booking by ${admin?.name || "Room Manager"}`,
      };

      await api.post("/bookings", bookingPayload);

      // 3. Show Stay Token Modal
      setActivePassData({
        tokenNumber,
        bookingNumber,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        roomNumber: selectedRoom.roomNumber,
        roomType: selectedRoom.roomType,
        checkIn,
        checkOut,
        nights: calculatedNights,
        guests: guestsCount,
        totalAmount: estimatedTotal,
        paymentMethod,
        paymentStatus: "Paid",
        issueDate: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });
      setGeneratedToken(tokenNumber);

      toast.success(
        `Room #${selectedRoom.roomNumber} booked! Stay Token: ${tokenNumber}`,
        "Booking Confirmed"
      );

      // 4. Refresh data & reset form
      await fetchData();
      setSelectedRoom(null);
      handleClearGuest();
      setNotes("");
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to confirm room booking",
        "Booking Failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle 1-Click Check-Out (Releases room back to Available)
  const handleCheckOut = async (booking) => {
    const roomNum = booking.room?.roomNumber || "this room";
    const guest = booking.customer?.name || "the guest";

    const ok = await confirm({
      title: "Process Guest Check-Out",
      message: `Complete check-out for ${guest} in Room #${roomNum}? This will release the room back to AVAILABLE inventory immediately.`,
      confirmText: "Yes, Check Out & Release Room",
      cancelText: "Keep Occupied",
      type: "gold",
    });

    if (!ok) return;

    try {
      await api.put(`/bookings/${booking._id || booking.id}/checkout`);
      toast.success(
        `Room #${roomNum} is now AVAILABLE for new guests!`,
        "Check-Out Complete"
      );
      await fetchData();
    } catch (err) {
      console.error("Check-out error:", err);
      toast.error(
        err.response?.data?.message || "Failed to process check-out.",
        "Check-Out Failed"
      );
    }
  };

  // Print stay pass
  const handlePrintPass = () => {
    window.print();
  };

  return (
    <div className="synaptix-dashboard-root">
      {/* Top Header: Clear & Friendly Front Desk Welcome */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
         
          <h1 className="welcome-title">Room Booking</h1>
          <p className="welcome-subtitle">
            Welcome back, <strong>{admin?.name}</strong>  
          </p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchData}
            title="Refresh room records"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Rooms</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar - 4 Clear Room Metrics */}
      <div className="synaptix-kpi-grid">
        {/* Available Rooms */}
        <div className="synaptix-stat-card glow-emerald">
          <div className="card-top-spark">
            <div className="stat-symbol emerald">
              <DoorOpen className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="sparkline-mini emerald">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 14 Q 20 6, 40 18 T 78 8" stroke="#34D399" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">ROOMS AVAILABLE</span>
          <div className="stat-main-number">
            {availableRooms.length} <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/ {rooms.length}</span>
          </div>
          <div className="stat-growth-tag positive">
            <span>Ready for guest check-in</span>
          </div>
        </div>

        {/* Current Occupancies */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <BedDouble className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">OCCUPIED ROOMS</span>
          <div className="stat-main-number">{activeOccupancies.length}</div>
          <div className="stat-growth-tag positive">
            <span>Guests currently staying</span>
          </div>
        </div>

        {/* Total Hotel Rooms */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <Crown className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL HOTEL ROOMS</span>
          <div className="stat-main-number">{rooms.length}</div>
          <div className="stat-growth-tag positive">
            <span>All room categories</span>
          </div>
        </div>

        {/* Quick Check-Out Ready */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <LogOut className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 16 Q 20 5, 40 18 T 78 2" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">CHECK-OUT READY</span>
          <div className="stat-main-number">{activeOccupancies.length}</div>
          <div className="stat-growth-tag positive">
            <span>Click to release room</span>
          </div>
        </div>
      </div>

      {/* Two Clear Modes Switcher */}
      <div className="room-desk-tabs-bar">
        <button
          type="button"
          className={`room-desk-tab-btn ${activeTab === "book" ? "active" : ""}`}
          onClick={() => setActiveTab("book")}
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          <span className="room-tab-text-full">Step 1: Book a Room</span>
          <span className="room-tab-text-short">Book Room</span>
          <span className="room-tab-badge-full">{availableRooms.length} Available</span>
          <span className="room-tab-badge-short">{availableRooms.length}</span>
        </button>

        <button
          type="button"
          className={`room-desk-tab-btn ${activeTab === "occupancies" ? "active" : ""}`}
          onClick={() => setActiveTab("occupancies")}
        >
          <BedDouble className="w-4 h-4 shrink-0" />
          <span className="room-tab-text-full">Active Guests & Check-Out</span>
          <span className="room-tab-text-short">Active Guests</span>
          <span className="room-tab-badge-full">{activeOccupancies.length} Staying</span>
          <span className="room-tab-badge-short">{activeOccupancies.length}</span>
        </button>
      </div>

      {activeTab === "book" ? (
        /* ============================================================
           BOOKING WORKFLOW DESK
           ============================================================ */
        <form onSubmit={handleCreateBooking} className="room-booking-layout">
          {/* Left Column: Room Picker & Available Catalog */}
          <div className="desk-left-section">
            <div className="synaptix-main-card">
              <div className="card-header-clean">
                <div>
                  <span className="card-pretitle">STEP 1 • CHOOSE A ROOM</span>
                  <h3 className="card-title-light">Available Hotel Rooms ({rooms.length} Total)</h3>
                </div>
              </div>

              {/* Combined Filter Section using <section> tag with 2 separate input tags */}
              <section className="room-filters-section">
                <div className="room-filters-grid" style={{ margin: "12px 0 16px 0" }}>
                  {/* Separate Input 1: Filter by Status */}
                  <div className="desk-input-field" style={{ margin: 0 }}>
                    <label htmlFor="filter-status-input" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                       
                      {statusFilter !== "All" && (
                        <button
                          type="button"
                          onClick={() => setStatusFilter("All")}
                          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "11px", fontWeight: "700", padding: 0 }}
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <div className="input-wrap" style={{ height: "42px", padding: "0 12px" }}>
                      <Filter className="w-4 h-4 text-purple-400 shrink-0" />
                      <select
                        id="filter-status-input"
                        name="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ cursor: "pointer", fontSize: "12.5px", fontWeight: "600", width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--text-main)" }}
                      >
                        <option value="All">All Rooms ({rooms.length} Total)</option>
                        <option value="Available">🟢 Available ({availableRoomsList.length})</option>
                        <option value="Occupied">🟣 Occupied ({occupiedRoomsList.length})</option>
                        <option value="Maintenance">🟠 Maintenance ({maintenanceRoomsList.length})</option>
                      </select>
                    </div>
                  </div>

                  {/* Separate Input 2: Filter by Room Type */}
                  <div className="desk-input-field" style={{ margin: 0 }}>
                    <label htmlFor="filter-type-input" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                       
                      {typeFilter !== "All" && (
                        <button
                          type="button"
                          onClick={() => setTypeFilter("All")}
                          style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "11px", fontWeight: "700", padding: 0 }}
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <div className="input-wrap" style={{ height: "42px", padding: "0 12px" }}>
                      <BedDouble className="w-4 h-4 text-purple-400 shrink-0" />
                      <select
                        id="filter-type-input"
                        name="typeFilter"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        style={{ cursor: "pointer", fontSize: "12.5px", fontWeight: "600", width: "100%", background: "transparent", border: "none", outline: "none", color: "var(--text-main)" }}
                      >
                        <option value="All">All Room Types ({rooms.length})</option>
                        <option value="Single">Single Room (1 Guest)</option>
                        <option value="Double">Double Room (2 Guests)</option>
                        <option value="Deluxe">Deluxe Room (3 Guests)</option>
                        <option value="Suite">Presidential Suite (4 Guests)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </section>

              {/* Rooms Grid */}
              {displayedRooms.length === 0 ? (
                <div className="empty-rooms-box" style={{ padding: "40px 20px", textAlign: "center", background: "var(--bg-card-inner)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
                  <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h4 style={{ color: "var(--text-main)", fontSize: "16px", margin: "0 0 6px 0" }}>
                    No Rooms Match Your Filter
                  </h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>
                    Please adjust your status or room type filter to view hotel rooms.
                  </p>
                </div>
              ) : (
                <div className="available-rooms-grid">
                  {displayedRooms.map((r) => {
                    const rId = String(r._id || r.id);
                    const selId = selectedRoom ? String(selectedRoom._id || selectedRoom.id) : null;
                    const isSelected = Boolean(selId && selId === rId);
                    const effStatus = getEffectiveStatus(r);
                    const isOccupied = effStatus === "Occupied";
                    const isMaintenance = effStatus === "Maintenance";
                    const isAvailable = effStatus === "Available";
                    const occupancy = getRoomOccupancy(r);

                    return (
                      <div
                        key={r._id || r.id}
                        className={`room-card-modern ${isSelected ? "selected" : ""} ${isOccupied ? "status-occupied" : isMaintenance ? "status-maintenance" : "status-available"}`}
                        onClick={() => {
                          if (isAvailable) setSelectedRoom(r);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        {isSelected && (
                          <div className="room-selected-badge">
                            ✓ SELECTED
                          </div>
                        )}

                        {/* Top Bar with Room #, Room Type, and Live Status Badge */}
                        <div className="room-card-top-bar">
                          <div className="room-card-top-left">
                            <span className="room-number-pill">#{r.roomNumber}</span>
                            <span className="room-type-chip">{r.roomType}</span>
                          </div>
                          <span className={`room-status-indicator ${isAvailable ? "available" : isOccupied ? "occupied" : "maintenance"}`}>
                            <span className="status-indicator-dot"></span>
                            {isAvailable ? "Available" : isOccupied ? "Occupied" : "Service"}
                          </span>
                        </div>

                        {/* Middle Row: Price & Capacity */}
                        <div className="room-card-middle-row">
                          <div className="room-price-box">
                            <span className="room-price-currency">₹</span>
                            <span className="room-price-amount">
                              {Number(r.pricePerNight || r.price).toLocaleString()}
                            </span>
                            <span className="room-price-unit">/ night</span>
                          </div>

                          <div className="room-amenities-row">
                            <span className="amenity-chip">
                              <Users className="w-3 h-3 text-purple-400" />
                              <span>Max {r.capacity || (r.roomType === "Single" ? 1 : r.roomType === "Suite" ? 4 : 2)}</span>
                            </span>
                          </div>
                        </div>

                        {/* Occupied Guest Details Snippet */}
                        {isOccupied && occupancy && (
                          <div className="room-occupied-snippet">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>Guest: <strong>{occupancy.customer?.name || "Guest"}</strong></span>
                            </div>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                              Stay: Till {new Date(occupancy.checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}

                        {/* Action Button */}
                        {isAvailable ? (
                          <button
                            type="button"
                            className={`btn-room-select ${isSelected ? "selected" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoom(r);
                            }}
                          >
                            {isSelected ? "✓ Room Selected" : "Select Room"}
                          </button>
                        ) : isOccupied ? (
                          <button type="button" disabled className="btn-room-disabled occupied">
                            Occupied (Staying)
                          </button>
                        ) : (
                          <button type="button" disabled className="btn-room-disabled maintenance">
                            Under Maintenance
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customer Details, Stay Duration, Payment & Token */}
          <div className="desk-right-section">
            {/* Step 2: Customer Intake */}
            <div className="synaptix-main-card" style={{ marginBottom: "20px" }}>
              <div className="card-header-clean">
                <div>
                  <span className="card-pretitle">STEP 2 • GUEST DETAILS</span>
                  <h3 className="card-title-light">Guest Information</h3>
                   
                </div>
              </div>

              {/* Quick Customer Search Bar */}
              <div className="guest-lookup-bar" style={{ marginBottom: "14px" }}>
                <Search className="w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  placeholder="Lookup guest by name or phone..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                />
              </div>

              {/* Search results dropdown */}
              {guestSearch.trim() && (
                <div
                  className="guest-results-dropdown"
                  style={{
                    background: "var(--bg-card-inner)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "12px",
                    padding: "8px",
                    marginBottom: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {customers
                    .filter(
                      (c) =>
                        c.name?.toLowerCase().includes(guestSearch.toLowerCase()) ||
                        c.phone?.includes(guestSearch)
                    )
                    .slice(0, 4)
                    .map((c) => (
                      <div
                        key={c._id || c.id}
                        className="guest-result-item"
                        onClick={() => handleSelectExistingCustomer(c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <UserAvatar name={c.name} size={30} />
                        <div className="result-meta" style={{ display: "flex", flexDirection: "column" }}>
                          <strong style={{ fontSize: "13px", color: "var(--text-main)" }}>{c.name}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.phone} • {c.address || "City Guest"}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Guest Form Fields */}
              <div className="guest-form-grid">
                <div className="desk-input-field">
                  <label>Guest Full Name *</label>
                  <div className="input-wrap">
                    <User className="w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="desk-input-field">
                  <label>Mobile Number (10 digits) *</label>
                  <div className="input-wrap">
                    <Phone className="w-4 h-4 text-purple-400" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="desk-input-field">
                  <label>Email Address</label>
                  <div className="input-wrap">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <input
                      type="email"
                      placeholder="guest@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="desk-input-field">
                  <label>City / Native Address</label>
                  <div className="input-wrap">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <input
                      type="text"
                      placeholder="Chennai, Bangalore, etc."
                      value={guestCity}
                      onChange={(e) => setGuestCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {selectedCustomerId && (
                <div
                  className="selected-customer-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--bg-header-pill)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "10px",
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "var(--accent)",
                  }}
                >
                  <span>Linked to Existing Profile #{selectedCustomerId.slice(-4)}</span>
                  <button
                    type="button"
                    onClick={handleClearGuest}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent)",
                      fontWeight: "700",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Dates, Duration & Payment - Responsive Bill Summary Card */}
            <div className="synaptix-main-card bill-summary-section-card">
              <div className="card-header-clean">
                <div>
                  <span className="card-pretitle">STEP 3 • PAYMENT</span>
                  <h3 className="card-title-light">Bill Summary</h3>
                </div>
              </div>

              <div className="dates-form-grid">
                <div className="desk-input-field">
                  <label>Check-In Date *</label>
                  <div className="input-wrap">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="desk-input-field">
                  <label>Check-Out Date *</label>
                  <div className="input-wrap">
                    <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
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
                    <Users className="w-4 h-4 text-purple-400 shrink-0" />
                    <select
                      value={guestsCount}
                      onChange={(e) => setGuestsCount(Number(e.target.value))}
                    >
                      <option value={1}>1 Guest</option>
                      <option value={2}>2 Guests</option>
                      <option value={3}>3 Guests</option>
                      <option value={4}>4 Guests</option>
                    </select>
                  </div>
                </div>

                <div className="desk-input-field">
                  <label>Payment Method *</label>
                  <div className="input-wrap">
                    <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                      <option value="Cash">Cash at Front Desk</option>
                      <option value="Card">Credit / Debit Card</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Live Cost Summary Banner */}
              <div className="desk-summary-box">
                <div className="desk-summary-line">
                  <span>Selected Room:</span>
                  <strong>
                    {selectedRoom ? `Room #${selectedRoom.roomNumber} (${selectedRoom.roomType})` : "None Selected"}
                  </strong>
                </div>
                <div className="desk-summary-line">
                  <span>Stay Duration:</span>
                  <strong>{calculatedNights} Night{calculatedNights > 1 ? "s" : ""}</strong>
                </div>
                <div className="desk-summary-divider"></div>
                <div className="desk-summary-line total-line">
                  <span>Total Amount:</span>
                  <span className="desk-summary-total">₹{estimatedTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Submit / Generate Token Button */}
              <button
                type="submit"
                disabled={submitting || !selectedRoom}
                className="btn-submit-booking-pass"
              >
                {submitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Confirming Booking...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 shrink-0" />
                    <span>
                      {selectedRoom
                        ? `Confirm Booking & Issue Pass (₹${estimatedTotal.toLocaleString()})`
                        : "Select an Available Room Above"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* ============================================================
           ACTIVE OCCUPANCIES & CHECK-OUT SECTION
           ============================================================ */
        <div className="synaptix-main-card">
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">CURRENTLY STAYING GUESTS</span>
              <h3 className="card-title-light">Active Hotel Stays & Check-Out ({activeOccupancies.length})</h3>
              <p className="card-desc-muted">
                Guests currently occupying rooms. Click <strong>"Check-Out"</strong> to release the room back to available inventory immediately.
              </p>
            </div>
          </div>

          {activeOccupancies.length === 0 ? (
            <div className="empty-rooms-box" style={{ padding: "50px 20px", textAlign: "center", background: "var(--bg-card-inner)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h4 style={{ color: "var(--text-main)", fontSize: "17px", margin: "0 0 6px 0" }}>No Current Occupancies</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>All hotel rooms are currently available for new guest bookings.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: "auto" }}>
              <table className="synaptix-data-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Guest Information</th>
                    <th>Stay Pass Token</th>
                    <th>Check-In / Out Dates</th>
                    <th>Guests</th>
                    <th>Total Paid</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOccupancies.map((b) => (
                    <tr key={b._id || b.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="room-number-pill" style={{ fontSize: "14px", padding: "4px 10px", background: "var(--bg-card-inner)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                            #{b.room?.roomNumber}
                          </span>
                          <span className="room-type-chip" style={{ fontSize: "10px" }}>{b.room?.roomType}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <UserAvatar name={b.customer?.name} size={36} />
                          <div>
                            <strong style={{ display: "block", color: "var(--text-main)", fontSize: "13.5px" }}>{b.customer?.name}</strong>
                            <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{b.customer?.phone} • {b.customer?.address || "City"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "12px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "8px",
                            background: "var(--bg-header-pill)",
                            color: "var(--accent)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          {b.tokenNumber || b.bookingNumber}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", fontSize: "12px", color: "var(--text-muted)" }}>
                          <span>In: {new Date(b.checkIn).toLocaleDateString()}</span>
                          <span>Out: {new Date(b.checkOut).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "13px", color: "var(--text-main)" }}>{b.guests} Pers.</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: "700", color: "var(--accent)", fontSize: "13.5px" }}>
                          ₹{Number(b.totalAmount).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleCheckOut(b)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 14px",
                            borderRadius: "10px",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#F87171",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#EF4444";
                            e.currentTarget.style.color = "#FFFFFF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                            e.currentTarget.style.color = "#F87171";
                          }}
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Check-Out</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          LUXURY STAY PASS / GUEST TOKEN MODAL
          ============================================================ */}
      {activePassData && (
        <div
          className="synaptix-modal-backdrop"
          onClick={() => setActivePassData(null)}
        >
          <div
            className="synaptix-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", padding: "28px" }}
          >
            {/* Top Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
              <button
                type="button"
                onClick={() => setActivePassData(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
                aria-label="Close pass"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pass Brand Header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <Crown className="w-10 h-10 text-amber-500 mx-auto mb-1" />
              <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "20px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 4px 0" }}>
                RPN LUXURY HOTEL & SUITES
              </h2>
              <span
                style={{
                  display: "inline-block",
                  padding: "3px 12px",
                  borderRadius: "9999px",
                  background: "var(--bg-header-pill)",
                  color: "var(--accent)",
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "0.06em",
                }}
              >
                OFFICIAL GUEST STAY PASS
              </span>
            </div>

            {/* Token ID Highlight Banner */}
            <div
              style={{
                background: "var(--bg-card-inner)",
                border: "1px dashed var(--border-glow)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                DIGITAL STAY TOKEN ID
              </span>
              <h3 style={{ fontSize: "24px", fontWeight: "800", color: "var(--accent)", margin: "4px 0", letterSpacing: "0.05em", fontFamily: "monospace" }}>
                {activePassData.tokenNumber}
              </h3>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>AUTH: RPN-SEC-2026-VAL</p>
            </div>

            {/* Stay Details Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "10px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Assigned Room</span>
                <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-main)" }}>
                  Room #{activePassData.roomNumber} ({activePassData.roomType})
                </span>
              </div>

              <div style={{ padding: "10px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Guest Name</span>
                <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-main)" }}>{activePassData.guestName}</span>
              </div>

              <div style={{ padding: "10px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Guest Contact</span>
                <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-main)" }}>{activePassData.guestPhone}</span>
              </div>

              <div style={{ padding: "10px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Stay Duration</span>
                <span style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-main)" }}>{activePassData.nights} Night(s)</span>
              </div>

              <div style={{ padding: "10px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Check-In / Out</span>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-main)" }}>
                  {activePassData.checkIn} → {activePassData.checkOut}
                </span>
              </div>

              <div style={{ padding: "10px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Total Amount Paid</span>
                <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--accent)" }}>
                  ₹{Number(activePassData.totalAmount).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Footer QR / Barcode Decoration */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "3px", height: "30px", marginBottom: "8px", opacity: 0.6 }}>
                {"|| | ||| | |||| | || | ||| || | |||| || | || |||| | |||".split("").map((b, i) => (
                  <span key={i} style={{ width: b === "|" ? "2px" : "4px", height: "100%", background: "var(--text-main)" }}></span>
                ))}
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-dim)", margin: 0 }}>
                Please present this token upon check-in or dining room charges. Valid for all hotel amenities.
              </p>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handlePrintPass}
                style={{
                  flex: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  borderRadius: "12px",
                  background: "var(--bg-card-inner)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-main)",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePassData(null)}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "12px",
                  background: "var(--primary-gradient)",
                  border: "none",
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
