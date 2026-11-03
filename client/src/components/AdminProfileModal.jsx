import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  Crown,
} from "lucide-react";

function AdminProfileModal({ isOpen, onClose, initialTab = "details" }) {
  const { admin, updateAdminProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (admin) {
      setName(admin.name || "");
      setEmail(admin.email || "");
      setPhone(admin.phone || "");
    }
    setActiveTab(initialTab);
    setSuccessMessage("");
    setErrorMessage("");
  }, [admin, isOpen, initialTab]);

  if (!isOpen) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!name.trim() || !email.trim()) {
      setErrorMessage("Name and email are required fields.");
      return;
    }

    try {
      setLoading(true);
      await updateAdminProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      setSuccessMessage("Admin profile updated successfully!");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to update profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (!currentPassword || !newPassword) {
      setErrorMessage("Please enter both current and new password.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to change password."
      );
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (str) => {
    if (!str) return "A";
    return str
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container profile-edit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-profile-preview">
            <UserAvatar name={name || admin?.name} size={50} />
            <div>
              <h3>Admin Profile Settings</h3>
              <p className="modal-admin-role">
                <Crown className="w-3.5 h-3.5 text-amber-500 inline mr-1" />
                {admin?.role || "Super Admin"} • {admin?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "details" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("details");
              setSuccessMessage("");
              setErrorMessage("");
            }}
          >
            <User className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "password" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("password");
              setSuccessMessage("");
              setErrorMessage("");
            }}
          >
            <Key className="w-4 h-4" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="modal-alert-box alert-success" role="status">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="modal-alert-box alert-error" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Profile Details Form */}
        {activeTab === "details" && (
          <form onSubmit={handleUpdateProfile} className="modal-form">
            <div className="modal-input-group">
              <label htmlFor="modal-admin-name">Full Name</label>
              <div className="modal-input-field">
                <User className="input-icon" />
                <input
                  id="modal-admin-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Administrator"
                  required
                />
              </div>
            </div>

            <div className="modal-input-group">
              <label htmlFor="modal-admin-email">Email Address</label>
              <div className="modal-input-field">
                <Mail className="input-icon" />
                <input
                  id="modal-admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@hotel.com"
                  required
                />
              </div>
            </div>

            <div className="modal-input-group">
              <label htmlFor="modal-admin-phone">Contact Phone</label>
              <div className="modal-input-field">
                <Phone className="input-icon" />
                <input
                  id="modal-admin-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-modal-save"
                disabled={loading}
              >
                {loading ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Change Password Form */}
        {activeTab === "password" && (
          <form onSubmit={handleChangePassword} className="modal-form">
            <div className="modal-input-group">
              <label htmlFor="modal-current-pass">Current Password</label>
              <div className="modal-input-field">
                <Lock className="input-icon" />
                <input
                  id="modal-current-pass"
                  type={showCurrentPass ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                >
                  {showCurrentPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="modal-input-group">
              <label htmlFor="modal-new-pass">New Password</label>
              <div className="modal-input-field">
                <Key className="input-icon" />
                <input
                  id="modal-new-pass"
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPass(!showNewPass)}
                >
                  {showNewPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="modal-input-group">
              <label htmlFor="modal-confirm-pass">Confirm New Password</label>
              <div className="modal-input-field">
                <Key className="input-icon" />
                <input
                  id="modal-confirm-pass"
                  type={showNewPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-modal-save"
                disabled={loading}
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AdminProfileModal;

