import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  ReceiptText,
  Plus,
  Search,
  Trash2,
  Clock,
  CheckCircle2,
  ChefHat,
  X,
  RotateCw,
  AlertCircle,
  Utensils,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";

function FoodOrders() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();
  const isAdmin = !admin?.role || admin.role.includes("Admin") || admin.role === "Super Admin";
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [selectedFood, setSelectedFood] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch foods and orders
  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [foodRes, orderRes] = await Promise.all([
        api.get("/foods"),
        api.get("/food-orders"),
      ]);

      const foodRecords = foodRes.data?.data || foodRes.data || [];
      const orderRecords = orderRes.data?.data || orderRes.data || [];

      const availableFoods = foodRecords.filter((food) => food.isAvailable);
      setFoods(availableFoods);

      setOrders(
        orderRecords.map((order) => ({
          ...order,
          id: order._id,
          tableNumber: order.notes?.match(/^Table:\s*(.+?)(?:\n|$)/)?.[1] || "Counter",
          total: order.totalAmount,
          items: order.items || [],
        }))
      );

      setSelectedFood((curr) => {
        if (availableFoods.some((f) => f._id === curr)) return curr;
        return availableFoods[0]?._id || "";
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // Live item total calculation
  const livePrice = useMemo(() => {
    const food = foods.find((f) => f._id === selectedFood);
    if (!food) return 0;
    return (Number(food.price) || 0) * (Number(quantity) || 1);
  }, [foods, selectedFood, quantity]);

  // Create order
  async function handleAddOrder(event) {
    event.preventDefault();

    const qty = Number(quantity);
    const table = Number(tableNumber);

    if (!selectedFood || !Number.isInteger(qty) || qty < 1 || !Number.isInteger(table) || table < 1) {
      toast.warning("Please enter a valid table/room number and positive quantity.", "Order Validation");
      return;
    }

    const food = foods.find((item) => item._id === selectedFood);
    if (!food) {
      toast.warning("Please select an available dish from the menu.", "Dish Selection Required");
      return;
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const orderData = {
      orderNumber,
      customerName: "Dine-in Guest",
      items: [
        {
          food: food._id,
          quantity: qty,
        },
      ],
      status: "Pending",
      paymentStatus: "Pending",
      notes: `Table: ${table}`,
    };

    try {
      setSaving(true);
      setError("");

      await api.post("/food-orders", orderData);
      setTableNumber("");
      setQuantity(1);
      setIsFormOpen(false);
      await fetchData();
      toast.success(`Kitchen order ${orderNumber} has been dispatched!`, "Order Placed");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to place order";
      setError(msg);
      toast.error(msg, "Order Failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(orderId, newStatus) {
    const backendStatus = newStatus === "Served" ? "Delivered" : newStatus;
    try {
      await api.put(`/food-orders/${orderId}`, { status: backendStatus });
      await fetchData();
      toast.success(`Order status updated to ${newStatus}.`, "Order Updated");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update status";
      toast.error(msg, "Status Update Failed");
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!isAdmin) {
      toast.error("Access Restricted: Only Administrators can cancel or delete food orders.", "Permission Denied");
      return;
    }

    const target = orders.find((o) => o._id === orderId);
    const ref = target?.orderNumber || "this order";

    const ok = await confirm({
      title: "Cancel Food Order",
      message: `Are you sure you want to cancel kitchen order ${ref}?`,
      confirmText: "Yes, Cancel Order",
      cancelText: "Keep Order",
      type: "danger",
    });

    if (!ok) return;

    try {
      await api.delete(`/food-orders/${orderId}`);
      await fetchData();
      toast.success(`Order ${ref} has been cancelled.`, "Order Removed");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete order";
      toast.error(msg, "Cancellation Failed");
    }
  }

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      const matchSearch =
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.tableNumber && o.tableNumber.toLowerCase().includes(q)) ||
        (o.status && o.status.toLowerCase().includes(q));
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const preparingCount = orders.filter((o) => o.status === "Preparing").length;
  const readyCount = orders.filter((o) => o.status === "Ready").length;

  return (
    <div className="synaptix-dashboard-root">
      {/* Page Header */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="ai-active-pill">
            <ReceiptText className="spark-icon" />
            <span>KITCHEN DISPATCH & BILLS</span>
          </div>
          <h1 className="welcome-title">Kitchen Orders & Dining Tickets</h1>
          <p className="welcome-subtitle">
            Track kitchen preparation tickets, table assignments, and meal service progress in real time.
          </p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchData}
            title="Refresh orders"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
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
                <span>Place Order</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Glowing Synaptix Cards) */}
      <div className="synaptix-kpi-grid">
        {/* Total Orders */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <ReceiptText className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL ORDERS</span>
          <div className="stat-main-number">{totalCount}</div>
          <div className="stat-growth-tag positive">
            <span>Kitchen tickets placed</span>
          </div>
        </div>

        {/* Pending Queue */}
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
          <span className="stat-caption">PENDING QUEUE</span>
          <div className="stat-main-number">{pendingCount}</div>
          <div className="stat-growth-tag positive">
            <span>Awaiting chef pickup</span>
          </div>
        </div>

        {/* In Preparation */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <ChefHat className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">IN PREPARATION</span>
          <div className="stat-main-number">{preparingCount}</div>
          <div className="stat-growth-tag positive">
            <span>Currently cooking</span>
          </div>
        </div>

        {/* Ready for Service */}
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
          <span className="stat-caption">READY FOR SERVICE</span>
          <div className="stat-main-number">{readyCount}</div>
          <div className="stat-growth-tag positive">
            <span>Ready for dispatch</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 18px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#F87171", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Floating / Collapsible Form Card */}
      {isFormOpen && (
        <div className="synaptix-main-card" style={{ marginBottom: "24px" }}>
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">NEW KITCHEN ORDER</span>
              <h3 className="card-title-light">Create Order Ticket</h3>
              <p className="card-desc-muted">Dispatch dishes directly to the kitchen preparation queue.</p>
            </div>
          </div>

          <form onSubmit={handleAddOrder} className="synaptix-form-grid">
            <div className="desk-input-field">
              <label>Table / Room Number *</label>
              <div className="input-wrap">
                <Utensils className="w-4 h-4 text-purple-400" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 4 (Dining Table)"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Select Dish *</label>
              <div className="input-wrap">
                <ChefHat className="w-4 h-4 text-purple-400" />
                <select
                  value={selectedFood}
                  onChange={(e) => setSelectedFood(e.target.value)}
                  required
                >
                  {foods.length === 0 ? (
                    <option value="">No items available</option>
                  ) : (
                    foods.map((food) => (
                      <option key={food._id} value={food._id}>
                        {food.name} (₹{food.price})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="desk-input-field">
              <label>Quantity *</label>
              <div className="input-wrap">
                <Plus className="w-4 h-4 text-purple-400" />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="desk-input-field">
              <label>Order Item Subtotal</label>
              <div style={{ height: "44px", background: "var(--bg-card-inner)", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total:</span>
                <strong style={{ color: "var(--accent)", fontSize: "16px" }}>₹{livePrice.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                className="synaptix-ghost-pill"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || foods.length === 0}
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
                {saving ? "Placing Order..." : "Send Ticket to Kitchen"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar: Search & Status Filter Card */}
      <div className="synaptix-toolbar-card">
        <div className="synaptix-search-input-wrap">
          <Search className="search-icon w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search by table or order ID..."
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
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="synaptix-main-card">
        <div className="card-header-clean">
          <div>
            <span className="card-pretitle">KITCHEN QUEUE DISPATCH</span>
            <h3 className="card-title-light">Dining Orders ({filteredOrders.length})</h3>
            <p className="card-desc-muted">Real-time status of dining table tickets, orders, and delivery status.</p>
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="desktop-table-view table-responsive" style={{ overflowX: "auto" }}>
          <table className="synaptix-data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Destination</th>
                <th>Ordered Items</th>
                <th>Total</th>
                <th>Order Progress</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
                      <RotateCw className="w-5 h-5 animate-spin text-purple-400" />
                      <span>Loading kitchen orders...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "40px" }}>
                    <ReceiptText className="w-10 h-10 text-purple-400 opacity-50 mx-auto mb-2" />
                    <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0" }}>No orders active right now</h4>
                    <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "12px" }}>Create a new order ticket to begin kitchen prep.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
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
                        {order.orderNumber || order.id.substring(order.id.length - 6).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="room-number-pill" style={{ fontSize: "12.5px", padding: "4px 10px", background: "var(--bg-card-inner)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                        Table {order.tableNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {order.items && order.items.length > 0 ? (
                          order.items.map((it, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: "var(--bg-card-inner)",
                                border: "1px solid var(--border-subtle)",
                                fontSize: "11.5px",
                                color: "var(--text-main)",
                              }}
                            >
                              {it.quantity}x {it.food?.name || "Dish"}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Standard Order</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: "700", color: "var(--accent)", fontSize: "14px" }}>
                        ₹{Number(order.total || 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
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
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Ready">Ready</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isAdmin ? (
                        <button
                          type="button"
                          className="btn-action-icon delete"
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Cancel Order (Admin Only)"
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            color: "#F87171",
                            display: "inline-grid",
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
                        <span style={{ fontSize: "11px", color: "var(--text-dim)" }}>Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Kitchen Order Ticket Cards (Zero Horizontal Scroll) */}
        <div className="mobile-orders-cards-view">
          {loading ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
              <RotateCw className="w-5 h-5 animate-spin text-purple-400 mx-auto mb-2" />
              <span>Loading kitchen orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", background: "var(--bg-card-inner)", borderRadius: "14px", border: "1px dashed var(--border-subtle)" }}>
              <ReceiptText className="w-8 h-8 text-purple-400 opacity-50 mx-auto mb-2" />
              <h4 style={{ color: "var(--text-main)", margin: "0 0 4px 0", fontSize: "14px" }}>No orders active</h4>
              <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "11.5px" }}>Create a new order ticket to begin kitchen prep.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="mobile-order-ticket-card">
                {/* Header: Order ID & Progress Status Select */}
                <div className="order-ticket-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className="order-ticket-id">
                      {order.orderNumber || order.id.substring(order.id.length - 6).toUpperCase()}
                    </span>
                    <span className="order-ticket-table">Table {order.tableNumber}</span>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="order-status-select"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>

                {/* Items Ordered List */}
                <div className="order-ticket-items">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <span key={idx} className="order-item-badge">
                        <strong>{it.quantity}x</strong> {it.food?.name || "Dish"}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--text-dim)" }}>Standard Order</span>
                  )}
                </div>

                {/* Footer: Total Amount & Admin Delete */}
                <div className="order-ticket-footer">
                  <div className="order-ticket-amount-group">
                    <span className="order-ticket-amount-label">Bill Total:</span>
                    <strong className="order-ticket-total">₹{Number(order.total || 0).toLocaleString("en-IN")}</strong>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      className="order-ticket-cancel-btn"
                      onClick={() => handleDeleteOrder(order.id)}
                      title="Cancel Order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-subtle)", fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
          <span>
            Showing <strong style={{ color: "var(--text-main)" }}>{filteredOrders.length}</strong> of{" "}
            <strong style={{ color: "var(--text-main)" }}>{totalCount}</strong> dining orders
          </span>
          <span style={{ color: "var(--text-dim)" }}>Kitchen Queue Live</span>
        </div>
      </div>
    </div>
  );
}

export default FoodOrders;
