import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import RpnGoldenCrownLogo from "./RpnGoldenCrownLogo";
import {
  LayoutDashboard,
  DoorOpen,
  BedDouble,
  UtensilsCrossed,
  ChefHat,
  ReceiptText,
  CalendarDays,
  Users,
  CreditCard,
  UserCheck,
  Settings as SettingsIcon,
  LogOut,
  X,
  Crown,
  KeyRound,
  MessageSquare,
} from "lucide-react";

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { logout, admin } = useAuth();
  const { confirm, toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const ok = await confirm({
      title: "Sign Out",
      message: "Are you sure you want to log out of your session?",
      confirmText: "Yes, Sign Out",
      type: "danger",
    });
    if (ok) {
      logout();
      navigate("/login");
      toast.info("You have successfully signed out.", "Session Ended");
    }
  };

  const role = admin?.role || "Super Admin";

  // Reorganized Priority-Wise Navigation Sections for Admin, Room Desk, and Food Desk
  const getNavSections = () => {
    // 1. Room Desk Portal (Receptionist / Room Manager) Priority-Ordered Workflow
    if (role === "Room Manager" || role === "Receptionist") {
      return [
        {
          title: "FRONT DESK OPERATIONS",
          items: [
            { to: "/room-desk", label: "Room Booking Desk", icon: DoorOpen },
            { to: "/chat", label: "Staff Chat & Updates", icon: MessageSquare },
            { to: "/rooms", label: "Rooms Catalog", icon: BedDouble },
            { to: "/bookings", label: "Guest Bookings", icon: CalendarDays },
            { to: "/customers", label: "Guest Directory", icon: Users },
          ],
        },
      ];
    }

    // 2. Food Desk Portal (Food Manager) Priority-Ordered Workflow
    if (role === "Food Manager") {
      return [
        {
          title: "DINING & KITCHEN OPERATIONS",
          items: [
            { to: "/food-desk", label: "Food Billing Desk", icon: UtensilsCrossed },
            { to: "/chat", label: "Staff Chat & Updates", icon: MessageSquare },
            { to: "/food-orders", label: "Kitchen Orders & Bills", icon: ReceiptText },
            { to: "/food", label: "Dining Menu", icon: ChefHat },
          ],
        },
      ];
    }

    // 3. Super Admin & Admin Master Executive Portal Priority-Ordered Hierarchy
    return [
      {
        title: "EXECUTIVE OVERVIEW",
        items: [
          { to: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
          { to: "/payments", label: "Payment Management", icon: CreditCard },
        ],
      },
      {
        title: "DESK DATA & PRICING",
        items: [
          { to: "/rooms", label: "Room Inventory & Pricing", icon: BedDouble },
          { to: "/food", label: "Dining Menu & Pricing", icon: ChefHat },
        ],
      },
      {
        title: "HOTEL OPERATIONS",
        items: [
          { to: "/chat", label: "Staff Chat & Updates", icon: MessageSquare },
          { to: "/room-desk", label: "Room Booking Desk", icon: DoorOpen },
          { to: "/food-orders", label: "Kitchen Orders & Bills", icon: ReceiptText },
        ],
      },
      {
        title: "HUMAN RESOURCES & GUESTS",
        items: [
          { to: "/staff", label: "Staff Management", icon: UserCheck },
          { to: "/customers", label: "Guest Directory", icon: Users },
        ],
      },
    ];
  };

  const navSections = getNavSections();

  const getRoleBadge = () => {
    if (role === "Room Manager" || role === "Receptionist") return { label: "RECEPTIONIST DESK", icon: KeyRound, color: "room" };
    if (role === "Food Manager") return { label: "FOOD DESK", icon: ChefHat, color: "food" };
    return { label: "SUPER ADMIN", icon: Crown, color: "admin" };
  };

  const roleBadge = getRoleBadge();
  const BadgeIcon = roleBadge.icon;

  return (
    <aside
      className={`sidebar-modern ${isOpen ? "sidebar-open" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Brand Header */}
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-logo-container">
          <RpnGoldenCrownLogo className="sidebar-crown-logo" idPrefix="sidebar" />
        </div>
        <div className="sidebar-brand-text">
          <h2>RPN HOTEL</h2>
          <span>
            {role === "Room Manager" || role === "Receptionist"
              ? "Receptionist Portal"
              : role === "Food Manager"
              ? "Food Manager Portal"
              : "Luxury Administration"}
          </span>
        </div>

        {/* Mobile Close Drawer Button */}
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={onClose}
          aria-label="Close menu drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill Banner */}
      <div className={`sidebar-role-indicator ${roleBadge.color}`}>
        <BadgeIcon className="w-3.5 h-3.5" />
        <span>{roleBadge.label}</span>
      </div>

      {/* Navigation Links with Priority-Ordered Sections */}
      <nav className="sidebar-nav-container">
        {navSections.map((section, sIdx) => (
          <div
            key={section.title}
            className="sidebar-nav-section-group"
            style={{ marginBottom: sIdx < navSections.length - 1 ? "18px" : "0" }}
          >
            <span className="sidebar-nav-section-label">{section.title}</span>
            <div className="sidebar-nav-list" style={{ marginTop: "6px" }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                    }
                  >
                    <Icon className="sidebar-link-icon" />
                    <span className="sidebar-link-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer with Admin & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-admin-pill">
          <div className="admin-status-dot"></div>
          <div className="admin-info-snippet">
            <span className="admin-snippet-name">{admin?.name || "Administrator"}</span>
            <span className="admin-snippet-role">{admin?.role || "Super Admin"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            handleLogout();
          }}
          className="sidebar-logout-btn"
          title="Sign out of dashboard"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
