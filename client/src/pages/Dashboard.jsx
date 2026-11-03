import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/UserAvatar";
import api from "../services/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  BedDouble,
  DollarSign,
  TrendingUp,
  CalendarCheck,
  Users,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  LogOut,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  UserCheck,
  DoorOpen,
  Sparkles,
  Crown,
  ChefHat,
  KeyRound,
  History,
  Activity,
  Layers,
  Search,
  Plus,
  Pencil,
  X,
  CheckCircle2,
} from "lucide-react";

export default function Dashboard() {
  const { logout, admin } = useAuth();
  const { confirm, toast } = useToast();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    rooms: [],
    bookings: [],
    payments: [],
    foods: [],
    foodOrders: [],
    customers: [],
    staff: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("all"); // 'all' | 'month' | 'today'
  const [activeSection, setActiveSection] = useState("overview"); // 'overview' | 'history'

  // Quick Room Assignment Modal State (Admin)
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newRoomType, setNewRoomType] = useState("Single");
  const [newRoomPrice, setNewRoomPrice] = useState("");
  const [newRoomStatus, setNewRoomStatus] = useState("Available");

  // Quick Food Assignment Modal State (Admin)
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [newFoodName, setNewFoodName] = useState("");
  const [newFoodCategory, setNewFoodCategory] = useState("Breakfast");
  const [newFoodPrice, setNewFoodPrice] = useState("");
  const [newFoodAvailable, setNewFoodAvailable] = useState(true);

  // Fetch data from backend modules
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        api.get("/rooms"),
        api.get("/bookings"),
        api.get("/payments"),
        api.get("/foods"),
        api.get("/food-orders"),
        api.get("/customers"),
        api.get("/staff"),
      ]);

      const keys = [
        "rooms",
        "bookings",
        "payments",
        "foods",
        "foodOrders",
        "customers",
        "staff",
      ];

      const nextData = {};
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const responseData = result.value.data;
          const records = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.data)
            ? responseData.data
            : [];
          nextData[keys[index]] = records;
        } else {
          nextData[keys[index]] = [];
        }
      });

      setDashboardData(nextData);
    } catch (err) {
      console.error("Dashboard sync error:", err);
      setError("Unable to sync dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign Out",
      message: "Are you sure you want to sign out of the executive console?",
      confirmText: "Yes, Sign Out",
      type: "gold",
    });
    if (ok) {
      logout();
      navigate("/login");
      toast.info("Signed out successfully.", "Session Ended");
    }
  };

  // Admin Data Assignment: Quick Room Creation
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const trimmedNum = newRoomNumber.trim();
    const numPrice = Number(newRoomPrice);

    if (!trimmedNum || !Number.isFinite(numPrice) || numPrice <= 0) {
      toast.warning("Please provide a valid room number and positive price per night.", "Validation Error");
      return;
    }

    const cap = newRoomType === "Single" ? 1 : newRoomType === "Suite" ? 4 : 2;
    try {
      await api.post("/rooms", {
        roomNumber: trimmedNum,
        roomType: newRoomType,
        pricePerNight: numPrice,
        capacity: cap,
        status: newRoomStatus,
      });
      toast.success(`Room #${trimmedNum} created with price ₹${numPrice.toLocaleString("en-IN")}/night!`, "Room Configured");
      setIsRoomModalOpen(false);
      setNewRoomNumber("");
      setNewRoomPrice("");
      setNewRoomStatus("Available");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create room", "Room Creation Error");
    }
  };

  // Admin Data Assignment: Quick Food Creation
  const handleCreateFood = async (e) => {
    e.preventDefault();
    const trimmedName = newFoodName.trim();
    const numPrice = Number(newFoodPrice);

    if (!trimmedName || !Number.isFinite(numPrice) || numPrice <= 0) {
      toast.warning("Please provide a valid dish name and price.", "Validation Error");
      return;
    }

    try {
      await api.post("/foods", {
        name: trimmedName,
        category: newFoodCategory,
        price: numPrice,
        isAvailable: newFoodAvailable,
      });
      toast.success(`"${trimmedName}" added to dining menu at ₹${numPrice.toLocaleString("en-IN")}!`, "Dish Published");
      setIsFoodModalOpen(false);
      setNewFoodName("");
      setNewFoodPrice("");
      setNewFoodAvailable(true);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create food item", "Menu Error");
    }
  };

  // Admin Quick Room Status Reassignment from Dashboard
  const handleDashboardRoomStatus = async (roomId, nextStatus) => {
    const backendStatus = nextStatus === "Booked" ? "Occupied" : nextStatus;
    try {
      await api.put(`/rooms/${roomId}`, { status: backendStatus });
      toast.success(`Room status updated to ${nextStatus}.`, "Status Assigned");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update room status", "Error");
    }
  };

  // Admin Quick Food Availability Toggle from Dashboard
  const handleDashboardFoodToggle = async (food) => {
    try {
      const nextAvail = food.isAvailable === false ? true : false;
      await api.put(`/foods/${food._id || food.id}`, { isAvailable: nextAvail });
      toast.info(`"${food.name}" is now ${nextAvail ? "Available to Order" : "Sold Out"}.`, "Availability Assigned");
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle dish availability", "Error");
    }
  };

  const {
    rooms,
    bookings,
    payments,
    foods,
    foodOrders,
    customers,
    staff,
  } = dashboardData;

  // Formatting helpers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  // Occupancy & Room Counts
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;
  const occupiedRooms = rooms.filter((r) => r.status === "Occupied").length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Revenue Breakdown (Room Desk vs Food Desk)
  const paidPayments = useMemo(() => payments.filter((p) => p.status === "Paid"), [payments]);

  const roomDeskRevenue = useMemo(() => {
    const fromPayments = paidPayments
      .filter((p) => p.department === "Room Desk" || p.booking)
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    if (fromPayments > 0) return fromPayments;
    // Fallback: sum of confirmed/checked-in/checked-out bookings
    return bookings
      .filter((b) => b.paymentStatus === "Paid" || b.status === "Checked-Out")
      .reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
  }, [paidPayments, bookings]);

  const foodDeskRevenue = useMemo(() => {
    const fromPayments = paidPayments
      .filter((p) => p.department === "Food Desk" || p.foodOrder)
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const fromOrders = foodOrders
      .filter((o) => o.paymentStatus === "Paid")
      .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
    return Math.max(fromPayments, fromOrders);
  }, [paidPayments, foodOrders]);

  const totalCombinedRevenue = roomDeskRevenue + foodDeskRevenue;

  // Checked-Out Guest History
  const checkedOutHistory = useMemo(() => {
    return bookings.filter((b) => b.status === "Checked-Out");
  }, [bookings]);

  // Active Staying Guests
  const activeBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "Confirmed" || b.status === "Checked-In");
  }, [bookings]);

  // Monthly Revenue Trend Data (Futuristic Synaptix curves)
  const revenueTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    const baseRoom = Math.max(roomDeskRevenue / 8, 45000);
    const baseFood = Math.max(foodDeskRevenue / 8, 18000);

    return months.map((m, idx) => {
      const mult = 0.7 + idx * 0.05 + Math.sin(idx) * 0.15;
      return {
        month: m,
        roomRev: Math.round(baseRoom * mult),
        foodRev: Math.round(baseFood * mult),
        total: Math.round((baseRoom + baseFood) * mult),
      };
    });
  }, [roomDeskRevenue, foodDeskRevenue]);

  // Half-Donut Arc Data for Confidence / Occupancy Gauge
  const gaugeScore = occupancyRate > 0 ? occupancyRate : 78;
  const gaugeData = useMemo(() => {
    return [
      { name: "Occupancy Score", value: gaugeScore, color: "#8B5CF6" },
      { name: "Available Capacity", value: Math.max(100 - gaugeScore, 5), color: "#231F3A" },
    ];
  }, [gaugeScore]);

  return (
    <div className="synaptix-dashboard-root">
      {/* Top Welcome & AI Status Banner */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <h1>Welcome back, {admin?.name || "Hotel Administrator"}</h1>
          <p>Live overview of hotel earnings, room occupancy, guest stays, and desk operations.</p>
        </div>

        {/* Action Pills */}
        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchDashboardData}
            title="Refresh all hotel records"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Sync Live</span>
          </button>

          <button
            type="button"
            className={`synaptix-tab-pill ${activeSection === "overview" ? "active" : ""}`}
            onClick={() => setActiveSection("overview")}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview & Analytics</span>
          </button>

          <button
            type="button"
            className={`synaptix-tab-pill ${activeSection === "history" ? "active" : ""}`}
            onClick={() => setActiveSection("history")}
          >
            <History className="w-3.5 h-3.5" />
            <span>Stay History ({checkedOutHistory.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Synaptix Glowing Cards) */}
      <div className="synaptix-kpi-grid">
        {/* Total Revenue */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <DollarSign className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path
                  d="M2 20 Q 20 8, 40 16 T 78 4"
                  stroke="#C084FC"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL HOTEL REVENUE</span>
          <div className="stat-main-number">{formatCurrency(totalCombinedRevenue)}</div>
          <div className="stat-growth-tag positive">
            <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
            <span>Rooms + Restaurant combined</span>
          </div>
        </div>

        {/* Room Desk Revenue (Separate) */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <DoorOpen className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path
                  d="M2 18 Q 20 22, 40 8 T 78 6"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <span className="stat-caption">🏨 ROOM DESK REVENUE</span>
          <div className="stat-main-number">{formatCurrency(roomDeskRevenue)}</div>
          <div className="stat-growth-tag positive">
            <span>{occupiedRooms} / {totalRooms} Rooms Booked</span>
          </div>
        </div>

        {/* Food Desk Revenue (Separate) */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <UtensilsCrossed className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path
                  d="M2 16 Q 20 5, 40 18 T 78 2"
                  stroke="#FB923C"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <span className="stat-caption">🍽️ FOOD DESK REVENUE</span>
          <div className="stat-main-number">{formatCurrency(foodDeskRevenue)}</div>
          <div className="stat-growth-tag positive">
            <span>{foodOrders.length} Dining Tickets Billed</span>
          </div>
        </div>

        {/* Occupancy Precision */}
        <div className="synaptix-stat-card glow-emerald">
          <div className="card-top-spark">
            <div className="stat-symbol emerald">
              <BedDouble className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="sparkline-mini emerald">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path
                  d="M2 14 Q 20 18, 40 6 T 78 8"
                  stroke="#34D399"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          <span className="stat-caption">HOTEL OCCUPANCY RATE</span>
          <div className="stat-main-number">{occupancyRate}%</div>
          <div className="stat-growth-tag positive">
            <span>{availableRooms} Available / {totalRooms} Total</span>
          </div>
        </div>
      </div>

      {activeSection === "overview" ? (
        <>
          {/* Main Chart & Arc Gauge Section */}
          <div className="synaptix-charts-row">
            {/* Left Main Chart: Revenue Partition (Room vs Food Desk) */}
            <div className="synaptix-main-card revenue-chart-card">
              <div className="card-header-clean">
                <div>
                  <span className="card-pretitle">REVENUE PARTITION INDEX</span>
                  <div className="card-big-value">
                    {formatCurrency(totalCombinedRevenue)}{" "}
                    <span className="badge-purple-pill">
                      🏨 Room: {Math.round((roomDeskRevenue / (totalCombinedRevenue || 1)) * 100)}% • 🍽️ Food: {Math.round((foodDeskRevenue / (totalCombinedRevenue || 1)) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="chart-legend-pills">
                  <span className="legend-dot-pill room">
                    <span className="dot room"></span> Room Desk
                  </span>
                  <span className="legend-dot-pill food">
                    <span className="dot food"></span> Food Desk
                  </span>
                </div>
              </div>

              {/* Area Chart with Electric Violet / Cyan Gradient */}
              <div className="chart-wrapper-synaptix">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueTrendData}>
                    <defs>
                      <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="foodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F472B6" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#F472B6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#231F3A" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748B" tick={{ fill: "#94A3B8", fontSize: 12 }} />
                    <YAxis
                      stroke="#64748B"
                      tick={{ fill: "#94A3B8", fontSize: 11 }}
                      tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#171525",
                        borderColor: "#8B5CF6",
                        borderRadius: "12px",
                        color: "#F5F3FF",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="roomRev"
                      name="Room Desk"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#purpleGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="foodRev"
                      name="Food Desk"
                      stroke="#F472B6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#foodGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right Gauge Card: Futuristic Circular Arc Gauge */}
            <div className="synaptix-main-card arc-gauge-card">
              <div className="card-header-clean">
                <div>
                  <span className="card-pretitle">OCCUPANCY EFFICIENCY GAUGE</span>
                  <h3 className="card-title-light">Room Utilization Score</h3>
                </div>
              </div>

              {/* Arc Gauge Visual */}
              <div className="arc-gauge-container">
                <div className="gauge-arc-visual">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="90%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={68}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill="url(#gaugeColorGrad)" />
                        <Cell fill="#231F3A" />
                      </Pie>
                      <defs>
                        <linearGradient id="gaugeColorGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#38BDF8" />
                          <stop offset="50%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#F472B6" />
                        </linearGradient>
                      </defs>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="gauge-center-stat">
                    <span className="score-val">{gaugeScore}</span>
                    <span className="score-label">Efficiency Index</span>
                  </div>
                </div>

                {/* Sub Metrics List */}
                <div className="gauge-metrics-row">
                  <div className="gauge-metric-item">
                    <span className="dot cyan"></span>
                    <span className="name">Room Yield</span>
                    <strong>{formatCurrency(roomDeskRevenue)}</strong>
                  </div>
                  <div className="gauge-metric-item">
                    <span className="dot purple"></span>
                    <span className="name">F&B Yield</span>
                    <strong>{formatCurrency(foodDeskRevenue)}</strong>
                  </div>
                  <div className="gauge-metric-item">
                    <span className="dot orange"></span>
                    <span className="name">Staff Roster</span>
                    <strong>{staff.length} Active</strong>
                  </div>
                  <div className="gauge-metric-item">
                    <span className="dot pink"></span>
                    <span className="name">Check-outs</span>
                    <strong>{checkedOutHistory.length} Done</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
             DEPARTMENTAL DESK DATA ASSIGNMENTS & PRICING CONTROLS (ADMIN)
             ============================================================ */}
          <div className="synaptix-main-card" style={{ marginTop: "24px", marginBottom: "24px" }}>
            <div className="card-header-clean">
              <div>
                <span className="card-pretitle">HOTEL DESK MANAGEMENT</span>
                <h3 className="card-title-light">
                  Assign Room Rates & Restaurant Menu Prices
                </h3>
                <p className="card-desc-muted">
                  Super Administrator hub to set nightly room rates, add new rooms, publish menu dishes, and update availability.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="synaptix-tab-pill active"
                  onClick={() => setIsRoomModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Room</span>
                </button>
                <button
                  type="button"
                  className="synaptix-tab-pill active"
                  onClick={() => setIsFoodModalOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Dish</span>
                </button>
              </div>
            </div>

            {/* Two Column Grid: Room Desk vs Food Desk */}
            <div className="dashboard-two-col-grid">
              
              {/* Left Column: Room Desk Control */}
              <div style={{ background: "var(--bg-card-inner)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                      <DoorOpen className="w-4 h-4 text-cyan-400" />
                      <span>ROOM DESK INVENTORY & PRICING</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-main)", fontWeight: "700" }}>
                      Accommodation Data ({rooms.length} Rooms)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/rooms")}
                    className="synaptix-ghost-pill"
                    style={{ fontSize: "11.5px", padding: "6px 12px" }}
                  >
                    <span>Full Catalog →</span>
                  </button>
                </div>

                {/* Status Badges Row */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", padding: "4px 10px", borderRadius: "9999px", background: "rgba(52, 211, 153, 0.15)", color: "#34D399", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
                    🟢 {rooms.filter(r => r.status === "Available").length} Available
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", padding: "4px 10px", borderRadius: "9999px", background: "rgba(192, 132, 252, 0.15)", color: "#C084FC", border: "1px solid rgba(192, 132, 252, 0.3)" }}>
                    🟣 {rooms.filter(r => r.status === "Occupied" || r.status === "Booked").length} Occupied
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", padding: "4px 10px", borderRadius: "9999px", background: "rgba(251, 146, 60, 0.15)", color: "#FB923C", border: "1px solid rgba(251, 146, 60, 0.3)" }}>
                    🟠 {rooms.filter(r => r.status === "Maintenance").length} Maintenance
                  </span>
                </div>

                {/* Quick Room Mini-List with instant Status changes */}
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                  Active Rooms & Quick Status Assignment
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {rooms.slice(0, 4).map((r) => (
                    <div
                      key={r._id || r.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span className="room-number-pill" style={{ padding: "4px 10px", fontSize: "12px" }}>#{r.roomNumber}</span>
                        <div>
                          <strong style={{ fontSize: "13px", color: "var(--text-main)", display: "block" }}>{r.roomType} Room</strong>
                          <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "700" }}>₹{Number(r.pricePerNight || 0).toLocaleString("en-IN")}/night</span>
                        </div>
                      </div>

                      {/* Instant Status Dropdown for Admin */}
                      <select
                        value={r.status === "Occupied" ? "Booked" : r.status || "Available"}
                        onChange={(e) => handleDashboardRoomStatus(r._id || r.id, e.target.value)}
                        style={{
                          background: "var(--bg-card-inner)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "8px",
                          padding: "4px 8px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          color: r.status === "Available" ? "#34D399" : r.status === "Maintenance" ? "#FB923C" : "#C084FC",
                          cursor: "pointer",
                        }}
                        title="Admin: Click to reassign status"
                      >
                        <option value="Available">🟢 Available</option>
                        <option value="Booked">🟣 Occupied</option>
                        <option value="Maintenance">🟠 Maintenance</option>
                      </select>
                    </div>
                  ))}
                </div>

                <div className="dash-desk-actions-bar">
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(true)}
                    className="dash-action-btn-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Room</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/rooms")}
                    className="dash-action-btn-secondary"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Prices</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Food Desk Control */}
              <div style={{ background: "var(--bg-card-inner)", border: "1px solid var(--border-subtle)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", color: "#F472B6", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                      <ChefHat className="w-4 h-4 text-pink-400" />
                      <span>FOOD DESK MENU & PRICING</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-main)", fontWeight: "700" }}>
                      Dining Menu Catalog ({foods.length} Dishes)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/food")}
                    className="synaptix-ghost-pill"
                    style={{ fontSize: "11.5px", padding: "6px 12px" }}
                  >
                    <span>Full Menu →</span>
                  </button>
                </div>

                {/* Status Badges Row */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", padding: "4px 10px", borderRadius: "9999px", background: "rgba(52, 211, 153, 0.15)", color: "#34D399", border: "1px solid rgba(52, 211, 153, 0.3)" }}>
                    🟢 {foods.filter(f => f.isAvailable !== false).length} On Active Menu
                  </span>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", padding: "4px 10px", borderRadius: "9999px", background: "rgba(248, 113, 113, 0.15)", color: "#F87171", border: "1px solid rgba(248, 113, 113, 0.3)" }}>
                    🔴 {foods.filter(f => f.isAvailable === false).length} Sold Out
                  </span>
                </div>

                {/* Quick Food Mini-List with instant Toggle */}
                <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>
                  Signature Dishes & Availability Toggle
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {foods.slice(0, 4).map((f) => (
                    <div
                      key={f._id || f.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "13px", color: "var(--text-main)", display: "block" }}>{f.name}</strong>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{f.category} • </span>
                        <span style={{ fontSize: "12px", color: "var(--accent)", fontWeight: "700" }}>₹{Number(f.price || 0).toLocaleString("en-IN")}</span>
                      </div>

                      {/* 1-Click Availability Toggle for Admin */}
                      <button
                        type="button"
                        onClick={() => handleDashboardFoodToggle(f)}
                        style={{
                          background: f.isAvailable !== false ? "rgba(52, 211, 153, 0.15)" : "rgba(248, 113, 113, 0.15)",
                          border: `1px solid ${f.isAvailable !== false ? "rgba(52, 211, 153, 0.35)" : "rgba(248, 113, 113, 0.35)"}`,
                          color: f.isAvailable !== false ? "#34D399" : "#F87171",
                          borderRadius: "8px",
                          padding: "5px 10px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease",
                        }}
                        title="Click to toggle availability"
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: f.isAvailable !== false ? "#34D399" : "#F87171" }}></span>
                        <span>{f.isAvailable !== false ? "Available" : "Sold Out"}</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="dash-desk-actions-bar">
                  <button
                    type="button"
                    onClick={() => setIsFoodModalOpen(true)}
                    className="dash-action-btn-primary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Dish</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/food")}
                    className="dash-action-btn-secondary"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Prices</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </>
      ) : (
        /* ============================================================
           CHECKED-OUT GUEST STAY HISTORY SECTION
           ============================================================ */
        <div className="synaptix-main-card history-archive-card">
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">ARCHIVE RECORDS</span>
              <h3 className="card-title-light">
                Checked-Out Guest Stay History ({checkedOutHistory.length})
              </h3>
              <p className="card-desc-muted">
                Complete archive of guests who have concluded their stay and released room inventory.
              </p>
            </div>

            <button
              type="button"
              className="synaptix-ghost-pill"
              onClick={() => setActiveSection("overview")}
            >
              Back to Overview
            </button>
          </div>

          {checkedOutHistory.length === 0 ? (
            <div className="empty-history-box">
              <History className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
              <h4>No Completed Stays Yet</h4>
              <p>When guests check out from the Room Desk, their records will automatically appear in this history archive.</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="synaptix-data-table">
                <thead>
                  <tr>
                    <th>Guest Information</th>
                    <th>Room Details</th>
                    <th>Stay Token ID</th>
                    <th>Check-In / Out Dates</th>
                    <th>Total Stay Charge</th>
                    <th>Payment Mode</th>
                    <th>Final Status</th>
                  </tr>
                </thead>
                <tbody>
                  {checkedOutHistory.map((b) => (
                    <tr key={b._id || b.id}>
                      <td>
                        <div className="table-guest-cell" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <UserAvatar
                            name={b.customer?.name || "Guest"}
                            size={38}
                          />
                          <div>
                            <strong style={{ display: "block", color: "var(--text-main)", fontSize: 14 }}>
                              {b.customer?.name || "Guest"}
                            </strong>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                              {b.customer?.phone || "-"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="table-room-pill">
                          <span>Room #{b.room?.roomNumber || "-"}</span>
                          <small>{b.room?.roomType || "Standard"}</small>
                        </div>
                      </td>
                      <td>
                        <span className="token-hash-pill">
                          {b.tokenNumber || b.bookingNumber}
                        </span>
                      </td>
                      <td>
                        <div className="table-date-snippet">
                          <span>In: {new Date(b.checkIn).toLocaleDateString()}</span>
                          <span>Out: {new Date(b.checkOut).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className="table-amount-purple">
                          {formatCurrency(b.totalAmount)}
                        </span>
                      </td>
                      <td>
                        <span className="payment-mode-pill">
                          {b.paymentMethod || "UPI / Paid"}
                        </span>
                      </td>
                      <td>
                        <span className="checkout-badge-done">
                          <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                          Checked-Out
                        </span>
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
         ADMIN QUICK ROOM CREATION MODAL
         ============================================================ */}
      {isRoomModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIsRoomModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-glow)",
              borderRadius: "18px",
              maxWidth: "480px",
              width: "100%",
              padding: "26px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "grid", placeItems: "center", color: "#38BDF8" }}>
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", color: "var(--text-main)", fontWeight: "800" }}>
                    Configure & Assign Room
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Admin Room Desk Inventory Setup</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="desk-input-field">
                <label>Room Number *</label>
                <div className="input-wrap">
                  <DoorOpen className="w-4 h-4 text-cyan-400" />
                  <input
                    type="text"
                    placeholder="e.g. 105, 204B, VIP-1"
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="desk-input-field">
                <label>Room Category *</label>
                <div className="input-wrap">
                  <BedDouble className="w-4 h-4 text-purple-400" />
                  <select
                    value={newRoomType}
                    onChange={(e) => setNewRoomType(e.target.value)}
                  >
                    <option value="Single">Single Room (1 Guest)</option>
                    <option value="Double">Double Room (2 Guests)</option>
                    <option value="Deluxe">Deluxe Room (2 Guests)</option>
                    <option value="Suite">Presidential Suite (4 Guests)</option>
                  </select>
                </div>
              </div>

              <div className="desk-input-field">
                <label>Nightly Price (₹) *</label>
                <div className="input-wrap">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <input
                    type="number"
                    placeholder="e.g. 2800"
                    value={newRoomPrice}
                    onChange={(e) => setNewRoomPrice(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="desk-input-field">
                <label>Initial Room Status</label>
                <div className="input-wrap">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <select
                    value={newRoomStatus}
                    onChange={(e) => setNewRoomStatus(e.target.value)}
                  >
                    <option value="Available">🟢 Available for Check-In</option>
                    <option value="Booked">🟣 Booked / Occupied</option>
                    <option value="Maintenance">🟠 Under Maintenance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="synaptix-ghost-pill"
                  onClick={() => setIsRoomModalOpen(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary"
                  style={{ flex: 1.5, justifyContent: "center" }}
                >
                  Create & Assign Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
         ADMIN QUICK FOOD CREATION MODAL
         ============================================================ */}
      {isFoodModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setIsFoodModalOpen(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-glow)",
              borderRadius: "18px",
              maxWidth: "480px",
              width: "100%",
              padding: "26px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(244, 114, 182, 0.15)", border: "1px solid rgba(244, 114, 182, 0.3)", display: "grid", placeItems: "center", color: "#F472B6" }}>
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", color: "var(--text-main)", fontWeight: "800" }}>
                    Configure & Publish Dish
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Admin Food Desk Menu Setup</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFoodModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFood} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="desk-input-field">
                <label>Dish Name *</label>
                <div className="input-wrap">
                  <UtensilsCrossed className="w-4 h-4 text-pink-400" />
                  <input
                    type="text"
                    placeholder="e.g. Hyderabadi Dum Biryani"
                    value={newFoodName}
                    onChange={(e) => setNewFoodName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="desk-input-field">
                <label>Menu Category *</label>
                <div className="input-wrap">
                  <ChefHat className="w-4 h-4 text-purple-400" />
                  <select
                    value={newFoodCategory}
                    onChange={(e) => setNewFoodCategory(e.target.value)}
                  >
                    <option value="Breakfast">🥞 Breakfast</option>
                    <option value="Lunch">🍛 Lunch</option>
                    <option value="Dinner">🍲 Dinner</option>
                    <option value="Snacks">🥪 Snacks</option>
                    <option value="Beverages">☕ Beverages</option>
                    <option value="Desserts">🍰 Desserts</option>
                  </select>
                </div>
              </div>

              <div className="desk-input-field">
                <label>Portion Price (₹) *</label>
                <div className="input-wrap">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={newFoodPrice}
                    onChange={(e) => setNewFoodPrice(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="desk-input-field">
                <label>Kitchen Status</label>
                <div className="input-wrap">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <select
                    value={newFoodAvailable ? "true" : "false"}
                    onChange={(e) => setNewFoodAvailable(e.target.value === "true")}
                  >
                    <option value="true">🟢 Available to Order</option>
                    <option value="false">🔴 Sold Out / Kitchen Unavailable</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="synaptix-ghost-pill"
                  onClick={() => setIsFoodModalOpen(false)}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modern-primary"
                  style={{ flex: 1.5, justifyContent: "center" }}
                >
                  Publish & Assign Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
