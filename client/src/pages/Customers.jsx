import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import UserAvatar from "../components/UserAvatar";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  X,
  RotateCw,
  AlertCircle,
  UserCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

function Customers() {
  const { admin } = useAuth();
  const { confirm, toast } = useToast();
  const isAdmin = admin?.role === "Super Admin" || admin?.role === "Admin";
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch customers from backend
  async function fetchCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");
      const records = response.data?.data || response.data || [];

      setCustomers(
        records.map((customer) => ({
          ...customer,
          id: customer._id,
          city: customer.address || "",
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  function resetForm() {
    setName("");
    setPhone("");
    setEmail("");
    setCity("");
    setEditingId(null);
    setIsFormOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedCity = city.trim();

    if (
      !trimmedName ||
      !/^\d{10}$/.test(trimmedPhone) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) ||
      !trimmedCity
    ) {
      toast.warning("Please enter a valid name, 10-digit phone, valid email, and city.", "Validation Required");
      return;
    }

    const duplicatePhone = customers.some(
      (customer) => customer.phone === trimmedPhone && customer.id !== editingId
    );

    if (duplicatePhone) {
      toast.error("This phone number is already registered with another customer.", "Duplicate Phone");
      return;
    }

    const duplicateEmail = customers.some(
      (customer) =>
        customer.email?.toLowerCase() === trimmedEmail.toLowerCase() &&
        customer.id !== editingId
    );

    if (duplicateEmail) {
      toast.error("This email is already registered with another customer.", "Duplicate Email");
      return;
    }

    const customerData = {
      name: trimmedName,
      phone: trimmedPhone,
      email: trimmedEmail,
      address: trimmedCity,
    };

    try {
      setError("");

      if (editingId !== null) {
        await api.put(`/customers/${editingId}`, customerData);
        toast.success(`Guest profile for ${trimmedName} updated.`, "Profile Updated");
      } else {
        await api.post("/customers", customerData);
        toast.success(`New guest ${trimmedName} registered successfully!`, "Guest Registered");
      }

      await fetchCustomers();
      resetForm();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unable to save customer.";
      setError(msg);
      toast.error(msg, "Error Saving Guest");
    }
  }

  function handleEditCustomer(customer) {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
    setEmail(customer.email);
    setCity(customer.city);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDeleteCustomer(id) {
    if (!isAdmin) {
      toast.error("Access Restricted: Only Administrators can delete guest profiles.", "Permission Denied");
      return;
    }

    const target = customers.find((c) => c.id === id);
    const guestName = target ? target.name : "this guest";

    const ok = await confirm({
      title: "Delete Guest Record",
      message: `Are you sure you want to delete ${guestName}'s record? All associated reservation logs may be affected.`,
      confirmText: "Yes, Delete Record",
      cancelText: "Keep Record",
      type: "danger",
    });

    if (!ok) return;

    try {
      setError("");
      await api.delete(`/customers/${id}`);
      if (editingId === id) resetForm();
      await fetchCustomers();
      toast.success(`Guest record for ${guestName} deleted.`, "Record Deleted");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Unable to delete customer.";
      setError(msg);
      toast.error(msg, "Error Deleting Guest");
    }
  }

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q))
      );
    });
  }, [customers, search]);

  const getInitials = (str) => {
    if (!str) return "G";
    return str
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const totalCount = customers.length;
  const recentThisMonth = customers.filter((c) => {
    if (!c.createdAt) return false;
    const d = new Date(c.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const phoneCount = customers.filter((c) => c.phone && c.phone.length === 10).length;
  const uniqueCitiesCount = new Set(customers.map((c) => c.city?.toLowerCase().trim()).filter(Boolean)).size;

  return (
    <div className="synaptix-dashboard-root">
      {/* Top Header (Matches Dashboard Style) */}
      <div className="synaptix-top-header">
        <div className="synaptix-welcome-text">
          <div className="synaptix-brand-tag">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>GUEST HOSPITALITY DIRECTORY</span>
          </div>
          <h1>Guest Directory & Profiles</h1>
          <p>Verified guest contact records, stay histories, and registered membership profiles</p>
        </div>

        <div className="synaptix-actions-bar">
          <button
            type="button"
            className="synaptix-ghost-pill"
            onClick={fetchCustomers}
            title="Refresh guest records"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh Guests</span>
          </button>

          <button
            type="button"
            className={`synaptix-tab-pill ${isFormOpen ? "active" : ""}`}
            onClick={() => {
              if (isFormOpen && editingId === null) {
                setIsFormOpen(false);
              } else {
                resetForm();
                setIsFormOpen(true);
              }
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
                <span>Add Guest</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Synaptix Glowing KPI Cards (Exact Dashboard Style) */}
      <div className="synaptix-kpi-grid">
        {/* Total Registered Guests */}
        <div className="synaptix-stat-card glow-purple">
          <div className="card-top-spark">
            <div className="stat-symbol purple">
              <Users className="w-5 h-5 text-purple-300" />
            </div>
            <div className="sparkline-mini purple">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 20 Q 20 8, 40 16 T 78 4" stroke="#C084FC" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">TOTAL REGISTERED GUESTS</span>
          <div className="stat-main-number">{totalCount}</div>
          <div className="stat-growth-tag positive">
            <ArrowUpRight className="w-3.5 h-3.5 inline mr-1" />
            <span>Active Guest Profiles</span>
          </div>
        </div>

        {/* New Arrivals This Month */}
        <div className="synaptix-stat-card glow-emerald">
          <div className="card-top-spark">
            <div className="stat-symbol emerald">
              <UserCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="sparkline-mini emerald">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 14 Q 20 18, 40 6 T 78 8" stroke="#34D399" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">NEW ARRIVALS THIS MONTH</span>
          <div className="stat-main-number">{recentThisMonth}</div>
          <div className="stat-growth-tag positive">
            <span>Recent Guest Check-Ins</span>
          </div>
        </div>

        {/* Verified Phone Contacts */}
        <div className="synaptix-stat-card glow-cyan">
          <div className="card-top-spark">
            <div className="stat-symbol cyan">
              <Phone className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="sparkline-mini cyan">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 18 Q 20 22, 40 8 T 78 6" stroke="#38BDF8" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">VERIFIED PHONE CONTACTS</span>
          <div className="stat-main-number">{phoneCount}</div>
          <div className="stat-growth-tag">
            <span>Direct SMS & WhatsApp Pass</span>
          </div>
        </div>

        {/* Distinct Metro Cities */}
        <div className="synaptix-stat-card glow-orange">
          <div className="card-top-spark">
            <div className="stat-symbol orange">
              <MapPin className="w-5 h-5 text-orange-300" />
            </div>
            <div className="sparkline-mini orange">
              <svg viewBox="0 0 80 28" fill="none" width="80" height="28" style={{ width: "80px", height: "28px", display: "block" }}>
                <path d="M2 16 Q 20 5, 40 18 T 78 2" stroke="#FB923C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
          </div>
          <span className="stat-caption">METRO RESIDENCE CITIES</span>
          <div className="stat-main-number">{uniqueCitiesCount}</div>
          <div className="stat-growth-tag positive">
            <span>Locations Recorded</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="modern-alert-banner alert-error" role="alert">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Guest Profile Form */}
      {isFormOpen && (
        <div className="synaptix-main-card">
          <div className="card-header-clean">
            <div>
              <span className="card-pretitle">PROFILE REGISTRATION</span>
              <h3 className="card-title-light">
                {editingId !== null ? "Edit Guest Information" : "Register New Guest Profile"}
              </h3>
              <p className="card-desc-muted">
                Save guest details for expedited check-in, token passes, and loyalty hospitality records.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="synaptix-form-grid">
            <div className="synaptix-form-field">
              <label htmlFor="cust-name">Full Legal Name *</label>
              <div className="input-wrap">
                <input
                  id="cust-name"
                  type="text"
                  placeholder="e.g. Anandha Krishnan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="cust-phone">Mobile Phone (10 digits) *</label>
              <div className="input-wrap">
                <input
                  id="cust-phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="cust-email">Email Address *</label>
              <div className="input-wrap">
                <input
                  id="cust-email"
                  type="email"
                  placeholder="e.g. guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-field">
              <label htmlFor="cust-city">City / Native Address *</label>
              <div className="input-wrap">
                <input
                  id="cust-city"
                  type="text"
                  placeholder="e.g. Chennai, Bangalore, Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="synaptix-form-actions">
              <button
                type="button"
                className="btn-modern-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-modern-primary"
                disabled={loading}
              >
                {editingId !== null ? "Update Guest Profile" : "Save Guest Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar Search (Synaptix Card Style) */}
      <div className="synaptix-toolbar-card">
        <div className="synaptix-search-input-wrap">
          <Search className="w-4 h-4 text-purple-400" />
          <input
            type="text"
            placeholder="Search by guest name, mobile phone, email, or city..."
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
      </div>

      {/* Guest Directory Table Card (Matches Synaptix Stay History Table) */}
      <div className="synaptix-main-card">
        <div className="card-header-clean">
          <div>
            <span className="card-pretitle">HOSPITALITY DIRECTORY</span>
            <h3 className="card-title-light">
              Guest Profiles & Contact Records ({filteredCustomers.length})
            </h3>
            <p className="card-desc-muted">
              Complete archive of registered hotel guests. Administrators can view, update, and manage records.
            </p>
          </div>
        </div>

        <div className="desktop-table-view">
          <div className="history-table-wrapper">
            <table className="synaptix-data-table">
              <thead>
                <tr>
                  <th>Guest Profile</th>
                  <th>Phone Number</th>
                  <th>Email Address</th>
                  <th>Location / City</th>
                  <th>Member Since</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="table-state-cell">
                      <div className="empty-history-box" style={{ padding: 40 }}>
                        <RotateCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                        <h4>Loading Guest Directory...</h4>
                      </div>
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-state-cell">
                      <div className="empty-history-box">
                        <Users className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
                        <h4>No Guests Found</h4>
                        <p>Try searching with another keyword or register a new guest above.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => (
                    <tr key={cust.id}>
                      <td>
                        <div className="table-guest-cell" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <UserAvatar
                            name={cust.name}
                            size={42}
                          />
                          <div>
                            <strong style={{ display: "block", color: "var(--text-main)", fontSize: 14.5 }}>
                              {cust.name}
                            </strong>
                            <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                              Guest ID #{String(cust.id || "").slice(-5)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="contact-pill-synaptix" title={`Phone: ${cust.phone}`}>
                          <Phone className="w-3.5 h-3.5 text-purple-400" />
                          <span>{cust.phone}</span>
                        </div>
                      </td>

                      <td>
                        <div className="contact-pill-synaptix" title={`Email: ${cust.email}`}>
                          <Mail className="w-3.5 h-3.5 text-purple-400" />
                          <span>{cust.email}</span>
                        </div>
                      </td>

                      <td>
                        <div className="contact-pill-synaptix" title={`City: ${cust.city || "-"}`}>
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          <span>{cust.city || "Tamil Nadu"}</span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {cust.createdAt
                            ? new Date(cust.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "VIP Member"}
                        </span>
                      </td>

                      <td className="text-right">
                        <div style={{ display: "inline-flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            onClick={() => handleEditCustomer(cust)}
                            title="Update Guest Contact Details"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {isAdmin ? (
                            <button
                              type="button"
                              className="btn-action-icon delete"
                              onClick={() => handleDeleteCustomer(cust.id)}
                              title="Delete Customer (Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
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
                              Protected
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

        {/* Mobile View: High-End Responsive Guest Profile Cards */}
        <div className="mobile-guests-cards-view">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <RotateCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
              <h4 style={{ color: "var(--text-main)", fontSize: "14px", margin: 0 }}>Loading Guest Directory...</h4>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-60" />
              <h4 style={{ color: "var(--text-main)", fontSize: "15px", margin: "0 0 4px 0" }}>No Guests Found</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: 0 }}>Try searching with another keyword or register a new guest above.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => (
              <div key={cust.id} className="mobile-guest-profile-card">
                <div className="guest-profile-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <UserAvatar name={cust.name} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block", color: "var(--text-main)", fontSize: "14.5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cust.name}
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Guest ID #{String(cust.id || "").slice(-5)}
                      </span>
                    </div>
                  </div>

                  <span className="guest-member-badge">
                    {cust.createdAt
                      ? new Date(cust.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "VIP Member"}
                  </span>
                </div>

                <div className="guest-profile-contact-list">
                  <a
                    href={`tel:${cust.phone}`}
                    className="guest-contact-touch-pill"
                    title="Tap to Call"
                  >
                    <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{cust.phone}</span>
                  </a>

                  <a
                    href={`mailto:${cust.email}`}
                    className="guest-contact-touch-pill"
                    title="Tap to Email"
                  >
                    <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{cust.email}</span>
                  </a>

                  <div className="guest-contact-touch-pill">
                    <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>{cust.city || "Tamil Nadu"}</span>
                  </div>
                </div>

                <div className="guest-profile-card-footer">
                  <span style={{ fontSize: "11.5px", color: "var(--text-dim)" }}>
                    Verified Guest Record
                  </span>

                  <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      className="guest-mgmt-btn edit"
                      onClick={() => handleEditCustomer(cust)}
                      title="Update Guest Contact Details"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Profile</span>
                    </button>
                    {isAdmin ? (
                      <button
                        type="button"
                        className="guest-mgmt-btn delete"
                        onClick={() => handleDeleteCustomer(cust.id)}
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "var(--text-dim)",
                          background: "var(--bg-card)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        Protected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", fontSize: 12, color: "var(--text-muted)" }}>
          <span>
            Showing <strong>{filteredCustomers.length}</strong> of <strong>{totalCount}</strong> total guests
          </span>
          <span>Verified Directory • RPN Hospitality</span>
        </div>
      </div>
    </div>
  );
}

export default Customers;
