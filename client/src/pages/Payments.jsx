import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/UserAvatar";
import {
  CreditCard,
  Search,
  Trash2,
  CheckCircle,
  Clock,
  RotateCw,
  AlertCircle,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  DoorOpen,
  UtensilsCrossed,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function Payments() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();
  const isAdmin = !admin?.role || admin.role.includes("Admin") || admin.role === "Super Admin";

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Fetch payments list
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/payments");
      const records = response.data?.data || response.data || [];

      const normalized = (Array.isArray(records) ? records : []).map((p) => {
        const guestName =
          p.customerName ||
          p.customer?.name ||
          p.booking?.customer?.name ||
          p.foodOrder?.customerName ||
          "Guest";

        const guestPhone =
          p.customer?.phone ||
          p.booking?.customer?.phone ||
          "-";

        const refNumber =
          p.booking?.bookingNumber ||
          p.foodOrder?.billNumber ||
          p.foodOrder?.orderNumber ||
          "-";

        return {
          id: p._id,
          paymentNumber: p.paymentNumber || `PAY-${String(p._id).slice(-6).toUpperCase()}`,
          department: p.department || (p.foodOrder ? "Food Desk" : "Room Desk"),
          amount: Number(p.amount || 0),
          method: p.paymentMethod || "UPI",
          status: p.status || "Paid",
          transactionId: p.transactionId || "-",
          guestName,
          guestPhone,
          refNumber,
          notes: p.notes || "",
          paymentDate: p.paymentDate || p.createdAt,
        };
      });

      setPayments(normalized);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load payment transactions.";
      setError(msg);
      toast.error(msg, "Error Loading Payments");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle Delete Payment (Strictly Admin Only)
  const handleDeletePayment = async (payment) => {
    if (!isAdmin) {
      toast.error("Permission Denied: Only Administrators can delete financial payment records.", "Access Restricted");
      return;
    }

    const ok = await confirm({
      title: "Delete Payment Transaction",
      message: `Are you sure you want to permanently delete receipt "${payment.paymentNumber}" for ₹${payment.amount.toLocaleString("en-IN")}? This transaction will be voided from ledger archives.`,
      confirmText: "Yes, Delete Record",
      cancelText: "Keep Record",
      type: "danger",
    });

    if (!ok) return;

    try {
      await api.delete(`/payments/${payment.id}`);
      toast.success(`Payment receipt ${payment.paymentNumber} has been deleted successfully.`, "Payment Deleted");
      fetchPayments();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete payment record.";
      toast.error(msg, "Delete Failed");
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase().trim();
    return payments.filter((p) => {
      const matchSearch =
        !q ||
        p.guestName.toLowerCase().includes(q) ||
        p.paymentNumber.toLowerCase().includes(q) ||
        p.refNumber.toLowerCase().includes(q) ||
        p.transactionId.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q);

      const matchDept = departmentFilter === "All" || p.department === departmentFilter;
      const matchMethod = methodFilter === "All" || p.method === methodFilter;
      const matchStatus = statusFilter === "All" || p.status === statusFilter;

      return matchSearch && matchDept && matchMethod && matchStatus;
    });
  }, [payments, search, departmentFilter, methodFilter, statusFilter]);

  // Financial Statistics
  const totalCount = payments.length;
  const paidPayments = useMemo(() => payments.filter((p) => p.status === "Paid"), [payments]);
  const totalRevenue = useMemo(
    () => paidPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [paidPayments]
  );

  const roomDeskRevenue = useMemo(
    () =>
      paidPayments
        .filter((p) => p.department === "Room Desk")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [paidPayments]
  );

  const foodDeskRevenue = useMemo(
    () =>
      paidPayments
        .filter((p) => p.department === "Food Desk")
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [paidPayments]
  );

  const pendingCount = useMemo(
    () => payments.filter((p) => p.status === "Pending").length,
    [payments]
  );

  // If not admin and somehow accessed, show access restricted banner
  if (!isAdmin) {
    return (
      <div className="synaptix-dashboard-root">
        <div className="synaptix-main-card" style={{ maxWidth: 640, margin: "80px auto", textAlign: "center", padding: "50px 30px" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Lock className="w-8 h-8 text-rose-500" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)", marginBottom: 10 }}>
            Executive Access Restricted
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
            The Payment Management ledger contains sensitive hotel revenue records and is strictly restricted to Administrators. Employees are only permitted to operate their assigned operational desks.
          </p>
          <span className="synaptix-ghost-pill" style={{ display: "inline-block" }}>
            Logged in as {admin?.role || "Staff Member"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="synaptix-dashboard-root">
      {/* Top Header & Action Pills (Exact Matches Dashboard & Staff Style) */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="synaptix-brand-tag">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>PAYMENTS & INVOICES</span>
          </div>
          <h1>Payment Transactions & Invoices</h1>
          <p>History of all room booking payments, restaurant dining bills, and receipts.</p>
        </div>

        <div className="synaptix-actions-bar">
          <div className="ai-active-pill">
            <span className="pulse-dot-purple"></span>
            <span>Ledger Active</span>
          </div>

          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchPayments}
            disabled={loading}
            title="Refresh payment transactions"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="synaptix-main-card"
          style={{
            borderColor: "rgba(239, 68, 68, 0.4)",
            background: "rgba(239, 68, 68, 0.08)",
            padding: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#FCA5A5",
          }}
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Synaptix Glowing KPI Cards (Exact Dashboard Style) */}
      <div className="synaptix-kpi-grid">
        {/* Total Hotel Revenue */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <DollarSign className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL HOTEL REVENUE</span>
          <div className="stat-main-number">₹{totalRevenue.toLocaleString("en-IN")}</div>
          <div className="stat-growth-tag positive">
            <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
            <span>Combined Departments</span>
          </div>
        </div>

        {/* Room Desk Revenue */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <DoorOpen className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 14 Q 20 18, 40 6 T 78 8" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">ROOM DESK REVENUE</span>
          <div className="stat-main-number">₹{roomDeskRevenue.toLocaleString("en-IN")}</div>
          <div className="stat-growth-tag positive">
            <span>{totalRevenue > 0 ? Math.round((roomDeskRevenue / totalRevenue) * 100) : 0}% Hotel Revenue Share</span>
          </div>
        </div>

        {/* Food Desk Revenue */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <UtensilsCrossed className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 8, 40 14 T 78 6" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">FOOD DESK REVENUE</span>
          <div className="stat-main-number">₹{foodDeskRevenue.toLocaleString("en-IN")}</div>
          <div className="stat-growth-tag positive">
            <span>{totalRevenue > 0 ? Math.round((foodDeskRevenue / totalRevenue) * 100) : 0}% Dining Revenue Share</span>
          </div>
        </div>

        {/* Receipts Settled */}
        <div className="synaptix-stat-card glow-emerald">
          <div className="card-top-spark">
            <div className="stat-symbol emerald">
              <CreditCard className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="sparkline-mini emerald">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 22 Q 22 10, 42 16 T 78 8" stroke="#34D399" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">SETTLED INVOICES</span>
          <div className="stat-main-number">{paidPayments.length}</div>
          <div className="stat-growth-tag neutral">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            <span>{pendingCount} Pending • {totalCount} Total</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Multi-Filters (Exact Toolbar Card Style) */}
      <div className="synaptix-toolbar-card">
        <div className="synaptix-search-input-wrap">
          <Search className="w-4 h-4 search-icon text-purple-400" />
          <input
            type="text"
            placeholder="Search by customer, receipt #, TXN ID, or booking/order ref..."
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
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="synaptix-select"
          >
            <option value="All">All Departments</option>
            <option value="Room Desk">🏨 Room Desk Only</option>
            <option value="Food Desk">🍽️ Food Desk Only</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="synaptix-select"
          >
            <option value="All">All Methods</option>
            <option value="UPI">UPI / QR Code</option>
            <option value="Card">Credit / Debit Card</option>
            <option value="Cash">Cash at Counter</option>
            <option value="Net Banking">Net Banking</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="synaptix-select"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">Paid / Settled</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="synaptix-main-card">
        <div className="card-header-clean">
          <div>
            <span className="card-pretitle">SETTLED INVOICES & RECEIPTS</span>
            <h3 className="card-title-light">
              Payment Transactions & Invoices ({filteredPayments.length})
            </h3>
            <p className="card-desc-muted">
              Receipts and settlement records for room stays and dining bills. Only Administrators hold deletion authority.
            </p>
          </div>
        </div>

        <div className="history-table-wrapper">
          <table className="synaptix-data-table">
            <thead>
              <tr>
                <th>Guest Profile</th>
                <th>Department</th>
                <th>Reference #</th>
                <th>Receipt & TXN ID</th>
                <th>Payment Mode</th>
                <th>Timestamp</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="table-state-cell">
                    <div className="empty-history-box" style={{ padding: 40 }}>
                      <RotateCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                      <h4>Loading Payment Ledger...</h4>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="table-state-cell">
                    <div className="empty-history-box">
                      <CreditCard className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
                      <h4>No Transactions Found</h4>
                      <p>No payment records match your active search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id}>
                    {/* Guest Profile with UserAvatar */}
                    <td>
                      <div className="table-guest-cell" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <UserAvatar name={p.guestName} size={38} />
                        <div>
                          <strong style={{ display: "block", color: "var(--text-main)", fontSize: 14 }}>
                            {p.guestName}
                          </strong>
                          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {p.guestPhone}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Department Badge */}
                    <td>
                      {p.department === "Food Desk" ? (
                        <span className="role-tag-badge food">🍽️ Food Desk</span>
                      ) : (
                        <span className="role-tag-badge room">🏨 Room Desk</span>
                      )}
                    </td>

                    {/* Reference # */}
                    <td>
                      <span className="token-hash-pill" title="Booking or Bill Reference">
                        {p.refNumber}
                      </span>
                    </td>

                    {/* Receipt & TXN ID */}
                    <td>
                      <div>
                        <strong style={{ display: "block", color: "var(--text-main)", fontSize: 12.5, fontFamily: "monospace" }}>
                          {p.paymentNumber}
                        </strong>
                        <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {p.transactionId}
                        </span>
                      </div>
                    </td>

                    {/* Payment Mode */}
                    <td>
                      <span className="payment-mode-pill">
                        {p.method}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "monospace" }}>
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }) : "-"}
                      </span>
                    </td>

                    {/* Amount */}
                    <td>
                      <span className="table-amount-purple">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td>
                      {p.status === "Paid" ? (
                        <span className="checkout-badge-done">
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                          Paid
                        </span>
                      ) : p.status === "Pending" ? (
                        <span className="status-badge-pending">
                          <Clock className="w-3.5 h-3.5 inline mr-1" />
                          Pending
                        </span>
                      ) : (
                        <span className="status-badge-inactive">
                          {p.status}
                        </span>
                      )}
                    </td>

                    {/* Admin Action: Delete Record */}
                    <td className="text-right">
                      {isAdmin && (
                        <button
                          type="button"
                          className="btn-action-icon delete"
                          onClick={() => handleDeletePayment(p)}
                          title="Delete Payment Record (Admin Only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-muted)" }}>
          <span>
            Showing <strong>{filteredPayments.length}</strong> of <strong>{totalCount}</strong> transactions
          </span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
            👑 Admin Authorized Deletion Enabled
          </span>
        </div>
      </div>
    </div>
  );
}
