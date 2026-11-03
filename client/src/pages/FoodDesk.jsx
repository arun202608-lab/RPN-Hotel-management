import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Printer,
  RotateCw,
  Crown,
  ChefHat,
  Coffee,
  CheckCircle2,
  DollarSign,
  User,
  DoorOpen,
  CreditCard,
  X,
  Sparkles,
  ArrowUpRight,
  ShoppingBag,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default function FoodDesk() {
  const { admin } = useAuth();
  const { toast } = useToast();

  // Data
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Order Cart / Tray
  const [cart, setCart] = useState([]); // [{ foodId, name, price, category, quantity }]
  const [orderType, setOrderType] = useState("Table"); // 'Table' | 'Room' | 'Takeaway'
  const [tableNumber, setTableNumber] = useState("Table 1");
  const [selectedRoomNumber, setSelectedRoomNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [orderNotes, setOrderNotes] = useState("");

  // Bill Modal State
  const [generatedBill, setGeneratedBill] = useState(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [foodsRes, ordersRes, roomsRes, bookingsRes] = await Promise.all([
        api.get("/foods"),
        api.get("/food-orders"),
        api.get("/rooms"),
        api.get("/bookings"),
      ]);

      setFoods(foodsRes.data?.data || foodsRes.data || []);
      setOrders(ordersRes.data?.data || ordersRes.data || []);
      setRooms(roomsRes.data?.data || roomsRes.data || []);
      setBookings(bookingsRes.data?.data || bookingsRes.data || []);
    } catch (err) {
      console.error("Failed to load food desk data:", err);
      toast.error("Unable to sync dining records.", "Network Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter available foods
  const availableFoods = useMemo(() => {
    return foods.filter((f) => {
      const matchCat = selectedCategory === "All" || f.category === selectedCategory;
      const matchQuery =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const isAvailable = f.isAvailable !== false && f.available !== false;
      return matchCat && matchQuery && isAvailable;
    });
  }, [foods, selectedCategory, searchQuery]);

  // Occupied rooms for room service quick pick
  const occupiedRooms = useMemo(() => {
    return rooms.filter((r) => r.status === "Occupied");
  }, [rooms]);

  // When room is selected in Room Service, auto-fill guest name if found in active bookings
  useEffect(() => {
    if (orderType === "Room" && selectedRoomNumber) {
      const matchedBooking = bookings.find(
        (b) =>
          b.room?.roomNumber === selectedRoomNumber &&
          (b.status === "Confirmed" || b.status === "Checked-In")
      );
      if (matchedBooking?.customer?.name) {
        setCustomerName(matchedBooking.customer.name);
      }
    }
  }, [selectedRoomNumber, orderType, bookings]);

  // Cart operations
  const addToCart = (food) => {
    const foodId = food._id || food.id;
    setCart((prev) => {
      const existing = prev.find((item) => item.foodId === foodId);
      if (existing) {
        return prev.map((item) =>
          item.foodId === foodId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          foodId,
          name: food.name,
          price: Number(food.price),
          category: food.category,
          quantity: 1,
        },
      ];
    });
    toast.info(`Added "${food.name}" to dining tray.`, "Dish Added");
  };

  const updateQuantity = (foodId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.foodId === foodId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (foodId) => {
    setCart((prev) => prev.filter((item) => item.foodId !== foodId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Total quantity of dishes in tray
  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const gstTax = useMemo(() => {
    return Math.round(subtotal * 0.05); // 5% GST
  }, [subtotal]);

  const grandTotal = useMemo(() => {
    return subtotal + gstTax;
  }, [subtotal, gstTax]);

  // Place order & generate bill
  const handleGenerateBill = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.warning("Please add at least one dish to the order tray.", "Empty Order");
      return;
    }

    let customerRef = customerName.trim();
    if (!customerRef) {
      if (orderType === "Room") customerRef = `Room ${selectedRoomNumber} Guest`;
      else if (orderType === "Table") customerRef = `${tableNumber} Guest`;
      else customerRef = "Walk-in Guest";
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const billNumber = `BILL-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const orderPayload = {
      orderNumber,
      billNumber,
      customerName: customerRef,
      roomNumber: orderType === "Room" ? selectedRoomNumber : tableNumber,
      items: cart.map((item) => ({
        food: item.foodId,
        quantity: item.quantity,
      })),
      status: "Delivered",
      paymentStatus: "Paid",
      paymentMethod,
      notes: orderNotes || `${orderType} Order processed by ${admin?.name || "Food Manager"}`,
    };

    try {
      setSubmitting(true);
      await api.post("/food-orders", orderPayload);

      // Open Instant Bill Modal
      setGeneratedBill({
        billNumber,
        orderNumber,
        customerName: customerRef,
        destination:
          orderType === "Room"
            ? `Room Service (Room #${selectedRoomNumber})`
            : orderType === "Table"
            ? `Dine-In (${tableNumber})`
            : "Takeaway Counter",
        items: [...cart],
        subtotal,
        gstTax,
        grandTotal,
        paymentMethod,
        paymentStatus: "Paid",
        serverName: admin?.name || "F&B Staff",
        dateTime: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      });

      toast.success(
        `Bill ${billNumber} generated! Total: ₹${grandTotal.toLocaleString()}`,
        "Order Billed"
      );

      // Refresh and clear cart
      await fetchData();
      clearCart();
      setCustomerName("");
      setOrderNotes("");
    } catch (err) {
      console.error("Order bill error:", err);
      toast.error(
        err.response?.data?.message || "Failed to generate food bill.",
        "Billing Error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  return (
    <div className="synaptix-dashboard-root">
      {/* Top Header: Clear & Friendly Dining Header */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="ai-active-pill">
            <ChefHat className="spark-icon" />
            <span>RESTAURANT & KITCHEN DESK</span>
          </div>
          <h1 className="welcome-title">Food Ordering & Dining Billing</h1>
          <p className="welcome-subtitle">
            Welcome back, <strong>{admin?.name}</strong> 
          </p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchData}
            title="Refresh menu & orders"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Menu</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar - 4 Clear Food Metrics */}
      <div className="synaptix-kpi-grid">
        {/* Available Dishes */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <UtensilsCrossed className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 16 Q 20 5, 40 18 T 78 2" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">MENU DISHES</span>
          <div className="stat-main-number">
            {availableFoods.length} <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>/ {foods.length}</span>
          </div>
          <div className="stat-growth-tag positive">
            <span>Ready to order</span>
          </div>
        </div>

        {/* Total Orders Placed */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <Receipt className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TODAY'S ORDERS</span>
          <div className="stat-main-number">{orders.length}</div>
          <div className="stat-growth-tag positive">
            <span>Billed & sent to kitchen</span>
          </div>
        </div>

        {/* Occupied Rooms */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <DoorOpen className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">OCCUPIED ROOMS</span>
          <div className="stat-main-number">{occupiedRooms.length}</div>
          <div className="stat-growth-tag positive">
            <span>Ready for room service</span>
          </div>
        </div>

        {/* Kitchen Status */}
        <div className="synaptix-stat-card glow-emerald">
          <div className="card-top-spark">
            <div className="stat-symbol emerald">
              <Coffee className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="sparkline-mini emerald">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 14 Q 20 18, 40 6 T 78 8" stroke="#34D399" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">KITCHEN STATUS</span>
          <div className="stat-main-number" style={{ fontSize: "22px", letterSpacing: "0.02em" }}>Active & Open</div>
          <div className="stat-growth-tag positive">
            <span>Dine-In & Room Service</span>
          </div>
        </div>
      </div>

      {/* Mobile Quick Jump Bar: Instant scroll to Menu or Billing */}
      <div className="food-mobile-tabs-bar">
        <button
          type="button"
          className="food-mobile-tab-btn"
          onClick={() => {
            document.getElementById("food-catalog-card")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <UtensilsCrossed className="w-4 h-4 shrink-0 text-purple-400" />
          <span>Menu Dishes</span>
          <span className="food-tab-count-pill">{availableFoods.length}</span>
        </button>
        <button
          type="button"
          className={`food-mobile-tab-btn ${totalCartCount > 0 ? "has-cart" : ""}`}
          onClick={() => {
            document.getElementById("food-billing-card")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Receipt className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Order Tray & Bill</span>
          {totalCartCount > 0 ? (
            <span className="food-tab-cart-pill">{totalCartCount}</span>
          ) : (
            <span className="food-tab-count-pill">0</span>
          )}
        </button>
      </div>

      {/* Main Two-Column Workflow */}
      <div className="food-desk-main-layout">
        {/* Left Column: Menu Catalog */}
        <div id="food-catalog-card" className="food-catalog-section">
          <div className="synaptix-main-card">
            <div className="card-header-clean">
              <div>
                <span className="card-pretitle">STEP 1 • SELECT FOOD DISHES</span>
                <h3 className="card-title-light">Restaurant Menu ({availableFoods.length} Dishes)</h3>
                 
              </div>
            </div>

            {/* Search & Category Pills */}
            <div style={{ margin: "16px 0 20px 0" }}>
              <div className="food-search-bar" style={{ marginBottom: "14px" }}>
                <Search className="w-4 h-4 text-purple-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search dishes (e.g. Dosa, Biryani, Coffee)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="food-category-pills" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["All", "Breakfast", "Lunch", "Dinner", "Snacks", "Beverages"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`type-pill ${selectedCategory === cat ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: selectedCategory === cat ? "700" : "600",
                      background: selectedCategory === cat ? "var(--primary)" : "var(--bg-card-inner)",
                      color: selectedCategory === cat ? "#FFFFFF" : "var(--text-muted)",
                      border: selectedCategory === cat ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {cat === "Breakfast" && "🥞 "}
                    {cat === "Lunch" && "🍛 "}
                    {cat === "Dinner" && "🍲 "}
                    {cat === "Snacks" && "🥪 "}
                    {cat === "Beverages" && "☕ "}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Grid */}
            {availableFoods.length === 0 ? (
              <div className="empty-rooms-box" style={{ padding: "40px 20px", textAlign: "center", background: "var(--bg-card-inner)", borderRadius: "16px", border: "1px dashed var(--border-subtle)" }}>
                <Coffee className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <h4 style={{ color: "var(--text-main)", fontSize: "16px", margin: "0 0 6px 0" }}>No Dishes Found</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>No dishes match the selected category or search query.</p>
              </div>
            ) : (
              <div className="available-foods-grid-modern">
                {availableFoods.map((f) => {
                  const inCart = cart.find((item) => item.foodId === (f._id || f.id));
                  return (
                    <div key={f._id || f.id} className="dish-card-modern">
                      {/* Card Header Row: Category Badge (Left) & Bold Price Tag (Right) */}
                      <div className="dish-card-header-row">
                        <span className={`dish-category-chip ${f.category?.toLowerCase() || "lunch"}`}>
                          {f.category === "Breakfast" && "🥞"}
                          {f.category === "Lunch" && "🍛"}
                          {f.category === "Dinner" && "🍲"}
                          {f.category === "Snacks" && "🥪"}
                          {f.category === "Beverages" && "☕"}
                          {!["Breakfast", "Lunch", "Dinner", "Snacks", "Beverages"].includes(f.category) && "🍽️"}{" "}
                          {f.category}
                        </span>
                        <div className="dish-price-tag">
                          <span className="dish-price-currency">₹</span>
                          <span className="dish-price-number">{Number(f.price).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Card Body: Title & Clean Description */}
                      <div className="dish-body-content">
                        <h4 className="dish-card-title">{f.name}</h4>
                        <p className="dish-card-desc">
                          {f.description || "Freshly cooked to gourmet culinary perfection with organic herbs."}
                        </p>
                      </div>

                      {/* Card Footer: Full-Width Add Button or Quantity Stepper */}
                      <div className="dish-card-footer">
                        {inCart ? (
                          <div className="dish-qty-stepper-modern">
                            <button
                              type="button"
                              className="dish-stepper-btn minus"
                              onClick={() => updateQuantity(f._id || f.id, -1)}
                              title="Decrease quantity"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="dish-stepper-display">
                              <strong>{inCart.quantity}</strong> in Tray
                            </span>
                            <button
                              type="button"
                              className="dish-stepper-btn plus"
                              onClick={() => updateQuantity(f._id || f.id, 1)}
                              title="Increase quantity"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn-dish-add-modern"
                            onClick={() => addToCart(f)}
                          >
                            <Plus className="w-4 h-4 shrink-0" />
                            <span>+ Add to Tray</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Tray & Instant Billing */}
        <div id="food-billing-card" className="food-billing-section">
          <form onSubmit={handleGenerateBill} className="synaptix-main-card">
            {/* Quick jump to menu */}
            <div className="food-mobile-back-bar">
              <button
                type="button"
                className="btn-back-to-menu"
                onClick={() => {
                  document.getElementById("food-catalog-card")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                ↑ Back to Menu Dishes
              </button>
            </div>

            <div className="card-header-clean">
              <div>
                <span className="card-pretitle">STEP 2 • TABLE / ROOM & BILL</span>
                <h3 className="card-title-light">Order Tray & Customer Bill</h3>
                 
              </div>
            </div>

            {/* Order Destination Selector */}
            <div style={{ margin: "14px 0" }}>
              <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>
                Order Destination *
              </label>
              <div className="dest-toggle-group-modern">
                <button
                  type="button"
                  className={`dest-btn-modern ${orderType === "Table" ? "active" : ""}`}
                  onClick={() => setOrderType("Table")}
                >
                  Table Dine-In
                </button>
                <button
                  type="button"
                  className={`dest-btn-modern ${orderType === "Room" ? "active" : ""}`}
                  onClick={() => setOrderType("Room")}
                >
                  Room Service
                </button>
                <button
                  type="button"
                  className={`dest-btn-modern ${orderType === "Takeaway" ? "active" : ""}`}
                  onClick={() => setOrderType("Takeaway")}
                >
                  Takeaway
                </button>
              </div>

              {/* Destination Detail Inputs */}
              {orderType === "Table" && (
                <div className="desk-input-field" style={{ marginBottom: "12px" }}>
                  <label>Select Table</label>
                  <div className="input-wrap">
                    <UtensilsCrossed className="w-4 h-4 text-purple-400 shrink-0" />
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                        <option key={num} value={`Table ${num}`}>
                          Table {num} (Dining Hall)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {orderType === "Room" && (
                <div className="desk-input-field" style={{ marginBottom: "12px" }}>
                  <label>Select Occupied Guest Room</label>
                  <div className="input-wrap">
                    <DoorOpen className="w-4 h-4 text-purple-400 shrink-0" />
                    <select
                      value={selectedRoomNumber}
                      onChange={(e) => setSelectedRoomNumber(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Staying Guest Room --</option>
                      {occupiedRooms.map((r) => (
                        <option key={r._id || r.id} value={r.roomNumber}>
                          Room #{r.roomNumber} ({r.roomType})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="desk-input-field" style={{ marginBottom: "14px" }}>
                <label>Customer Name (Optional / Auto)</label>
                <div className="input-wrap">
                  <User className="w-4 h-4 text-purple-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="e.g. Mr. Karthik / Guest"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>
                  Selected Dishes ({cart.length})
                </span>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#F87171",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Clear Tray
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center", background: "var(--bg-card-inner)", borderRadius: "14px", border: "1px dashed var(--border-subtle)" }}>
                  <UtensilsCrossed className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-50" />
                  <p style={{ color: "var(--text-main)", fontSize: "13px", margin: "0 0 4px 0", fontWeight: "600" }}>Your order tray is empty</p>
                  <span style={{ color: "var(--text-dim)", fontSize: "11.5px", display: "block", marginBottom: "12px" }}>
                    Click "+ Add to Tray" on any dish in the menu to begin.
                  </span>
                  <button
                    type="button"
                    className="btn-back-to-menu"
                    onClick={() => setMobileTab("menu")}
                    style={{ margin: "0 auto", display: "inline-flex" }}
                  >
                    Browse Menu Catalog
                  </button>
                </div>
              ) : (
                <div className="order-tray-scroll">
                  {cart.map((item) => (
                    <div key={item.foodId} className="cart-item-row-modern">
                      {/* Line 1: Item Name (Left) + Line Total & Delete Button (Right) */}
                      <div className="cart-item-tier-top">
                        <div className="cart-item-name-block">
                          <span className="cart-item-name-text" title={item.name}>{item.name}</span>
                          <span className="cart-item-unit-rate">₹{item.price} each</span>
                        </div>
                        <div className="cart-item-total-block">
                          <span className="cart-item-total-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                          <button
                            type="button"
                            className="cart-item-delete-btn"
                            onClick={() => removeFromCart(item.foodId)}
                            title={`Remove ${item.name}`}
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Line 2: Quantity Stepper */}
                      <div className="cart-item-tier-bottom">
                        <span className="cart-item-qty-label">Quantity:</span>
                        <div className="cart-mini-stepper">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.foodId, -1)}
                            className="cart-mini-stepper-btn minus"
                            title="Decrease"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="cart-mini-stepper-value">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.foodId, 1)}
                            className="cart-mini-stepper-btn plus"
                            title="Increase"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment & Bill Summary */}
            <div className="bill-summary-card-modern">
              <div className="desk-input-field" style={{ marginBottom: "10px" }}>
                <label>Payment Method *</label>
                <div className="input-wrap">
                  <CreditCard className="w-4 h-4 text-purple-400 shrink-0" />
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="UPI">UPI (GPay / PhonePe / QR)</option>
                    <option value="Card">Credit / Debit Card</option>
                  </select>
                </div>
              </div>

              <div className="summary-row-item">
                <span>Items Subtotal:</span>
                <strong style={{ color: "var(--text-main)" }}>₹{subtotal.toLocaleString()}</strong>
              </div>
              <div className="summary-row-item">
                <span>GST (5% CGST + SGST):</span>
                <span>₹{gstTax.toLocaleString()}</span>
              </div>
              <div className="summary-row-item total">
                <span>Grand Total:</span>
                <span className="total-val">₹{grandTotal.toLocaleString()}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="btn-submit-booking-pass"
                style={{
                  marginTop: "12px",
                  background: cart.length > 0 ? "var(--primary-gradient)" : "var(--bg-card)",
                  color: cart.length > 0 ? "#FFFFFF" : "var(--text-dim)",
                  cursor: cart.length > 0 ? "pointer" : "not-allowed",
                  boxShadow: cart.length > 0 ? "0 4px 18px rgba(139, 92, 246, 0.45)" : "none",
                }}
              >
                {submitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin shrink-0" />
                    <span>Processing Payment & Bill...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 shrink-0" />
                    <span>
                      {cart.length > 0
                        ? `Print Bill & Settle (₹${grandTotal.toLocaleString()})`
                        : "Select Dishes to Order"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Floating Tray Bar: Shows item count & total price with 1-tap jump to billing */}
      {cart.length > 0 && (
        <div
          className="food-mobile-floating-bar"
          onClick={() => {
            document.getElementById("food-billing-card")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className="floating-bar-info">
            <div className="floating-bar-cart-icon">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div className="floating-bar-text-group">
              <span className="floating-bar-count">
                {totalCartCount} {totalCartCount === 1 ? "Item" : "Items"} in Tray
              </span>
              <span className="floating-bar-amount">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
          <div className="floating-bar-action">
            <span>Settle Bill</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* ============================================================
          LUXURY RESTAURANT BILL / DINING INVOICE MODAL
          ============================================================ */}
      {generatedBill && (
        <div
          className="synaptix-modal-backdrop"
          onClick={() => setGeneratedBill(null)}
        >
          <div
            className="synaptix-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", padding: "28px" }}
          >
            {/* Close Button */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
              <button
                type="button"
                onClick={() => setGeneratedBill(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px",
                }}
                aria-label="Close bill"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Restaurant Brand Banner */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <Crown className="w-10 h-10 text-amber-500 mx-auto mb-1" />
              <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "20px", fontWeight: "700", color: "var(--text-main)", margin: "0 0 2px 0" }}>
                RPN LUXURY DINING & BISTRO
              </h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px 0" }}>Fine Dining • Room Service • Gastronomy</p>
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
                OFFICIAL DINING TAX INVOICE
              </span>
            </div>

            {/* Bill Meta Row */}
            <div className="bill-modal-meta-grid">
              <div style={{ padding: "8px 12px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>INVOICE NUMBER</span>
                <strong style={{ fontSize: "13px", color: "var(--text-main)", fontFamily: "monospace" }}>{generatedBill.billNumber}</strong>
              </div>
              <div style={{ padding: "8px 12px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>ORDER TICKET</span>
                <strong style={{ fontSize: "13px", color: "var(--text-main)", fontFamily: "monospace" }}>{generatedBill.orderNumber}</strong>
              </div>
              <div style={{ padding: "8px 12px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>DATE & TIME</span>
                <strong style={{ fontSize: "12px", color: "var(--text-main)" }}>{generatedBill.dateTime}</strong>
              </div>
              <div style={{ padding: "8px 12px", background: "var(--bg-card-inner)", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>DESTINATION</span>
                <strong style={{ fontSize: "12px", color: "var(--text-main)" }}>{generatedBill.destination}</strong>
              </div>
            </div>

            {/* Guest & Cashier Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "12px", padding: "8px 12px", background: "var(--bg-card-inner)", borderRadius: "8px", border: "1px solid var(--border-subtle)", marginBottom: "16px", color: "var(--text-muted)" }}>
              <span>Billed to: <strong style={{ color: "var(--text-main)" }}>{generatedBill.customerName}</strong></span>
              <span>Billed by: <strong style={{ color: "var(--text-main)" }}>{generatedBill.serverName}</strong></span>
            </div>

            {/* Itemized Table */}
            <div style={{ overflowX: "auto", marginBottom: "16px" }}>
              <table className="synaptix-data-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Rate</th>
                    <th>Qty</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedBill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ color: "var(--text-main)", fontSize: "13px" }}>{item.name}</strong></td>
                      <td>₹{item.price}</td>
                      <td>{item.quantity}</td>
                      <td style={{ textAlign: "right", fontWeight: "700", color: "var(--accent)" }}>₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bill Totals Summary */}
            <div style={{ background: "var(--bg-card-inner)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
                <span>Subtotal</span>
                <strong style={{ color: "var(--text-main)" }}>₹{generatedBill.subtotal.toLocaleString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-muted)" }}>
                <span>GST Tax (5%)</span>
                <span>₹{generatedBill.gstTax.toLocaleString()}</span>
              </div>
              <div style={{ height: "1px", background: "var(--border-subtle)", margin: "2px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "15px", fontWeight: "700" }}>
                <span style={{ color: "var(--text-main)" }}>Total Amount Paid</span>
                <span style={{ color: "var(--accent)", fontSize: "20px", fontWeight: "800" }}>₹{generatedBill.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Paid Stamp & Notes */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "10px 14px", background: "rgba(52, 211, 153, 0.1)", border: "1px dashed rgba(52, 211, 153, 0.4)", borderRadius: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#34D399", letterSpacing: "0.06em" }}>PAID IN FULL</span>
                <small style={{ fontSize: "10.5px", color: "#6EE7B7" }}>{generatedBill.paymentMethod.toUpperCase()}</small>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, textAlign: "right" }}>
                Thank you for dining with RPN Luxury Hotel! Taxes included.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handlePrintBill}
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
                <span>Print Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setGeneratedBill(null)}
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
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
