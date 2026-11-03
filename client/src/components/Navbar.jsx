import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import AdminProfileModal from "./AdminProfileModal";
import UserAvatar from "./UserAvatar";
import api from "../services/api";
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Key,
  Bell,
  Sparkles,
  Hotel,
  Crown,
  Menu,
  Sun,
  Moon,
  MessageSquare,
  Megaphone,
  Check,
  Flame,
} from "lucide-react";

function Navbar({ onToggleSidebar = () => {} }) {
  const { admin, logout } = useAuth();
  const { confirm, toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("details");

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch live notifications and unread messages count
  const fetchLiveNotifs = useCallback(async () => {
    try {
      const [notifRes, contactsRes] = await Promise.allSettled([
        api.get("/chat/notifications"),
        api.get("/chat/contacts"),
      ]);

      if (notifRes.status === "fulfilled") {
        const notifData = notifRes.value.data;
        const list = notifData?.data || [];
        setNotifications(list);
        setUnreadNotifCount(notifData?.unreadCount || 0);
      }

      if (contactsRes.status === "fulfilled") {
        const contacts = contactsRes.value.data?.data || [];
        const totalUnreadChat = contacts.reduce(
          (sum, c) => sum + (Number(c.unreadCount) || 0),
          0
        );
        setUnreadChatCount(totalUnreadChat);
      }
    } catch {
      // Silently catch background poll error
    }
  }, []);

  useEffect(() => {
    fetchLiveNotifs();
    const timer = setInterval(fetchLiveNotifs, 5000);
    return () => clearInterval(timer);
  }, [fetchLiveNotifs]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign Out",
      message: "Are you sure you want to log out of the admin console?",
      confirmText: "Yes, Sign Out",
      type: "gold",
    });
    if (ok) {
      logout();
      navigate("/login");
      toast.info("Signed out successfully.", "Session Ended");
    }
  };

  const handleMarkNotifRead = async (id) => {
    try {
      await api.put(`/chat/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, readBy: [...(n.readBy || []), admin?.email] }
            : n
        )
      );
      setUnreadNotifCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // fallback
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("chat")) return "Staff Chat";
    if (path.includes("room-desk")) return "Room Desk";
    if (path.includes("food-desk")) return "Food Desk";
    if (path.includes("rooms")) return "Rooms Catalog";
    if (path.includes("food-orders")) return "Kitchen Orders";
    if (path.includes("food")) return "Dining Menu";
    if (path.includes("bookings")) return "Bookings";
    if (path.includes("customers")) return "Guest Directory";
    if (path.includes("payments")) return "Payments";
    if (path.includes("staff")) return "Hotel Staff";
    if (path.includes("settings")) return "Settings";
    return "Executive Dashboard";
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <header className="navbar-modern">
        {/* Left Section: Mobile Menu Toggle & Title */}
        <div className="navbar-left-group">
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-amber-700" />
          </button>

          <div className="navbar-title-section">
            <div className="navbar-heading-row">
              <h2>{getPageTitle()}</h2>
              <span className="live-status-pill">
                <span className="status-pulse-dot"></span>
                Live Sync
              </span>
            </div>
            <p className="navbar-subtitle">
              Welcome back, <strong className="text-slate-800">{admin?.name || "Administrator"}</strong> • RPN Hotel Management Console
            </p>
          </div>
        </div>

        {/* Right Section: Notification, Theme Toggle & Admin Profile */}
        <div className="navbar-actions-section">
          {/* Theme Switcher Button */}
          <button
            type="button"
            className="navbar-theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to Luxury Light Mode" : "Switch to Futuristic Dark Mode"}
            aria-label="Toggle display theme"
          >
            {theme === "dark" ? (
              <>
                <Moon className="w-4 h-4 theme-icon-moon" />
                <span className="theme-toggle-text">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 theme-icon-sun" />
                <span className="theme-toggle-text">Light</span>
              </>
            )}
          </button>

          {/* Staff Chat Direct Button (Desktop Only; on mobile floating chat FAB is used) */}
          <button
            type="button"
            className="navbar-action-btn navbar-chat-btn-desktop-only"
            onClick={() => navigate("/chat")}
            title="Open Internal Staff Chat"
            style={{ position: "relative" }}
          >
            <MessageSquare className="w-4 h-4" />
            {unreadChatCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  background: "var(--primary-gradient)",
                  color: "#FFFFFF",
                  fontSize: "10px",
                  fontWeight: "800",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 8px rgba(139, 92, 246, 0.8)",
                }}
              >
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* System Notification Icon & Floating Panel */}
          <div className="navbar-notif-wrapper" ref={notifRef} style={{ position: "relative" }}>
            <button
              type="button"
              className="navbar-action-btn"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="Hotel Announcements & Alerts"
              style={{ position: "relative" }}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#EF4444",
                    boxShadow: "0 0 8px #EF4444",
                  }}
                ></span>
              )}
            </button>

            {/* Notification Dropdown Popover */}
            {isNotifOpen && (
              <div
                className="navbar-notif-popover"
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  width: "360px",
                  maxWidth: "calc(100vw - 24px)",
                  maxHeight: "440px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "18px",
                  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.65)",
                  zIndex: 999,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "var(--bg-card-inner)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Bell className="w-4 h-4 text-purple-400" />
                    <strong style={{ fontSize: "13.5px", color: "var(--text-main)" }}>
                      Hotel Updates & Notices
                    </strong>
                  </div>

                  {unreadNotifCount > 0 && (
                    <span
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#F87171",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      {unreadNotifCount} New
                    </span>
                  )}
                </div>

                {/* Notices List */}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--text-muted)" }}>
                      <Megaphone className="w-8 h-8 opacity-40 mx-auto mb-2 text-purple-400" />
                      <p style={{ margin: 0, fontSize: "13px" }}>No active hotel notices</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const isRead = n.readBy && n.readBy.includes(admin?.email);

                      return (
                        <div
                          key={n._id}
                          onClick={() => handleMarkNotifRead(n._id)}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "12px",
                            background: isRead ? "var(--bg-card-inner)" : "rgba(139, 92, 246, 0.1)",
                            border: isRead ? "1px solid var(--border-subtle)" : "1px solid rgba(139, 92, 246, 0.3)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "12.5px", color: "var(--text-main)" }}>{n.title}</strong>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "800",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background:
                                  n.priority === "Urgent"
                                    ? "rgba(239, 68, 68, 0.2)"
                                    : n.priority === "High"
                                    ? "rgba(251, 146, 60, 0.2)"
                                    : "rgba(52, 211, 153, 0.2)",
                                color:
                                  n.priority === "Urgent"
                                    ? "#F87171"
                                    : n.priority === "High"
                                    ? "#FB923C"
                                    : "#34D399",
                              }}
                            >
                              {n.priority}
                            </span>
                          </div>

                          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.4" }}>
                            {n.message}
                          </p>

                          <span style={{ fontSize: "10px", color: "var(--text-dim)", display: "block", marginTop: "4px" }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • By {n.createdByName}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Link to Staff Chat */}
                <div
                  style={{
                    padding: "10px 16px",
                    borderTop: "1px solid var(--border-subtle)",
                    background: "var(--bg-card-inner)",
                    textAlign: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotifOpen(false);
                      navigate("/chat");
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent)",
                      fontSize: "12.5px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Staff Chat & Post Updates →</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile Dropdown Trigger */}
          <div className="navbar-profile-wrapper" ref={dropdownRef}>
            <button
              type="button"
              className={`navbar-profile-trigger ${isDropdownOpen ? "dropdown-active" : ""}`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="avatar-container">
                <UserAvatar name={admin?.name || "Administrator"} size={36} />
                <span className="online-indicator" title="Admin Active"></span>
              </div>

              <div className="profile-name-role">
                <span className="admin-display-name">
                  {admin?.name || "Administrator"}
                </span>
                <span className="admin-role-badge">
                  {admin?.role || "Super Admin"}
                </span>
              </div>

              <ChevronDown
                className={`dropdown-chevron ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="navbar-dropdown-menu">
                {/* Profile Card Header */}
                <div className="dropdown-user-header">
                  <UserAvatar name={admin?.name || "Administrator"} size={48} />
                  <div className="dropdown-user-meta">
                    <h4>{admin?.name || "Administrator"}</h4>
                    <p>{admin?.email || "admin@hotel.com"}</p>
                    <span className="dropdown-role-tag">
                      <Crown className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                      {admin?.role || "Super Admin"}
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                {/* Dropdown Action Links */}
                <div className="dropdown-links-list">
                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setModalTab("details");
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <User className="item-icon text-blue-600" />
                    <div className="item-text">
                      <span className="item-title">Edit Admin Profile</span>
                      <span className="item-desc">Update name, email & phone</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setModalTab("password");
                      setIsProfileModalOpen(true);
                    }}
                  >
                    <Key className="item-icon text-amber-500" />
                    <div className="item-text">
                      <span className="item-title">Security & Password</span>
                      <span className="item-desc">Change login credentials</span>
                    </div>
                  </button>

                  {(!admin?.role || admin.role.includes("Admin")) && (
                    <button
                      type="button"
                      className="dropdown-item-btn"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        navigate("/settings");
                      }}
                    >
                      <Settings className="item-icon text-slate-600" />
                      <div className="item-text">
                        <span className="item-title">Hotel Settings</span>
                        <span className="item-desc">Taxes, checkout & preferences</span>
                      </div>
                    </button>
                  )}
                </div>

                <div className="dropdown-divider"></div>

                {/* Logout Button */}
                <div className="dropdown-footer">
                  <button
                    type="button"
                    className="dropdown-logout-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Admin</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Profile Edit Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={modalTab}
      />
    </>
  );
}

export default Navbar;
