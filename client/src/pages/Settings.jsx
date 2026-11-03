import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const { admin: authAdmin, updateAdminProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState("hotel");

  const [hotel, setHotel] = useState({
    hotelName: "",
    email: "",
    phone: "",
    address: "",
    currency: "INR",
    checkIn: "12:00",
    checkOut: "11:00",
    taxPercentage: 5,
    cancellationPolicy: "",
  });

  const [admin, setAdmin] = useState({
    name: "Administrator",
    email: "admin@hotel.com",
    phone: "",
  });

  useEffect(() => {
    if (authAdmin) {
      setAdmin({
        name: authAdmin.name || "Administrator",
        email: authAdmin.email || "admin@hotel.com",
        phone: authAdmin.phone || "",
      });
    }
  }, [authAdmin]);

  const [notifications, setNotifications] = useState({
    bookings: true,
    payments: true,
    foodOrders: true,
    staffUpdates: false,
  });

  const [passwords, setPasswords] = useState({
    current: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // FETCH SETTINGS
  async function fetchSettings() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/settings");
      const data = response.data.data;

      setHotel({
        hotelName: data.hotelName || "",
        email: data.hotelEmail || "",
        phone: data.hotelPhone || "",
        address: data.hotelAddress || "",
        currency: data.currency || "INR",
        checkIn: data.checkInTime || "12:00",
        checkOut: data.checkOutTime || "11:00",
        taxPercentage: data.taxPercentage ?? 5,
        cancellationPolicy: data.cancellationPolicy || "",
      });

      setNotifications({
        bookings: data.notifications?.bookings ?? true,
        payments: data.notifications?.payments ?? true,
        foodOrders: data.notifications?.foodOrders ?? true,
        staffUpdates: data.notifications?.staffUpdates ?? false,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load settings. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  // HOTEL FORM CHANGE
  function handleHotelChange(event) {
    const { name, value } = event.target;

    setHotel((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // ADMIN FORM CHANGE
  function handleAdminChange(event) {
    const { name, value } = event.target;

    setAdmin((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // SAVE HOTEL AND GENERAL SETTINGS
  async function saveHotelSettings(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        hotelName: hotel.hotelName.trim(),
        hotelEmail: hotel.email.trim(),
        hotelPhone: hotel.phone.trim(),
        hotelAddress: hotel.address.trim(),
        currency: hotel.currency,
        checkInTime: hotel.checkIn,
        checkOutTime: hotel.checkOut,
        taxPercentage: Number(hotel.taxPercentage),
        cancellationPolicy: hotel.cancellationPolicy.trim(),
      };

      const response = await api.put("/settings", payload);
      const data = response.data.data;

      setHotel((previous) => ({
        ...previous,
        hotelName: data.hotelName || "",
        email: data.hotelEmail || "",
        phone: data.hotelPhone || "",
        address: data.hotelAddress || "",
        currency: data.currency || "INR",
        checkIn: data.checkInTime || "12:00",
        checkOut: data.checkOutTime || "11:00",
        taxPercentage: data.taxPercentage ?? 5,
        cancellationPolicy: data.cancellationPolicy || "",
      }));

      setMessage("Settings saved successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  // SAVE NOTIFICATIONS
  async function saveNotifications() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.put("/settings", {
        notifications,
      });

      setMessage("Notification preferences saved successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save notification preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  // ADMIN PROFILE
  async function saveAdminSettings(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await updateAdminProfile({
        name: admin.name.trim(),
        email: admin.email.trim(),
        phone: (admin.phone || "").trim(),
      });

      setMessage("Admin profile updated and saved to MongoDB successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update admin profile."
      );
    } finally {
      setSaving(false);
    }
  }

  // PASSWORD FORM
  async function handlePasswordChange(event) {
    event.preventDefault();

    if (
      !passwords.current ||
      !passwords.newPassword ||
      !passwords.confirmPassword
    ) {
      setError("Please fill in all password fields.");
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError("New password must contain at least 6 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await changePassword(passwords.current, passwords.newPassword);
      setMessage("Admin password changed successfully!");

      setPasswords({
        current: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to change password."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="settings-page">
      <div className="settings-header">
        <div>
          <span className="settings-eyebrow">ADMINISTRATION</span>
          <h1>Settings</h1>
          <p>Manage your hotel information and preferences.</p>
        </div>

        <div className="settings-header-icon">⚙️</div>
      </div>

      {/* SUCCESS MESSAGE */}
      {message && (
        <div className="settings-message" role="status">
          <span>✓</span>
          {message}

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && (
        <div className="settings-message" role="alert">
          <span>⚠️</span>
          {error}

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading settings...</p>
      ) : (
        <div className="settings-layout">
          {/* SIDEBAR */}
          <aside className="settings-sidebar">
            <div className="settings-profile">
              <div className="settings-avatar">
                {(admin.name || "A").charAt(0).toUpperCase()}
              </div>

              <div>
                <h3>{admin.name || "Administrator"}</h3>
                <p>Hotel Administrator</p>
              </div>
            </div>

            <button
              type="button"
              className={activeTab === "hotel" ? "active" : ""}
              onClick={() => setActiveTab("hotel")}
            >
              <span>🏨</span> Hotel Information
            </button>

            <button
              type="button"
              className={activeTab === "general" ? "active" : ""}
              onClick={() => setActiveTab("general")}
            >
              <span>🌐</span> General Settings
            </button>

            <button
              type="button"
              className={activeTab === "profile" ? "active" : ""}
              onClick={() => setActiveTab("profile")}
            >
              <span>👤</span> Admin Profile
            </button>

            <button
              type="button"
              className={
                activeTab === "notifications" ? "active" : ""
              }
              onClick={() => setActiveTab("notifications")}
            >
              <span>🔔</span> Notifications
            </button>

            <button
              type="button"
              className={activeTab === "security" ? "active" : ""}
              onClick={() => setActiveTab("security")}
            >
              <span>🔒</span> Security
            </button>
          </aside>

          {/* CONTENT */}
          <div className="settings-content">
            {/* HOTEL INFORMATION */}
            {activeTab === "hotel" && (
              <form onSubmit={saveHotelSettings}>
                <div className="settings-card-heading">
                  <div>
                    <h2>Hotel Information</h2>
                    <p>
                      Update your hotel's basic contact information.
                    </p>
                  </div>

                  <span>🏨</span>
                </div>

                <div className="settings-form-grid">
                  <label>
                    Hotel Name

                    <input
                      name="hotelName"
                      value={hotel.hotelName}
                      onChange={handleHotelChange}
                      placeholder="Enter hotel name"
                      required
                    />
                  </label>

                  <label>
                    Contact Email

                    <input
                      type="email"
                      name="email"
                      value={hotel.email}
                      onChange={handleHotelChange}
                      placeholder="hotel@example.com"
                      required
                    />
                  </label>

                  <label>
                    Phone Number

                    <input
                      type="tel"
                      name="phone"
                      value={hotel.phone}
                      onChange={handleHotelChange}
                      placeholder="Enter phone number"
                    />
                  </label>

                  <label>
                    Currency

                    <select
                      name="currency"
                      value={hotel.currency}
                      onChange={handleHotelChange}
                    >
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                    </select>
                  </label>

                  <label className="settings-full-width">
                    Hotel Address

                    <textarea
                      name="address"
                      value={hotel.address}
                      onChange={handleHotelChange}
                      placeholder="Enter complete hotel address"
                      rows="3"
                    />
                  </label>
                </div>

                <div className="settings-form-footer">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Hotel Information"}
                  </button>
                </div>
              </form>
            )}

            {/* GENERAL SETTINGS */}
            {activeTab === "general" && (
              <form onSubmit={saveHotelSettings}>
                <div className="settings-card-heading">
                  <div>
                    <h2>General Settings</h2>
                    <p>
                      Configure your hotel's operating preferences.
                    </p>
                  </div>

                  <span>🌐</span>
                </div>

                <div className="settings-form-grid">
                  <label>
                    Hotel Name

                    <input
                      name="hotelName"
                      value={hotel.hotelName}
                      onChange={handleHotelChange}
                      required
                    />
                  </label>

                  <label>
                    Currency

                    <select
                      name="currency"
                      value={hotel.currency}
                      onChange={handleHotelChange}
                    >
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                    </select>
                  </label>

                  <label>
                    Tax Percentage (%)

                    <input
                      type="number"
                      name="taxPercentage"
                      min="0"
                      max="100"
                      step="0.01"
                      value={hotel.taxPercentage}
                      onChange={handleHotelChange}
                      required
                    />
                  </label>

                  <label>
                    Check-in Time

                    <input
                      type="time"
                      name="checkIn"
                      value={hotel.checkIn}
                      onChange={handleHotelChange}
                      required
                    />
                  </label>

                  <label>
                    Check-out Time

                    <input
                      type="time"
                      name="checkOut"
                      value={hotel.checkOut}
                      onChange={handleHotelChange}
                      required
                    />
                  </label>

                  <label className="settings-full-width">
                    Cancellation Policy

                    <textarea
                      name="cancellationPolicy"
                      value={hotel.cancellationPolicy}
                      onChange={handleHotelChange}
                      placeholder="Enter cancellation policy"
                      rows="3"
                    />
                  </label>
                </div>

                <div className="settings-info-box">
                  <span>ℹ️</span>

                  <p>
                    These are configuration preferences. Changing
                    them does not automatically recalculate existing
                    bookings or payments.
                  </p>
                </div>

                <div className="settings-form-footer">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save General Settings"}
                  </button>
                </div>
              </form>
            )}

            {/* ADMIN PROFILE */}
            {activeTab === "profile" && (
              <form onSubmit={saveAdminSettings}>
                <div className="settings-card-heading">
                  <div>
                    <h2>Admin Profile</h2>
                    <p>
                      Manage the administrator's display information.
                    </p>
                  </div>

                  <span>👤</span>
                </div>

                <div className="settings-form-grid">
                  <label className="settings-full-width">
                    Full Name

                    <input
                      name="name"
                      value={admin.name}
                      onChange={handleAdminChange}
                      placeholder="Enter administrator name"
                      required
                    />
                  </label>

                  <label className="settings-full-width">
                    Email Address

                    <input
                      type="email"
                      name="email"
                      value={admin.email}
                      onChange={handleAdminChange}
                      placeholder="admin@example.com"
                      required
                    />
                  </label>
                  <label className="settings-full-width">
                    Contact Phone
                    <input
                      name="phone"
                      value={admin.phone || ""}
                      onChange={handleAdminChange}
                      placeholder="+91 98765 43210"
                    />
                  </label>
                </div>

                <div className="settings-info-box">
                  <span>🛡️</span>
                  <p>
                    Changes saved here directly update your administrator account in the database.
                  </p>
                </div>

                <div className="settings-form-footer">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Admin Profile"}
                  </button>
                </div>
              </form>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div>
                <div className="settings-card-heading">
                  <div>
                    <h2>Notification Preferences</h2>
                    <p>
                      Choose which notification preferences to enable.
                    </p>
                  </div>

                  <span>🔔</span>
                </div>

                <div className="notification-list">
                  {[
                    {
                      key: "bookings",
                      title: "Booking Notifications",
                      description:
                        "Enable preferences for booking updates.",
                    },
                    {
                      key: "payments",
                      title: "Payment Notifications",
                      description:
                        "Enable preferences for payment updates.",
                    },
                    {
                      key: "foodOrders",
                      title: "Food Order Notifications",
                      description:
                        "Enable preferences for food order updates.",
                    },
                    {
                      key: "staffUpdates",
                      title: "Staff Notifications",
                      description:
                        "Enable preferences for staff updates.",
                    },
                  ].map((item) => (
                    <label
                      className="notification-item"
                      key={item.key}
                    >
                      <div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>

                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={(event) =>
                          setNotifications((previous) => ({
                            ...previous,
                            [item.key]: event.target.checked,
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>

                <div className="settings-info-box">
                  <span>ℹ️</span>

                  <p>
                    These preferences are saved to MongoDB. Actual
                    email or SMS delivery requires a notification
                    service to be configured separately.
                  </p>
                </div>

                <div className="settings-form-footer">
                  <button
                    type="button"
                    className="settings-save-btn"
                    onClick={saveNotifications}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Preferences"}
                  </button>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordChange}>
                <div className="settings-card-heading">
                  <div>
                    <h2>Security Settings</h2>
                    <p>Manage your account password.</p>
                  </div>

                  <span>🔒</span>
                </div>

                <div className="settings-security-notice">
                  <strong>🔐 Password Security</strong>
                  <p>
                    Changing your password requires entering your existing password correctly. Your new password must contain at least 6 characters.
                  </p>
                </div>

                <div className="settings-form-grid">
                  <label className="settings-full-width">
                    Current Password

                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(event) =>
                        setPasswords((previous) => ({
                          ...previous,
                          current: event.target.value,
                        }))
                      }
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  <label>
                    New Password

                    <input
                      type="password"
                      value={passwords.newPassword}
                      onChange={(event) =>
                        setPasswords((previous) => ({
                          ...previous,
                          newPassword: event.target.value,
                        }))
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </label>

                  <label>
                    Confirm New Password

                    <input
                      type="password"
                      value={passwords.confirmPassword}
                      onChange={(event) =>
                        setPasswords((previous) => ({
                          ...previous,
                          confirmPassword: event.target.value,
                        }))
                      }
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </label>
                </div>

                <div className="settings-form-footer">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={saving}
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Settings;